from fastapi import APIRouter
from typing import Dict, Any
from backend.app.state import state

router = APIRouter(prefix="/api/benchmark", tags=["Benchmark & Evaluation"])

@router.get("/report")
def get_benchmark_report():
    if not state.last_run_result:
        state.initialize_and_run(count=500)

    res = state.last_run_result
    report = state.evaluator.evaluate_run(
        total_records=res.total_records,
        matched_records=res.matched_records,
        exceptions=list(state.exceptions.values()),
        processing_time_ms=res.processing_time_ms
    )
    return report.model_dump()
