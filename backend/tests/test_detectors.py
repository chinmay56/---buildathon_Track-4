import pytest
from datetime import datetime
from backend.app.models.domain import Order, Payment, Split, Payout, Refund, OrderStatus, PaymentStatus, PayoutStatus, RefundStatus, ClawbackStatus
from backend.app.models.policy import MerchantSettlementPolicy
from backend.app.engine.state_calculator import DeterministicStateCalculator
from backend.app.engine.detectors.refund_clawback import RefundClawbackDetector
from backend.app.engine.detectors.excess_commission import ExcessCommissionDetector
from backend.app.engine.detectors.tax_rule_mismatch import TaxRuleMismatchDetector
from backend.app.engine.detectors.orphaned_payout import OrphanedPayoutDetector
from backend.app.engine.detectors.rounding_drift import RoundingDriftDetector

def test_refund_clawback_detector():
    policy = MerchantSettlementPolicy()
    calc = DeterministicStateCalculator(policy)
    detector = RefundClawbackDetector(policy, calc)

    order = Order(id="ord_01", customer_id="c1", vendor_id="v1", amount=10000.0, status=OrderStatus.REFUNDED, created_at="2026-08-01T10:00:00")
    payment = Payment(id="pay_01", order_id="ord_01", amount=10000.0, status=PaymentStatus.REFUNDED, utr="UTR1", captured_at="2026-08-01T10:01:00")
    splits = [Split(id="spl_01", order_id="ord_01", vendor_id="v1", gross_amount=10000.0, vendor_amount=9000.0, platform_commission=1000.0, created_at="2026-08-01T10:05:00")]
    payouts = [Payout(id="pout_01", order_id="ord_01", vendor_id="v1", amount=9000.0, status=PayoutStatus.SETTLED, utr="UTR_P1", settled_at="2026-08-01T12:00:00", batch_id="B1")]
    
    # Unrecovered clawback refund
    refund = Refund(id="rfnd_01", order_id="ord_01", payment_id="pay_01", vendor_id="v1", amount=10000.0, status=RefundStatus.PROCESSED, created_at="2026-08-01T14:00:00", clawback_amount=0.0, clawback_status=ClawbackStatus.UNRECOVERED)

    exc = detector.detect(order, payment, splits, payouts, [refund])
    assert exc is not None
    assert exc.discrepancy_amount == 9000.0

def test_excess_commission_detector():
    policy = MerchantSettlementPolicy(platform_commission_pct=10.0)
    calc = DeterministicStateCalculator(policy)
    detector = ExcessCommissionDetector(policy, calc)

    order = Order(id="ord_02", customer_id="c1", vendor_id="v1", amount=10000.0, status=OrderStatus.SETTLED, created_at="2026-08-01T10:00:00")
    # Charged ₹1500 commission instead of expected ₹1000
    splits = [Split(id="spl_02", order_id="ord_02", vendor_id="v1", gross_amount=10000.0, vendor_amount=8500.0, platform_commission=1500.0, created_at="2026-08-01T10:05:00")]

    exc = detector.detect(order, None, splits, [], [])
    assert exc is not None
    assert exc.discrepancy_amount == 500.0
