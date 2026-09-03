"""
Settlement Q&A Copilot Engine.
Provides natural-language finance operations assistant powered by OpenAI LLM Agents,
capable of answering ledger queries, diagnosing specific exceptions, and evaluating cash risk in real time.
"""

import os
import json
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from dotenv import load_dotenv
import openai
from backend.app.state import app_state

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")


class ChatMessage(BaseModel):
    role: str  # "user" | "assistant" | "system"
    content: str
    timestamp: Optional[str] = None


class CopilotQueryRequest(BaseModel):
    message: str
    order_id: Optional[str] = None
    vendor_id: Optional[str] = None


class CopilotQueryResponse(BaseModel):
    reply: str
    context_data: Optional[Dict[str, Any]] = None
    suggested_actions: List[str] = []
    cited_policy_clauses: List[str] = []


def answer_settlement_query(req: CopilotQueryRequest) -> CopilotQueryResponse:
    """
    Evaluates natural language financial queries using real-time OpenAI LLM Agent
    grounded with live ledger records, multi-source reconciliations, and cash float state.
    """
    msg_raw = req.message.strip()
    status = app_state.get_batch_status()
    cash = app_state.get_cash_position()
    exceptions = app_state.get_exceptions()

    # Collect live financial context
    live_context = {
        "batch_status": {
            "total_records": status.total_records,
            "matched_records": status.matched_records,
            "exception_count": status.exception_count,
            "match_rate_pct": status.match_rate_pct,
            "total_exposure_inr": status.total_exposure_inr,
            "processing_time_ms": status.processing_time_ms,
            "throughput_rps": status.throughput_records_per_sec
        },
        "cash_and_float_position": {
            "total_gmv_inr": cash.total_gmv_inr,
            "unrecovered_vendor_clawbacks_inr": cash.unrecovered_vendor_clawbacks_inr,
            "orphaned_payout_exposure_inr": cash.orphaned_payout_exposure_inr,
            "safe_settlement_disbursement_float_inr": cash.safe_settlement_disbursement_float_inr,
            "float_risk_index_pct": cash.float_risk_index_pct
        },
        "exceptions_summary": [
            {
                "id": e.id,
                "order_id": e.order_id,
                "vendor_id": e.vendor_id,
                "type": e.exception_type.value if hasattr(e.exception_type, "value") else str(e.exception_type),
                "discrepancy_inr": e.discrepancy_amount,
                "status": e.status.value if hasattr(e.status, "value") else str(e.status),
                "detector": e.detector_name,
                "root_cause": e.root_cause or "Pending automated ReAct investigation"
            }
            for e in exceptions[:10]  # sample top 10 for context density
        ]
    }

    # If specific order is referenced, add deep detail
    target_order_id = req.order_id
    if not target_order_id:
        for word in req.message.replace(",", " ").replace("?", " ").replace("'", " ").replace('"', " ").split():
            if word.lower().startswith("ord_"):
                target_order_id = word.strip()
                break

    order_specific_context = None
    if target_order_id:
        rec = app_state.get_record_by_order(target_order_id)
        exc = next((e for e in exceptions if e.order_id == target_order_id), None)
        order_specific_context = {
            "order_id": target_order_id,
            "record": rec.model_dump() if rec else None,
            "exception": exc.model_dump() if exc else None
        }

    # Build Prompt for OpenAI
    system_prompt = (
        "You are the autonomous AI Finance Controller & Operations Copilot for a high-volume multi-vendor marketplace "
        "powered by Razorpay Route. You assist CFOs, finance controllers, and auditors with real-time ledger diagnostics, "
        "cash float risk analysis, refund clawback tracking, and double-entry reconciliation.\n\n"
        "RULES:\n"
        "1. Never give vague or generic advice. Always cite exact numbers, UTRs, Order IDs, and Razorpay Route mechanics from the provided live context.\n"
        "2. When discussing clawbacks, explain the Razorpay Route clawback dilemma (customer refund issued after vendor payout settlement without automated debit note).\n"
        "3. Keep formatting clean and professional with markdown bullet points, bold key figures, and code blocks where helpful.\n"
        "4. At the end of your response, output a JSON block on a single line starting with '__ACTIONS_METADATA__' containing:\n"
        "   {\"suggested_actions\": [\"Action 1\", \"Action 2\"], \"cited_policy_clauses\": [\"Clause 1\"]}"
    )

    user_prompt = f"""
LIVE RECONCILIATION & FLOAT CONTEXT:
{json.dumps(live_context, indent=2)}

{f"ORDER TARGET CONTEXT: {json.dumps(order_specific_context, indent=2)}" if order_specific_context else ""}

USER QUERY:
{msg_raw}
"""

    if OPENAI_API_KEY:
        try:
            client = openai.OpenAI(api_key=OPENAI_API_KEY)
            completion = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.2,
                max_tokens=600
            )

            raw_reply = completion.choices[0].message.content or ""
            
            # Parse suggested actions and clauses if present
            suggested_actions = ["Inspect Settlement Ledger", "Review Trapped Clawbacks", "Run Forward Forecast"]
            cited_clauses = ["Razorpay Route Standard Settlement Policy v2.4"]

            if "__ACTIONS_METADATA__" in raw_reply:
                parts = raw_reply.split("__ACTIONS_METADATA__")
                reply_text = parts[0].strip()
                try:
                    meta = json.loads(parts[1].strip())
                    if "suggested_actions" in meta:
                        suggested_actions = meta["suggested_actions"]
                    if "cited_policy_clauses" in meta:
                        cited_clauses = meta["cited_policy_clauses"]
                except Exception:
                    pass
            else:
                reply_text = raw_reply.strip()

            return CopilotQueryResponse(
                reply=reply_text,
                context_data=order_specific_context or live_context,
                suggested_actions=suggested_actions,
                cited_policy_clauses=cited_clauses
            )
        except Exception as e:
            print(f"⚠️ OpenAI LLM Call Error: {e}, falling back to deterministic synthesis.")

    # Fallback to local deterministic response if network/offline
    return _deterministic_fallback(msg_raw, status, cash, exceptions, target_order_id)


