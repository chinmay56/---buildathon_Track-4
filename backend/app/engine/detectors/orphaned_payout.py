from typing import Optional, List, Dict
from datetime import datetime
from backend.app.models.domain import Order, Payment, Split, Payout, Refund, PaymentStatus
from backend.app.models.policy import MerchantSettlementPolicy
from backend.app.models.exception import SettlementException, ExceptionType, ExceptionStatus
from backend.app.engine.state_calculator import DeterministicStateCalculator

class OrphanedPayoutDetector:
    name = "OrphanedPayoutDetector"

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
        order_payouts = [p for p in payouts if p.order_id == order.id and p.status == "settled"]
        if not order_payouts:
            return None

        # If payout exists but payment is failed, missing or amount is 0
        if not payment or payment.status == PaymentStatus.FAILED:
            payout_amount = sum(p.amount for p in order_payouts)
            return SettlementException(
                id=f"EXC_ORPH_{order.id}",
                order_id=order.id,
                vendor_id=order.vendor_id,
                exception_type=ExceptionType.ORPHANED_PAYOUT_RECORD,
                status=ExceptionStatus.AUTO_RESOLVABLE,
                detected_at=datetime.utcnow().isoformat(),
                discrepancy_amount=payout_amount,
                detector_name=self.name,
                audit_trail=[{
                    "step": "DETECTION",
                    "timestamp": datetime.utcnow().isoformat(),
                    "rule": "payout exists without valid upstream captured payment",
                    "discrepancy": payout_amount
                }]
            )
        return None
