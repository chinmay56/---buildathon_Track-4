from typing import Dict, List, Any, Optional
from datetime import datetime
from backend.app.models.exception import (
    SettlementException, ExceptionStatus, ExceptionType,
    EvidencePackage, FinancialBreakdown, CorrectionProposal
)
from backend.app.agent.tools import AgentToolRegistry

class AIInvestigator:
    def __init__(self, tool_registry: AgentToolRegistry):
        self.tools = tool_registry

    def investigate(self, exception: SettlementException) -> SettlementException:
        order_id = exception.order_id
        tool_call_log = []

        # Step 1: Query Order Details
        order_data = self.tools.get_order(order_id)
        tool_call_log.append({
            "step": 1,
            "tool": "get_order",
            "args": {"order_id": order_id},
            "status": "success",
            "summary": f"Order {order_id} fetched: Amount ₹{order_data.get('amount')}, Status: {order_data.get('status')}"
        })

        # Step 2: Query Payment
        pay_data = self.tools.get_payment(order_id)
        tool_call_log.append({
            "step": 2,
            "tool": "get_payment",
            "args": {"order_id": order_id},
            "status": "success",
            "summary": f"Payment {pay_data.get('id')}: Method {pay_data.get('method')}, Status: {pay_data.get('status')}, UTR: {pay_data.get('utr')}"
        })

        # Step 3: Query Splits & Payouts
        splits_data = self.tools.get_splits(order_id)
        payouts_data = self.tools.get_payouts(order_id)
        tool_call_log.append({
            "step": 3,
            "tool": "get_splits_and_payouts",
            "args": {"order_id": order_id},
            "status": "success",
            "summary": f"Found {len(splits_data)} splits, {len(payouts_data)} payouts"
        })

        # Step 4: Query Refunds
        refunds_data = self.tools.get_refunds(order_id)
        tool_call_log.append({
            "step": 4,
            "tool": "get_refunds",
            "args": {"order_id": order_id},
            "status": "success",
            "summary": f"Found {len(refunds_data)} refund records"
        })

        # Step 5: Deterministic Expected State & Financial Exposure
        expected_state = self.tools.calculate_expected_state(order_id)
        exposure_data = self.tools.calculate_financial_exposure(order_id)
        tool_call_log.append({
            "step": 5,
            "tool": "calculate_financial_exposure",
            "args": {"order_id": order_id},
            "status": "success",
            "summary": f"Calculated expected vendor share ₹{expected_state.get('expected_vendor_share')}, Net exposure: ₹{exposure_data.get('net_exposure_inr')}"
        })

        # Check Ambiguity
        if exception.exception_type == ExceptionType.AMBIGUOUS_POLICY_CATEGORY:
            exception.status = ExceptionStatus.HUMAN_REVIEW
            exception.investigated_at = datetime.utcnow().isoformat()
            exception.root_cause = "Vendor contractual tier is missing from policy mapping. Deterministic policy cannot calculate expected rates."
            exception.evidence = EvidencePackage(
                order_id=order_id,
                payment_id=pay_data.get("id"),
                policy_rule_cited="POLICY_SEC_9_TIER_MAPPING_REQUIRED",
                timeline_summary=[
                    f"Order created with unmapped category '{order_data.get('item_category')}'",
                    "Tax class unrecognized in merchant settlement schedule",
                    "Agent halted automated resolution to prevent unauthorized fee rate assumption"
                ]
            )
            exception.human_review_reason = "Merchant policy requires manual assignment of commission rate tier for custom vendor category."
            exception.required_human_inputs = ["vendor_commission_tier", "item_tax_classification"]
            exception.financial_breakdown = FinancialBreakdown(
                expected_amount=0.0,
                actual_amount=order_data.get("amount", 0.0),
                discrepancy_amount=0.0,
                calculation_basis="Unmapped tier prevents authoritative expected calculation."
            )
            exception.audit_trail.extend(tool_call_log)
            return exception

        # Handle Resolvable Cases
        root_cause = ""
        policy_cited = ""
        action_type = ""
        action_desc = ""
        is_debit = True
        adjustment_amt = exposure_data.get("net_exposure_inr", exception.discrepancy_amount)

        if exception.exception_type == ExceptionType.REFUND_AFTER_PAYOUT_UNRECOVERED:
            root_cause = f"Full customer refund processed after vendor payout settlement (UTR: {payouts_data[0].get('utr') if payouts_data else 'N/A'}) with ₹0 automatic clawback applied."
            policy_cited = "POLICY_SEC_4_2_CLAWBACK_MANDATORY_POST_PAYOUT"
            action_type = "CREATE_VENDOR_CLAWBACK_DEBIT"
            action_desc = f"Create vendor debit adjustment note for ₹{adjustment_amt} to recover payout post-refund."
            is_debit = True

        elif exception.exception_type == ExceptionType.EXCESS_COMMISSION_DOUBLE_COUNT:
            root_cause = f"Duplicate platform commission entries recorded across split sub-ledger (expected ₹{expected_state.get('expected_platform_commission')}, charged ₹{order_data.get('amount') - exposure_data.get('actual_vendor_share')})."
            policy_cited = "POLICY_SEC_2_1_STANDARD_COMMISSION_SCHEDULE"
            action_type = "REFUND_COMMISSION_CREDIT"
            action_desc = f"Issue credit adjustment of ₹{adjustment_amt} to vendor {exception.vendor_id} to reverse excess commission."
            is_debit = False

        elif exception.exception_type == ExceptionType.TAX_RULE_MISMATCH:
            root_cause = f"Discrepancy in recorded GST line. Applied 28% luxury rate instead of configured {order_data.get('tax_class')} rule."
            policy_cited = "POLICY_SEC_3_GST_RULESET"
            action_type = "REBOOK_TAX_JOURNAL"
            action_desc = f"Re-book tax journal delta ₹{adjustment_amt} to align with {order_data.get('tax_class')} schedule."
            is_debit = True

        elif exception.exception_type == ExceptionType.ORPHANED_PAYOUT_RECORD:
            root_cause = f"Settled payout record has no valid captured payment (Payment status: {pay_data.get('status')})."
            policy_cited = "POLICY_SEC_6_VALID_CAPTURED_PAYMENT_PREREQUISITE"
            action_type = "HOLD_ORPHANED_PAYOUT"
            action_desc = f"Freeze unverified vendor payout ₹{adjustment_amt} pending gateway UTR audit."
            is_debit = True

        elif exception.exception_type == ExceptionType.ROUNDING_DRIFT_EXCEEDED:
            root_cause = f"Cumulative penny rounding variance ₹{adjustment_amt} exceeds allowable ₹{self.tools.policy.rounding_tolerance_inr} threshold."
            policy_cited = "POLICY_SEC_8_ROUNDING_TOLERANCE_ENFORCEMENT"
            action_type = "BALANCE_ADJUSTMENT"
            action_desc = f"Apply balancing adjustment ₹{adjustment_amt} to clear rounding sub-ledger variance."
            is_debit = False

        # Create Proposal
        proposal = self.tools.create_correction_proposal(
            exception_id=exception.id,
            target_vendor_id=exception.vendor_id,
            adjustment_amount=adjustment_amt,
            is_debit=is_debit,
            action_type=action_type,
            reason=action_desc,
            policy_citation=policy_cited
        )

        timeline = [
            f"1. Order {order_id} placed for ₹{order_data.get('amount')} (Item category: {order_data.get('item_category')})",
            f"2. Payment {pay_data.get('id')} recorded (Status: {pay_data.get('status')})",
            f"3. Payout {payouts_data[0].get('id') if payouts_data else 'None'} initiated for ₹{payouts_data[0].get('amount') if payouts_data else 0.0}",
        ]
        if refunds_data:
            timeline.append(f"4. Refund {refunds_data[0].get('id')} processed for ₹{refunds_data[0].get('amount')} without clawback deduction")
        timeline.append(f"5. AI Deterministic Reconciler calculated ₹{adjustment_amt} exposure against policy {policy_cited}")

        exception.status = ExceptionStatus.AUTO_RESOLVABLE
        exception.investigated_at = datetime.utcnow().isoformat()
        exception.root_cause = root_cause
        exception.evidence = EvidencePackage(
            order_id=order_id,
            payment_id=pay_data.get("id"),
            split_id=splits_data[0].get("id") if splits_data else None,
            payout_id=payouts_data[0].get("id") if payouts_data else None,
            refund_id=refunds_data[0].get("id") if refunds_data else None,
            policy_rule_cited=policy_cited,
            timeline_summary=timeline
        )
        exception.financial_breakdown = FinancialBreakdown(
            expected_amount=expected_state.get("expected_vendor_share", 0.0),
            actual_amount=exposure_data.get("actual_vendor_share", 0.0),
            discrepancy_amount=adjustment_amt,
            calculation_basis=f"Derived using policy {self.tools.policy.version} rules"
        )
        exception.proposed_correction = proposal
        exception.audit_trail.extend(tool_call_log)

        return exception
