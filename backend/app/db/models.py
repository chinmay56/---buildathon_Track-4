"""
SQLAlchemy ORM Database Models for Razorpay Settlement Controller.

Implements persistent relational schemas for multi-source ingestion,
settlement exceptions, and immutable double-entry journal entries.
"""

from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, JSON, ForeignKey, Text
from datetime import datetime
from backend.app.db.session import Base


class OrderRecord(Base):
    __tablename__ = "orders"

    id = Column(String(64), primary_key=True, index=True)
    gross_amount = Column(Float, nullable=False)
    vendor_id = Column(String(64), index=True, nullable=False)
    vendor_name = Column(String(128), nullable=True)
    item_category = Column(String(64), default="standard_goods")
    status = Column(String(32), default="created")
    created_at = Column(DateTime, default=datetime.utcnow)


class PaymentRecord(Base):
    __tablename__ = "payments"

    id = Column(String(64), primary_key=True, index=True)
    order_id = Column(String(64), ForeignKey("orders.id"), index=True, nullable=False)
    amount = Column(Float, nullable=False)
    gateway_fee = Column(Float, default=0.0)
    gateway_tax = Column(Float, default=0.0)
    status = Column(String(32), default="captured")
    method = Column(String(32), default="upi")
    captured_at = Column(DateTime, default=datetime.utcnow)


class SplitRecord(Base):
    __tablename__ = "splits"

    id = Column(String(64), primary_key=True, index=True)
    order_id = Column(String(64), ForeignKey("orders.id"), index=True, nullable=False)
    vendor_id = Column(String(64), index=True, nullable=False)
    vendor_amount = Column(Float, nullable=False)
    marketplace_fee = Column(Float, default=0.0)
    marketplace_tax = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)


class PayoutRecord(Base):
    __tablename__ = "payouts"

    id = Column(String(64), primary_key=True, index=True)
    order_id = Column(String(64), ForeignKey("orders.id"), index=True, nullable=False)
    vendor_id = Column(String(64), index=True, nullable=False)
    amount = Column(Float, nullable=False)
    status = Column(String(32), default="settled")
    utr = Column(String(64), nullable=True)
    settled_at = Column(DateTime, default=datetime.utcnow)


class RefundRecord(Base):
    __tablename__ = "refunds"

    id = Column(String(64), primary_key=True, index=True)
    order_id = Column(String(64), ForeignKey("orders.id"), index=True, nullable=False)
    amount = Column(Float, nullable=False)
    reason = Column(String(128), default="customer_return")
    created_at = Column(DateTime, default=datetime.utcnow)


class SettlementExceptionRecord(Base):
    __tablename__ = "settlement_exceptions"

    id = Column(String(64), primary_key=True, index=True)
    order_id = Column(String(64), ForeignKey("orders.id"), index=True, nullable=False)
    vendor_id = Column(String(64), index=True, nullable=False)
    exception_type = Column(String(64), nullable=False)
    discrepancy_amount = Column(Float, nullable=False)
    status = Column(String(32), default="UNRESOLVED")
    detector_name = Column(String(64), nullable=False)
    root_cause = Column(Text, nullable=True)
    evidence = Column(JSON, nullable=True)
    proposed_correction = Column(JSON, nullable=True)
    audit_trail = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class DoubleEntryJournalEntryRecord(Base):
    __tablename__ = "ledger_journal_entries"

    id = Column(String(64), primary_key=True, index=True)
    entry_number = Column(Integer, autoincrement=True, unique=True)
    order_id = Column(String(64), ForeignKey("orders.id"), index=True, nullable=False)
    account_debited = Column(String(128), nullable=False)
    account_credited = Column(String(128), nullable=False)
    amount_inr = Column(Float, nullable=False)
    posted_by = Column(String(128), nullable=False)
    policy_citation = Column(String(256), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
