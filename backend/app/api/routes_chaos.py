import uuid
from fastapi import APIRouter, HTTPException, Body
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from backend.app.state import state
from backend.app.models.domain import (
    Order, Payment, Split, Payout, Refund,
    OrderStatus, PaymentStatus, PayoutStatus, RefundStatus, ClawbackStatus
)
from backend.app.models.exception import ExceptionType

router = APIRouter(prefix="/api/chaos", tags=["Chaos Injector"])

@router.post("/inject")
def inject_chaos_scenario(payload: Dict[str, Any] = Body(...)):
    scenario = payload.get("scenario") # LATE_REFUND, DUPLICATE_COMMISSION, TAX_MISMATCH, GHOST_PAYOUT, AMBIGUOUS_TIER
    custom_amount = float(payload.get("amount", 12500.0))
    vendor_id = payload.get("vendor_id", "vend_007")

    order_idx = len(state.orders) + 1
    order_id = f"ord_chaos_{order_idx:04d}"
    now = datetime.utcnow()

    if scenario == "LATE_REFUND":
        # Order settled, payout made, refund issued post-settlement with 0 clawback
        order = Order(
            id=order_id,
            customer_id="cust_chaos_99",
            vendor_id=vendor_id,
            amount=custom_amount,
            status=OrderStatus.REFUNDED,
            item_category="standard_goods",
            tax_class="GST_18",
            created_at=(now - timedelta(hours=6)).isoformat()
        )
        payment = Payment(
            id=f"pay_chaos_{order_idx:04d}",
            order_id=order_id,
            amount=custom_amount,
            status=PaymentStatus.REFUNDED,
            method="upi",
            utr=f"UTR_LIVE_{uuid.uuid4().hex[:8].upper()}",
            captured_at=(now - timedelta(hours=5, minutes=50)).isoformat()
        )
        vendor_payout = round(custom_amount * 0.90, 2)
        split = Split(
            id=f"spl_chaos_{order_idx:04d}",
            order_id=order_id,
            vendor_id=vendor_id,
            gross_amount=custom_amount,
            vendor_amount=vendor_payout,
            platform_commission=round(custom_amount * 0.10, 2),
            status="settled",
            created_at=(now - timedelta(hours=5)).isoformat()
        )
        payout = Payout(
            id=f"pout_chaos_{order_idx:04d}",
            order_id=order_id,
            vendor_id=vendor_id,
            split_id=split.id,
            amount=vendor_payout,
            status=PayoutStatus.SETTLED,
            utr=f"UTR_SETTLED_{uuid.uuid4().hex[:8].upper()}",
            settled_at=(now - timedelta(hours=3)).isoformat(),
            batch_id="BATCH_LIVE_DEMO"
        )
        refund = Refund(
            id=f"rfnd_chaos_{order_idx:04d}",
            order_id=order_id,
            payment_id=payment.id,
            vendor_id=vendor_id,
            amount=custom_amount,
            status=RefundStatus.PROCESSED,
            created_at=(now - timedelta(hours=1)).isoformat(),
            clawback_required=True,
            clawback_amount=0.0, # DISCREPANCY
            clawback_status=ClawbackStatus.UNRECOVERED,
            reason="live_judge_chaos_test"
        )

        state.orders[order_id] = order
        state.payments[order_id] = payment
        state.splits.setdefault(order_id, []).append(split)
        state.payouts.setdefault(order_id, []).append(payout)
        state.refunds.setdefault(order_id, []).append(refund)

    elif scenario == "DUPLICATE_COMMISSION":
        order = Order(
            id=order_id,
            customer_id="cust_chaos_99",
            vendor_id=vendor_id,
            amount=custom_amount,
            status=OrderStatus.SETTLED,
            item_category="standard_goods",
            tax_class="GST_18",
            created_at=now.isoformat()
        )
        payment = Payment(
            id=f"pay_chaos_{order_idx:04d}",
            order_id=order_id,
            amount=custom_amount,
            status=PaymentStatus.CAPTURED,
            method="card",
            utr=f"UTR_LIVE_{uuid.uuid4().hex[:8].upper()}",
            captured_at=now.isoformat()
        )
        # Charge 25% commission instead of 10%
        comm = round(custom_amount * 0.25, 2)
        vendor_payout = round(custom_amount - comm, 2)
        split = Split(
            id=f"spl_chaos_{order_idx:04d}",
            order_id=order_id,
            vendor_id=vendor_id,
            gross_amount=custom_amount,
            vendor_amount=vendor_payout,
            platform_commission=comm,
            status="settled",
            created_at=now.isoformat()
        )
        payout = Payout(
            id=f"pout_chaos_{order_idx:04d}",
            order_id=order_id,
            vendor_id=vendor_id,
            split_id=split.id,
            amount=vendor_payout,
            status=PayoutStatus.SETTLED,
            utr=f"UTR_SETTLED_{uuid.uuid4().hex[:8].upper()}",
            settled_at=now.isoformat(),
            batch_id="BATCH_LIVE_DEMO"
        )
        state.orders[order_id] = order
        state.payments[order_id] = payment
        state.splits.setdefault(order_id, []).append(split)
        state.payouts.setdefault(order_id, []).append(payout)

    elif scenario == "GHOST_PAYOUT":
        order = Order(
            id=order_id,
            customer_id="cust_chaos_99",
            vendor_id=vendor_id,
            amount=custom_amount,
            status=OrderStatus.CREATED,
            item_category="standard_goods",
            tax_class="GST_18",
            created_at=now.isoformat()
        )
        payment = Payment(
            id=f"pay_chaos_{order_idx:04d}",
            order_id=order_id,
            amount=custom_amount,
            status=PaymentStatus.FAILED, # FAILED PAYMENT
            method="netbanking",
            utr="UTR_FAILED",
            captured_at=now.isoformat()
        )
        payout = Payout(
            id=f"pout_chaos_{order_idx:04d}",
            order_id=order_id,
            vendor_id=vendor_id,
            amount=round(custom_amount * 0.90, 2),
            status=PayoutStatus.SETTLED,
            utr=f"GHOST_UTR_{uuid.uuid4().hex[:8].upper()}",
            settled_at=now.isoformat(),
            batch_id="BATCH_LIVE_DEMO"
        )
        state.orders[order_id] = order
        state.payments[order_id] = payment
        state.payouts.setdefault(order_id, []).append(payout)

    elif scenario == "AMBIGUOUS_TIER":
        order = Order(
            id=order_id,
            customer_id="cust_chaos_99",
            vendor_id=vendor_id,
            amount=custom_amount,
            status=OrderStatus.SETTLED,
            item_category="unregistered_custom_contract",
            tax_class="UNKNOWN_OVERSEAS_EXEMPTION",
            created_at=now.isoformat()
        )
        payment = Payment(
            id=f"pay_chaos_{order_idx:04d}",
            order_id=order_id,
            amount=custom_amount,
            status=PaymentStatus.CAPTURED,
            method="card",
            utr=f"UTR_{uuid.uuid4().hex[:8].upper()}",
            captured_at=now.isoformat()
        )
        state.orders[order_id] = order
        state.payments[order_id] = payment

    # Re-run reconciliation on the new batch
    all_splits = [s for sublist in state.splits.values() for s in sublist]
    all_payouts = [p for sublist in state.payouts.values() for p in sublist]
    all_refunds = [r for sublist in state.refunds.values() for r in sublist]

    result = state.reconciler.reconcile_batch(
        orders=list(state.orders.values()),
        payments=list(state.payments.values()),
        splits=all_splits,
        payouts=all_payouts,
        refunds=all_refunds
    )
    state.last_run_result = result
    state.settlement_records = result.settlement_records
    state.exceptions = {e.id: e for e in result.exceptions}

    # Update tool registry
    state.tool_registry = AgentToolRegistry(
        orders=list(state.orders.values()),
        payments=list(state.payments.values()),
        splits=all_splits,
        payouts=all_payouts,
        refunds=all_refunds,
        policy=state.policy
    )
    state.investigator = AIInvestigator(state.tool_registry)

    # Find the newly caught exception for this order
    new_exc = next((e for e in state.exceptions.values() if e.order_id == order_id), None)

    return {
        "status": "injected",
        "scenario": scenario,
        "order_id": order_id,
        "vendor_id": vendor_id,
        "amount": custom_amount,
        "detected_exception": new_exc.model_dump() if new_exc else None,
        "batch_total": len(state.orders),
        "total_exceptions": len(state.exceptions)
    }
