import React from 'react';
import { CheckCircle2, Zap, ShieldAlert, CheckCheck } from 'lucide-react';
import type { BatchStatus } from '../types';

interface MetricsProps {
  status: BatchStatus | null;
}

export const MetricsOverview: React.FC<MetricsProps> = ({ status }) => {
  if (!status) return null;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
      gap: '14px',
      marginBottom: '16px'
    }}>
      
      {/* 1. Match Rate */}
      <div className="blade-card" style={{ padding: '16px 18px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: '#059669' }}></div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span className="micro-label">Reconciliation Match Rate</span>
          <span style={{ padding: '4px', borderRadius: '6px', background: '#ECFDF5', color: '#059669' }}>
            <CheckCircle2 size={15} />
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <div className="num-mono" style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--blade-text-primary)', lineHeight: 1.1 }}>
              {status.match_rate_pct}%
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--blade-text-muted)', marginTop: '4px' }}>
              <span className="num-mono" style={{ fontWeight: 600, color: '#059669' }}>{status.matched_records}</span> of <span className="num-mono">{status.total_records}</span> clean transactions
            </div>
          </div>
          {/* Micro Sparkline */}
          <svg width="48" height="22" viewBox="0 0 48 22" fill="none" style={{ opacity: 0.85 }}>
            <path d="M1 18L10 14L20 16L30 8L40 10L47 2" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M1 18L10 14L20 16L30 8L40 10L47 2V22H1V18Z" fill="#ECFDF5" opacity="0.6"/>
          </svg>
        </div>
      </div>

      {/* 2. Throughput Speed */}
      <div className="blade-card" style={{ padding: '16px 18px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: '#0B72E7' }}></div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span className="micro-label">Engine Throughput</span>
          <span style={{ padding: '4px', borderRadius: '6px', background: '#EFF6FF', color: '#0B72E7' }}>
            <Zap size={15} />
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <div className="num-mono" style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0B72E7', lineHeight: 1.1 }}>
              {status.throughput_records_per_sec.toLocaleString()} <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--blade-text-muted)' }}>rec/s</span>
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--blade-text-muted)', marginTop: '4px' }}>
              500 tx batch in <span className="num-mono" style={{ fontWeight: 600, color: 'var(--blade-text-primary)' }}>{status.processing_time_ms} ms</span>
            </div>
          </div>
          {/* Micro Sparkline */}
          <svg width="48" height="22" viewBox="0 0 48 22" fill="none" style={{ opacity: 0.85 }}>
            <path d="M1 19L12 15L24 17L34 7L47 3" stroke="#0B72E7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M1 19L12 15L24 17L34 7L47 3V22H1V19Z" fill="#EFF6FF" opacity="0.7"/>
          </svg>
        </div>
      </div>

      {/* 3. Financial Exposure */}
      <div className="blade-card" style={{ padding: '16px 18px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: '#DC2626' }}></div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span className="micro-label">Net Discrepancy Exposure</span>
          <span style={{ padding: '4px', borderRadius: '6px', background: '#FEF2F2', color: '#DC2626' }}>
            <ShieldAlert size={15} />
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <div className="num-mono" style={{ fontSize: '1.85rem', fontWeight: 800, color: '#DC2626', lineHeight: 1.1 }}>
              ₹{status.total_exposure_inr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--blade-text-muted)', marginTop: '4px' }}>
              Trapped across <span className="num-mono" style={{ fontWeight: 600, color: '#DC2626' }}>{status.exception_count}</span> exceptions
            </div>
          </div>
          {/* Micro Sparkline */}
          <svg width="48" height="22" viewBox="0 0 48 22" fill="none" style={{ opacity: 0.85 }}>
            <path d="M1 5L12 12L24 8L34 16L47 18" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M1 5L12 12L24 8L34 16L47 18V22H1V5Z" fill="#FEF2F2" opacity="0.8"/>
          </svg>
        </div>
      </div>

      {/* 4. Closed Loop Resolution */}
      <div className="blade-card" style={{ padding: '16px 18px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: '#7C3AED' }}></div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span className="micro-label">Verified Closures</span>
          <span style={{ padding: '4px', borderRadius: '6px', background: '#F5F3FF', color: '#7C3AED' }}>
            <CheckCheck size={15} />
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <div className="num-mono" style={{ fontSize: '1.85rem', fontWeight: 800, color: '#7C3AED', lineHeight: 1.1 }}>
              {status.resolved_count} <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--blade-text-muted)' }}>Verified ₹0</span>
            </div>
            <div style={{ fontSize: '0.72rem', display: 'flex', gap: '5px', alignItems: 'center', marginTop: '6px' }}>
              <span className="badge badge-review" style={{ fontSize: '0.66rem' }}>
                {status.human_review_count} Human Review
              </span>
              <span className="badge badge-resolvable" style={{ fontSize: '0.66rem' }}>
                {status.unresolved_count} Pending
              </span>
            </div>
          </div>
          {/* Micro Sparkline */}
          <svg width="48" height="22" viewBox="0 0 48 22" fill="none" style={{ opacity: 0.85 }}>
            <path d="M1 18L12 14L22 10L32 6L47 2" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M1 18L12 14L22 10L32 6L47 2V22H1V18Z" fill="#F5F3FF" opacity="0.8"/>
          </svg>
        </div>
      </div>

    </div>
  );
};
