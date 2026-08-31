import React from 'react';
import { Eye, ShieldCheck, HelpCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { SettlementException } from '../types';

interface ExceptionsHubProps {
  exceptions: SettlementException[];
  onSelectException: (exception: SettlementException) => void;
  onInvestigate: (id: string) => void;
  onApprove: (id: string) => void;
  loading: boolean;
}

export const ExceptionsHub: React.FC<ExceptionsHubProps> = ({
  exceptions,
  onSelectException,
  onInvestigate: _onInvestigate,
  onApprove: _onApprove,
  loading: _loading,
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "AUTO_RESOLVABLE":
        return <span className="badge badge-resolvable"><AlertTriangle size={11} /> AUTO-RESOLVABLE</span>;
      case "HUMAN_REVIEW":
        return <span className="badge badge-review"><HelpCircle size={11} /> HUMAN REVIEW</span>;
      case "VERIFIED_RESOLVED":
        return <span className="badge badge-verified"><ShieldCheck size={11} /> VERIFIED ₹0</span>;
      case "APPROVED":
        return <span className="badge badge-blue">APPROVED</span>;
      default:
        return <span className="badge badge-resolvable">{status}</span>;
    }
  };

  const getExceptionTypeName = (type: string) => {
    switch (type) {
      case 'REFUND_AFTER_PAYOUT_UNRECOVERED':
        return 'Late Refund Post-Payout (Clawback Required)';
      case 'EXCESS_COMMISSION_DOUBLE_COUNT':
        return 'Duplicate Commission Line Overcharge';
      case 'TAX_RULE_MISMATCH':
        return 'Tax Slab Divergence (GST Mismatch)';
      case 'ORPHANED_PAYOUT_RECORD':
        return 'Orphaned Payout (No Captured Payment)';
      case 'ROUNDING_DRIFT_EXCEEDED':
        return 'Cumulative Rounding Sub-Ledger Drift';
      case 'AMBIGUOUS_POLICY_CATEGORY':
        return 'Ambiguous Unmapped Vendor Contract Tier';
      default:
        return type;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        <div className="rzp-card" style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 600 }}>
            Total Flagged Exceptions
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#DC2626' }}>
            {exceptions.length}
          </div>
        </div>

        <div className="rzp-card" style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 600 }}>
            Auto-Resolvable
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#D97706' }}>
            {exceptions.filter(e => e.status === 'AUTO_RESOLVABLE' || e.status === 'DETECTED').length}
          </div>
        </div>

        <div className="rzp-card" style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 600 }}>
            Human Review Required
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#B91C1C' }}>
            {exceptions.filter(e => e.status === 'HUMAN_REVIEW').length}
          </div>
        </div>

        <div className="rzp-card" style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 600 }}>
            Verified Resolved (₹0)
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#047857' }}>
            {exceptions.filter(e => e.status === 'VERIFIED_RESOLVED').length}
          </div>
        </div>
      </div>

      {/* Exceptions List */}
      <div className="rzp-panel" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>
            Active Exception Cases ({exceptions.length})
          </h2>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
            Select any exception to review multi-source fund flow DAG and approve corrective action
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {exceptions.map((exc) => {
            const isVerified = exc.status === 'VERIFIED_RESOLVED';
            const isHumanReview = exc.status === 'HUMAN_REVIEW';

            return (
              <div
                key={exc.id}
                onClick={() => onSelectException(exc)}
                style={{
                  padding: '14px 16px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-subtle)',
                  background: isVerified ? '#F0FDF4' : isHumanReview ? '#FEF2F2' : '#FFFFFF',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                  transition: 'border-color 0.12s ease, box-shadow 0.12s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#0B72E7';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                }}
              >
                
                {/* Exception Info */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: '1 1 400px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    background: isVerified ? '#ECFDF5' : isHumanReview ? '#FEE2E2' : '#EFF6FF',
                    color: isVerified ? '#047857' : isHumanReview ? '#DC2626' : '#0B72E7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {isVerified ? <CheckCircle2 size={16} /> : isHumanReview ? <HelpCircle size={16} /> : <AlertTriangle size={16} />}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                      <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)' }}>
                        {getExceptionTypeName(exc.exception_type)}
                      </span>
                      {getStatusBadge(exc.status)}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-subtle)' }}>
                      Order: <strong style={{ color: 'var(--text-main)' }}>{exc.order_id}</strong> • Vendor: <strong>{exc.vendor_id}</strong> • Detector: {exc.detector_name}
                    </div>
                    {exc.root_cause && (
                      <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.4 }}>
                        {exc.root_cause}
                      </p>
                    )}
                  </div>
                </div>

                {/* Discrepancy & Action */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>Net Discrepancy</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: isVerified ? '#047857' : '#DC2626' }}>
                      {isVerified ? '₹0.00' : `₹${exc.discrepancy_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                    </div>
                  </div>

                  <button
                    className="btn-primary"
                    style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectException(exc);
                    }}
                  >
                    <Eye size={12} />
                    <span>Inspect</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
};
