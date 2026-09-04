"""
Settlement Q&A Copilot Engine.
Provides natural-language finance operations assistant powered by OpenAI LLM Agents,
capable of answering ledger queries, diagnosing specific exceptions, and evaluating cash risk in real time.
"""

import os
import json
import re
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
    # Conversation history from the frontend — enables context-aware follow-up answers.
    # Each entry is {"role": "user"|"assistant", "content": "..."}
    history: List[ChatMessage] = []


class CopilotQueryResponse(BaseModel):
    reply: str
    context_data: Optional[Dict[str, Any]] = None
    suggested_actions: List[str] = []
    cited_policy_clauses: List[str] = []


def _clean_markdown_reply(raw_text: str) -> str:
    """
    Ensures the reply is clean, human-readable markdown text and strips out
    any accidental JSON enclosures or metadata delimiters.
    """
    text = raw_text.strip()

    # If wrapped in markdown code fence ```json ... ```
    if text.startswith("```json") or text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)

    # Check if raw text is a JSON object
    if text.startswith("{") and text.endswith("}"):
        try:
            parsed = json.loads(text)
            if isinstance(parsed, dict):
                if "reply" in parsed:
                    return str(parsed["reply"]).strip()
                elif "response" in parsed:
                    return str(parsed["response"]).strip()
                elif "answer" in parsed:
                    return str(parsed["answer"]).strip()
                elif "finding" in parsed or "root_cause" in parsed:
                    # Construct clean summary from fields
                    lines = []
                    if "finding" in parsed:
                        lines.append(f"**Finding**: {parsed['finding']}")
                    if "root_cause" in parsed:
                        lines.append(f"**Root Cause**: {parsed['root_cause']}")
                    if "discrepancy" in parsed or "difference" in parsed:
                        lines.append(f"**Discrepancy**: ₹{parsed.get('discrepancy') or parsed.get('difference')}")
                    if "recommended_action" in parsed:
                        lines.append(f"**Recommended Action**: {parsed['recommended_action']}")
                    return "\n\n".join(lines)
        except Exception:
            pass

    # Strip custom action metadata tag if present
    if "__ACTIONS_METADATA__" in text:
        text = text.split("__ACTIONS_METADATA__")[0].strip()

    return text


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
            for e in exceptions[:10]
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
        "FORMATTING INSTRUCTIONS:\n"
        "1. Always respond in natural, conversational, professional GitHub Markdown text. Do NOT output raw JSON.\n"
        "2. Use bullet points, bold key figures (e.g. **₹11,250.00**), and clear section headers.\n"
        "3. Cite exact numbers, Order IDs, UTRs, and Razorpay Route mechanics from the live context.\n"
        "4. Clearly explain the Razorpay Route clawback/reversal mechanics when asked about refunds post-payout."
    )

    user_prompt = f"""
LIVE RECONCILIATION & FLOAT CONTEXT:
{json.dumps(live_context, indent=2)}

{f"ORDER TARGET CONTEXT: {json.dumps(order_specific_context, indent=2)}" if order_specific_context else ""}

USER QUESTION:
{msg_raw}
"""

    if OPENAI_API_KEY:
        try:
            client = openai.OpenAI(api_key=OPENAI_API_KEY)

            # Build the messages array:
            # 1. System prompt
            # 2. Prior conversation turns (history) — enables context-aware follow-ups
            # 3. Current user question (with grounded live context injected)
            messages_payload = [{"role": "system", "content": system_prompt}]

            # Replay prior turns without the live context (keeps token count low)
            for turn in req.history[:-1]:  # exclude the last turn — it's the current question
                messages_payload.append({"role": turn.role, "content": turn.content})

            # Current question — inject the full live context here only
            messages_payload.append({"role": "user", "content": user_prompt})

            completion = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages_payload,
                temperature=0.2,
                max_tokens=650
            )

            raw_reply = completion.choices[0].message.content or ""
            reply_text = _clean_markdown_reply(raw_reply)

            suggested_actions = ["Inspect Settlement Ledger", "Review Trapped Clawbacks", "Run Forward Forecast"]
            if target_order_id:
                suggested_actions = ["Inspect Order Drawer", "Approve & Simulate Correction", "View Route DAG"]

            cited_clauses = ["Razorpay Route Standard Settlement Policy v2.4"]
            if target_order_id:
                cited_clauses = ["Policy Clause 4.2 (Transfer Reversal on Returns)"]

            return CopilotQueryResponse(
                reply=reply_text,
                context_data=order_specific_context or live_context,
                suggested_actions=suggested_actions,
                cited_policy_clauses=cited_clauses
            )
        except Exception as e:
            print(f"[Copilot] OpenAI Error: {e}, falling back to deterministic synthesis.")

    # Fallback to local deterministic response if network/offline
    return _deterministic_fallback(msg_raw, status, cash, exceptions, target_order_id)


def _deterministic_fallback(msg_raw: str, status: Any, cash: Any, exceptions: List[Any], target_order_id: Optional[str]) -> CopilotQueryResponse:
    if target_order_id:
        exc = next((e for e in exceptions if e.order_id == target_order_id), None)
        if exc:
            return CopilotQueryResponse(
                reply=f"### Diagnosis for Order `{target_order_id}`\n\n- **Status**: `{exc.status}`\n- **Discrepancy**: **₹{exc.discrepancy_amount:,.2f}**\n- **Root Cause**: {exc.root_cause or 'Anomaly flagged by deterministic detector'}\n- **Vendor ID**: `{exc.vendor_id}`",
                context_data={"exception": exc.model_dump()},
                suggested_actions=["Approve & Simulate Correction", "Inspect Ledger Row"],
                cited_policy_clauses=["Policy Clause 4.2 (Transfer Reversal on Returns)"]
            )

    return CopilotQueryResponse(
        reply=f"### Current Working Capital & Cash Position Summary\n\n- **Batch Size**: {status.total_records} transactions\n- **Match Rate**: **{status.match_rate_pct}%**\n- **Trapped Clawbacks**: **₹{cash.unrecovered_vendor_clawbacks_inr:,.2f}**\n- **Safe T+2 Float**: **₹{cash.safe_settlement_disbursement_float_inr:,.2f}**",
        context_data=status.model_dump(),
        suggested_actions=["View Forward 7-Day Forecast", "Review Trapped Clawbacks"],
        cited_policy_clauses=["Razorpay Route Standard Settlement Standard v2.4"]
    )
