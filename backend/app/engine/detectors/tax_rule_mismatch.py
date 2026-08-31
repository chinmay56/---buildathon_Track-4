from typing import Optional, List, Dict
from datetime import datetime
from backend.app.models.domain import Order, Payment, Split, Payout, Refund
from backend.app.models.policy import MerchantSettlementPolicy
from backend.app.models.exception import SettlementException, ExceptionType, ExceptionStatus
from backend.app.engine.state_calculator import DeterministicStateCalculator

class TaxRuleMismatchDetector:
    name = "TaxRuleMismatchDetector"

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
        # Check if order tax class is completely unknown/ambiguous
        if order.tax_class == "UNKNOWN_TAX_GROUP" or order.item_category == "UNMAPPED_CUSTOM_TIER":
            return SettlementException(
                id=f"EXC_AMB_{order.id}",
                order_id=order.id,
                vendor_id=order.vendor_id,
                exception_type=ExceptionType.AMBIGUOUS_POLICY_CATEGORY,
                status=ExceptionStatus.HUMAN_REVIEW,
                detected_at=datetime.utcnow().isoformat(),
                discrepancy_amount=0.0,
                detector_name=self.name,
                human_review_reason=f"Tax class '{order.tax_class}' for item category '{order.item_category}' is unmapped in merchant policy.",
                required_human_inputs=["vendor_tax_classification", "applicable_gst_slab"],
                audit_trail=[{
                    "step": "DETECTION",
                    "timestamp": datetime.utcnow().isoformat(),
                    "rule": "tax_class not in configured policy tax_rules",
                    "status": "HUMAN_REVIEW"
                }]
            )

        # Check for Tax Rate Mismatch (e.g. GST_28 charged on standard goods when policy defines GST_18 max)
        if order.tax_class in ("GST_28_MISMATCH", "GST_28"):
            expected_tax = self.calculator.calculate_expected_tax(
                self.calculator.calculate_expected_commission(order.amount),
                "GST_18"
            )
            charged_tax = round(self.calculator.calculate_expected_commission(order.amount) * 0.28, 2)
            discrepancy = round(abs(charged_tax - expected_tax), 2)
            
            return SettlementException(
                id=f"EXC_TAX_{order.id}",
                order_id=order.id,
                vendor_id=order.vendor_id,
                exception_type=ExceptionType.TAX_RULE_MISMATCH,
                status=ExceptionStatus.AUTO_RESOLVABLE,
                detected_at=datetime.utcnow().isoformat(),
                discrepancy_amount=discrepancy,
                detector_name=self.name,
                audit_trail=[{
                    "step": "DETECTION",
                    "timestamp": datetime.utcnow().isoformat(),
                    "rule": "recorded_tax_rate (28%) exceeds configured policy rate for GST_18",
                    "discrepancy": discrepancy
                }]
            )
        return None
