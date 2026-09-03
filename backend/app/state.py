from typing import Dict, List, Optional, Any
from backend.app.models.domain import Order, Payment, Split, Payout, Refund, SettlementRecord, CashPosition, BatchStatus
from backend.app.models.policy import MerchantSettlementPolicy
from backend.app.models.exception import SettlementException
from backend.app.models.benchmark import BenchmarkReport
from backend.app.data.synthetic_generator import SyntheticDataGenerator, GroundTruthEntry
from backend.app.data.ground_truth import GroundTruthEvaluator
from backend.app.engine.reconciler import MultiSourceReconciler, BatchReconciliationResult
from backend.app.agent.tools import AgentToolRegistry
from backend.app.agent.investigator import AIInvestigator
from backend.app.ledger.journal_ledger import DoubleEntryJournalLedger
from backend.app.ledger.correction_executor import CorrectionExecutor
from backend.app.ledger.verifier import PostCorrectionVerifier
from backend.app.db.session import SessionLocal
from backend.app.db.models import OrderRecord, PaymentRecord, SplitRecord, PayoutRecord, RefundRecord, SettlementExceptionRecord

class AppState:
    def __init__(self):
        self.policy = MerchantSettlementPolicy()
        self.generator = SyntheticDataGenerator(seed=42, policy=self.policy)
        self.reconciler = MultiSourceReconciler(policy=self.policy)
        self.ledger = DoubleEntryJournalLedger()
        self.executor = CorrectionExecutor(self.ledger)
        self.verifier = PostCorrectionVerifier(self.reconciler)
        
        self.orders: Dict[str, Order] = {}
        self.payments: Dict[str, Payment] = {}
        self.splits: Dict[str, List[Split]] = {}
        self.payouts: Dict[str, List[Payout]] = {}
        self.refunds: Dict[str, List[Refund]] = {}
        self.settlement_records: List[SettlementRecord] = []
        self.exceptions: Dict[str, SettlementException] = {}
        self.ground_truth: Dict[str, GroundTruthEntry] = {}
        
        self.last_run_result: Optional[BatchReconciliationResult] = None
        self.tool_registry: Optional[AgentToolRegistry] = None
        self.investigator: Optional[AIInvestigator] = None
        self.evaluator: Optional[GroundTruthEvaluator] = None

        # Auto-initialize 75-record batch immediately on startup
        self.initialize_and_run(count=75)

    def persist_to_db(self, data: Dict[str, Any]):
        """
        Saves all generated/loaded records into the SQL database (SQLite / PostgreSQL / Supabase).
        """
        try:
            db = SessionLocal()
            # Clear previous records for fresh run
            db.query(SplitRecord).delete()
            db.query(PayoutRecord).delete()
            db.query(RefundRecord).delete()
            db.query(PaymentRecord).delete()
            db.query(OrderRecord).delete()
            db.query(SettlementExceptionRecord).delete()
            db.commit()

            # Insert Orders
            for o in data["orders"]:
                db.add(OrderRecord(
                    id=o.id,
                    gross_amount=o.amount,
                    vendor_id=o.vendor_id,
                    vendor_name=o.vendor_name,
                    item_category=o.item_category,
                    status=o.status.value
                ))
            # Insert Payments
            for p in data["payments"]:
                db.add(PaymentRecord(
                    id=p.id,
                    order_id=p.order_id,
                    amount=p.amount,
                    gateway_fee=p.fee,
                    gateway_tax=p.tax,
                    status=p.status.value,
                    method=p.method
                ))
            # Insert Splits
            for s in data["splits"]:
                db.add(SplitRecord(
                    id=s.id,
                    order_id=s.order_id,
                    vendor_id=s.vendor_id,
                    vendor_amount=s.vendor_amount,
                    marketplace_fee=s.marketplace_commission,
                    marketplace_tax=s.marketplace_tax
                ))
            # Insert Payouts
            for p in data["payouts"]:
                db.add(PayoutRecord(
                    id=p.id,
                    order_id=p.order_id,
                    vendor_id=p.vendor_id,
                    amount=p.amount,
                    status=p.status.value,
                    utr=p.utr
                ))
            # Insert Refunds
            for r in data["refunds"]:
                db.add(RefundRecord(
                    id=r.id,
                    order_id=r.order_id,
                    amount=r.amount,
                    reason=r.reason
                ))
            db.commit()
            db.close()
        except Exception as e:
            print(f"⚠️ DB Persistence note: {e}")

    def initialize_and_run(self, count: int = 75):
        data, gt = self.generator.generate_batch(count=count)
        self.ground_truth = gt
        self.evaluator = GroundTruthEvaluator(self.ground_truth)

        self.orders = {o.id: o for o in data["orders"]}
        self.payments = {p.order_id: p for p in data["payments"]}
        
        # Group splits, payouts, refunds by order_id
        self.splits = {}
        for s in data["splits"]:
            self.splits.setdefault(s.order_id, []).append(s)
            
        self.payouts = {}
        for p in data["payouts"]:
            self.payouts.setdefault(p.order_id, []).append(p)
            
        self.refunds = {}
        for r in data["refunds"]:
            self.refunds.setdefault(r.order_id, []).append(r)

        # Run reconciliation
        res = self.reconciler.reconcile_batch(
            orders=self.orders,
            payments=self.payments,
            splits=self.splits,
            payouts=self.payouts,
            refunds=self.refunds
        )
        self.last_run_result = res
        self.settlement_records = res.settlement_records
        self.exceptions = {e.id: e for e in res.exceptions}

        # Initialize AI Tool Registry & Investigator
        self.tool_registry = AgentToolRegistry(
            orders=self.orders,
            payments=self.payments,
            splits=self.splits,
            payouts=self.payouts,
            refunds=self.refunds,
            policy=self.policy
        )
        self.investigator = AIInvestigator(self.tool_registry)

        # Persist batch to DB
        self.persist_to_db(data)

    def get_batch_status(self) -> BatchStatus:
        if not self.last_run_result:
            self.initialize_and_run(75)
        return self.last_run_result.to_batch_status(
            total_resolved=sum(1 for e in self.exceptions.values() if e.status.value == "VERIFIED_RESOLVED"),
            total_unresolved=sum(1 for e in self.exceptions.values() if e.status.value == "UNRESOLVED"),
            total_human_review=sum(1 for e in self.exceptions.values() if e.status.value == "HUMAN_REVIEW")
        )

    def get_cash_position(self) -> CashPosition:
        if not self.last_run_result:
            self.initialize_and_run(75)
            
        total_gmv = sum(o.amount for o in self.orders.values())
        unrecovered_clawbacks = sum(
            r.amount for r_list in self.refunds.values() for r in r_list 
            if r.clawback_status.value == "UNRECOVERED"
        )
        orphaned_exposure = sum(
            p.amount for p_list in self.payouts.values() for p in p_list 
            if p.order_id not in self.payments
        )
        # Safe float represents total GMV minus uncollected liabilities and unrecovered exposure
        safe_float = max(0.0, total_gmv * 0.88 - unrecovered_clawbacks - orphaned_exposure)
        risk_pct = round((unrecovered_clawbacks + orphaned_exposure) / max(total_gmv, 1.0) * 100, 2)
        
        return CashPosition(
            total_gmv_inr=round(total_gmv, 2),
            unrecovered_vendor_clawbacks_inr=round(unrecovered_clawbacks, 2),
            orphaned_payout_exposure_inr=round(orphaned_exposure, 2),
            safe_settlement_disbursement_float_inr=round(safe_float, 2),
            float_risk_index_pct=risk_pct
        )

    def get_exceptions(self) -> List[SettlementException]:
        return list(self.exceptions.values())

    def get_record_by_order(self, order_id: str) -> Optional[SettlementRecord]:
        for r in self.settlement_records:
            if r.order_id == order_id:
                return r
        return None

state = AppState()
app_state = state
