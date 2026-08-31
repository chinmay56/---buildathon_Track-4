import React, { useState, useRef, useEffect } from 'react';
import { 
  Zap, 
  Search, 
  Play, 
  ShieldCheck, 
  RefreshCw, 
  Check, 
  ChevronDown,
  ShieldAlert
} from 'lucide-react';
import type { AuthUser } from '../types';

interface GlobalHeaderProps {
  currentUser: AuthUser | null;
  oauthConnected: boolean;
  loading: boolean;
  onRefresh: () => void;
  onRunBatch: () => void;
  onOpenChaosModal: () => void;
  onOpenAuthModal: () => void;
  onOpenOAuthModal: () => void;
  demoAccounts?: AuthUser[];
  onSelectUser?: (user: AuthUser) => void;
}

const DEFAULT_DEMO_ACCOUNTS: AuthUser[] = [
  {
    user_id: "usr_ctrl_001",
    name: "Arjun Mehta",
    email: "arjun.mehta@nexusmarket.in",
    role: "FINANCE_CONTROLLER",
    merchant_id: "rzp_live_nexus99",
    permissions: ["read_ledger", "investigate_ai", "approve_corrections", "run_reconciliation", "inject_chaos"]
  },
  {
    user_id: "usr_audit_002",
    name: "Priya Sharma",
    email: "priya.sharma@deloitte-audit.com",
    role: "COMPLIANCE_AUDITOR",
    merchant_id: "rzp_live_nexus99",
    permissions: ["read_ledger", "view_audit_trail", "view_benchmarks", "view_cash_position"]
  },
  {
    user_id: "usr_ops_003",
    name: "Rohan Verma",
    email: "rohan.verma@nexusmarket.in",
    role: "SETTLEMENT_OPERATOR",
    merchant_id: "rzp_live_nexus99",
    permissions: ["read_ledger", "investigate_ai"]
  }
];

