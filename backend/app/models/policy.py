from pydantic import BaseModel, Field
from typing import Dict, Any, Optional

class MerchantSettlementPolicy(BaseModel):
    version: str = "v2.1"
    platform_commission_pct: float = 10.0 # 10% platform commission
    vendor_share_pct: float = 90.0 # 90% vendor share
    
    # Razorpay Gateway fees
    payment_gateway_fee_pct: float = 2.0 # 2% gateway processing fee
    payment_gateway_fee_tax_pct: float = 18.0 # 18% GST on gateway fee
    
    # Route Transfer fees
    route_transfer_fee_flat: float = 5.0 # ₹5 flat transfer fee
    route_transfer_fee_tax_pct: float = 18.0 # 18% GST on route transfer fee
    
    # Tax rules by class (GST on standard goods)
    tax_rules: Dict[str, float] = Field(default_factory=lambda: {
        "GST_18": 18.0,
        "GST_12": 12.0,
        "GST_5": 5.0,
        "GST_EXEMPT": 0.0
    })
    
    # Refund handling policy
    refund_responsibility: str = "proportional" # "proportional", "platform", "vendor"
    clawback_after_payout_required: bool = True
    
    # Rounding and tolerance
    rounding_tolerance_inr: float = 0.50 # Tolerance in INR (₹0.50)
    batch_rounding_drift_tolerance_inr: float = 5.00 # Max cumulative drift
