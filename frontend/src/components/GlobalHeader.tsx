import React from 'react';
import { 
  Zap, 
  Search, 
  Play, 
  ShieldCheck,
  RefreshCw
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
}

export const GlobalHeader: React.FC<GlobalHeaderProps> = ({
  currentUser,
  oauthConnected,
  loading,
  onRunBatch,
  onOpenAuthModal,
  onOpenOAuthModal,
}) => {
  const userInitials = currentUser?.name ? currentUser.name.split(' ').map(n => n[0]).join('') : "AM";
  const userRoleShort = currentUser?.role === 'FINANCE_CONTROLLER' ? 'Controller' : currentUser?.role === 'COMPLIANCE_AUDITOR' ? 'Auditor' : 'Operator';

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
        transition: 'border-color 0.15s ease',
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

      {/* Right: Only Essential Actions & Role Switcher */}
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

        {/* User Identity & Role Switcher */}
        <div
          onClick={onOpenAuthModal}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 10px 4px 6px',
            borderRadius: '20px',
            background: '#F8FAFC',
            border: '1px solid var(--blade-border-medium)',
            cursor: 'pointer',
            transition: 'all 0.12s ease'
          }}
          title="Switch active user or RBAC role"
        >
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: currentUser?.role === 'COMPLIANCE_AUDITOR' ? '#059669' : currentUser?.role === 'SETTLEMENT_OPERATOR' ? '#D97706' : '#0B72E7',
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
              {currentUser?.name || "Arjun Mehta"}
            </span>
            <span style={{ fontSize: '0.62rem', color: '#0B72E7', fontWeight: 600 }}>
              {userRoleShort} ▼
            </span>
          </div>
        </div>

      </div>

    </header>
  );
};
