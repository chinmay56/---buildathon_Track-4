import random
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Any
from backend.app.models.domain import (
    Order, Payment, Split, Payout, Refund, SettlementRecord,
    OrderStatus, PaymentStatus, PayoutStatus, RefundStatus, ClawbackStatus
)
from backend.app.models.policy import MerchantSettlementPolicy
from backend.app.models.exception import ExceptionType

class GroundTruthEntry:
    def __init__(self, order_id: str, is_exception: bool, exception_type: str = None, 
                 expected_discrepancy: float = 0.0, description: str = ""):
        self.order_id = order_id
        self.is_exception = is_exception
        self.exception_type = exception_type
        self.expected_discrepancy = expected_discrepancy
        self.description = description

    def to_dict(self) -> Dict[str, Any]:
        return {
            "order_id": self.order_id,
            "is_exception": self.is_exception,
            "exception_type": self.exception_type,
            "expected_discrepancy": round(self.expected_discrepancy, 2),
            "description": self.description
        }

# Realistic Indian Merchant & Vendor Catalog
AUTHENTIC_VENDORS = [
    {"id": "vend_boat01", "name": "boAt Lifestyle Audio", "gstin": "27AABCU9603R1ZM", "bank": "HDFC0000240"},
    {"id": "vend_noise02", "name": "Noise Smartwatches", "gstin": "07AAACN1234D1ZP", "bank": "ICIC0001004"},
    {"id": "vend_mama03", "name": "Mamaearth Organics", "gstin": "06AABCM9988E1ZT", "bank": "KKBK0000958"},
    {"id": "vend_cloud04", "name": "Cloudtail Retail India", "gstin": "29AABCC4321F1ZU", "bank": "SBIN0004521"},
    {"id": "vend_appario05", "name": "Appario Electronics", "gstin": "07AABCA7654G1ZV", "bank": "AXIS0000123"},
    {"id": "vend_wakefit06", "name": "Wakefit Home Living", "gstin": "29AABCW8877H1ZX", "bank": "HDFC0001850"},
    {"id": "vend_lens07", "name": "Lenskart Eyewear Solutions", "gstin": "06AABCL5544I1ZY", "bank": "ICIC0000450"},
    {"id": "vend_sugar08", "name": "SUGAR Cosmetics", "gstin": "27AABCS3322J1ZZ", "bank": "KKBK0001200"},
    {"id": "vend_cult09", "name": "Cult.fit Wellness", "gstin": "29AABCC1122K1Z0", "bank": "HDFC0000100"},
    {"id": "vend_licious10", "name": "Licious Fresh Foods", "gstin": "29AABCL9900L1Z1", "bank": "SBIN0001500"},
    {"id": "vend_titan11", "name": "Titan World Store", "gstin": "29AABCT1234M1Z2", "bank": "AXIS0000450"},
    {"id": "vend_pepper12", "name": "Pepperfry Furniture", "gstin": "27AABCP5678N1Z3", "bank": "ICIC0000800"},
    {"id": "vend_zepto13", "name": "Zepto Quick Delivery", "gstin": "27AABCZ9012P1Z4", "bank": "HDFC0000900"},
    {"id": "vend_blinkit14", "name": "Blinkit Retail Express", "gstin": "07AABCB3456Q1Z5", "bank": "SBIN0009900"},
    {"id": "vend_nykaa15", "name": "Nykaa Beauty & Fashion", "gstin": "27AABCN7890R1Z6", "bank": "KKBK0000300"},
]

