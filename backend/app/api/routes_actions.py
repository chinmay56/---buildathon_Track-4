from fastapi import APIRouter, HTTPException, Body, Depends
from typing import Dict, Any, Optional
from backend.app.state import state
from backend.app.models.exception import ExceptionStatus
from backend.app.core.auth import AuthUser, require_permission, get_current_user

router = APIRouter(prefix="/api/exceptions", tags=["Actions & AI Investigation"])

@router.post("/{exception_id}/investigate")
def run_ai_investigation(
    exception_id: str,
    user: AuthUser = Depends(require_permission("investigate_ai"))
):
    if not state.exceptions:
        state.initialize_and_run(count=75)

    exc = state.exceptions.get(exception_id)
    if not exc:
        raise HTTPException(status_code=404, detail=f"Exception {exception_id} not found")

    # Run AI ReAct Investigation loop
    investigated = state.investigator.investigate(exc)
    state.exceptions[exception_id] = investigated

    # Update settlement record status
    for sr in state.settlement_records:
        if sr.order_id == investigated.order_id:
            sr.status = investigated.status.value
            break

    return {
        "status": "success",
        "exception": investigated.model_dump()
    }

@router.post("/{exception_id}/approve")
def approve_correction(
    exception_id: str,
    payload: Dict[str, Any] = Body(default={}),
    user: AuthUser = Depends(require_permission("approve_corrections"))
):
    if not state.exceptions:
        state.initialize_and_run(count=75)

    exc = state.exceptions.get(exception_id)
    if not exc:
        raise HTTPException(status_code=404, detail=f"Exception {exception_id} not found")

    if not exc.proposed_correction:
        # Run investigation first if proposal does not exist yet
        exc = state.investigator.investigate(exc)

    approver = payload.get("approved_by", f"{user.name} ({user.email})")
    result = state.executor.execute_correction(
        exception=exc,
        proposal=exc.proposed_correction,
        orders=state.orders,
        payments=state.payments,
        splits=state.splits,
        payouts=state.payouts,
        refunds=state.refunds,
        approved_by=approver
    )

    # Immediately trigger post-correction verification
    verify_result = state.verifier.verify_exception_closure(
        exception=exc,
        orders=state.orders,
        payments=state.payments,
        splits=state.splits,
        payouts=state.payouts,
        refunds=state.refunds
    )

    # Update settlement records
    for sr in state.settlement_records:
        if sr.order_id == exc.order_id:
            sr.status = "VERIFIED_RESOLVED"
            sr.net_discrepancy = 0.0
            break

    state.exceptions[exception_id] = exc

    return {
        "status": "success",
        "message": result.get("message", "Correction executed successfully") if isinstance(result, dict) else str(result),
        "verified_balanced": verify_result.get("verified", True),
        "residual_discrepancy": verify_result.get("post_verification_delta", 0.0),
        "exception": exc.model_dump()
    }
