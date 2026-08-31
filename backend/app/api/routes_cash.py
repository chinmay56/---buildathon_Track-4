"""
Cash Position and Forward Liquidity Forecasting API Routes.
"""

from fastapi import APIRouter
from backend.app.state import app_state
from backend.app.models.domain import CashPosition
from backend.app.engine.forecaster import compute_7day_cash_forecast, ForwardCashForecastReport

router = APIRouter(prefix="/api/cash", tags=["Cash Position & Forecasting"])


@router.get("/position", response_model=CashPosition)
async def get_cash_position():
    """
    Calculates current cash position, trapped capital in unrecovered clawbacks,
    orphaned payout risk, and safe settlement disbursement float.
    """
    return app_state.get_cash_position()


@router.get("/forecast", response_model=ForwardCashForecastReport)
async def get_forward_cash_forecast():
    """
    Generates rolling 7-day forward liquidity projections, scheduled T+2 disbursements,
    and clawback offset schedules for working capital safety.
    """
    cash_pos = app_state.get_cash_position()
    return compute_7day_cash_forecast(
        total_gmv=cash_pos.total_gmv_inr,
        unrecovered_clawbacks=cash_pos.unrecovered_vendor_clawbacks_inr,
        orphaned_payouts=cash_pos.orphaned_payout_exposure_inr,
        current_settlement_float=cash_pos.safe_settlement_disbursement_float_inr
    )