class SyntheticDataGenerator:
    def __init__(self, seed: int = 42, policy: MerchantSettlementPolicy = None):
        self.seed = seed
        random.seed(seed)
        self.policy = policy or MerchantSettlementPolicy()
        self.vendors = AUTHENTIC_VENDORS
        self.categories = [
            ("standard_goods", "GST_18"),
            ("digital_services", "GST_18"),
            ("exempt_goods", "GST_EXEMPT"),
            ("high_value_electronics", "GST_18"),
            ("essentials", "GST_5")
        ]
        self.base_time = datetime(2026, 8, 1, 9, 0, 0)

    def generate_batch(self, count: int = 500) -> Tuple[Dict[str, List[Any]], Dict[str, GroundTruthEntry]]:
        orders: List[Order] = []
        payments: List[Payment] = []
        splits: List[Split] = []
        payouts: List[Payout] = []
        refunds: List[Refund] = []
        settlements: List[SettlementRecord] = []
        ground_truth: Dict[str, GroundTruthEntry] = {}

        # Target exception distribution across 500 records (~7% anomaly rate)
        exception_indices = {
            "refund_clawback": set(range(10, 20)),      # 10 Late refund unrecovered clawbacks
            "excess_commission": set(range(35, 41)),    # 6 Duplicate commission overcharges
            "tax_mismatch": set(range(70, 77)),         # 7 GST slab mismatches
            "orphaned_payout": set(range(110, 115)),    # 5 Orphaned payouts without captured payments
            "rounding_drift": set(range(150, 154)),     # 4 Sub-ledger rounding drifts
            "ambiguous_policy": set(range(180, 183)),   # 3 Ambiguous unmapped vendor contract tiers
        }

        for i in range(1, count + 1):
            order_id = f"ord_{i:04d}"
            vendor_profile = random.choice(self.vendors)
            vendor_id = vendor_profile["id"]
            cat, tax_class = random.choice(self.categories)
            
            # Realistic order amounts from ₹500 to ₹45,000
            amount = round(random.choice([850, 1299, 2499, 4999, 8999, 12499, 18999, 24999, 36500]) + random.uniform(-15, 15), 2)
            created_dt = self.base_time + timedelta(minutes=i * 12)
            created_dt_str = created_dt.isoformat()
            
            # Policy calculations
            comm_pct = self.policy.platform_commission_pct / 100.0
            gross_comm = round(amount * comm_pct, 2)
            expected_vendor_share = round(amount - gross_comm, 2)
            
            # Gateway fee
            gw_fee = round(amount * (self.policy.payment_gateway_fee_pct / 100.0), 2)
            gw_tax = round(gw_fee * (self.policy.payment_gateway_fee_tax_pct / 100.0), 2)
            
            transfer_fee = self.policy.route_transfer_fee_flat
            transfer_tax = round(transfer_fee * (self.policy.route_transfer_fee_tax_pct / 100.0), 2)

            actual_comm = gross_comm
            actual_vendor_payout = expected_vendor_share
            tax_rate = self.policy.tax_rules.get(tax_class, 18.0)
            actual_tax_deducted = round(gross_comm * (tax_rate / 100.0), 2)

            order_status = OrderStatus.SETTLED
            pay_status = PaymentStatus.CAPTURED
            refund_obj = None

            # Anomaly 1: Late Refund After Vendor Payout (Unrecovered Clawback)
            if i in exception_indices["refund_clawback"]:
                order_status = OrderStatus.REFUNDED
                pay_status = PaymentStatus.REFUNDED
                refund_amt = amount
                refund_dt = created_dt + timedelta(hours=4)
                refund_obj = Refund(
                    id=f"rfnd_{i:04d}",
                    order_id=order_id,
                    payment_id=f"pay_{i:04d}",
                    vendor_id=vendor_id,
                    amount=refund_amt,
                    status=RefundStatus.PROCESSED,
                    clawback_required=True,
                    clawback_amount=0.0, # 0.0 unrecovered clawback
                    clawback_status=ClawbackStatus.UNRECOVERED,
                    created_at=refund_dt.isoformat(),
                    reason="customer_return"
                )
                ground_truth[order_id] = GroundTruthEntry(
                    order_id=order_id,
                    is_exception=True,
                    exception_type=ExceptionType.REFUND_AFTER_PAYOUT_UNRECOVERED.value,
                    expected_discrepancy=actual_vendor_payout,
                    description=f"Customer refunded ₹{refund_amt} 4h post vendor payout. Ledger missing debit clawback."
                )

            # Anomaly 2: Duplicate Commission Overcharge
            elif i in exception_indices["excess_commission"]:
                actual_comm = round(gross_comm * 2.2, 2)
                actual_vendor_payout = round(amount - actual_comm, 2)
                ground_truth[order_id] = GroundTruthEntry(
                    order_id=order_id,
                    is_exception=True,
                    exception_type=ExceptionType.EXCESS_COMMISSION_DOUBLE_COUNT.value,
                    expected_discrepancy=round(actual_comm - gross_comm, 2),
                    description=f"Platform charged duplicate promotional commission (₹{actual_comm} vs ₹{gross_comm})."
                )

            # Anomaly 3: GST Slab Tax Divergence
            elif i in exception_indices["tax_mismatch"]:
                tax_class = "GST_28"
                expected_tax = round(gross_comm * 0.18, 2)
                actual_tax_deducted = round(gross_comm * 0.28, 2)
                ground_truth[order_id] = GroundTruthEntry(
                    order_id=order_id,
                    is_exception=True,
                    exception_type=ExceptionType.TAX_RULE_MISMATCH.value,
                    expected_discrepancy=round(abs(actual_tax_deducted - expected_tax), 2),
                    description=f"GST sub-ledger applied 28% luxury rate instead of 18% policy rate."
                )

            # Anomaly 4: Orphaned Payout (No Captured Payment)
            elif i in exception_indices["orphaned_payout"]:
                pay_status = PaymentStatus.FAILED
                ground_truth[order_id] = GroundTruthEntry(
                    order_id=order_id,
                    is_exception=True,
                    exception_type=ExceptionType.ORPHANED_PAYOUT_RECORD.value,
                    expected_discrepancy=actual_vendor_payout,
                    description=f"Bank payout settled with valid UTR, but upstream gateway payment failed."
                )

            # Anomaly 5: Cumulative Sub-Ledger Rounding Drift
            elif i in exception_indices["rounding_drift"]:
                actual_vendor_payout = round(actual_vendor_payout - 3.75, 2)
                ground_truth[order_id] = GroundTruthEntry(
                    order_id=order_id,
                    is_exception=True,
                    exception_type=ExceptionType.ROUNDING_DRIFT_EXCEEDED.value,
                    expected_discrepancy=3.75,
                    description=f"Sub-ledger truncation accumulated ₹3.75 drift beyond policy tolerance."
                )

            # Anomaly 6: Ambiguous Unmapped Contract Tier
            elif i in exception_indices["ambiguous_policy"]:
                cat = "UNMAPPED_CUSTOM_TIER"
                tax_class = "UNKNOWN_TAX_GROUP"
                ground_truth[order_id] = GroundTruthEntry(
                    order_id=order_id,
                    is_exception=True,
                    exception_type=ExceptionType.AMBIGUOUS_POLICY_CATEGORY.value,
                    expected_discrepancy=0.0,
                    description=f"Vendor under custom tier with unmapped contractual rates. Routed to Human Review."
                )

            # Clean Record
            else:
                ground_truth[order_id] = GroundTruthEntry(
                    order_id=order_id,
                    is_exception=False,
                    expected_discrepancy=0.0,
                    description="Clean balanced settlement record."
                )

            # Create Order
            order = Order(
                id=order_id,
                customer_id=f"cust_{random.randint(1000, 9999)}",
                vendor_id=vendor_id,
                amount=amount,
                currency="INR",
                status=order_status,
                item_category=cat,
                tax_class=tax_class,
                created_at=created_dt_str
            )
            orders.append(order)

            # Create Payment
            pm_method = random.choice(["upi", "card", "netbanking"])
            utr_num = f"UTR{random.randint(100000000000, 999999999999)}"
            payment = Payment(
                id=f"pay_{i:04d}",
                order_id=order_id,
                amount=amount,
                currency="INR",
                status=pay_status,
                method=pm_method,
                gateway_fee=gw_fee,
                gateway_tax=gw_tax,
                utr=utr_num,
                captured_at=(created_dt + timedelta(minutes=2)).isoformat()
            )
            payments.append(payment)

            # Create Split
            split = Split(
                id=f"splt_{i:04d}",
                order_id=order_id,
                vendor_id=vendor_id,
                gross_amount=amount,
                vendor_amount=actual_vendor_payout,
                platform_commission=actual_comm,
                route_transfer_fee=transfer_fee,
                route_transfer_tax=transfer_tax,
                status="settled",
                created_at=(created_dt + timedelta(minutes=5)).isoformat()
            )
            splits.append(split)

            # Create Payout
            payout = Payout(
                id=f"pout_{i:04d}",
                order_id=order_id,
                vendor_id=vendor_id,
                split_id=split.id,
                amount=actual_vendor_payout,
                currency="INR",
                status=PayoutStatus.SETTLED,
                utr=utr_num,
                settled_at=(created_dt + timedelta(hours=2)).isoformat(),
                batch_id=f"BATCH_{created_dt.strftime('%Y%m%d')}"
            )
            payouts.append(payout)

            if refund_obj:
                refunds.append(refund_obj)

        dataset = {
            "orders": orders,
            "payments": payments,
            "splits": splits,
            "payouts": payouts,
            "refunds": refunds,
            "settlements": settlements
        }

        return dataset, ground_truth
