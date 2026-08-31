import React, { useState } from 'react';
import { X, Flame } from 'lucide-react';
import { injectChaosScenario } from '../api';

interface ChaosModalProps {
  onClose: () => void;
  onSuccess: (newException: any) => void;
}

export const ChaosInjectorModal: React.FC<ChaosModalProps> = ({ onClose, onSuccess }) => {
  const [scenario, setScenario] = useState<string>("LATE_REFUND");
  const [amount, setAmount] = useState<number>(14500);
  const [vendorId, setVendorId] = useState<string>("vend_014");
  const [loading, setLoading] = useState<boolean>(false);

  const handleInject = async () => {
    setLoading(true);
    try {
      const res = await injectChaosScenario(scenario, amount, vendorId);
      if (res.detected_exception) {
        onSuccess(res.detected_exception);
      }
      onClose();
    } catch (err) {
      alert("Failed to inject chaos scenario: " + err);
    } finally {
      setLoading(false);
    }
  };

  const scenarios = [
    {
      id: 'LATE_REFUND',
      title: 'Late Refund on Settled Vendor',
      desc: 'Customer receives full refund hours after vendor payout is settled. Ledger fails to create clawback.',
      badge: 'Cash Leakage'
    },
    {
      id: 'DUPLICATE_COMMISSION',
      title: 'Double Commission Overcharge',
      desc: 'Platform accidentally applies standard commission + duplicate promotional fee line (25% vs 10%).',
      badge: 'Vendor Overcharge'
    },
    {
      id: 'GHOST_PAYOUT',
      title: 'Ghost Payout (No Captured Payment)',
      desc: 'Bank payout settles with valid UTR, but upstream payment transaction was failed/cancelled.',
      badge: 'Orphaned Float'
    },
    {
      id: 'AMBIGUOUS_TIER',
      title: 'Ambiguous Unmapped Contract Tier',
      desc: 'Custom enterprise vendor agreement with unmapped tax slab. Tests honest HUMAN REVIEW fallback.',
      badge: 'Safeguard Test'
    }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        style={{
          background: '#FFFFFF',
          borderRadius: '8px',
          width: '620px',
          maxWidth: '95vw',
          padding: '22px',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ padding: '6px', borderRadius: '6px', background: '#FEF2F2', color: '#DC2626' }}>
              <Flame size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Chaos Scenario Simulation
              </h2>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-subtle)' }}>
                Demonstrate live settlement anomaly detection against injected discrepancies
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-subtle)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Scenarios selection */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
            Select Chaos Scenario
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
            {scenarios.map((sc) => (
              <div
                key={sc.id}
                onClick={() => setScenario(sc.id)}
                style={{
                  padding: '10px 14px',
                  borderRadius: '6px',
                  background: scenario === sc.id ? '#EFF6FF' : 'var(--bg-subtle)',
                  border: scenario === sc.id ? '1px solid #0B72E7' : '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  transition: 'all 0.1s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>{sc.title}</span>
                  <span className="badge badge-review" style={{ fontSize: '0.65rem' }}>{sc.badge}</span>
                </div>
                <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{sc.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Amount & Vendor Input */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
          <div>
            <label style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', display: 'block', marginBottom: '4px', fontWeight: 500 }}>
              Transaction Amount (₹)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              style={{
                width: '100%',
                background: '#FFFFFF',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                padding: '6px 10px',
                color: 'var(--text-main)',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', display: 'block', marginBottom: '4px', fontWeight: 500 }}>
              Target Vendor ID
            </label>
            <input
              type="text"
              value={vendorId}
              onChange={(e) => setVendorId(e.target.value)}
              style={{
                width: '100%',
                background: '#FFFFFF',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                padding: '6px 10px',
                color: 'var(--text-main)',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            />
          </div>
        </div>

        {/* Footer actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
          <button className="btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleInject} disabled={loading} style={{ background: '#DC2626' }}>
            <Flame size={14} />
            <span>{loading ? "Injecting & Reconciling..." : "Inject Discrepancy Live"}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