export const GlobalHeader: React.FC<GlobalHeaderProps> = ({
  currentUser,
  oauthConnected,
  loading,
  onRunBatch,
  onOpenOAuthModal,
  demoAccounts = [],
  onSelectUser,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeUser = currentUser || DEFAULT_DEMO_ACCOUNTS[0];
  const userInitials = activeUser?.name ? activeUser.name.split(' ').map(n => n[0]).join('') : "AM";
  const userRoleShort = activeUser?.role === 'FINANCE_CONTROLLER' ? 'Controller' : activeUser?.role === 'COMPLIANCE_AUDITOR' ? 'Auditor' : 'Operator';

  const accountsToRender = (demoAccounts && demoAccounts.length > 0) ? demoAccounts : DEFAULT_DEMO_ACCOUNTS;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'FINANCE_CONTROLLER':
        return { bg: '#EFF6FF', text: '#0B72E7', border: '#BFDBFE', label: 'Controller (Full)' };
      case 'COMPLIANCE_AUDITOR':
        return { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0', label: 'Auditor (Read-Only)' };
      case 'SETTLEMENT_OPERATOR':
        return { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A', label: 'Operator (Triage)' };
      default:
        return { bg: '#F1F5F9', text: '#475569', border: '#E2E8F0', label: role };
    }
  };

  return (
    <header style={{
      background: '#FFFFFF',
      borderBottom: '1px solid var(--blade-border-medium)',
      height: '56px',
      padding: '0 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      
      {/* Left: Brand Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '28px',
          height: '28px',
          borderRadius: '7px',
          background: 'linear-gradient(135deg, #0B72E7 0%, #0854AB 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 4px rgba(11, 114, 231, 0.25)'
        }}>
          <Zap size={15} color="#FFFFFF" fill="#FFFFFF" />
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
          <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--blade-text-primary)', letterSpacing: '-0.02em', fontFamily: 'var(--font-heading)' }}>
            Razorpay
          </span>
          <span style={{
            fontSize: '0.64rem',
            fontWeight: 700,
            color: '#0B72E7',
            background: '#EFF6FF',
            padding: '1px 6px',
            borderRadius: '4px',
            border: '1px solid #BFDBFE',
            textTransform: 'uppercase',
            fontFamily: 'var(--font-heading)'
          }}>
            Route Controller
          </span>
        </div>
      </div>

      {/* Center: Clean Search Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: '#F8FAFC',
        border: '1px solid var(--blade-border-medium)',
        borderRadius: '8px',
        padding: '6px 14px',
        width: '360px',
        gap: '8px',
      }}>
        <Search size={14} color="var(--blade-text-muted)" />
        <input
          type="text"
          placeholder="Search orders, payouts, refunds, UTRs..."
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontSize: '0.78rem',
            color: 'var(--blade-text-primary)',
            width: '100%',
          }}
        />
        <span style={{
          fontSize: '0.62rem',
          color: 'var(--blade-text-muted)',
          background: '#FFFFFF',
          border: '1px solid var(--blade-border-medium)',
          padding: '1px 5px',
          borderRadius: '4px',
          fontFamily: 'var(--font-mono)',
          fontWeight: 600
        }}>
          ⌘K
        </span>
      </div>

      {/* Right: Actions, OAuth & Instant 1-Click Role Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        
        {/* Razorpay OAuth Status Badge */}
        <button
          onClick={onOpenOAuthModal}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '5px 10px',
            borderRadius: '6px',
            background: oauthConnected ? '#ECFDF5' : '#FFFBEB',
            border: oauthConnected ? '1px solid #A7F3D0' : '1px solid #FDE68A',
            fontSize: '0.72rem',
            fontFamily: 'var(--font-heading)',
            fontWeight: 600,
            color: oauthConnected ? '#059669' : '#D97706',
            cursor: 'pointer',
            transition: 'all 0.12s ease'
          }}
          title="Razorpay OAuth 2.0 Partner Connection"
        >
          <ShieldCheck size={13} color={oauthConnected ? "#059669" : "#D97706"} />
          <span>{oauthConnected ? "OAuth Connected" : "Connect OAuth"}</span>
        </button>

        {/* Primary Action: Reconcile Batch */}
        <button
          className="btn-primary"
          onClick={onRunBatch}
          disabled={loading}
          style={{ padding: '6px 14px', fontSize: '0.78rem' }}
        >
          {loading ? (
            <RefreshCw size={13} className="animate-spin" />
          ) : (
            <Play size={13} fill="currentColor" />
          )}
          <span>Reconcile 500</span>
        </button>

        {/* User Identity & Instant Dropdown Switcher */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <div
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 10px 4px 6px',
              borderRadius: '20px',
              background: dropdownOpen ? '#EFF6FF' : '#F8FAFC',
              border: dropdownOpen ? '1px solid #0B72E7' : '1px solid var(--blade-border-medium)',
              cursor: 'pointer',
              transition: 'all 0.12s ease',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
            }}
            title="Click to switch RBAC Role / User"
          >
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: activeUser?.role === 'COMPLIANCE_AUDITOR' ? '#059669' : activeUser?.role === 'SETTLEMENT_OPERATOR' ? '#D97706' : '#0B72E7',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.68rem',
              fontWeight: 700,
            }}>
              {userInitials}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--blade-text-primary)', lineHeight: 1.1, fontFamily: 'var(--font-heading)' }}>
                {activeUser?.name || "Arjun Mehta"}
              </span>
              <span style={{ fontSize: '0.62rem', color: '#0B72E7', fontWeight: 600 }}>
                {userRoleShort}
              </span>
            </div>
            <ChevronDown size={12} color="#64748B" style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
          </div>

          {/* Instant Dropdown Menu */}
          {dropdownOpen && (
            <div style={{
              position: 'absolute',
              top: '38px',
              right: 0,
              width: '290px',
              background: '#FFFFFF',
              border: '1px solid var(--blade-border-medium)',
              borderRadius: '10px',
              boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.14), 0 8px 10px -6px rgba(15, 23, 42, 0.08)',
              padding: '8px',
              zIndex: 100,
              animation: 'fadeIn 0.12s ease-out'
            }}>
              <div style={{ padding: '6px 8px 8px 8px', borderBottom: '1px solid #F1F5F9', marginBottom: '6px' }}>
                <div style={{ fontSize: '0.66rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-heading)' }}>
                  Switch Active Role (RBAC)
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>
                  Test granular permission enforcement live
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {accountsToRender.map((acc) => {
                  const isSelected = activeUser?.user_id === acc.user_id;
                  const roleStyle = getRoleBadgeStyle(acc.role);

                  return (
                    <div
                      key={acc.user_id}
                      onClick={() => {
                        if (onSelectUser) onSelectUser(acc);
                        setDropdownOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        background: isSelected ? '#EFF6FF' : 'transparent',
                        cursor: 'pointer',
                        transition: 'all 0.1s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.background = '#F8FAFC';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                        <div style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '50%',
                          background: acc.role === 'FINANCE_CONTROLLER' ? '#0B72E7' : acc.role === 'COMPLIANCE_AUDITOR' ? '#059669' : '#D97706',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                        }}>
                          {acc.name.split(' ').map(n => n[0]).join('')}
                        </div>

                        <div>
                          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0F172A', fontFamily: 'var(--font-heading)' }}>
                            {acc.name}
                          </div>
                          <span style={{
                            fontSize: '0.62rem',
                            fontWeight: 700,
                            padding: '1px 5px',
                            borderRadius: '4px',
                            background: roleStyle.bg,
                            color: roleStyle.text,
                            border: `1px solid ${roleStyle.border}`
                          }}>
                            {roleStyle.label}
                          </span>
                        </div>
                      </div>

                      {isSelected && (
                        <Check size={14} color="#0B72E7" strokeWidth={2.5} />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Policy Indicator */}
              <div style={{
                marginTop: '6px',
                padding: '6px 8px',
                background: '#F8FAFC',
                borderRadius: '6px',
                border: '1px solid #F1F5F9',
                fontSize: '0.66rem',
                color: '#64748B',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <ShieldAlert size={12} color="#0B72E7" />
                <span>Auditors are blocked from posting ledger edits (403)</span>
              </div>
            </div>
          )}
        </div>

      </div>

    </header>
  );
};
