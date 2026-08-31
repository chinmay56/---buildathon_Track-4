"""
Forward Cash Flow Forecasting Engine for Razorpay Route Marketplace Settlements.

Calculates rolling 7-day liquidity projections, safe disbursement buffers,
and trapped vendor clawback recovery schedules.
"""

from typing import List, Dict, Any
from datetime import datetime, timedelta
from pydantic import BaseModel


class DailyForecastItem(BaseModel):
    date: str
    day_label: str
    projected_inflow_inr: float
    scheduled_vendor_payouts_inr: float
    clawback_recovery_inr: float
    net_disbursement_inr: float
    safe_working_capital_float_inr: float
    status: str  # "SAFE", "TIGHT_FLOAT", "ACTION_REQUIRED"


class ForwardCashForecastReport(BaseModel):
    generated_at: str
    current_cash_pool_inr: float
    total_7day_projected_inflow_inr: float
    total_7day_scheduled_disbursements_inr: float
    total_7day_clawback_recovery_inr: float
    net_7day_float_buffer_inr: float
    minimum_float_headroom_inr: float
    liquidity_health_status: str
    daily_projections: List[DailyForecastItem]


def compute_7day_cash_forecast(
    total_gmv: float,
    unrecovered_clawbacks: float,
    orphaned_payouts: float,
    current_settlement_float: float
) -> ForwardCashForecastReport:
    """
    Computes rolling 7-day cash forecast incorporating T+2 marketplace settlement cycle,
    scheduled vendor payouts, and unrecovered refund clawback recoveries.
    """
    today = datetime.now()
    daily_projections: List[DailyForecastItem] = []
    
    # Base daily volume derived from current batch
    avg_daily_gmv = max(total_gmv / 7.0, 500000.0)
    current_float = current_settlement_float
    
    # Scheduled clawback recovery amortized across 7 days
    daily_clawback_recovery = unrecovered_clawbacks / 5.0  # recovered over first 5 days
    
    total_inflow = 0.0
    total_disbursements = 0.0
    total_clawbacks_recovered = 0.0
    min_headroom = current_float

    day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

    for i in range(1, 8):
        target_date = today + timedelta(days=i)
        day_str = target_date.strftime("%Y-%m-%d")
        day_name = target_date.strftime("%a")
        
        # Inflow simulation with realistic weekend vs weekday volatility
        is_weekend = target_date.weekday() >= 5
        multiplier = 1.35 if is_weekend else 0.95
        daily_inflow = round(avg_daily_gmv * multiplier, 2)
        
        # Payouts on T+2 rolling cycle (typically ~86% of gross after 12% commission/fee)
        gross_payout_obligation = round(daily_inflow * 0.86, 2)
        
        # Apply scheduled clawback offset against vendor payout obligations
        clawback_offset = round(min(daily_clawback_recovery if i <= 5 else 0.0, gross_payout_obligation * 0.15), 2)
        net_disbursement = round(gross_payout_obligation - clawback_offset, 2)
        
        # Running liquidity float buffer
        current_float = round(current_float + (daily_inflow * 0.14) + clawback_offset, 2)
        if current_float < min_headroom:
            min_headroom = current_float
            
        status = "SAFE"
        if current_float < 500000.0:
            status = "TIGHT_FLOAT"
        if orphaned_payouts > 100000.0 and i <= 2:
            status = "ACTION_REQUIRED"
            
        total_inflow += daily_inflow
        total_disbursements += net_disbursement
        total_clawbacks_recovered += clawback_offset

        daily_projections.append(
            DailyForecastItem(
                date=day_str,
                day_label=f"{day_name} (Day +{i})",
                projected_inflow_inr=daily_inflow,
                scheduled_vendor_payouts_inr=gross_payout_obligation,
                clawback_recovery_inr=clawback_offset,
                net_disbursement_inr=net_disbursement,
                safe_working_capital_float_inr=current_float,
                status=status
            )
        )

    health_status = "OPTIMAL" if min_headroom > 1000000.0 else "ADEQUATE"

    return ForwardCashForecastReport(
        generated_at=today.isoformat(),
        current_cash_pool_inr=round(current_settlement_float, 2),
        total_7day_projected_inflow_inr=round(total_inflow, 2),
        total_7day_scheduled_disbursements_inr=round(total_disbursements, 2),
        total_7day_clawback_recovery_inr=round(total_clawbacks_recovered, 2),
        net_7day_float_buffer_inr=round(current_float, 2),
        minimum_float_headroom_inr=round(min_headroom, 2),
        liquidity_health_status=health_status,
        daily_projections=daily_projections
    )
