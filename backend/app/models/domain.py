from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from enum import Enum
from datetime import datetime

class OrderStatus(str, Enum):
    CREATED = "created"
    PAID = "paid"
    PARTIALLY_REFUNDED = "partially_refunded"
    REFUNDED = "refunded"
    SETTLED = "settled"

class PaymentStatus(str, Enum):
    AUTHORIZED = "authorized"
    CAPTURED = "captured"
    REFUNDED = "refunded"
    FAILED = "failed"

class PayoutStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    SETTLED = "settled"
    REVERSED = "reversed"

class RefundStatus(str, Enum):
    PROCESSED = "processed"
    PENDING = "pending"
    FAILED = "failed"

class ClawbackStatus(str, Enum):
    NOT_REQUIRED = "not_required"
    PENDING = "pending"
    RECOVERED = "recovered"
    UNRECOVERED = "unrecovered"

class Order(BaseModel):
    id: str
    customer_id: str
    vendor_id: str
    amount: float
    currency: str = "INR"
    status: OrderStatus
    item_category: str = "standard_goods" # standard_goods, digital_services, exempt_goods, high_value_electronics
    tax_class: str = "GST_18" # GST_18, GST_5, GST_12, GST_EXEMPT
    created_at: str

class Payment(BaseModel):
    id: str
    order_id: str
    amount: float
    currency: str = "INR"
    status: PaymentStatus
    method: str = "upi" # upi, card, netbanking, wallet
    gateway_fee: float = 0.0
    gateway_tax: float = 0.0
    utr: str
    captured_at: str

class Split(BaseModel):
    id: str
    order_id: str
    vendor_id: str
    gross_amount: float
    vendor_amount: float
    platform_commission: float
    route_transfer_fee: float = 0.0
    route_transfer_tax: float = 0.0
    status: str = "settled"
    created_at: str

class Payout(BaseModel):
    id: str
    order_id: str
    vendor_id: str
    split_id: Optional[str] = None
    amount: float
    currency: str = "INR"
    status: PayoutStatus
    utr: str
    settled_at: str
    batch_id: str

class Refund(BaseModel):
    id: str
    order_id: str
    payment_id: str
    vendor_id: str
    amount: float
    status: RefundStatus
    created_at: str
    clawback_required: bool = True
    clawback_amount: float = 0.0
    clawback_status: ClawbackStatus = ClawbackStatus.NOT_REQUIRED
    reason: str = "customer_return"

class SettlementRecord(BaseModel):
    id: str
    order_id: str
    vendor_id: str
    gross_amount: float
    expected_settlement: float
    actual_settlement: float
    commission_deducted: float
    tax_deducted: float
    gateway_fee_deducted: float
    net_discrepancy: float = 0.0
    status: str = "MATCHED" # MATCHED, EXCEPTION, RESOLVED, HUMAN_REVIEW
    exception_id: Optional[str] = None
    reconciled_at: Optional[str] = None

class LedgerEntry(BaseModel):
    id: str
    timestamp: str
    order_id: str
    vendor_id: str
    entry_type: str # PAYMENT, COMMISSION, SPLIT_PAYOUT, REFUND, CLAWBACK_DEBIT, TAX_ADJUSTMENT, MANUAL_JOURNAL
    debit: float = 0.0
    credit: float = 0.0
    balance_after: float = 0.0
    description: str
    is_correction: bool = False
    parent_exception_id: Optional[str] = None

class CashPosition(BaseModel):
    total_gmv_inr: float
    unrecovered_vendor_clawbacks_inr: float
    orphaned_payout_exposure_inr: float
    safe_settlement_disbursement_float_inr: float
    float_risk_index_pct: float

class BatchStatus(BaseModel):
    batch_id: str
    total_records: int = 0
    matched_records: int = 0
    exception_count: int = 0
    resolved_count: int = 0
    unresolved_count: int = 0
    human_review_count: int = 0
    total_exposure_inr: float = 0.0
    match_rate_pct: float = 0.0
    processing_time_ms: float = 0.0
    throughput_records_per_sec: float = 0.0
    last_reconciled_at: str = ""
