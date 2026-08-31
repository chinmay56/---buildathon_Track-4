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

export type ActiveTab = 'overview' | 'exceptions' | 'copilot' | 'cash' | 'forecast' | 'chaos' | 'benchmark';

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
  const mainNav = [
    {
      id: 'overview' as ActiveTab,
      label: 'Settlement Ledger',
      icon: Layers,
      badge: '500 Records',
      badgeType: 'neutral',
    },
    {
      id: 'exceptions' as ActiveTab,
      label: 'Exceptions Hub',
      icon: AlertOctagon,
      badge: exceptionCount > 0 ? `${exceptionCount}` : null,
      badgeType: 'danger',
    },
    {
      id: 'copilot' as ActiveTab,
      label: 'Settlement Q&A Copilot',
      icon: Bot,
      badge: 'AI Agent',
      badgeType: 'blue',
    },
    {
      id: 'cash' as ActiveTab,
      label: 'Cash & Float Position',
      icon: Wallet,
      badge: null,
    },
    {
      id: 'forecast' as ActiveTab,
      label: 'Forward 7-Day Forecast',
      icon: TrendingUp,
      badge: 'T+7 Float',
      badgeType: 'success',
    },
  ];

  const evalNav = [
    {
      id: 'chaos' as ActiveTab,
      label: 'Chaos Simulator',
      icon: Flame,
      badge: 'Judge Demo',
      badgeType: 'warning',
    },
    {
      id: 'benchmark' as ActiveTab,
      label: 'Ground Truth Audit',
      icon: Award,
      badge: '100% Prec',
      badgeType: 'success',
    },
  ];

  return (
    <aside style={{
      width: '230px',
      minWidth: '230px',
      background: '#FFFFFF',
      borderRight: '1px solid var(--blade-border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      height: 'calc(100vh - 56px)',
      position: 'sticky',
      top: '56px',
      zIndex: 30,
    }}>
      
      {/* Navigation Sections */}
      <div style={{ padding: '16px 10px' }}>
        
        {/* Section 1: Core Settlements */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{
            fontSize: '0.64rem',
            fontWeight: 700,
            color: 'var(--blade-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            padding: '0 10px 6px 10px',
          }}>
            Core Settlements
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {mainNav.map((item) => {
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
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    background: isActive ? '#EFF6FF' : 'transparent',
                    color: isActive ? '#0B72E7' : 'var(--blade-text-secondary)',
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                    fontWeight: isActive ? 600 : 500,
                    textAlign: 'left',
                    transition: 'all 0.1s ease',
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Icon size={15} color={isActive ? '#0B72E7' : '#64748B'} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span style={{
                      fontSize: '0.62rem',
                      fontWeight: 700,
                      padding: '1px 5px',
                      borderRadius: '3px',
                      background: isActive 
                        ? '#0B72E7' 
                        : item.badgeType === 'danger'
                        ? '#DC2626'
                        : item.badgeType === 'blue'
                        ? '#EFF6FF'
                        : item.badgeType === 'success'
                        ? '#ECFDF5'
                        : '#F1F5F9',
                      color: isActive || item.badgeType === 'danger' ? '#FFFFFF' : item.badgeType === 'blue' ? '#0B72E7' : item.badgeType === 'success' ? '#047857' : '#475569',
                      border: item.badgeType === 'blue' && !isActive ? '1px solid #BFDBFE' : item.badgeType === 'success' && !isActive ? '1px solid #A7F3D0' : 'none'
                    }}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Section 2: Audit & Benchmarks */}
        <div>
          <div style={{
            fontSize: '0.64rem',
            fontWeight: 700,
            color: 'var(--blade-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            padding: '0 10px 6px 10px',
          }}>
            Audit & Benchmark
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {evalNav.map((item) => {
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
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    background: isActive ? '#EFF6FF' : 'transparent',
                    color: isActive ? '#0B72E7' : 'var(--blade-text-secondary)',
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                    fontWeight: isActive ? 600 : 500,
                    textAlign: 'left',
                    transition: 'all 0.1s ease',
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Icon size={15} color={isActive ? '#0B72E7' : '#64748B'} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span style={{
                      fontSize: '0.62rem',
                      fontWeight: 700,
                      padding: '1px 5px',
                      borderRadius: '3px',
                      background: isActive 
                        ? '#0B72E7' 
                        : item.badgeType === 'warning'
                        ? '#FEF3C7'
                        : '#ECFDF5',
                      color: isActive ? '#FFFFFF' : item.badgeType === 'warning' ? '#92400E' : '#047857',
                    }}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

      </div>

      {/* Bottom Footer Section */}
      <div style={{
        padding: '14px',
        borderTop: '1px solid var(--blade-border-subtle)',
        background: 'var(--blade-bg-subtle)',
        fontSize: '0.68rem',
        color: 'var(--blade-text-muted)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px', fontWeight: 600, color: 'var(--blade-text-secondary)' }}>
          <ShieldCheck size={13} color="#059669" />
          <span>Deterministic Audit Engine</span>
        </div>
        <p style={{ fontSize: '0.64rem', color: 'var(--blade-text-muted)' }}>
          Razorpay Route • T+2 Settlement Cycle
        </p>
      </div>

    </aside>
  );
};
