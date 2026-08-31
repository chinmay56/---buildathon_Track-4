from typing import Dict, List, Any, Optional
from datetime import datetime
from backend.app.data.synthetic_generator import GroundTruthEntry
from backend.app.models.exception import SettlementException, ExceptionStatus
from backend.app.models.benchmark import (
    BenchmarkReport, MetricSummary, ConfusionMatrix, ExceptionTypeBenchmark
)

class GroundTruthEvaluator:
    def __init__(self, ground_truth: Dict[str, GroundTruthEntry]):
        self._ground_truth = ground_truth

    def evaluate_run(
        self,
        total_records: int,
        matched_records: int,
        exceptions: List[SettlementException],
        processing_time_ms: float
    ) -> BenchmarkReport:
        # Build lookup for detected exceptions by order_id
        detected_map: Dict[str, SettlementException] = {exc.order_id: exc for exc in exceptions}
        
        tp = 0 # Ground truth exception AND detected as exception
        fp = 0 # Ground truth clean BUT detected as exception
        fn = 0 # Ground truth exception BUT missed (not detected)
        tn = 0 # Ground truth clean AND correctly matched
        
        type_stats: Dict[str, Dict[str, Any]] = {}
        total_gt_exposure = 0.0
        total_detected_exposure = 0.0
        monetary_deltas = []

        resolved_count = 0
        human_review_count = 0
        unresolved_count = 0

        for exc in exceptions:
            if exc.status == ExceptionStatus.VERIFIED_RESOLVED:
                resolved_count += 1
            elif exc.status == ExceptionStatus.HUMAN_REVIEW:
                human_review_count += 1
            elif exc.status in (ExceptionStatus.UNRESOLVED, ExceptionStatus.DETECTED):
                unresolved_count += 1
            
            total_detected_exposure += exc.discrepancy_amount

        for order_id, gt in self._ground_truth.items():
            if gt.is_exception:
                total_gt_exposure += gt.expected_discrepancy
                exc_type = gt.exception_type or "OTHER"
                if exc_type not in type_stats:
                    type_stats[exc_type] = {"gt_count": 0, "detected_count": 0, "monetary_diff": 0.0}
                type_stats[exc_type]["gt_count"] += 1

                if order_id in detected_map:
                    tp += 1
                    detected_exc = detected_map[order_id]
                    type_stats[exc_type]["detected_count"] += 1
                    diff = abs(detected_exc.discrepancy_amount - gt.expected_discrepancy)
                    type_stats[exc_type]["monetary_diff"] += diff
                    monetary_deltas.append(diff)
                else:
                    fn += 1
            else:
                if order_id in detected_map:
                    fp += 1
                else:
                    tn += 1

        precision = (tp / (tp + fp) * 100.0) if (tp + fp) > 0 else 100.0
        recall = (tp / (tp + fn) * 100.0) if (tp + fn) > 0 else 100.0
        f1 = (2 * precision * recall / (precision + recall)) if (precision + recall) > 0 else 0.0
        match_rate = (matched_records / total_records * 100.0) if total_records > 0 else 0.0
        
        # Monetary accuracy = 100% - (sum of monetary deltas / total gt exposure)
        avg_monetary_error = sum(monetary_deltas) if monetary_deltas else 0.0
        monetary_accuracy = max(0.0, 100.0 - ((avg_monetary_error / total_gt_exposure * 100.0) if total_gt_exposure > 0 else 0.0))

        throughput = (total_records / (processing_time_ms / 1000.0)) if processing_time_ms > 0 else 0.0

        by_type_benchmarks = []
        for exc_t, s in type_stats.items():
            t_prec = (s["detected_count"] / s["detected_count"] * 100.0) if s["detected_count"] > 0 else 0.0
            t_rec = (s["detected_count"] / s["gt_count"] * 100.0) if s["gt_count"] > 0 else 0.0
            by_type_benchmarks.append(ExceptionTypeBenchmark(
                exception_type=exc_t,
                ground_truth_count=s["gt_count"],
                detected_count=s["detected_count"],
                precision_pct=round(t_prec, 2),
                recall_pct=round(t_rec, 2),
                monetary_error_delta=round(s["monetary_diff"], 2)
            ))

        metrics = MetricSummary(
            total_records=total_records,
            matched_records=matched_records,
            exception_records=len(exceptions),
            resolved_records=resolved_count,
            human_review_records=human_review_count,
            unresolved_records=unresolved_count,
            match_rate_pct=round(match_rate, 2),
            precision_pct=round(precision, 2),
            recall_pct=round(recall, 2),
            f1_score_pct=round(f1, 2),
            monetary_accuracy_pct=round(monetary_accuracy, 2),
            total_financial_exposure=round(total_detected_exposure, 2),
            total_recovered_exposure=0.0,
            processing_time_ms=round(processing_time_ms, 2),
            throughput_records_per_sec=round(throughput, 1)
        )

        conf_matrix = ConfusionMatrix(
            true_positives=tp,
            false_positives=fp,
            true_negatives=tn,
            false_negatives=fn
        )

        honest_breakdown = {
            "AUTO_RESOLVABLE": sum(1 for e in exceptions if e.status in (ExceptionStatus.AUTO_RESOLVABLE, ExceptionStatus.VERIFIED_RESOLVED)),
            "HUMAN_REVIEW": sum(1 for e in exceptions if e.status == ExceptionStatus.HUMAN_REVIEW),
            "UNRESOLVED": sum(1 for e in exceptions if e.status == ExceptionStatus.UNRESOLVED)
        }

        return BenchmarkReport(
            timestamp=datetime.utcnow().isoformat(),
            dataset_version="synthetic_batch_v1_seed42",
            metrics=metrics,
            confusion_matrix=conf_matrix,
            by_exception_type=by_type_benchmarks,
            honest_exception_breakdown=honest_breakdown
        )
