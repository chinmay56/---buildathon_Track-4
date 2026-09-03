from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any, Optional, List
from backend.app.state import state
from backend.app.models.exception import ExceptionStatus

router = APIRouter(prefix="/api/exceptions", tags=["Exceptions"])

@router.get("")
def list_exceptions(
    status: Optional[str] = None,
    exception_type: Optional[str] = None,
    vendor_id: Optional[str] = None
):
    if not state.exceptions:
        state.initialize_and_run(count=75)

    results = list(state.exceptions.values())

    if status and status != "ALL":
        results = [e for e in results if e.status == status]

    if exception_type and exception_type != "ALL":
        results = [e for e in results if e.exception_type == exception_type]

    if vendor_id:
        results = [e for e in results if e.vendor_id == vendor_id]

    return {
        "count": len(results),
        "exceptions": [e.model_dump() for e in results]
    }

@router.get("/{exception_id}")
def get_exception_detail(exception_id: str):
    if not state.exceptions:
        state.initialize_and_run(count=75)

    exc = state.exceptions.get(exception_id)
    if not exc:
        raise HTTPException(status_code=404, detail=f"Exception {exception_id} not found")

    order_id = exc.order_id
    order = state.orders.get(order_id)
    payment = state.payments.get(order_id)
    splits = state.splits.get(order_id, [])
    payouts = state.payouts.get(order_id, [])
    refunds = state.refunds.get(order_id, [])

    return {
        "exception": exc.model_dump(),
        "context": {
            "order": order.model_dump() if order else None,
            "payment": payment.model_dump() if payment else None,
            "splits": [s.model_dump() for s in splits],
            "payouts": [p.model_dump() for p in payouts],
            "refunds": [r.model_dump() for r in refunds]
        }
    }
