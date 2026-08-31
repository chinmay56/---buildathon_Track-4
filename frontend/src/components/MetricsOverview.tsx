import React from 'react';
import { CheckCircle2, Zap, AlertTriangle, ShieldAlert } from 'lucide-react';
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
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: '#10B981' }}></div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span className="micro-label">Reconciliation Match Rate</span>
          <span style={{ padding: '4px', borderRadius: '4px', background: '#ECFDF5', color: '#047857' }}>
            <CheckCircle2 size={14} />
          </span>
        </div>
        <div className="num-mono" style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--blade-text-primary)', marginBottom: '2px' }}>
          {status.match_rate_pct}%
        </div>
        <div style={{ fontSize: '0.73rem', color: 'var(--blade-text-muted)' }}>
          <span className="num-mono" style={{ fontWeight: 600, color: '#047857' }}>{status.matched_records}</span> of <span className="num-mono">{status.total_records}</span> clean transactions
        </div>
      </div>

      {/* 2. Throughput Speed */}
      <div className="blade-card" style={{ padding: '16px 18px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: '#0B72E7' }}></div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span className="micro-label">Engine Speed</span>
          <span style={{ padding: '4px', borderRadius: '4px', background: '#EFF6FF', color: '#0B72E7' }}>
            <Zap size={14} />
          </span>
        </div>
        <div className="num-mono" style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0B72E7', marginBottom: '2px' }}>
          {status.throughput_records_per_sec.toLocaleString()} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--blade-text-muted)' }}>rec/s</span>
        </div>
        <div style={{ fontSize: '0.73rem', color: 'var(--blade-text-muted)' }}>
          500 records batch in <span className="num-mono" style={{ fontWeight: 600, color: 'var(--blade-text-primary)' }}>{status.processing_time_ms} ms</span>
        </div>
      </div>

      {/* 3. Financial Exposure */}
      <div className="blade-card" style={{ padding: '16px 18px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: '#EF4444' }}></div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span className="micro-label">Net Discrepancy Exposure</span>
          <span style={{ padding: '4px', borderRadius: '4px', background: '#FEF2F2', color: '#B91C1C' }}>
            <ShieldAlert size={14} />
          </span>
        </div>
        <div className="num-mono" style={{ fontSize: '1.75rem', fontWeight: 700, color: '#B91C1C', marginBottom: '2px' }}>
          ₹{status.total_exposure_inr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </div>
        <div style={{ fontSize: '0.73rem', color: 'var(--blade-text-muted)' }}>
          Across <span className="num-mono" style={{ fontWeight: 600, color: '#B91C1C' }}>{status.exception_count}</span> flagged exceptions
        </div>
      </div>

      {/* 4. Closed Loop Resolution */}
      <div className="blade-card" style={{ padding: '16px 18px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: '#6366F1' }}></div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span className="micro-label">Closed Loop Verification</span>
          <span style={{ padding: '4px', borderRadius: '4px', background: '#EFF6FF', color: '#1D4ED8' }}>
            <AlertTriangle size={14} />
          </span>
        </div>
        <div className="num-mono" style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1D4ED8', marginBottom: '2px' }}>
          {status.resolved_count} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--blade-text-muted)' }}>Verified ₹0</span>
        </div>
        <div style={{ fontSize: '0.72rem', display: 'flex', gap: '6px', alignItems: 'center', marginTop: '2px' }}>
          <span className="badge badge-review" style={{ fontSize: '0.64rem' }}>
            {status.human_review_count} Human Review
          </span>
          <span className="badge badge-resolvable" style={{ fontSize: '0.64rem' }}>
            {status.unresolved_count} Pending
          </span>
        </div>
      </div>

    </div>
  );
};
