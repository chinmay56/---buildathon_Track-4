import React from 'react';
import { 
  Layers, 
  AlertOctagon, 
  Wallet, 
  Flame, 
  Award, 
  ShieldCheck,
  Bot,
  TrendingUp
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type ActiveTab = 'overview' | 'exceptions' | 'copilot' | 'cash' | 'forecast' | 'chaos' | 'benchmark';

interface NavItem {
  id: ActiveTab;
  label: string;
  icon: LucideIcon;
  badge?: number | string | null;
  badgeAlert?: boolean;
}

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  exceptionCount: number;
  unresolvedCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  exceptionCount,
}) => {
  const mainNav: NavItem[] = [
    {
      id: 'overview',
      label: 'Settlement Ledger',
      icon: Layers,
    },
    {
      id: 'exceptions',
      label: 'Exceptions Hub',
      icon: AlertOctagon,
      badge: exceptionCount > 0 ? exceptionCount : null,
      badgeAlert: true,
    },
  ];

  const intelligenceNav: NavItem[] = [
    {
      id: 'copilot',
      label: 'Settlement Q&A Copilot',
      icon: Bot,
    },
    {
      id: 'cash',
      label: 'Cash & Float Position',
      icon: Wallet,
    },
    {
      id: 'forecast',
      label: 'Forward 7-Day Forecast',
      icon: TrendingUp,
    },
  ];

  const evalNav: NavItem[] = [
    {
      id: 'chaos',
      label: 'Chaos Simulator',
      icon: Flame,
    },
    {
      id: 'benchmark',
      label: 'Ground Truth Audit',
      icon: Award,
    },
  ];

  const renderNavGroup = (title: string, items: NavItem[]) => (
    <div style={{ marginBottom: '20px' }}>
      <div style={{
        fontSize: '0.66rem',
        fontWeight: 700,
        color: 'var(--blade-text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        padding: '0 12px 8px 12px',
        fontFamily: 'var(--font-heading)',
      }}>
        {title}
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: 'none',
                background: isActive ? '#EFF6FF' : 'transparent',
                color: isActive ? '#0B72E7' : 'var(--blade-text-secondary)',
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontFamily: 'var(--font-heading)',
                fontWeight: isActive ? 600 : 500,
                textAlign: 'left',
                transition: 'all 0.12s ease',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'var(--blade-bg-subtle)';
                  e.currentTarget.style.color = 'var(--blade-text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--blade-text-secondary)';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Icon size={16} color={isActive ? '#0B72E7' : '#64748B'} />
                <span>{item.label}</span>
              </div>

              {item.badge !== undefined && item.badge !== null && (
                <span style={{
                  fontSize: '0.68rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: '10px',
                  background: item.badgeAlert ? '#FEF2F2' : '#F1F5F9',
                  color: item.badgeAlert ? '#DC2626' : '#64748B',
                  border: item.badgeAlert ? '1px solid #FECACA' : '1px solid #E2E8F0',
                }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );

  return (
    <aside style={{
      width: '240px',
      minWidth: '240px',
      background: '#FFFFFF',
      borderRight: '1px solid var(--blade-border-medium)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      height: 'calc(100vh - 56px)',
      position: 'sticky',
      top: '56px',
      zIndex: 30,
    }}>
      
      {/* Navigation Groups */}
      <div style={{ padding: '20px 10px' }}>
        {renderNavGroup('Core Operations', mainNav)}
        {renderNavGroup('Intelligence & Float', intelligenceNav)}
        {renderNavGroup('Audit & Verification', evalNav)}
      </div>

      {/* Clean Minimalist Footer */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid var(--blade-border-medium)',
        background: 'var(--blade-bg-subtle)',
        fontSize: '0.72rem',
        color: 'var(--blade-text-muted)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px', fontWeight: 600, color: 'var(--blade-text-secondary)', fontFamily: 'var(--font-heading)' }}>
          <ShieldCheck size={14} color="#059669" />
          <span>Deterministic Audit Engine</span>
        </div>
        <p style={{ fontSize: '0.66rem', color: 'var(--blade-text-muted)' }}>
          Razorpay Route • T+2 Settlement Cycle
        </p>
      </div>

    </aside>
  );
};
