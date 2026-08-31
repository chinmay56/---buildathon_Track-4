"""
Double-Entry Journal & Settlement Ledger Engine.

Maintains immutable financial transaction entries, debits, credits,
and real-time vendor payable balance calculations.
"""

import uuid
from typing import Dict, List, Optional
from datetime import datetime
from backend.app.models.domain import LedgerEntry


class DoubleEntryJournalLedger:
    def __init__(self):
        self.entries: List[LedgerEntry] = []
        self.vendor_balances: Dict[str, float] = {}

    def post_entry(
        self,
        order_id: str,
        vendor_id: str,
        entry_type: str,
        debit: float,
        credit: float,
        description: str,
        is_correction: bool = False,
        parent_exception_id: Optional[str] = None
    ) -> LedgerEntry:
        current_bal = self.vendor_balances.get(vendor_id, 0.0)
        # Credit increases vendor payable balance, debit decreases vendor balance (clawback/deduction)
        new_bal = round(current_bal + credit - debit, 2)
        self.vendor_balances[vendor_id] = new_bal

        entry = LedgerEntry(
            id=f"LEDGER_{uuid.uuid4().hex[:8].upper()}",
            timestamp=datetime.utcnow().isoformat(),
            order_id=order_id,
            vendor_id=vendor_id,
            entry_type=entry_type,
            debit=debit,
            credit=credit,
            balance_after=new_bal,
            description=description,
            is_correction=is_correction,
            parent_exception_id=parent_exception_id
        )
        self.entries.append(entry)
        return entry

    def get_vendor_balance(self, vendor_id: str) -> float:
        return self.vendor_balances.get(vendor_id, 0.0)

    def get_entries_for_order(self, order_id: str) -> List[LedgerEntry]:
        return [e for e in self.entries if e.order_id == order_id]
