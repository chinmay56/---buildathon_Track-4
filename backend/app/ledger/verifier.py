from typing import Dict, List, Any, Optional
from datetime import datetime
from backend.app.models.domain import Order, Payment, Split, Payout, Refund, SettlementRecord
from backend.app.models.exception import SettlementException, ExceptionStatus
from backend.app.engine.reconciler import MultiSourceReconciler

class PostCorrectionVerifier:
    def __init__(self, reconciler: MultiSourceReconciler):
        self.reconciler = reconciler

    def verify_exception_closure(
        self,
        exception: SettlementException,
        orders: Dict[str, Order],
        payments: Dict[str, Payment],
        splits: Dict[str, List[Split]],
        payouts: Dict[str, List[Payout]],
        refunds: Dict[str, List[Refund]]
    ) -> Dict[str, Any]:
        order_id = exception.order_id
        order = orders.get(order_id)
        if not order:
            return {"verified": False, "reason": "Order not found in registry"}

        order_payment = payments.get(order_id)
        order_splits = splits.get(order_id, [])
        order_payouts = payouts.get(order_id, [])
        order_refunds = refunds.get(order_id, [])

        # Re-run all 5 detectors on this specific order
        residual_exception: Optional[SettlementException] = None
        for detector in self.reconciler.detectors:
            exc = detector.detect(
                order=order,
                payment=order_payment,
                splits=order_splits,
                payouts=order_payouts,
                refunds=order_refunds
            )
            if exc:
                residual_exception = exc
                break

        if residual_exception is None:
            # Successfully verified closed to 0 delta
            exception.status = ExceptionStatus.VERIFIED_RESOLVED
            exception.verified_at = datetime.utcnow().isoformat()
            exception.post_verification_delta = 0.0
            exception.audit_trail.append({
                "step": "POST_CORRECTION_VERIFICATION",
                "timestamp": datetime.utcnow().isoformat(),
                "result": "VERIFIED_RESOLVED",
                "residual_delta_inr": 0.0,
                "message": "Reconciliation re-run confirmed 0.00 financial discrepancy."
            })
            return {
                "verified": True,
                "status": "VERIFIED_RESOLVED",
                "post_verification_delta": 0.0,
                "message": f"Exception {exception.id} confirmed resolved! Net discrepancy closed to ₹0.00."
            }
        else:
            exception.status = ExceptionStatus.UNRESOLVED
            exception.post_verification_delta = residual_exception.discrepancy_amount
            exception.audit_trail.append({
                "step": "POST_CORRECTION_VERIFICATION",
                "timestamp": datetime.utcnow().isoformat(),
                "result": "RESIDUAL_DISCREPANCY_REMAINS",
                "residual_delta_inr": residual_exception.discrepancy_amount
            })
            return {
                "verified": False,
                "status": "UNRESOLVED",
                "post_verification_delta": residual_exception.discrepancy_amount,
                "message": f"Residual discrepancy of ₹{residual_exception.discrepancy_amount} still detected."
            }
