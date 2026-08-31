from typing import Optional, List, Dict
from datetime import datetime
from backend.app.models.domain import Order, Payment, Split, Payout, Refund
from backend.app.models.policy import MerchantSettlementPolicy
from backend.app.models.exception import SettlementException, ExceptionType, ExceptionStatus
from backend.app.engine.state_calculator import DeterministicStateCalculator

class RoundingDriftDetector:
    name = "RoundingDriftDetector"

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
        # If there are refunds or failed payments, let other detectors handle
        if refunds or (payment and payment.status == "failed"):
            return None

        order_splits = [s for s in splits if s.order_id == order.id]
        if not order_splits:
            return None

        expected_comm = self.calculator.calculate_expected_commission(order.amount)
        actual_comm = sum(s.platform_commission for s in order_splits)
        
        # If commission matched expected, but vendor share has drift from expected
        if self.calculator.is_within_tolerance(expected_comm, actual_comm):
            expected_vendor = self.calculator.calculate_expected_vendor_share(order.amount)
            actual_vendor = sum(s.vendor_amount for s in order_splits)
            diff = round(abs(expected_vendor - actual_vendor), 2)
            
            if diff > self.policy.rounding_tolerance_inr:
                return SettlementException(
                    id=f"EXC_RND_{order.id}",
                    order_id=order.id,
                    vendor_id=order.vendor_id,
                    exception_type=ExceptionType.ROUNDING_DRIFT_EXCEEDED,
                    status=ExceptionStatus.AUTO_RESOLVABLE,
                    detected_at=datetime.utcnow().isoformat(),
                    discrepancy_amount=diff,
                    detector_name=self.name,
                    audit_trail=[{
                        "step": "DETECTION",
                        "timestamp": datetime.utcnow().isoformat(),
                        "rule": "abs(expected_vendor_share - actual_vendor_share) > rounding_tolerance",
                        "discrepancy": diff
                    }]
                )
        return None
