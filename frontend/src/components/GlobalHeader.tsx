import React from 'react';
import { 
  Zap, 
  Search, 
  Bell, 
  Building2, 
  ChevronDown, 
  RefreshCw, 
  Play, 
  Flame, 
  ShieldCheck
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
  onRefresh,
  onRunBatch,
  onOpenChaosModal,
  onOpenAuthModal,
  onOpenOAuthModal,
}) => {
  const userInitials = currentUser?.name ? currentUser.name.split(' ').map(n => n[0]).join('') : "AM";
  const userRoleShort = currentUser?.role === 'FINANCE_CONTROLLER' ? 'Controller' : currentUser?.role === 'COMPLIANCE_AUDITOR' ? 'Auditor' : 'Operator';

  return (
    <header style={{
      background: '#FFFFFF',
      borderBottom: '1px solid var(--blade-border-subtle)',
      height: '56px',
      padding: '0 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      
      {/* Left: Brand Logo & Merchant Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        
        {/* Razorpay Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            background: 'linear-gradient(135deg, #0B72E7 0%, #0854AB 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Zap size={15} color="#FFFFFF" fill="#FFFFFF" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--blade-text-primary)', letterSpacing: '-0.02em' }}>
              Razorpay
            </span>
            <span style={{
              fontSize: '0.62rem',
              fontWeight: 700,
              color: '#0B72E7',
              background: '#EFF6FF',
              padding: '1px 5px',
              borderRadius: '3px',
              border: '1px solid #BFDBFE',
              textTransform: 'uppercase',
            }}>
              Route
            </span>
          </div>
        </div>

        <span style={{ width: '1px', height: '18px', background: 'var(--blade-border-subtle)' }}></span>

        {/* Merchant Switcher Pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 8px',
          borderRadius: '6px',
          background: 'var(--blade-bg-subtle)',
          border: '1px solid var(--blade-border-subtle)',
          cursor: 'pointer',
        }}>
          <Building2 size={13} color="#0B72E7" />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--blade-text-primary)', lineHeight: 1.1 }}>
              Nexus Marketplace
            </span>
            <span className="num-mono" style={{ fontSize: '0.62rem', color: 'var(--blade-text-muted)' }}>
              rzp_live_nexus99
            </span>
          </div>
          <ChevronDown size={12} color="var(--blade-text-muted)" />
        </div>

        {/* Razorpay OAuth 2.0 Partner Badge */}
        <button
          onClick={onOpenOAuthModal}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 8px',
            borderRadius: '4px',
            background: oauthConnected ? '#EFF6FF' : '#FEF3C7',
            border: oauthConnected ? '1px solid #BFDBFE' : '1px solid #FCD34D',
            fontSize: '0.68rem',
            fontWeight: 700,
            color: oauthConnected ? '#1D4ED8' : '#B45309',
            cursor: 'pointer'
          }}
          title="Razorpay OAuth 2.0 Partner Connection"
        >
          <ShieldCheck size={12} color={oauthConnected ? "#0B72E7" : "#D97706"} />
          <span>{oauthConnected ? "OAuth 2.0 Connected" : "OAuth Connect"}</span>
        </button>

      </div>

      {/* Center: Global Search Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: 'var(--blade-bg-subtle)',
        border: '1px solid var(--blade-border-subtle)',
        borderRadius: '6px',
        padding: '5px 12px',
        width: '320px',
        gap: '8px',
      }}>
        <Search size={13} color="var(--blade-text-muted)" />
        <input
          type="text"
          placeholder="Search orders, payouts, refunds, UTRs..."
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontSize: '0.76rem',
            color: 'var(--blade-text-primary)',
            width: '100%',
          }}
        />
        <span style={{
          fontSize: '0.62rem',
          color: 'var(--blade-text-muted)',
          background: '#FFFFFF',
          border: '1px solid var(--blade-border-subtle)',
          padding: '1px 4px',
          borderRadius: '3px',
          fontFamily: 'var(--font-mono)',
        }}>
          ⌘K
        </span>
      </div>

      {/* Right: Environment, Actions, User */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        
        {/* Live Indicator Pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          padding: '3px 8px',
          borderRadius: '4px',
          background: '#ECFDF5',
          border: '1px solid #A7F3D0',
          fontSize: '0.68rem',
          fontWeight: 600,
          color: '#047857',
        }}>
          <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10B981' }}></span>
          <span>LIVE PRODUCTION</span>
        </div>

        {/* Sync Button */}
        <button
          className="btn-secondary"
          onClick={onRefresh}
          disabled={loading}
          style={{ padding: '5px 10px', fontSize: '0.75rem' }}
          title="Refresh ledger state"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          <span>Sync</span>
        </button>

        {/* Reconcile Batch Button */}
        <button
          className="btn-primary"
          onClick={onRunBatch}
          disabled={loading}
          style={{ padding: '5px 12px', fontSize: '0.75rem' }}
        >
          <Play size={12} fill="currentColor" />
          <span>Reconcile 500</span>
        </button>

        {/* Chaos Button */}
        <button
          className="btn-danger"
          onClick={onOpenChaosModal}
          style={{ padding: '5px 10px', fontSize: '0.75rem' }}
        >
          <Flame size={12} />
          <span>Chaos</span>
        </button>

        {/* Notification Bell */}
        <button style={{
          background: 'transparent',
          border: '1px solid var(--blade-border-subtle)',
          borderRadius: '6px',
          padding: '6px',
          cursor: 'pointer',
          color: 'var(--blade-text-secondary)',
          display: 'flex',
          alignItems: 'center',
        }}>
          <Bell size={14} />
        </button>

        {/* User Identity & Role Switcher Pill */}
        <div
          onClick={onOpenAuthModal}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '3px 8px',
            borderRadius: '20px',
            background: 'var(--blade-bg-subtle)',
            border: '1px solid var(--blade-border-subtle)',
            cursor: 'pointer',
            transition: 'all 0.12s'
          }}
          title="Click to switch RBAC Role / User"
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
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--blade-text-primary)', lineHeight: 1.1 }}>
              {currentUser?.name || "Arjun Mehta"}
            </span>
            <span style={{ fontSize: '0.6rem', color: '#0B72E7', fontWeight: 600 }}>
              {userRoleShort} ▼
            </span>
          </div>
        </div>

      </div>

    </header>
  );
};
