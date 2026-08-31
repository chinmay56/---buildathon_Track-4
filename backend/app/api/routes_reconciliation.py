from fastapi import APIRouter, Query
from typing import Dict, Any, Optional, List
from backend.app.state import state

router = APIRouter(prefix="/api/reconciliation", tags=["Reconciliation"])

@router.post("/run")
def run_reconciliation(record_count: int = Query(500, ge=50, le=1000)):
    state.initialize_and_run(count=record_count)
    res = state.last_run_result
    return {
        "status": "success",
        "batch_id": res.batch_id,
        "total_records": res.total_records,
        "matched_records": res.matched_records,
        "exception_count": len(res.exceptions),
        "processing_time_ms": round(res.processing_time_ms, 2),
        "throughput_records_per_sec": round(res.throughput_rps, 1)
    }

@router.get("/current")
def get_current_status():
    if not state.last_run_result:
        state.initialize_and_run(count=500)
    
    res = state.last_run_result
    
    # Calculate real-time exception counts
    total_exposure = sum(e.discrepancy_amount for e in state.exceptions.values())
    resolved_count = sum(1 for e in state.exceptions.values() if e.status == "VERIFIED_RESOLVED")
    human_review_count = sum(1 for e in state.exceptions.values() if e.status == "HUMAN_REVIEW")
    unresolved_count = sum(1 for e in state.exceptions.values() if e.status in ("UNRESOLVED", "DETECTED", "AUTO_RESOLVABLE"))
    
    return {
        "batch_id": res.batch_id,
        "total_records": res.total_records,
        "matched_records": res.matched_records,
        "exception_count": len(state.exceptions),
        "resolved_count": resolved_count,
        "human_review_count": human_review_count,
        "unresolved_count": unresolved_count,
        "total_exposure_inr": round(total_exposure, 2),
        "match_rate_pct": round((res.matched_records / res.total_records) * 100.0, 2) if res.total_records > 0 else 0.0,
        "throughput_records_per_sec": round(res.throughput_rps, 1),
        "processing_time_ms": round(res.processing_time_ms, 2)
    }

@router.get("/ledger")
def get_ledger_records(
    status: Optional[str] = None,
    limit: int = 100,
    offset: int = 0
):
    if not state.settlement_records:
        state.initialize_and_run(count=500)

    records = state.settlement_records
    if status and status != "ALL":
        records = [r for r in records if r.status == status]

    total = len(records)
    paginated = records[offset : offset + limit]
    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "records": [r.model_dump() for r in paginated]
    }
