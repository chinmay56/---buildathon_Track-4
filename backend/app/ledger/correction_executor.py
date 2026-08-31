from typing import Dict, List, Any, Optional
from datetime import datetime
from backend.app.models.domain import Order, Payment, Split, Payout, Refund, ClawbackStatus
from backend.app.models.exception import SettlementException, CorrectionProposal, ExceptionStatus
from backend.app.ledger.journal_ledger import DoubleEntryJournalLedger

class CorrectionExecutor:
    def __init__(self, ledger: DoubleEntryJournalLedger):
        self.ledger = ledger
        self.executed_idempotency_keys = set()

    def execute_correction(
        self,
        exception: SettlementException,
        proposal: CorrectionProposal,
        orders: Dict[str, Order],
        payments: Dict[str, Payment],
        splits: Dict[str, List[Split]],
        payouts: Dict[str, List[Payout]],
        refunds: Dict[str, List[Refund]],
        approved_by: str = "FinanceManager@marketplace.in"
    ) -> Dict[str, Any]:
        if proposal.idempotency_key in self.executed_idempotency_keys:
            return {
                "status": "already_executed",
                "message": f"Proposal {proposal.proposal_id} was already executed previously."
            }

        order_id = exception.order_id
        vendor_id = proposal.target_vendor_id
        amt = proposal.adjustment_amount

        # 1. Update Domain State
        if proposal.action_type == "CREATE_VENDOR_CLAWBACK_DEBIT":
            order_refunds = refunds.get(order_id, [])
            for ref in order_refunds:
                ref.clawback_amount = amt
                ref.clawback_status = ClawbackStatus.RECOVERED
            
            # Post debit entry on double-entry journal ledger
            self.ledger.post_entry(
                order_id=order_id,
                vendor_id=vendor_id,
                entry_type="CLAWBACK_DEBIT",
                debit=amt,
                credit=0.0,
                description=f"Clawback recovery for refund on {order_id} post-payout",
                is_correction=True,
                parent_exception_id=exception.id
            )

        elif proposal.action_type == "REFUND_COMMISSION_CREDIT":
            order_splits = splits.get(order_id, [])
            for s in order_splits:
                s.platform_commission = round(s.platform_commission - amt, 2)
                s.vendor_amount = round(s.vendor_amount + amt, 2)
            
            self.ledger.post_entry(
                order_id=order_id,
                vendor_id=vendor_id,
                entry_type="COMMISSION_ADJUSTMENT_CREDIT",
                debit=0.0,
                credit=amt,
                description=f"Refund excess commission of ₹{amt} to vendor on {order_id}",
                is_correction=True,
                parent_exception_id=exception.id
            )

        elif proposal.action_type == "TAX_ROUNDING_ADJUSTMENT":
            order_splits = splits.get(order_id, [])
            for s in order_splits:
                s.marketplace_tax = round(s.marketplace_tax - amt, 2)
            
            self.ledger.post_entry(
                order_id=order_id,
                vendor_id=vendor_id,
                entry_type="TAX_RECONCILIATION_CREDIT",
                debit=0.0,
                credit=amt,
                description=f"Tax reconciliation adjustment on order {order_id}",
                is_correction=True,
                parent_exception_id=exception.id
            )

        elif proposal.action_type == "QUARANTINE_UNMATCHED_PAYOUT":
            order_payouts = payouts.get(order_id, [])
            for p in order_payouts:
                p.status = "QUARANTINED"
            
            self.ledger.post_entry(
                order_id=order_id,
                vendor_id=vendor_id,
                entry_type="PAYOUT_QUARANTINE",
                debit=amt,
                credit=0.0,
                description=f"Quarantined unlinked payout ₹{amt} for {order_id}",
                is_correction=True,
                parent_exception_id=exception.id
            )

        elif proposal.action_type == "ROUNDING_TOLERANCE_OFFSET":
            self.ledger.post_entry(
                order_id=order_id,
                vendor_id=vendor_id,
                entry_type="ROUNDING_WRITE_OFF",
                debit=0.0,
                credit=amt,
                description=f"Automated rounding tolerance offset of ₹{amt}",
                is_correction=True,
                parent_exception_id=exception.id
            )

        # 2. Mark proposal approved & executed
        proposal.approved_by = approved_by
        proposal.approved_at = datetime.utcnow().isoformat()
        proposal.execution_status = "EXECUTED"
        proposal.executed_at = datetime.utcnow().isoformat()

        self.executed_idempotency_keys.add(proposal.idempotency_key)

        exception.status = ExceptionStatus.RESOLVED
        exception.audit_trail.append({
            "step": "CORRECTION_EXECUTED",
            "timestamp": datetime.utcnow().isoformat(),
            "approved_by": approved_by,
            "action_applied": proposal.action_type,
            "amount_inr": amt,
            "journal_entry": proposal.journal_entry
        })

        return {
            "status": "success",
            "message": f"Successfully executed {proposal.action_type} for ₹{amt:,.2f}. Double-entry journal updated.",
            "exception_id": exception.id
        }
