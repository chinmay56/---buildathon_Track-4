from typing import Dict, Any, Optional
from backend.app.models.domain import Order, Payment, Split, Payout, Refund
from backend.app.models.policy import MerchantSettlementPolicy

class DeterministicStateCalculator:
    def __init__(self, policy: MerchantSettlementPolicy):
        self.policy = policy

    def calculate_expected_commission(self, order_amount: float) -> float:
        rate = self.policy.platform_commission_pct / 100.0
        return round(order_amount * rate, 2)

    def calculate_expected_vendor_share(self, order_amount: float) -> float:
        comm = self.calculate_expected_commission(order_amount)
        return round(order_amount - comm, 2)

    def calculate_expected_tax(self, gross_commission: float, tax_class: str) -> float:
        tax_rate = self.policy.tax_rules.get(tax_class, 18.0)
        return round(gross_commission * (tax_rate / 100.0), 2)

    def calculate_gateway_fee_and_tax(self, order_amount: float) -> (float, float):
        fee = round(order_amount * (self.policy.payment_gateway_fee_pct / 100.0), 2)
        tax = round(fee * (self.policy.payment_gateway_fee_tax_pct / 100.0), 2)
        return fee, tax

    def calculate_expected_clawback(self, refund_amount: float, order_amount: float, vendor_payout_amount: float) -> float:
        if not self.policy.clawback_after_payout_required:
            return 0.0
        if self.policy.refund_responsibility == "proportional":
            ratio = refund_amount / order_amount if order_amount > 0 else 1.0
            return round(vendor_payout_amount * ratio, 2)
        elif self.policy.refund_responsibility == "vendor":
            return round(min(refund_amount, vendor_payout_amount), 2)
        else: # platform
            return 0.0

    def is_within_tolerance(self, expected: float, actual: float) -> bool:
        return abs(round(expected - actual, 2)) <= self.policy.rounding_tolerance_inr
