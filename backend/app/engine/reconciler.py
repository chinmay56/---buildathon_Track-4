import time
from typing import Dict, List, Tuple, Any, Optional, Union
from pydantic import BaseModel, Field
from datetime import datetime
from backend.app.models.domain import (
    Order, Payment, Split, Payout, Refund, SettlementRecord, BatchStatus
)
from backend.app.models.policy import MerchantSettlementPolicy
from backend.app.models.exception import SettlementException, ExceptionStatus
from backend.app.engine.state_calculator import DeterministicStateCalculator
from backend.app.engine.detectors import (
    RefundClawbackDetector,
    ExcessCommissionDetector,
    TaxRuleMismatchDetector,
    OrphanedPayoutDetector,
    RoundingDriftDetector
)


class BatchReconciliationResult(BaseModel):
    batch_id: str
    total_records: int
    matched_records: int
    exception_count: int
    exceptions: List[SettlementException]
    settlement_records: List[SettlementRecord]
    match_rate_pct: float
    processing_time_ms: float
    throughput_records_per_sec: float
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

    def to_batch_status(
        self,
        total_resolved: int = 0,
        total_unresolved: int = 0,
        total_human_review: int = 0
    ) -> BatchStatus:
        total_exposure = sum(e.discrepancy_amount for e in self.exceptions)
        return BatchStatus(
            batch_id=self.batch_id,
            total_records=self.total_records,
            matched_records=self.matched_records,
            exception_count=self.exception_count,
            resolved_count=total_resolved,
            unresolved_count=total_unresolved,
            human_review_count=total_human_review,
            total_exposure_inr=round(total_exposure, 2),
            match_rate_pct=self.match_rate_pct,
            processing_time_ms=self.processing_time_ms,
            throughput_records_per_sec=self.throughput_records_per_sec,
            last_reconciled_at=self.timestamp
        )


class MultiSourceReconciler:
    def __init__(self, policy: MerchantSettlementPolicy = None):
        self.policy = policy or MerchantSettlementPolicy()
        self.calculator = DeterministicStateCalculator(self.policy)
        self.detectors = [
            RefundClawbackDetector(self.policy, self.calculator),
            ExcessCommissionDetector(self.policy, self.calculator),
            TaxRuleMismatchDetector(self.policy, self.calculator),
            OrphanedPayoutDetector(self.policy, self.calculator),
            RoundingDriftDetector(self.policy, self.calculator),
        ]

    def reconcile_batch(
        self,
        orders: Union[List[Order], Dict[str, Order]],
        payments: Union[List[Payment], Dict[str, Payment]],
        splits: Union[List[Split], Dict[str, List[Split]]],
        payouts: Union[List[Payout], Dict[str, List[Payout]]],
        refunds: Union[List[Refund], Dict[str, List[Refund]]],
        batch_id: str = "BATCH_20260828_01"
    ) -> BatchReconciliationResult:
        start_time = time.perf_counter()

        orders_list = list(orders.values()) if isinstance(orders, dict) else orders
        
        # Build index lookups for fast O(1) multi-source joining
        if isinstance(payments, dict):
            payments_by_order = payments
        else:
            payments_by_order = {p.order_id: p for p in payments}

        if isinstance(splits, dict):
            splits_by_order = splits
        else:
            splits_by_order = {}
            for s in splits:
                splits_by_order.setdefault(s.order_id, []).append(s)

        if isinstance(payouts, dict):
            payouts_by_order = payouts
        else:
            payouts_by_order = {}
            for p in payouts:
                payouts_by_order.setdefault(p.order_id, []).append(p)

        if isinstance(refunds, dict):
            refunds_by_order = refunds
        else:
            refunds_by_order = {}
            for r in refunds:
                refunds_by_order.setdefault(r.order_id, []).append(r)

        exceptions: List[SettlementException] = []
        settlement_records: List[SettlementRecord] = []
        matched_count = 0

        for order in orders_list:
            order_payment = payments_by_order.get(order.id)
            order_splits = splits_by_order.get(order.id, [])
            order_payouts = payouts_by_order.get(order.id, [])
            order_refunds = refunds_by_order.get(order.id, [])

            # Run all 5 independent exception detectors
            order_exception: Optional[SettlementException] = None
            for detector in self.detectors:
                exc = detector.detect(
                    order=order,
                    payment=order_payment,
                    splits=order_splits,
                    payouts=order_payouts,
                    refunds=order_refunds
                )
                if exc:
                    order_exception = exc
                    break

            if order_exception:
                exceptions.append(order_exception)
                expected_settlement = order_exception.financial_breakdown.expected_amount if order_exception.financial_breakdown else order.amount * 0.88
                actual_settlement = order_exception.financial_breakdown.actual_amount if order_exception.financial_breakdown else (order_payouts[0].amount if order_payouts else 0.0)
                discrepancy = order_exception.discrepancy_amount

                rec = SettlementRecord(
                    id=f"SETL_{order.id}",
                    order_id=order.id,
                    vendor_id=order.vendor_id,
                    gross_amount=order.amount,
                    expected_settlement=round(expected_settlement, 2),
                    actual_settlement=round(actual_settlement, 2),
                    commission_deducted=round(order.amount * 0.10, 2),
                    tax_deducted=round(order.amount * 0.018, 2),
                    gateway_fee_deducted=round(order.amount * 0.02, 2),
                    net_discrepancy=round(discrepancy, 2),
                    status=order_exception.status.value,
                    exception_id=order_exception.id
                )
                settlement_records.append(rec)
            else:
                matched_count += 1
                actual_amt = order_payouts[0].amount if order_payouts else (order.amount * 0.88)
                rec = SettlementRecord(
                    id=f"SETL_{order.id}",
                    order_id=order.id,
                    vendor_id=order.vendor_id,
                    gross_amount=order.amount,
                    expected_settlement=round(actual_amt, 2),
                    actual_settlement=round(actual_amt, 2),
                    commission_deducted=round(order.amount * 0.10, 2),
                    tax_deducted=round(order.amount * 0.018, 2),
                    gateway_fee_deducted=round(order.amount * 0.02, 2),
                    net_discrepancy=0.0,
                    status="MATCHED",
                    exception_id=None
                )
                settlement_records.append(rec)

        processing_time_ms = round((time.perf_counter() - start_time) * 1000, 2)
        total_records = len(orders_list)
        throughput = round(total_records / max(processing_time_ms / 1000, 0.0001), 2)
        match_rate = round((matched_count / max(total_records, 1)) * 100, 2)

        return BatchReconciliationResult(
            batch_id=batch_id,
            total_records=total_records,
            matched_records=matched_count,
            exception_count=len(exceptions),
            exceptions=exceptions,
            settlement_records=settlement_records,
            match_rate_pct=match_rate,
            processing_time_ms=processing_time_ms,
            throughput_records_per_sec=throughput
        )
