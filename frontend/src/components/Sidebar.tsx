import React from 'react';
import { 
  Layers, 
  AlertOctagon, 
  Wallet, 
  Flame, 
  Award, 
  Bot, 
  TrendingUp,
  Activity
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
  const coreOps: NavItem[] = [
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
      label: 'Operations Copilot',
      icon: Bot,
    },
    {
      id: 'cash',
      label: 'Cash & Float Health',
      icon: Wallet,
    },
    {
      id: 'forecast',
      label: 'Forward 7-Day Forecast',
      icon: TrendingUp,
    },
  ];

  const auditNav: NavItem[] = [
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

  const renderNavSection = (title: string, items: NavItem[], isLast: boolean = false) => (
    <div style={{ marginBottom: isLast ? '0' : '14px' }}>
      <div style={{
        fontSize: '0.64rem',
        fontWeight: 700,
        color: '#94A3B8',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        padding: '0 12px 6px 12px',
        fontFamily: 'var(--font-heading)',
      }}>
        {title}
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
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
                padding: '7px 10px',
                borderRadius: '6px',
                border: 'none',
                background: isActive ? '#F1F5F9' : 'transparent',
                color: isActive ? '#0F172A' : '#475569',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontFamily: 'var(--font-heading)',
                fontWeight: isActive ? 600 : 500,
                textAlign: 'left',
                position: 'relative',
                transition: 'all 0.12s ease',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = '#F8FAFC';
                  e.currentTarget.style.color = '#0F172A';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#475569';
                }
              }}
            >
              {/* Active Left Indicator Bar */}
              {isActive && (
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: '6px',
                  bottom: '6px',
                  width: '3px',
                  borderRadius: '0 3px 3px 0',
                  background: '#0B72E7',
                }} />
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '9px', paddingLeft: isActive ? '4px' : '0', transition: 'padding-left 0.1s ease' }}>
                <Icon size={15} color={isActive ? '#0B72E7' : '#64748B'} strokeWidth={isActive ? 2 : 1.75} />
                <span>{item.label}</span>
              </div>

              {item.badge !== undefined && item.badge !== null && (
                <span style={{
                  fontSize: '0.66rem',
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
      
      {!isLast && (
        <div style={{
          height: '1px',
          background: '#F1F5F9',
          margin: '12px 6px 0 6px',
        }} />
      )}
    </div>
  );

  return (
    <aside style={{
      width: '230px',
      minWidth: '230px',
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
      
      {/* Navigation Groups with Minimal Dissection */}
      <div style={{ padding: '16px 8px' }}>
        {renderNavSection('Core Operations', coreOps)}
        {renderNavSection('Intelligence & Float', intelligenceNav)}
        {renderNavSection('Audit & Benchmark', auditNav, true)}
      </div>

      {/* Clean Minimalist Footer Status */}
      <div style={{
        padding: '14px 16px',
        borderTop: '1px solid #F1F5F9',
        background: '#FAFAFA',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#059669' }}></span>
          <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#334155', fontFamily: 'var(--font-heading)' }}>
            Engine Active
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.66rem', color: '#94A3B8', fontFamily: 'var(--font-mono)' }}>
          <Activity size={12} color="#059669" />
          <span>14ms</span>
        </div>
      </div>

    </aside>
  );
};
