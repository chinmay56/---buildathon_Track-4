import pytest
from backend.app.state import state

def test_ground_truth_and_benchmark_report():
    state.initialize_and_run(count=75)
    res = state.last_run_result
    
    report = state.evaluator.evaluate_run(
        total_records=res.total_records,
        matched_records=res.matched_records,
        exceptions=list(state.exceptions.values()),
        processing_time_ms=res.processing_time_ms
    )

    assert report.metrics.total_records == 75
    assert report.metrics.precision_pct >= 90.0
    assert report.metrics.recall_pct >= 90.0
    assert report.metrics.monetary_accuracy_pct >= 95.0
    assert report.metrics.throughput_records_per_sec > 100.0
    assert report.confusion_matrix.true_positives > 0
    assert len(report.by_exception_type) >= 5
