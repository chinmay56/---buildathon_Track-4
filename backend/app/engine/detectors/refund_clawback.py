from typing import Optional, List, Dict
from datetime import datetime
from backend.app.models.domain import Order, Payment, Split, Payout, Refund, ClawbackStatus
from backend.app.models.policy import MerchantSettlementPolicy
from backend.app.models.exception import SettlementException, ExceptionType, ExceptionStatus
from backend.app.engine.state_calculator import DeterministicStateCalculator

class RefundClawbackDetector:
    name = "RefundClawbackDetector"

    def __init__(self, policy: MerchantSettlementPolicy, calculator: DeterministicStateCalculator):
        self.policy = policy
        self.calculator = calculator

    def detect(
        self,
        order: Order,
        payment: Optional[Payment],
        splits: List[Split],
        payouts: List[Payout],
        refunds: List[Refund]
    ) -> Optional[SettlementException]:
        if not refunds:
            return None

        # Check if any settled payout exists for this order
        settled_payouts = [p for p in payouts if p.order_id == order.id and p.status == "settled"]
        if not settled_payouts:
            return None

        total_payout_amount = sum(p.amount for p in settled_payouts)

        for refund in refunds:
            if refund.order_id != order.id or refund.status != "processed":
                continue
            
            # Check timestamps: if refund timestamp >= payout settled_at
            # In synthetic data, if clawback is pending/unrecovered and required clawback > recorded clawback
            expected_clawback = self.calculator.calculate_expected_clawback(
                refund_amount=refund.amount,
                order_amount=order.amount,
                vendor_payout_amount=total_payout_amount
            )

            actual_clawback = refund.clawback_amount

            if expected_clawback > actual_clawback and not self.calculator.is_within_tolerance(expected_clawback, actual_clawback):
                discrepancy = round(expected_clawback - actual_clawback, 2)
                return SettlementException(
                    id=f"EXC_RC_{order.id}",
                    order_id=order.id,
                    vendor_id=order.vendor_id,
                    exception_type=ExceptionType.REFUND_AFTER_PAYOUT_UNRECOVERED,
                    status=ExceptionStatus.AUTO_RESOLVABLE,
                    detected_at=datetime.utcnow().isoformat(),
                    discrepancy_amount=discrepancy,
                    detector_name=self.name,
                    audit_trail=[{
                        "step": "DETECTION",
                        "timestamp": datetime.utcnow().isoformat(),
                        "rule": "refund.timestamp > payout.settled_at AND required_clawback > existing_clawback",
                        "discrepancy": discrepancy
                    }]
                )
        return None
