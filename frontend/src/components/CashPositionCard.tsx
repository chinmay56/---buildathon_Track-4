import React from 'react';
import { Lock, Wallet, ShieldCheck, AlertTriangle, TrendingDown, Info } from 'lucide-react';
import type { CashPosition } from '../types';

interface CashProps {
  cash: CashPosition | null;
}

function RiskBar({ pct }: { pct: number }) {
  const color = pct > 10 ? '#DC2626' : pct > 5 ? '#D97706' : '#059669';
  return (
    <div style={{ marginTop: '6px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--blade-text-muted)', marginBottom: '3px' }}>
        <span>0% (No Risk)</span>
        <span style={{ fontWeight: 700, color }}>Current: {pct}%</span>
        <span>20% (High Risk)</span>
      </div>
      <div style={{ height: '6px', borderRadius: '4px', background: '#F1F5F9', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${Math.min(pct / 20 * 100, 100)}%`,
          background: color,
          borderRadius: '4px',
          transition: 'width 0.6s ease'
        }} />
      </div>
    </div>
  );
}

export const CashPositionCard: React.FC<CashProps> = ({ cash }) => {
  if (!cash) return (
    <div className="blade-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--blade-text-muted)' }}>
      Loading cash position...
    </div>
  );

  const totalLiabilities = cash.unrecovered_vendor_clawbacks_inr + cash.orphaned_payout_exposure_inr;
  const isHighRisk = cash.float_risk_index_pct > 10;
  const isMedRisk  = cash.float_risk_index_pct > 5;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

      {/* ── Header banner ───────────────────────────────────────────── */}
      <div className="blade-panel" style={{
        padding: '16px 20px',
        borderLeft: `4px solid ${isHighRisk ? '#DC2626' : isMedRisk ? '#D97706' : '#059669'}`,
        background: '#FFFFFF'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '7px', borderRadius: '6px', background: '#EFF6FF', color: '#0B72E7' }}>
              <Wallet size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--blade-text-primary)' }}>
                Cash Float & Settlement Liquidity Health
              </h2>
              <p style={{ fontSize: '0.73rem', color: 'var(--blade-text-muted)' }}>
                Live working capital position derived from the active reconciliation batch
              </p>
            </div>
          </div>
          <span className="badge" style={{
            fontSize: '0.72rem', padding: '4px 10px',
            background: isHighRisk ? '#FEF2F2' : isMedRisk ? '#FFFBEB' : '#ECFDF5',
            color:      isHighRisk ? '#DC2626' : isMedRisk ? '#D97706' : '#059669',
            border: `1px solid ${isHighRisk ? '#FECACA' : isMedRisk ? '#FDE68A' : '#A7F3D0'}`
          }}>
            {isHighRisk ? '⚠ HIGH RISK' : isMedRisk ? '⚡ MODERATE RISK' : '✓ HEALTHY'} — {cash.float_risk_index_pct}% GMV Exposure
          </span>
        </div>
      </div>

      {/* ── 4 KPI cards ─────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px' }}>

        {/* 1. Total GMV */}
        <div className="blade-card" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="micro-label" style={{ marginBottom: '6px' }}>Total Batch GMV</div>
            <span title="Gross Merchandise Value across all 75 orders in this reconciliation batch">
              <Info size={12} color="var(--blade-text-muted)" />
            </span>
          </div>
          <div className="num-mono" style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--blade-text-primary)' }}>
            ₹{cash.total_gmv_inr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--blade-text-muted)', marginTop: '4px' }}>
            Gross order volume across 75 transactions
          </div>
        </div>

        {/* 2. Trapped Clawbacks */}
        <div className="blade-card" style={{
          padding: '16px 18px',
          background: cash.unrecovered_vendor_clawbacks_inr > 0 ? '#FEF2F2' : '#F0FDF4',
          borderColor: cash.unrecovered_vendor_clawbacks_inr > 0 ? '#FECACA' : '#A7F3D0'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="micro-label" style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              color: cash.unrecovered_vendor_clawbacks_inr > 0 ? '#DC2626' : '#059669',
              marginBottom: '6px'
            }}>
              <Lock size={12} /> Trapped Vendor Clawbacks
            </div>
          </div>
          <div className="num-mono" style={{
            fontSize: '1.45rem', fontWeight: 800,
            color: cash.unrecovered_vendor_clawbacks_inr > 0 ? '#DC2626' : '#059669'
          }}>
            ₹{cash.unrecovered_vendor_clawbacks_inr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.7rem', marginTop: '4px', color: cash.unrecovered_vendor_clawbacks_inr > 0 ? '#DC2626' : '#059669', opacity: 0.9 }}>
            {cash.unrecovered_vendor_clawbacks_inr > 0
              ? 'Customer returned goods after vendor was paid — clawback debit pending'
              : 'No unrecovered clawbacks — all refund debits reconciled'}
          </div>
        </div>

        {/* 3. Orphaned Payouts */}
        <div className="blade-card" style={{
          padding: '16px 18px',
          background: cash.orphaned_payout_exposure_inr > 0 ? '#FFFBEB' : '#F0FDF4',
          borderColor: cash.orphaned_payout_exposure_inr > 0 ? '#FDE68A' : '#A7F3D0'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="micro-label" style={{
              color: cash.orphaned_payout_exposure_inr > 0 ? '#D97706' : '#059669',
              marginBottom: '6px'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertTriangle size={12} /> Orphaned Payout Exposure
              </span>
            </div>
          </div>
          <div className="num-mono" style={{
            fontSize: '1.45rem', fontWeight: 800,
            color: cash.orphaned_payout_exposure_inr > 0 ? '#D97706' : '#059669'
          }}>
            ₹{cash.orphaned_payout_exposure_inr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.7rem', marginTop: '4px', color: cash.orphaned_payout_exposure_inr > 0 ? '#D97706' : '#059669', opacity: 0.9 }}>
            {cash.orphaned_payout_exposure_inr > 0
              ? 'Bank IMPS/UTR sent but no captured gateway payment found'
              : 'All payouts have matching captured payments'}
          </div>
        </div>

        {/* 4. Safe Float */}
        <div className="blade-card" style={{ padding: '16px 18px', background: '#ECFDF5', borderColor: '#A7F3D0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="micro-label" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#059669', marginBottom: '6px' }}>
              <ShieldCheck size={12} /> Safe Settlement Float
            </div>
          </div>
          <div className="num-mono" style={{ fontSize: '1.45rem', fontWeight: 800, color: '#059669' }}>
            ₹{cash.safe_settlement_disbursement_float_inr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#059669', marginTop: '4px', opacity: 0.9 }}>
            Safe to disburse on T+2 rolling cycle
          </div>
        </div>

      </div>

      {/* ── Risk breakdown panel ─────────────────────────────────────── */}
      <div className="blade-panel" style={{ padding: '18px 20px', background: '#FFFFFF' }}>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--blade-text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <TrendingDown size={15} color="#DC2626" /> Float Risk Index
        </h3>
        <RiskBar pct={cash.float_risk_index_pct} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>

          <div style={{ padding: '14px', background: 'var(--blade-bg-subtle)', borderRadius: '6px', border: '1px solid var(--blade-border-subtle)' }}>
            <div style={{ fontSize: '0.73rem', fontWeight: 700, color: 'var(--blade-text-primary)', marginBottom: '6px', display: 'flex', gap: '6px', alignItems: 'center' }}>
              <Lock size={12} color="#DC2626" /> Total Trapped Liabilities
            </div>
            <div className="num-mono" style={{ fontSize: '1.1rem', fontWeight: 800, color: '#DC2626' }}>
              ₹{totalLiabilities.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.69rem', color: 'var(--blade-text-muted)', marginTop: '3px' }}>
              Clawbacks ₹{cash.unrecovered_vendor_clawbacks_inr.toLocaleString('en-IN', { minimumFractionDigits: 2 })} + Orphaned ₹{cash.orphaned_payout_exposure_inr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div style={{ padding: '14px', background: 'var(--blade-bg-subtle)', borderRadius: '6px', border: '1px solid var(--blade-border-subtle)' }}>
            <div style={{ fontSize: '0.73rem', fontWeight: 700, color: 'var(--blade-text-primary)', marginBottom: '6px', display: 'flex', gap: '6px', alignItems: 'center' }}>
              <ShieldCheck size={12} color="#059669" /> Net Working Capital Buffer
            </div>
            <div className="num-mono" style={{ fontSize: '1.1rem', fontWeight: 800, color: '#059669' }}>
              ₹{cash.safe_settlement_disbursement_float_inr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.69rem', color: 'var(--blade-text-muted)', marginTop: '3px' }}>
              GMV × 88% vendor share − trapped liabilities
            </div>
          </div>

        </div>

        {/* How it's calculated */}
        <div style={{ marginTop: '14px', padding: '12px 14px', background: '#F8FAFC', borderRadius: '6px', border: '1px solid var(--blade-border-subtle)' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--blade-text-primary)', marginBottom: '6px' }}>How This Is Calculated</div>
          <div style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--blade-text-secondary)', lineHeight: 1.8 }}>
            <div>Total GMV           = ₹{cash.total_gmv_inr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            <div>× Vendor Share (88%) = ₹{(cash.total_gmv_inr * 0.88).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            <div>− Unrecovered Clawbacks = −₹{cash.unrecovered_vendor_clawbacks_inr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            <div>− Orphaned Exposure     = −₹{cash.orphaned_payout_exposure_inr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            <div style={{ borderTop: '1px solid var(--blade-border-subtle)', marginTop: '4px', paddingTop: '4px', fontWeight: 700, color: '#059669' }}>
              = Safe Float: ₹{cash.safe_settlement_disbursement_float_inr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