def _deterministic_fallback(msg_raw: str, status: Any, cash: Any, exceptions: List[Any], target_order_id: Optional[str]) -> CopilotQueryResponse:
    msg_lower = msg_raw.lower()
    if target_order_id:
        exc = next((e for e in exceptions if e.order_id == target_order_id), None)
        if exc:
            return CopilotQueryResponse(
                reply=f"**Diagnosis for Order `{target_order_id}`:**\n\n- **Status**: `{exc.status}`\n- **Discrepancy**: **₹{exc.discrepancy_amount:,.2f}**\n- **Root Cause**: {exc.root_cause or 'Flagged by detector'}\n- **Vendor ID**: `{exc.vendor_id}`",
                context_data={"exception": exc.model_dump()},
                suggested_actions=["Approve & Execute Correction", "Inspect Ledger Row"],
                cited_policy_clauses=["Policy Clause 4.2 (Clawback Offset on Returns)"]
            )

    return CopilotQueryResponse(
        reply=f"**Current Working Capital & Cash Position Summary:**\n\n- **Batch Size**: {status.total_records} transactions\n- **Match Rate**: **{status.match_rate_pct}%**\n- **Trapped Clawbacks**: **₹{cash.unrecovered_vendor_clawbacks_inr:,.2f}**\n- **Safe T+2 Float**: **₹{cash.safe_settlement_disbursement_float_inr:,.2f}**",
        context_data=status.model_dump(),
        suggested_actions=["View Forward 7-Day Forecast", "Review Trapped Clawbacks"],
        cited_policy_clauses=["Razorpay Route Standard Settlement Standard v2.4"]
    )
