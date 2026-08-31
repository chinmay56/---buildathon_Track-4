import pytest
from backend.app.models.policy import MerchantSettlementPolicy
from backend.app.engine.state_calculator import DeterministicStateCalculator

def test_commission_and_vendor_share_calculation():
    policy = MerchantSettlementPolicy(platform_commission_pct=10.0)
    calc = DeterministicStateCalculator(policy)

    gross = 10000.0
    comm = calc.calculate_expected_commission(gross)
    vendor_share = calc.calculate_expected_vendor_share(gross)

    assert comm == 1000.0
    assert vendor_share == 9000.0

def test_tax_rules_calculation():
    policy = MerchantSettlementPolicy()
    calc = DeterministicStateCalculator(policy)

    comm = 1000.0
    tax_18 = calc.calculate_expected_tax(comm, "GST_18")
    tax_5 = calc.calculate_expected_tax(comm, "GST_5")
    tax_exempt = calc.calculate_expected_tax(comm, "GST_EXEMPT")

    assert tax_18 == 180.0
    assert tax_5 == 50.0
    assert tax_exempt == 0.0

def test_proportional_clawback_calculation():
    policy = MerchantSettlementPolicy(clawback_after_payout_required=True, refund_responsibility="proportional")
    calc = DeterministicStateCalculator(policy)

    # Full refund of ₹10,000 when vendor received ₹9,000 payout
    clawback = calc.calculate_expected_clawback(refund_amount=10000.0, order_amount=10000.0, vendor_payout_amount=9000.0)
    assert clawback == 9000.0

    # Partial 50% refund of ₹5,000
    partial_clawback = calc.calculate_expected_clawback(refund_amount=5000.0, order_amount=10000.0, vendor_payout_amount=9000.0)
    assert partial_clawback == 4500.0
