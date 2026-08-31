from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional

class MetricSummary(BaseModel):
    total_records: int
    matched_records: int
    exception_records: int
    resolved_records: int
    human_review_records: int
    unresolved_records: int
    
    match_rate_pct: float
    precision_pct: float
    recall_pct: float
    f1_score_pct: float
    monetary_accuracy_pct: float
    
    total_financial_exposure: float
    total_recovered_exposure: float
    
    processing_time_ms: float
    throughput_records_per_sec: float

class ConfusionMatrix(BaseModel):
    true_positives: int # Detected real exceptions
    false_positives: int # Flagged clean transactions falsely
    true_negatives: int # Correctly identified matched records
    false_negatives: int # Missed ground-truth exceptions

class ExceptionTypeBenchmark(BaseModel):
    exception_type: str
    ground_truth_count: int
    detected_count: int
    precision_pct: float
    recall_pct: float
    monetary_error_delta: float

class BenchmarkReport(BaseModel):
    timestamp: str
    dataset_version: str
    metrics: MetricSummary
    confusion_matrix: ConfusionMatrix
    by_exception_type: List[ExceptionTypeBenchmark]
    honest_exception_breakdown: Dict[str, int]
