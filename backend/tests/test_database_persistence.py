"""
Unit tests for SQLAlchemy Relational Database Schema & Persistence.
"""

from backend.app.db.session import SessionLocal, engine, Base
from backend.app.db.models import OrderRecord, DoubleEntryJournalEntryRecord
import datetime

def test_database_tables_exist():
    # Verify tables created by SQLAlchemy metadata
    table_names = engine.table_names() if hasattr(engine, 'table_names') else list(Base.metadata.tables.keys())
    assert "orders" in table_names
    assert "payments" in table_names
    assert "splits" in table_names
    assert "payouts" in table_names
    assert "refunds" in table_names
    assert "settlement_exceptions" in table_names
    assert "ledger_journal_entries" in table_names

def test_double_entry_journal_persistence():
    db = SessionLocal()
    try:
        # Create a journal entry
        entry = DoubleEntryJournalEntryRecord(
            id="entry_test_001",
            order_id="ord_test_001",
            account_debited="Vendor_Clawback_Receivable",
            account_credited="Marketplace_Settlement_Pool",
            amount_inr=1500.0,
            posted_by="Arjun Mehta (Lead Controller)",
            policy_citation="Policy Clause 4.2"
        )
        db.merge(entry)
        db.commit()

        # Query back
        saved = db.query(DoubleEntryJournalEntryRecord).filter_by(id="entry_test_001").first()
        assert saved is not None
        assert saved.amount_inr == 1500.0
        assert saved.account_debited == "Vendor_Clawback_Receivable"
    finally:
        db.close()
