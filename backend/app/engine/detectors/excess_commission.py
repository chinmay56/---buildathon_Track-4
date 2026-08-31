from typing import Optional, List, Dict
from datetime import datetime
from backend.app.models.domain import Order, Payment, Split, Payout, Refund
from backend.app.models.policy import MerchantSettlementPolicy
from backend.app.models.exception import SettlementException, ExceptionType, ExceptionStatus
from backend.app.engine.state_calculator import DeterministicStateCalculator

class ExcessCommissionDetector:
    name = "ExcessCommissionDetector"

    def __init__(self, policy: MerchantSettlementPolicy, calculator: DeterministicStateCalculator):
        self.policy = policy
        self.calculator = calculator

    def detect(
        self,
        order: Order,
        payment: Optional[Payment],
        splits: List[Split],
        payouts: List[Payout],
        refunds: List[Refund]
    ) -> Optional[SettlementException]:
        order_splits = [s for s in splits if s.order_id == order.id]
        if not order_splits:
            return None

        total_commission_deducted = sum(s.platform_commission for s in order_splits)
        expected_commission = self.calculator.calculate_expected_commission(order.amount)

        if total_commission_deducted > expected_commission and not self.calculator.is_within_tolerance(expected_commission, total_commission_deducted):
            discrepancy = round(total_commission_deducted - expected_commission, 2)
            return SettlementException(
                id=f"EXC_COMM_{order.id}",
                order_id=order.id,
                vendor_id=order.vendor_id,
                exception_type=ExceptionType.EXCESS_COMMISSION_DOUBLE_COUNT,
                status=ExceptionStatus.AUTO_RESOLVABLE,
                detected_at=datetime.utcnow().isoformat(),
                discrepancy_amount=discrepancy,
                detector_name=self.name,
                audit_trail=[{
                    "step": "DETECTION",
                    "timestamp": datetime.utcnow().isoformat(),
                    "rule": "actual_commission > expected_commission + tolerance",
                    "discrepancy": discrepancy
                }]
            )
        return None
