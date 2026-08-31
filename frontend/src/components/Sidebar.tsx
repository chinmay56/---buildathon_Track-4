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
  badge: string | null;
  badgeType?: 'neutral' | 'danger' | 'purple' | 'success' | 'warning';
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
      badge: '500 Live',
      badgeType: 'neutral',
    },
    {
      id: 'exceptions',
      label: 'Exceptions Hub',
      icon: AlertOctagon,
      badge: exceptionCount > 0 ? `${exceptionCount}` : null,
      badgeType: 'danger',
    },
  ];

  const intelligenceNav: NavItem[] = [
    {
      id: 'copilot',
      label: 'Settlement Q&A Copilot',
      icon: Bot,
      badge: 'AI Agent',
      badgeType: 'purple',
    },
    {
      id: 'cash',
      label: 'Cash & Float Position',
      icon: Wallet,
      badge: null,
    },
    {
      id: 'forecast',
      label: 'Forward 7-Day Forecast',
      icon: TrendingUp,
      badge: 'T+7 Float',
      badgeType: 'success',
    },
  ];

  const evalNav: NavItem[] = [
    {
      id: 'chaos',
      label: 'Chaos Simulator',
      icon: Flame,
      badge: 'Judge Demo',
      badgeType: 'warning',
    },
    {
      id: 'benchmark',
      label: 'Ground Truth Audit',
      icon: Award,
      badge: '100% Prec',
      badgeType: 'success',
    },
  ];

  const renderNavGroup = (title: string, items: NavItem[]) => (
    <div style={{ marginBottom: '18px' }}>
      <div style={{
        fontSize: '0.66rem',
        fontWeight: 700,
        color: 'var(--blade-text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        padding: '0 10px 8px 10px',
        fontFamily: 'var(--font-heading)',
      }}>
        {title}
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
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
                borderRadius: '8px',
                border: 'none',
                background: isActive ? '#EFF6FF' : 'transparent',
                color: isActive ? '#0B72E7' : 'var(--blade-text-secondary)',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontFamily: 'var(--font-heading)',
                fontWeight: isActive ? 600 : 500,
                textAlign: 'left',
                transition: 'all 0.15s ease',
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                <Icon size={16} color={isActive ? '#0B72E7' : '#64748B'} />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span style={{
                  fontSize: '0.64rem',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: isActive 
                    ? '#0B72E7' 
                    : item.badgeType === 'danger'
                    ? '#DC2626'
                    : item.badgeType === 'purple'
                    ? '#F5F3FF'
                    : item.badgeType === 'success'
                    ? '#ECFDF5'
                    : item.badgeType === 'warning'
                    ? '#FFFBEB'
                    : '#F1F5F9',
                  color: isActive || item.badgeType === 'danger' ? '#FFFFFF' : item.badgeType === 'purple' ? '#7C3AED' : item.badgeType === 'success' ? '#059669' : item.badgeType === 'warning' ? '#D97706' : '#475569',
                  border: item.badgeType === 'purple' && !isActive ? '1px solid #DDD6FE' : item.badgeType === 'success' && !isActive ? '1px solid #A7F3D0' : item.badgeType === 'warning' && !isActive ? '1px solid #FDE68A' : 'none'
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
      <div style={{ padding: '18px 12px' }}>
        {renderNavGroup('Core Operations', mainNav)}
        {renderNavGroup('Intelligence & Float', intelligenceNav)}
        {renderNavGroup('Audit & Verification', evalNav)}
      </div>

      {/* Bottom Footer Section */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid var(--blade-border-medium)',
        background: 'var(--blade-bg-subtle)',
        fontSize: '0.72rem',
        color: 'var(--blade-text-muted)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px', fontWeight: 600, color: 'var(--blade-text-secondary)', fontFamily: 'var(--font-heading)' }}>
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
