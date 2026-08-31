import React from 'react';
import { Lock, Wallet, ShieldCheck } from 'lucide-react';
import type { CashPosition } from '../types';

interface CashProps {
  cash: CashPosition | null;
}

export const CashPositionCard: React.FC<CashProps> = ({ cash }) => {
  if (!cash) return null;

  return (
    <div className="rzp-panel" style={{ padding: '16px 20px', marginBottom: '16px' }}>
      
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Wallet size={16} color="#0B72E7" />
          <h2 style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Cash Float & Settlement Liquidity Health
          </h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="micro-label">Exposure Risk:</span>
          <span className="badge" style={{
            background: cash.float_risk_index_pct > 5 ? '#FEF2F2' : '#ECFDF5',
            color: cash.float_risk_index_pct > 5 ? '#B91C1C' : '#047857',
            border: cash.float_risk_index_pct > 5 ? '1px solid #FECACA' : '1px solid #A7F3D0'
          }}>
            {cash.float_risk_index_pct}% GMV Exposure
          </span>
        </div>
      </div>

      {/* 4 Stat Boxes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
        
        {/* Total GMV */}
        <div style={{ padding: '12px 14px', background: 'var(--bg-subtle)', borderRadius: '6px', border: '1px solid var(--border-hairline)' }}>
          <div className="micro-label" style={{ marginBottom: '2px' }}>Total Batch GMV</div>
          <div className="num-mono" style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            ₹{cash.total_gmv_inr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>

        {/* Trapped Capital */}
        <div style={{ padding: '12px 14px', background: '#FEF2F2', borderRadius: '6px', border: '1px solid #FECACA' }}>
          <div className="micro-label" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#B91C1C', marginBottom: '2px' }}>
            <Lock size={11} /> Trapped Vendor Clawbacks
          </div>
          <div className="num-mono" style={{ fontSize: '1.2rem', fontWeight: 700, color: '#B91C1C' }}>
            ₹{cash.unrecovered_vendor_clawbacks_inr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.68rem', color: '#B91C1C', opacity: 0.85 }}>Pending recovery debit note</div>
        </div>

        {/* Orphaned Payouts */}
        <div style={{ padding: '12px 14px', background: '#FFFBEB', borderRadius: '6px', border: '1px solid #FDE68A' }}>
          <div className="micro-label" style={{ color: '#B45309', marginBottom: '2px' }}>Orphaned Payout Exposure</div>
          <div className="num-mono" style={{ fontSize: '1.2rem', fontWeight: 700, color: '#B45309' }}>
            ₹{cash.orphaned_payout_exposure_inr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.68rem', color: '#B45309', opacity: 0.85 }}>Unverified UTR transfers</div>
        </div>

        {/* Safe T+2 Float */}
        <div style={{ padding: '12px 14px', background: '#ECFDF5', borderRadius: '6px', border: '1px solid #A7F3D0' }}>
          <div className="micro-label" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#047857', marginBottom: '2px' }}>
            <ShieldCheck size={11} /> Safe Settlement Float
          </div>
          <div className="num-mono" style={{ fontSize: '1.2rem', fontWeight: 700, color: '#047857' }}>
            ₹{cash.safe_settlement_disbursement_float_inr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.68rem', color: '#047857', opacity: 0.85 }}>Safe to disburse on T+2 rolling cycle</div>
        </div>

      </div>

    </div>
  );
};
