import React, { useState, useEffect } from 'react';
import { TrendingUp, ShieldCheck, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import { fetchCashForecast, fetchCashPosition } from '../api';
import type { ForwardCashForecastReport, CashPosition } from '../types';

export const CashForecastView: React.FC = () => {
  const [forecast, setForecast] = useState<ForwardCashForecastReport | null>(null);
  const [_cash, setCash] = useState<CashPosition | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [f, c] = await Promise.all([
        fetchCashForecast(),
        fetchCashPosition()
      ]);
      setForecast(f);
      setCash(c);
    } catch (err) {
      console.error("Error loading forecast:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Top Header Banner */}
      <div className="blade-panel" style={{ padding: '16px 20px', borderLeft: '4px solid #10B981' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', borderRadius: '6px', background: '#ECFDF5', color: '#047857' }}>
              <TrendingUp size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--blade-text-primary)' }}>
                Forward Cash & Working Capital Forecaster
              </h2>
              <p style={{ fontSize: '0.74rem', color: 'var(--blade-text-muted)' }}>
                Rolling 7-day liquidity projections, safe T+2 disbursement buffer, and automated vendor clawback offsets
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge badge-matched" style={{ fontSize: '0.72rem' }}>
              <ShieldCheck size={12} /> Liquidity Status: {forecast?.liquidity_health_status || "OPTIMAL"}
            </span>
            <button className="btn-secondary" onClick={loadData} disabled={loading} style={{ padding: '5px 10px', fontSize: '0.74rem' }}>
              <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
              <span>Recalculate</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Big KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '14px' }}>
        
        {/* 1. Safe Float */}
        <div className="blade-card" style={{ padding: '16px 18px', borderTop: '3px solid #10B981' }}>
          <div className="micro-label" style={{ marginBottom: '4px' }}>Safe Settlement Float (Current)</div>
          <div className="num-mono" style={{ fontSize: '1.6rem', fontWeight: 700, color: '#047857', marginBottom: '2px' }}>
            ₹{forecast?.current_cash_pool_inr.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || "0.00"}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--blade-text-muted)' }}>
            Available buffer for daily rolling disbursements
          </div>
        </div>

        {/* 2. Projected 7-Day Inflow */}
        <div className="blade-card" style={{ padding: '16px 18px', borderTop: '3px solid #0B72E7' }}>
          <div className="micro-label" style={{ marginBottom: '4px' }}>Projected 7-Day Inflow (GMV)</div>
          <div className="num-mono" style={{ fontSize: '1.6rem', fontWeight: 700, color: '#0B72E7', marginBottom: '2px' }}>
            ₹{forecast?.total_7day_projected_inflow_inr.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || "0.00"}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--blade-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ArrowUpRight size={12} color="#0B72E7" /> Expected marketplace order volume
          </div>
        </div>

        {/* 3. Scheduled Payouts */}
        <div className="blade-card" style={{ padding: '16px 18px', borderTop: '3px solid #F59E0B' }}>
          <div className="micro-label" style={{ marginBottom: '4px' }}>Scheduled Vendor Disbursements</div>
          <div className="num-mono" style={{ fontSize: '1.6rem', fontWeight: 700, color: '#B45309', marginBottom: '2px' }}>
            ₹{forecast?.total_7day_scheduled_disbursements_inr.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || "0.00"}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--blade-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ArrowDownRight size={12} color="#B45309" /> T+2 rolling vendor settlements
          </div>
        </div>

        {/* 4. Clawback Recovery */}
        <div className="blade-card" style={{ padding: '16px 18px', borderTop: '3px solid #8B5CF6' }}>
          <div className="micro-label" style={{ marginBottom: '4px' }}>Scheduled Clawback Offsets</div>
          <div className="num-mono" style={{ fontSize: '1.6rem', fontWeight: 700, color: '#6D28D9', marginBottom: '2px' }}>
            ₹{forecast?.total_7day_clawback_recovery_inr.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || "0.00"}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--blade-text-muted)' }}>
            Recovering unrecovered refunds via debit offset
          </div>
        </div>

      </div>

      {/* 7-Day Projection Table */}
      <div className="blade-panel" style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--blade-text-primary)' }}>
            Rolling 7-Day Settlement & Float Projection
          </h3>
          <span style={{ fontSize: '0.72rem', color: 'var(--blade-text-muted)' }}>
            Minimum Liquidity Headroom: <strong className="num-mono" style={{ color: '#047857' }}>₹{forecast?.minimum_float_headroom_inr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
          </span>
        </div>

        <div style={{ overflowX: 'auto', borderRadius: '6px', border: '1px solid var(--blade-border-subtle)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.78rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--blade-border-subtle)', background: 'var(--blade-bg-subtle)', color: 'var(--blade-text-muted)' }}>
                <th style={{ padding: '9px 12px' }}>DATE / CYCLE</th>
                <th style={{ padding: '9px 12px', textAlign: 'right' }}>PROJECTED INFLOW (₹)</th>
                <th style={{ padding: '9px 12px', textAlign: 'right' }}>VENDOR PAYOUT (₹)</th>
                <th style={{ padding: '9px 12px', textAlign: 'right' }}>CLAWBACK OFFSET (₹)</th>
                <th style={{ padding: '9px 12px', textAlign: 'right' }}>NET DISBURSED (₹)</th>
                <th style={{ padding: '9px 12px', textAlign: 'right' }}>RUNNING FLOAT (₹)</th>
                <th style={{ padding: '9px 12px', textAlign: 'center' }}>HEALTH</th>
              </tr>
            </thead>
            <tbody>
              {forecast?.daily_projections.map((row, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--blade-border-subtle)', background: '#FFFFFF' }}>
                  <td style={{ padding: '9px 12px', fontWeight: 600, color: 'var(--blade-text-primary)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span>{row.day_label}</span>
                      <span className="num-mono" style={{ fontSize: '0.68rem', color: 'var(--blade-text-muted)' }}>{row.date}</span>
                    </div>
                  </td>
                  <td className="num-mono" style={{ padding: '9px 12px', textAlign: 'right', color: 'var(--blade-text-primary)' }}>
                    ₹{row.projected_inflow_inr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="num-mono" style={{ padding: '9px 12px', textAlign: 'right', color: '#B45309' }}>
                    ₹{row.scheduled_vendor_payouts_inr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="num-mono" style={{ padding: '9px 12px', textAlign: 'right', color: '#047857', fontWeight: 600 }}>
                    +₹{row.clawback_recovery_inr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="num-mono" style={{ padding: '9px 12px', textAlign: 'right', color: 'var(--blade-text-primary)', fontWeight: 500 }}>
                    ₹{row.net_disbursement_inr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="num-mono" style={{ padding: '9px 12px', textAlign: 'right', color: '#0B72E7', fontWeight: 700 }}>
                    ₹{row.safe_working_capital_float_inr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '9px 12px', textAlign: 'center' }}>
                    <span className="badge badge-matched" style={{ fontSize: '0.66rem' }}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
