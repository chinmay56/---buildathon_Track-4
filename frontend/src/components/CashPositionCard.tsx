import React from 'react';
import { Lock, Wallet, ShieldCheck } from 'lucide-react';
import type { CashPosition } from '../types';

interface CashProps {
  cash: CashPosition | null;
}

export const CashPositionCard: React.FC<CashProps> = ({ cash }) => {
  if (!cash) return null;

  return (
    <div className="blade-panel" style={{ padding: '18px 20px', marginBottom: '16px', background: '#FFFFFF' }}>
      
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ padding: '5px', borderRadius: '6px', background: '#EFF6FF', color: '#0B72E7' }}>
            <Wallet size={16} />
          </div>
          <h2 style={{ fontSize: '0.96rem', fontWeight: 700, color: 'var(--blade-text-primary)', fontFamily: 'var(--font-heading)' }}>
            Cash Float & Settlement Liquidity Health
          </h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="micro-label">Exposure Risk:</span>
          <span className="badge" style={{
            background: cash.float_risk_index_pct > 5 ? '#FEF2F2' : '#ECFDF5',
            color: cash.float_risk_index_pct > 5 ? '#DC2626' : '#059669',
            border: cash.float_risk_index_pct > 5 ? '1px solid #FECACA' : '1px solid #A7F3D0'
          }}>
            {cash.float_risk_index_pct}% GMV Exposure
          </span>
        </div>
      </div>

      {/* 4 Stat Boxes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px' }}>
        
        {/* Total GMV */}
        <div className="blade-card" style={{ padding: '14px', background: '#F8FAFC' }}>
          <div className="micro-label" style={{ marginBottom: '4px' }}>Total Batch GMV</div>
          <div className="num-mono" style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--blade-text-primary)' }}>
            ₹{cash.total_gmv_inr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>

        {/* Trapped Capital */}
        <div className="blade-card" style={{ padding: '14px', background: '#FEF2F2', borderColor: '#FECACA' }}>
          <div className="micro-label" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#DC2626', marginBottom: '4px' }}>
            <Lock size={12} /> Trapped Vendor Clawbacks
          </div>
          <div className="num-mono" style={{ fontSize: '1.3rem', fontWeight: 800, color: '#DC2626' }}>
            ₹{cash.unrecovered_vendor_clawbacks_inr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#DC2626', opacity: 0.85, marginTop: '2px' }}>Pending recovery debit note</div>
        </div>

        {/* Orphaned Payouts */}
        <div className="blade-card" style={{ padding: '14px', background: '#FFFBEB', borderColor: '#FDE68A' }}>
          <div className="micro-label" style={{ color: '#D97706', marginBottom: '4px' }}>Orphaned Payout Exposure</div>
          <div className="num-mono" style={{ fontSize: '1.3rem', fontWeight: 800, color: '#D97706' }}>
            ₹{cash.orphaned_payout_exposure_inr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#D97706', opacity: 0.85, marginTop: '2px' }}>Unverified UTR transfers</div>
        </div>

        {/* Safe T+2 Float */}
        <div className="blade-card" style={{ padding: '14px', background: '#ECFDF5', borderColor: '#A7F3D0' }}>
          <div className="micro-label" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#059669', marginBottom: '4px' }}>
            <ShieldCheck size={12} /> Safe Settlement Float
          </div>
          <div className="num-mono" style={{ fontSize: '1.3rem', fontWeight: 800, color: '#059669' }}>
            ₹{cash.safe_settlement_disbursement_float_inr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#059669', opacity: 0.85, marginTop: '2px' }}>Safe to disburse on T+2 rolling cycle</div>
        </div>

      </div>

    </div>
  );
};
