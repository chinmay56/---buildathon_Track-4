import pytest
from backend.app.state import state

def test_full_reconciliation_investigation_and_verification_loop():
    # Initialize fresh batch of 500 records
    state.initialize_and_run(count=500)
    
    assert len(state.orders) == 500
    assert len(state.exceptions) > 0

    # Pick an unrecovered refund exception
    refund_exc = next(
        (e for e in state.exceptions.values() if e.exception_type.value == "REFUND_AFTER_PAYOUT_UNRECOVERED"),
        None
    )
    assert refund_exc is not None

    # Step 1: AI Investigation
    investigated = state.investigator.investigate(refund_exc)
    assert investigated.proposed_correction is not None
    assert investigated.evidence.policy_rule_cited != ""
    assert investigated.proposed_correction.adjustment_amount > 0

    # Step 2: Human Approval & Execution
    prop = investigated.proposed_correction
    exec_res = state.executor.execute_correction(
        exception=investigated,
        proposal=prop,
        orders=state.orders,
        payments=state.payments,
        splits=state.splits,
        payouts=state.payouts,
        refunds=state.refunds,
        approved_by="Auditor@test.in"
    )
    assert exec_res["status"] == "success"

    # Step 3: Post-Correction Verification
    verify_res = state.verifier.verify_exception_closure(
        exception=investigated,
        orders=state.orders,
        payments=state.payments,
        splits=state.splits,
        payouts=state.payouts,
        refunds=state.refunds
    )
    assert verify_res["verified"] is True
    assert verify_res["post_verification_delta"] == 0.0
    assert investigated.status.value == "VERIFIED_RESOLVED"
