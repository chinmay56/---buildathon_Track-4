import uuid
from typing import Dict, List, Any, Optional, Union
from datetime import datetime
from backend.app.models.domain import Order, Payment, Split, Payout, Refund, SettlementRecord
from backend.app.models.policy import MerchantSettlementPolicy
from backend.app.models.exception import CorrectionProposal
from backend.app.engine.state_calculator import DeterministicStateCalculator

class AgentToolRegistry:
    def __init__(
        self,
        orders: Union[List[Order], Dict[str, Order]],
        payments: Union[List[Payment], Dict[str, Payment]],
        splits: Union[List[Split], Dict[str, List[Split]]],
        payouts: Union[List[Payout], Dict[str, List[Payout]]],
        refunds: Union[List[Refund], Dict[str, List[Refund]]],
        policy: MerchantSettlementPolicy
    ):
        self.orders = orders if isinstance(orders, dict) else {o.id: o for o in orders}
        self.payments = payments if isinstance(payments, dict) else {p.order_id: p for p in payments}
        
        if isinstance(splits, dict):
            self.splits = splits
        else:
            self.splits = {}
            for s in splits:
                self.splits.setdefault(s.order_id, []).append(s)
            
        if isinstance(payouts, dict):
            self.payouts = payouts
        else:
            self.payouts = {}
            for p in payouts:
                self.payouts.setdefault(p.order_id, []).append(p)
            
        if isinstance(refunds, dict):
            self.refunds = refunds
        else:
            self.refunds = {}
            for r in refunds:
                self.refunds.setdefault(r.order_id, []).append(r)

        self.policy = policy
        self.calculator = DeterministicStateCalculator(policy)

    def get_order(self, order_id: str) -> Dict[str, Any]:
        order = self.orders.get(order_id)
        return order.model_dump() if order else {"error": f"Order {order_id} not found"}

    def get_payment(self, order_id: str) -> Dict[str, Any]:
        pay = self.payments.get(order_id)
        return pay.model_dump() if pay else {"error": f"Payment for order {order_id} not found"}

    def get_splits(self, order_id: str) -> List[Dict[str, Any]]:
        splits = self.splits.get(order_id, [])
        return [s.model_dump() for s in splits]

    def get_payouts(self, order_id: str) -> List[Dict[str, Any]]:
        payouts = self.payouts.get(order_id, [])
        return [p.model_dump() for p in payouts]

    def get_refunds(self, order_id: str) -> List[Dict[str, Any]]:
        refunds = self.refunds.get(order_id, [])
        return [r.model_dump() for r in refunds]

    def get_policy(self) -> Dict[str, Any]:
        return self.policy.model_dump()

    def calculate_expected_state(self, order_id: str) -> Dict[str, Any]:
        order = self.orders.get(order_id)
        if not order:
            return {"error": "Order not found"}
        
        commission = self.calculator.calculate_expected_commission(order.amount)
        vendor_share = self.calculator.calculate_expected_vendor_share(order.amount)
        rzp_fee, fee_tax = self.calculator.calculate_gateway_fee_and_tax(order.amount)
        
        return {
            "order_id": order_id,
            "gross_amount": order.amount,
            "expected_platform_commission": commission,
            "expected_vendor_share": vendor_share,
            "expected_gateway_fee": rzp_fee,
            "expected_fee_tax": fee_tax,
            "expected_net_settlement": round(vendor_share, 2)
        }

    def calculate_financial_exposure(self, order_id: str) -> Dict[str, Any]:
        order = self.orders.get(order_id)
        if not order:
            return {"error": "Order not found"}
        
        order_splits = self.splits.get(order_id, [])
        order_payouts = self.payouts.get(order_id, [])
        order_refunds = self.refunds.get(order_id, [])
        
        actual_vendor_payout = sum(p.amount for p in order_payouts if p.status == "settled")
        expected_state = self.calculate_expected_state(order_id)
        expected_vendor_share = expected_state.get("expected_vendor_share", 0.0)
        
        refund_amount = sum(r.amount for r in order_refunds)
        unrecovered_clawback = sum(r.amount for r in order_refunds if r.clawback_status.value == "unrecovered")
        
        discrepancy = 0.0
        if unrecovered_clawback > 0 and actual_vendor_payout > 0:
            discrepancy = actual_vendor_payout
        elif actual_vendor_payout != expected_vendor_share and not order_refunds:
            discrepancy = abs(actual_vendor_payout - expected_vendor_share)

        return {
            "order_id": order_id,
            "actual_payout_amount": actual_vendor_payout,
            "expected_vendor_share": expected_vendor_share,
            "refund_amount": refund_amount,
            "unrecovered_clawback": unrecovered_clawback,
            "net_exposure_inr": round(discrepancy, 2)
        }

    def create_correction_proposal(
        self,
        exception_id: str,
        target_vendor_id: str,
        adjustment_amount: float,
        action_type: str,
        reason: str,
        is_debit: bool = True,
        policy_citation: str = "POLICY_SEC_4_2_CLAWBACK_MANDATORY_POST_PAYOUT",
        order_id: str = ""
    ) -> CorrectionProposal:
        proposal_id = f"PROP_{uuid.uuid4().hex[:8].upper()}"
        idempotency_key = f"IDEM_{exception_id}_{action_type}_{int(adjustment_amount*100)}"
        
        # Build double-entry balanced journal entry
        if action_type == "CREATE_VENDOR_CLAWBACK_DEBIT":
            journal = {
                "debit_account": f"Vendor_Receivable_{target_vendor_id}",
                "debit_amount": adjustment_amount,
                "credit_account": "Marketplace_Customer_Refund_Clearing",
                "credit_amount": adjustment_amount,
                "memo": f"Clawback unrecovered refund on order {order_id or exception_id}"
            }
        elif action_type == "REFUND_COMMISSION_CREDIT":
            journal = {
                "debit_account": "Platform_Commission_Revenue",
                "debit_amount": adjustment_amount,
                "credit_account": f"Vendor_Payable_{target_vendor_id}",
                "credit_amount": adjustment_amount,
                "memo": f"Reverse excess commission charged on order {order_id or exception_id}"
            }
        elif action_type == "TAX_ROUNDING_ADJUSTMENT" or action_type == "REBOOK_TAX_JOURNAL":
            journal = {
                "debit_account": "GST_Output_Liability",
                "debit_amount": adjustment_amount,
                "credit_account": f"Vendor_Payable_{target_vendor_id}",
                "credit_amount": adjustment_amount,
                "memo": f"Adjust tax rate variance on order {order_id or exception_id}"
            }
        else:
            journal = {
                "debit_account": "Suspense_Quarantine_Account",
                "debit_amount": adjustment_amount,
                "credit_account": "Bank_Clearing_Account",
                "credit_amount": adjustment_amount,
                "memo": f"Quarantine unmatched payout on order {order_id or exception_id}"
            }

        return CorrectionProposal(
            proposal_id=proposal_id,
            exception_id=exception_id,
            action_type=action_type,
            target_vendor_id=target_vendor_id,
            adjustment_amount=round(adjustment_amount, 2),
            is_debit=is_debit,
            reason=reason,
            policy_citation=policy_citation or "POLICY_SEC_STANDARD",
            idempotency_key=idempotency_key,
            created_at=datetime.utcnow().isoformat()
        )
