from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from enum import Enum
from datetime import datetime

class ExceptionType(str, Enum):
    REFUND_AFTER_PAYOUT_UNRECOVERED = "REFUND_AFTER_PAYOUT_UNRECOVERED"
    EXCESS_COMMISSION_DOUBLE_COUNT = "EXCESS_COMMISSION_DOUBLE_COUNT"
    TAX_RULE_MISMATCH = "TAX_RULE_MISMATCH"
    ORPHANED_PAYOUT_RECORD = "ORPHANED_PAYOUT_RECORD"
    ROUNDING_DRIFT_EXCEEDED = "ROUNDING_DRIFT_EXCEEDED"
    AMBIGUOUS_POLICY_CATEGORY = "AMBIGUOUS_POLICY_CATEGORY"

class ExceptionStatus(str, Enum):
    DETECTED = "DETECTED"
    AUTO_RESOLVABLE = "AUTO_RESOLVABLE"
    HUMAN_REVIEW = "HUMAN_REVIEW"
    APPROVED = "APPROVED"
    RESOLVED = "RESOLVED"
    VERIFIED_RESOLVED = "VERIFIED_RESOLVED"
    UNRESOLVED = "UNRESOLVED"

class EvidencePackage(BaseModel):
    order_id: Optional[str] = None
    payment_id: Optional[str] = None
    split_id: Optional[str] = None
    payout_id: Optional[str] = None
    refund_id: Optional[str] = None
    settlement_id: Optional[str] = None
    policy_rule_cited: str
    timeline_summary: List[str] = Field(default_factory=list)

class FinancialBreakdown(BaseModel):
    expected_amount: float
    actual_amount: float
    discrepancy_amount: float
    currency: str = "INR"
    calculation_basis: str

class CorrectionProposal(BaseModel):
    proposal_id: str
    exception_id: str
    action_type: str # CREATE_VENDOR_CLAWBACK_DEBIT, REFUND_COMMISSION_CREDIT, REBOOK_TAX_JOURNAL, HOLD_ORPHANED_PAYOUT, BALANCE_ADJUSTMENT
    target_vendor_id: str
    adjustment_amount: float
    is_debit: bool = True # True if debiting vendor / recovering money, False if crediting
    reason: str
    policy_citation: str
    idempotency_key: str
    created_at: str
    approved_by: Optional[str] = None
    approved_at: Optional[str] = None
    execution_status: str = "PENDING"
    executed_at: Optional[str] = None
    journal_entry: Optional[Dict[str, Any]] = None

class SettlementException(BaseModel):
    id: str
    order_id: str
    vendor_id: str
    exception_type: ExceptionType
    status: ExceptionStatus = ExceptionStatus.DETECTED
    detected_at: str
    discrepancy_amount: float
    detector_name: str
    
    financial_breakdown: Optional[FinancialBreakdown] = None
    evidence: Optional[EvidencePackage] = None
    proposed_correction: Optional[CorrectionProposal] = None
    
    investigated_at: Optional[str] = None
    root_cause: Optional[str] = None
    human_review_reason: Optional[str] = None
    required_human_inputs: List[str] = Field(default_factory=list)
    
    audit_trail: List[Dict[str, Any]] = Field(default_factory=list)
    verified_at: Optional[str] = None
    post_verification_delta: Optional[float] = None
