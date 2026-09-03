import uuid
from fastapi import APIRouter, HTTPException, Body
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from backend.app.state import state
from backend.app.models.domain import (
    Order, Payment, Split, Payout, Refund,
    OrderStatus, PaymentStatus, PayoutStatus, RefundStatus, ClawbackStatus
)
from backend.app.data.synthetic_generator import GroundTruthEntry
from backend.app.models.exception import ExceptionType
from backend.app.agent.tools import AgentToolRegistry
from backend.app.agent.investigator import AIInvestigator

router = APIRouter(prefix="/api/chaos", tags=["Chaos Injector"])

@router.post("/inject")
def inject_chaos_scenario(payload: Dict[str, Any] = Body(...)):
    scenario = payload.get("scenario")  # LATE_REFUND, DUPLICATE_COMMISSION, TAX_MISMATCH, GHOST_PAYOUT, AMBIGUOUS_TIER
    custom_amount = float(payload.get("amount", 12500.0))
    vendor_id = payload.get("vendor_id", "vend_007")

    order_idx = len(state.orders) + 1
    order_id = f"ord_chaos_{order_idx:04d}"
    now = datetime.utcnow()

    gt_entry = GroundTruthEntry(
        order_id=order_id,
        is_exception=True,
        exception_type=scenario,
        expected_discrepancy=0.0,
        description=f"Live chaos scenario: {scenario}"
    )

    if scenario == "LATE_REFUND":
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
            clawback_amount=0.0,
            clawback_status=ClawbackStatus.UNRECOVERED,
            reason="live_judge_chaos_test"
        )

        state.orders[order_id] = order
        state.payments[order_id] = payment
        state.splits.setdefault(order_id, []).append(split)
        state.payouts.setdefault(order_id, []).append(payout)
        state.refunds.setdefault(order_id, []).append(refund)

        gt_entry.expected_discrepancy = vendor_payout

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

        gt_entry.expected_discrepancy = round(comm - (custom_amount * 0.10), 2)

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
            status=PaymentStatus.FAILED,
            method="netbanking",
            utr="UTR_FAILED",
            captured_at=now.isoformat()
        )
        vendor_payout = round(custom_amount * 0.90, 2)
        payout = Payout(
            id=f"pout_chaos_{order_idx:04d}",
            order_id=order_id,
            vendor_id=vendor_id,
            amount=vendor_payout,
            status=PayoutStatus.SETTLED,
            utr=f"GHOST_UTR_{uuid.uuid4().hex[:8].upper()}",
            settled_at=now.isoformat(),
            batch_id="BATCH_LIVE_DEMO"
        )
        state.orders[order_id] = order
        state.payments[order_id] = payment
        state.payouts.setdefault(order_id, []).append(payout)

        gt_entry.expected_discrepancy = vendor_payout

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
        gt_entry.expected_discrepancy = 0.0

    # Save to ground truth dict
    state.ground_truth[order_id] = gt_entry

    # Re-run reconciliation on the new batch dynamically
    result = state.reconciler.reconcile_batch(
        orders=state.orders,
        payments=state.payments,
        splits=state.splits,
        payouts=state.payouts,
        refunds=state.refunds
    )
    state.last_run_result = result
    state.settlement_records = result.settlement_records
    state.exceptions = {e.id: e for e in result.exceptions}

    # Update tool registry for ReAct AI
    state.tool_registry = AgentToolRegistry(
        orders=state.orders,
        payments=state.payments,
        splits=state.splits,
        payouts=state.payouts,
        refunds=state.refunds,
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
