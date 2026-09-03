"""
ReAct AI Diagnostic Investigator Engine.
Executes autonomous multi-tool diagnostic queries across Orders, Payments, Route Splits,
Bank Payouts, and Customer Refunds, synthesizing root-cause findings and double-entry
reversal proposals via OpenAI LLM agents.
"""

import os
import json
from typing import Dict, List, Any, Optional
from datetime import datetime
from dotenv import load_dotenv
import openai
from backend.app.models.exception import (
    SettlementException, ExceptionStatus, ExceptionType,
    EvidencePackage, FinancialBreakdown, CorrectionProposal
)
from backend.app.agent.tools import AgentToolRegistry

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")


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

        # Compute Core Adjustment Details
        adjustment_amt = exposure_data.get("net_exposure_inr", exception.discrepancy_amount)
        is_debit = True
        action_type = "CREATE_VENDOR_CLAWBACK_DEBIT"
        policy_cited = "POLICY_SEC_4_2_CLAWBACK_MANDATORY_POST_PAYOUT"

        if exception.exception_type == ExceptionType.REFUND_AFTER_PAYOUT_UNRECOVERED:
            action_type = "CREATE_VENDOR_CLAWBACK_DEBIT"
            policy_cited = "POLICY_SEC_4_2_CLAWBACK_MANDATORY_POST_PAYOUT"
            is_debit = True
        elif exception.exception_type == ExceptionType.EXCESS_COMMISSION_DOUBLE_COUNT:
            action_type = "REFUND_COMMISSION_CREDIT"
            policy_cited = "POLICY_SEC_2_1_STANDARD_COMMISSION_SCHEDULE"
            is_debit = False
        elif exception.exception_type == ExceptionType.TAX_RULE_MISMATCH:
            action_type = "REBOOK_TAX_JOURNAL"
            policy_cited = "POLICY_SEC_3_GST_RULESET"
            is_debit = True
        elif exception.exception_type == ExceptionType.ORPHANED_PAYOUT_RECORD:
            action_type = "HOLD_ORPHANED_PAYOUT"
            policy_cited = "POLICY_SEC_6_VALID_CAPTURED_PAYMENT_PREREQUISITE"
            is_debit = True
        elif exception.exception_type == ExceptionType.ROUNDING_DRIFT_EXCEEDED:
            action_type = "BALANCE_ADJUSTMENT"
            policy_cited = "POLICY_SEC_8_ROUNDING_TOLERANCE_ENFORCEMENT"
            is_debit = False

        # Synthesize Root Cause & Investigation via OpenAI LLM
        root_cause = ""
        action_desc = ""
        if OPENAI_API_KEY:
            try:
                client = openai.OpenAI(api_key=OPENAI_API_KEY)
                investigation_prompt = f"""
You are an autonomous AI Finance Controller auditing a Razorpay Route settlement anomaly.
Synthesize a concise, authoritative Root Cause Analysis (1-2 sentences) and recommended action description based on the multi-source audit data:

Order Data: {json.dumps(order_data)}
Payment Data: {json.dumps(pay_data)}
Splits: {json.dumps(splits_data)}
Payouts: {json.dumps(payouts_data)}
Refunds: {json.dumps(refunds_data)}
Expected State: {json.dumps(expected_state)}
Discrepancy Amount: ₹{adjustment_amt}
Exception Type: {exception.exception_type.value if hasattr(exception.exception_type, 'value') else str(exception.exception_type)}

Return JSON with format:
{{
  "root_cause": "concise explanation of discrepancy and mechanism",
  "action_description": "concise description of double-entry ledger adjustment",
  "policy_citation": "{policy_cited}"
}}
"""
                res = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[{"role": "user", "content": investigation_prompt}],
                    response_format={"type": "json_object"},
                    temperature=0.1,
                    max_tokens=250
                )
                parsed = json.loads(res.choices[0].message.content or "{}")
                root_cause = parsed.get("root_cause", "")
                action_desc = parsed.get("action_description", "")
            except Exception as e:
                print(f"⚠️ OpenAI Investigator Error: {e}, falling back to local synthesis.")

        # Fallback if OpenAI call had an issue
        if not root_cause:
            if exception.exception_type == ExceptionType.REFUND_AFTER_PAYOUT_UNRECOVERED:
                root_cause = f"Full customer refund processed after vendor payout settlement (UTR: {payouts_data[0].get('utr') if payouts_data else 'N/A'}) with ₹0 automatic clawback applied."
                action_desc = f"Create vendor debit adjustment note for ₹{adjustment_amt} to recover payout post-refund."
            elif exception.exception_type == ExceptionType.EXCESS_COMMISSION_DOUBLE_COUNT:
                root_cause = f"Duplicate platform commission entries recorded across split sub-ledger (expected ₹{expected_state.get('expected_platform_commission')}, charged ₹{order_data.get('amount') - exposure_data.get('actual_vendor_share')})."
                action_desc = f"Issue credit adjustment of ₹{adjustment_amt} to vendor {exception.vendor_id} to reverse excess commission."
            else:
                root_cause = f"Detected discrepancy of ₹{adjustment_amt} in settlement ledger equation."
                action_desc = f"Post double-entry journal adjustment of ₹{adjustment_amt} to balance ledger."

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
        timeline.append(f"5. AI Controller calculated ₹{adjustment_amt} exposure against policy {policy_cited}")

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
            calculation_basis=f"Derived dynamically using policy {self.tools.policy.version} rules"
        )
        exception.proposed_correction = proposal
        exception.audit_trail.extend(tool_call_log)

        return exception
