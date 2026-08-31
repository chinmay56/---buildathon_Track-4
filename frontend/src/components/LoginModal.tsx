import React from 'react';
import { X, ShieldCheck, CheckCircle2, Zap } from 'lucide-react';
import type { AuthUser } from '../types';

interface LoginModalProps {
  currentUser: AuthUser | null;
  demoAccounts: AuthUser[];
  onClose: () => void;
  onSelectUser: (user: AuthUser) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  currentUser,
  demoAccounts,
  onClose,
  onSelectUser,
}) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content"
        style={{ maxWidth: '480px', padding: '24px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              background: '#0B72E7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF'
            }}>
              <Zap size={18} fill="#FFFFFF" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--blade-text-primary)' }}>
                Razorpay Identity & RBAC Switcher
              </h3>
              <p style={{ fontSize: '0.72rem', color: 'var(--blade-text-muted)' }}>
                Switch active authentication role to test granular fintech permissions
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--blade-text-muted)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Demo Accounts List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          <div className="micro-label" style={{ marginBottom: '2px' }}>
            Preconfigured Evaluation Roles (1-Click Switch)
          </div>

          {demoAccounts.map((acc) => {
            const isSelected = currentUser?.user_id === acc.user_id;

            return (
              <div
                key={acc.user_id}
                onClick={() => {
                  onSelectUser(acc);
                  onClose();
                }}
                style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  border: isSelected ? '2px solid #0B72E7' : '1px solid var(--blade-border-subtle)',
                  background: isSelected ? '#EFF6FF' : 'var(--blade-bg-subtle)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.12s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    background: acc.role === 'FINANCE_CONTROLLER' ? '#0B72E7' : acc.role === 'COMPLIANCE_AUDITOR' ? '#059669' : '#F59E0B',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.78rem',
                    fontWeight: 700
                  }}>
                    {acc.name.split(' ').map(n => n[0]).join('')}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--blade-text-primary)' }}>
                        {acc.name}
                      </span>
                      <span style={{
                        fontSize: '0.62rem',
                        fontWeight: 700,
                        padding: '1px 5px',
                        borderRadius: '3px',
                        background: acc.role === 'FINANCE_CONTROLLER' ? '#DBEAFE' : acc.role === 'COMPLIANCE_AUDITOR' ? '#DCFCE7' : '#FEF3C7',
                        color: acc.role === 'FINANCE_CONTROLLER' ? '#1D4ED8' : acc.role === 'COMPLIANCE_AUDITOR' ? '#15803D' : '#B45309',
                      }}>
                        {acc.role.replace('_', ' ')}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--blade-text-muted)' }}>
                      {acc.email} • {acc.permissions.length} permissions
                    </div>
                  </div>
                </div>

                {isSelected ? (
                  <CheckCircle2 size={18} color="#0B72E7" />
                ) : (
                  <span style={{ fontSize: '0.72rem', color: 'var(--blade-text-muted)' }}>Switch</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Security Summary Box */}
        <div style={{ padding: '12px', background: 'var(--blade-bg-subtle)', borderRadius: '6px', border: '1px solid var(--blade-border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', fontWeight: 600, color: 'var(--blade-text-primary)', marginBottom: '4px' }}>
            <ShieldCheck size={14} color="#059669" />
            <span>Fintech RBAC Security Enforcement</span>
          </div>
          <p style={{ fontSize: '0.7rem', color: 'var(--blade-text-muted)', lineHeight: 1.4 }}>
            • <strong>Finance Controller</strong>: Full permissions to approve double-entry journal closures.<br />
            • <strong>Compliance Auditor</strong>: Read-only access to immutable ledger and benchmark metrics.<br />
            • <strong>Settlement Operator</strong>: Triage and diagnostic ReAct investigation only.
          </p>
        </div>

      </div>
    </div>
  );
};
