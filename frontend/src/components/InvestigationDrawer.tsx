import React, { useState } from 'react';
import { 
  X, Bot, ShieldCheck, CheckCircle2, AlertTriangle,
  Terminal, Check, CreditCard
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { SettlementException } from '../types';

interface DrawerProps {
  exception: SettlementException | null;
  context: any;
  loading: boolean;
  onClose: () => void;
  onInvestigate: (id: string) => void;
  onApprove: (id: string) => void;
}

export const InvestigationDrawer: React.FC<DrawerProps> = ({
  exception,
  context,
  loading,
  onClose,
  onInvestigate,
  onApprove
}) => {
  const [approving, setApproving] = useState(false);

  if (!exception && !context) return null;

  const handleApproveClick = async () => {
    if (!exception) return;
    setApproving(true);
    try {
      await onApprove(exception.id);
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.6 }
      });
    } finally {
      setApproving(false);
    }
  };

  const isVerified = exception?.status === "VERIFIED_RESOLVED";
  const isHumanReview = exception?.status === "HUMAN_REVIEW";
  const isInvestigated = Boolean(exception?.investigated_at || exception?.root_cause);

  // Financial calculations for Route DAG
  const grossAmt = context?.order?.amount || exception?.financial_breakdown?.expected_amount || 0;
  const platformFee = Math.round(grossAmt * 0.10);
  const rzpFee = Math.round(grossAmt * 0.02);
  const vendorPayoutAmt = context?.payouts?.length ? context.payouts[0].amount : (grossAmt - platformFee - rzpFee);
  const refundAmt = context?.refunds?.length ? context.refunds[0].amount : 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="drawer-slideover"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Top Header */}
        <div style={{
          padding: '16px 22px',
          borderBottom: '1px solid var(--blade-border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#FFFFFF',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '6px',
              background: isVerified ? '#ECFDF5' : isHumanReview ? '#FEF2F2' : '#EFF6FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isVerified ? '#047857' : isHumanReview ? '#B91C1C' : '#0B72E7',
            }}>
              {isVerified ? <ShieldCheck size={18} /> : <Bot size={18} />}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="num-mono" style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--blade-text-primary)' }}>
                  {exception?.order_id || context?.order?.id}
                </span>
                {isVerified && <span className="badge badge-verified"><Check size={11} /> VERIFIED ₹0</span>}
                {isHumanReview && <span className="badge badge-review">HUMAN REVIEW</span>}
                {!isVerified && !isHumanReview && <span className="badge badge-resolvable">AUTO-RESOLVABLE</span>}
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--blade-text-muted)' }}>
                Vendor: <strong className="num-mono" style={{ color: 'var(--blade-text-secondary)' }}>{exception?.vendor_id || context?.order?.vendor_id}</strong> • Exception ID: <span className="num-mono">{exception?.id}</span>
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--blade-text-muted)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Drawer Body */}
        <div style={{ padding: '20px 22px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* 1. Razorpay Route Split Fund Flow DAG */}
          <div>
            <div className="micro-label" style={{ marginBottom: '8px' }}>
              Razorpay Route • Split Settlement Fund Flow
            </div>
            
            <div style={{
              background: 'var(--blade-bg-subtle)',
              padding: '14px',
              borderRadius: '8px',
              border: '1px solid var(--blade-border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              
              {/* Level 1: Gross Inflow */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  padding: '10px 14px',
                  background: '#FFFFFF',
                  borderRadius: '6px',
                  border: '1px solid var(--blade-border-subtle)',
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div className="micro-label" style={{ fontSize: '0.62rem' }}>Customer Inflow (Payment Gateway)</div>
                    <div className="num-mono" style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0F172A' }}>
                      ₹{grossAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <span className="badge badge-matched" style={{ fontSize: '0.66rem' }}>
                    <CreditCard size={11} /> {context?.payment?.method?.toUpperCase() || 'UPI'} CAPTURED
                  </span>
                </div>
              </div>

              {/* Connecting Split Arrows */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                
                {/* Split Node 1: Platform Commission */}
                <div style={{ padding: '8px 10px', background: '#FFFFFF', borderRadius: '6px', border: '1px solid var(--blade-border-subtle)' }}>
                  <div className="micro-label" style={{ fontSize: '0.6rem' }}>Platform Take (10%)</div>
                  <div className="num-mono" style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0B72E7' }}>
                    ₹{platformFee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--blade-text-muted)' }}>Marketplace Share</div>
                </div>

                {/* Split Node 2: Razorpay MDR */}
                <div style={{ padding: '8px 10px', background: '#FFFFFF', borderRadius: '6px', border: '1px solid var(--blade-border-subtle)' }}>
                  <div className="micro-label" style={{ fontSize: '0.6rem' }}>Razorpay MDR (2%)</div>
                  <div className="num-mono" style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748B' }}>
                    ₹{rzpFee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--blade-text-muted)' }}>Gateway Processing</div>
                </div>

                {/* Split Node 3: Vendor Payout */}
                <div style={{ padding: '8px 10px', background: '#FFFFFF', borderRadius: '6px', border: '1px solid var(--blade-border-subtle)' }}>
                  <div className="micro-label" style={{ fontSize: '0.6rem' }}>Vendor IMPS Payout</div>
                  <div className="num-mono" style={{ fontSize: '0.82rem', fontWeight: 700, color: '#B45309' }}>
                    ₹{vendorPayoutAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: '0.62rem', color: '#047857' }}>Settled via Bank UTR</div>
                </div>

              </div>

              {/* Refund / Clawback Divergence Event */}
              {refundAmt > 0 && (
                <div style={{
                  padding: '10px 12px',
                  background: isVerified ? '#ECFDF5' : '#FEF2F2',
                  borderRadius: '6px',
                  border: isVerified ? '1px solid #A7F3D0' : '1px solid #FECACA',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px'
                }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: isVerified ? '#047857' : '#B91C1C' }}>
                      {isVerified ? '✓ Automated Debit Note Posted & Clawback Balanced' : '⚠ Customer Return Post-Payout (Clawback Missing)'}
                    </div>
                    <p style={{ fontSize: '0.68rem', color: isVerified ? '#047857' : '#991B1B', marginTop: '2px' }}>
                      {isVerified ? '₹' + refundAmt + ' scheduled against vendor next settlement cycle' : 'Vendor already received ₹' + vendorPayoutAmt + ' payout before customer refund of ₹' + refundAmt}
                    </p>
                  </div>
                  <span className="num-mono" style={{ fontSize: '0.92rem', fontWeight: 700, color: isVerified ? '#047857' : '#B91C1C' }}>
                    {isVerified ? '₹0.00 Delta' : '-₹' + refundAmt}
                  </span>
                </div>
              )}

            </div>
          </div>

          {/* 2. Deterministic Comparison Matrix */}
          {exception?.financial_breakdown && (
            <div>
              <div className="micro-label" style={{ marginBottom: '8px' }}>
                Deterministic Mathematical Comparison Matrix
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                <div style={{ padding: '10px 12px', background: 'var(--blade-bg-subtle)', borderRadius: '6px', border: '1px solid var(--blade-border-subtle)' }}>
                  <div className="micro-label" style={{ fontSize: '0.64rem', marginBottom: '2px' }}>Expected Vendor Share</div>
                  <div className="num-mono" style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--blade-text-primary)' }}>
                    ₹{exception.financial_breakdown.expected_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div style={{ padding: '10px 12px', background: 'var(--blade-bg-subtle)', borderRadius: '6px', border: '1px solid var(--blade-border-subtle)' }}>
                  <div className="micro-label" style={{ fontSize: '0.64rem', marginBottom: '2px' }}>Actual Disbursed Share</div>
                  <div className="num-mono" style={{ fontSize: '1.05rem', fontWeight: 700, color: '#B45309' }}>
                    ₹{exception.financial_breakdown.actual_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div style={{ padding: '10px 12px', background: isVerified ? '#ECFDF5' : '#FEF2F2', borderRadius: '6px', border: isVerified ? '1px solid #A7F3D0' : '1px solid #FECACA' }}>
                  <div className="micro-label" style={{ fontSize: '0.64rem', color: isVerified ? '#047857' : '#B91C1C', marginBottom: '2px' }}>
                    {isVerified ? 'Post-Fix Delta' : 'Calculated Discrepancy'}
                  </div>
                  <div className="num-mono" style={{ fontSize: '1.05rem', fontWeight: 700, color: isVerified ? '#047857' : '#B91C1C' }}>
                    {isVerified ? '₹0.00 (Closed)' : `₹${exception.financial_breakdown.discrepancy_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. AI Root Cause & Policy Citation */}
          <div style={{ padding: '14px 16px', background: 'var(--blade-bg-subtle)', borderRadius: '6px', border: '1px solid var(--blade-border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Bot size={15} color="#0B72E7" />
                <h3 style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--blade-text-primary)' }}>AI Agent Root Cause Findings</h3>
              </div>
              {exception?.evidence?.policy_rule_cited && (
                <span className="badge badge-blue" style={{ fontSize: '0.66rem' }}>
                  {exception.evidence.policy_rule_cited}
                </span>
              )}
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--blade-text-secondary)', lineHeight: 1.5, marginBottom: '10px' }}>
              {exception?.root_cause || "Investigation not run yet. Click 'Run AI Investigation' to autonomously trace multi-source records."}
            </p>

            {/* Evidence IDs */}
            {exception?.evidence && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {exception.evidence.order_id && (
                  <span className="num-mono" style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: '#FFFFFF', border: '1px solid var(--blade-border-subtle)', color: 'var(--blade-text-muted)' }}>
                    Order: <strong style={{ color: 'var(--blade-text-primary)' }}>{exception.evidence.order_id}</strong>
                  </span>
                )}
                {exception.evidence.payment_id && (
                  <span className="num-mono" style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: '#FFFFFF', border: '1px solid var(--blade-border-subtle)', color: 'var(--blade-text-muted)' }}>
                    Payment: <strong style={{ color: 'var(--blade-text-primary)' }}>{exception.evidence.payment_id}</strong>
                  </span>
                )}
                {exception.evidence.payout_id && (
                  <span className="num-mono" style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: '#FFFFFF', border: '1px solid var(--blade-border-subtle)', color: 'var(--blade-text-muted)' }}>
                    Payout: <strong style={{ color: 'var(--blade-text-primary)' }}>{exception.evidence.payout_id}</strong>
                  </span>
                )}
                {exception.evidence.refund_id && (
                  <span className="num-mono" style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}>
                    Refund: <strong>{exception.evidence.refund_id}</strong>
                  </span>
                )}
              </div>
            )}

            {/* Human Review Ambiguity Notice */}
            {isHumanReview && exception?.human_review_reason && (
              <div style={{ padding: '10px 12px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '6px', marginTop: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.76rem', fontWeight: 600, color: '#B91C1C', marginBottom: '3px' }}>
                  <AlertTriangle size={13} /> Unresolved Ambiguity (Policy Safeguard)
                </div>
                <p style={{ fontSize: '0.74rem', color: '#B91C1C', marginBottom: '4px' }}>
                  {exception.human_review_reason}
                </p>
                <div style={{ fontSize: '0.7rem', color: 'var(--blade-text-muted)' }}>
                  Required inputs before action: <strong style={{ color: 'var(--blade-text-primary)' }}>{exception.required_human_inputs.join(', ')}</strong>
                </div>
              </div>
            )}
          </div>

          {/* 4. Scoped Tool Execution Trace */}
          {exception?.audit_trail && exception.audit_trail.length > 0 && (
            <div>
              <div className="micro-label" style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
                <Terminal size={12} /> Scoped Read-Only Tool Execution Trace
              </div>
              <div style={{ background: '#0F172A', padding: '10px 12px', borderRadius: '6px', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', maxHeight: '130px', overflowY: 'auto' }}>
                {exception.audit_trail.map((step, idx) => (
                  <div key={idx} style={{ padding: '3px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', color: '#94A3B8' }}>
                    <span style={{ color: '#64748B' }}>[{step.step || idx + 1}]</span>{' '}
                    <span style={{ color: '#34D399' }}>{step.tool || step.rule || step.action_applied || step.result}</span>:{' '}
                    <span style={{ color: '#F1F5F9' }}>{step.summary || step.message || JSON.stringify(step.args || {})}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Sticky Action Footer */}
        <div style={{
          padding: '14px 22px',
          borderTop: '1px solid var(--blade-border-subtle)',
          background: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
        }}>
          <div>
            {exception?.proposed_correction && !isVerified && (
              <div>
                <div className="micro-label" style={{ fontSize: '0.62rem' }}>PROPOSED SAFE ACTION:</div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--blade-text-primary)' }}>
                  {exception.proposed_correction.reason}
                </div>
              </div>
            )}
            {isVerified && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#047857', fontSize: '0.82rem', fontWeight: 600 }}>
                <CheckCircle2 size={15} /> Closed Loop Complete • Mathematically Verified Delta: ₹0.00
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {!isInvestigated && (
              <button 
                className="btn-secondary"
                onClick={() => exception && onInvestigate(exception.id)}
                disabled={loading}
              >
                <Bot size={13} />
                <span>Run AI Investigation</span>
              </button>
            )}

            {!isVerified && !isHumanReview && exception && (
              <button 
                className="btn-success"
                onClick={handleApproveClick}
                disabled={approving || loading}
              >
                <ShieldCheck size={14} />
                <span>{approving ? "Verifying..." : "Approve & Execute Correction"}</span>
              </button>
            )}

            <button className="btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
