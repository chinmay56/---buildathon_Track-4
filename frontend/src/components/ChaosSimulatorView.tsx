import React, { useState } from 'react';
import { Flame, CheckCircle2, Zap } from 'lucide-react';
import { injectChaosScenario } from '../api';

interface ChaosViewProps {
  onScenarioInjected: (newException: any) => void;
  loading: boolean;
}

export const ChaosSimulatorView: React.FC<ChaosViewProps> = ({
  onScenarioInjected,
  loading: parentLoading,
}) => {
  const [scenario, setScenario] = useState<string>("LATE_REFUND");
  const [amount, setAmount] = useState<number>(14500);
  const [vendorId, setVendorId] = useState<string>("vend_014");
  const [injecting, setInjecting] = useState<boolean>(false);
  const [lastInjectedResult, setLastInjectedResult] = useState<any>(null);

  const handleInject = async () => {
    setInjecting(true);
    try {
      const res = await injectChaosScenario(scenario, amount, vendorId);
      setLastInjectedResult(res);
      if (res.detected_exception) {
        onScenarioInjected(res.detected_exception);
      }
    } catch (err) {
      alert("Failed to inject chaos scenario: " + err);
    } finally {
      setInjecting(false);
    }
  };

  const scenarios = [
    {
      id: 'LATE_REFUND',
      title: 'Late Refund on Settled Vendor (Clawback Failure)',
      desc: 'Simulates a customer receiving a 100% refund 4 hours after vendor payout is settled. Tests whether the agent detects unrecovered cash leakage and drafts a vendor debit clawback.',
      badge: 'Cash Leakage',
      suggestedAmt: 14500,
    },
    {
      id: 'DUPLICATE_COMMISSION',
      title: 'Double Commission Overcharge (Split Sub-Ledger)',
      desc: 'Simulates a platform error deducting standard 10% commission plus an unintended duplicate 15% promotional fee line. Tests if the agent detects the fee overcharge and calculates exact reversal credit.',
      badge: 'Vendor Overcharge',
      suggestedAmt: 22000,
    },
    {
      id: 'GHOST_PAYOUT',
      title: 'Ghost Payout (Settlement without Captured Payment)',
      desc: 'Simulates a settled bank payout with valid UTR whose upstream gateway payment was cancelled or failed. Tests if the agent identifies the broken order linkage and freezes orphaned float.',
      badge: 'Orphaned Float',
      suggestedAmt: 8500,
    },
    {
      id: 'AMBIGUOUS_TIER',
      title: 'Ambiguous Unmapped Vendor Contract Tier (Policy Safeguard)',
      desc: 'Simulates a high-value merchant with custom unmapped contract terms. Tests whether the AI controller safely halts and routes to HUMAN REVIEW with required missing fields identified rather than guessing.',
      badge: 'Safety Test',
      suggestedAmt: 35000,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Header Banner */}
      <div className="rzp-panel" style={{ padding: '18px 22px', borderLeft: '4px solid #DC2626' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <div style={{ padding: '6px', borderRadius: '6px', background: '#FEF2F2', color: '#DC2626' }}>
            <Flame size={18} />
          </div>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Live Chaos & Anomaly Injection Simulator
            </h2>
            <p style={{ fontSize: '0.76rem', color: 'var(--text-subtle)' }}>
              Interactive testbench for hackathon judges: inject custom ledger anomalies in real-time and observe autonomous detection, investigation, and mathematical verification.
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px', alignItems: 'start' }}>
        
        {/* Left Column: Scenario Selector */}
        <div className="rzp-panel" style={{ padding: '18px' }}>
          <label style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>
            1. Select Test Scenario
          </label>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px' }}>
            {scenarios.map((sc) => {
              const isSelected = scenario === sc.id;

              return (
                <div
                  key={sc.id}
                  onClick={() => {
                    setScenario(sc.id);
                    setAmount(sc.suggestedAmt);
                  }}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '6px',
                    background: isSelected ? '#EFF6FF' : 'var(--bg-subtle)',
                    border: isSelected ? '1.5px solid #0B72E7' : '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    transition: 'all 0.12s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: isSelected ? '#0B72E7' : 'var(--text-main)' }}>
                      {sc.title}
                    </span>
                    <span className="badge badge-review" style={{ fontSize: '0.62rem' }}>{sc.badge}</span>
                  </div>
                  <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    {sc.desc}
                  </p>
                </div>
              );
            })}
          </div>

          <label style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
            2. Configure Parameters
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '18px' }}>
            <div>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', display: 'block', marginBottom: '3px' }}>
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
                  padding: '7px 10px',
                  color: 'var(--text-main)',
                  fontSize: '0.84rem',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', display: 'block', marginBottom: '3px' }}>
                Vendor Target ID
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
                  padding: '7px 10px',
                  color: 'var(--text-main)',
                  fontSize: '0.84rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <button
            className="btn-primary"
            onClick={handleInject}
            disabled={injecting || parentLoading}
            style={{
              width: '100%',
              justifyContent: 'center',
              padding: '10px',
              background: '#DC2626',
              fontSize: '0.84rem',
            }}
          >
            <Flame size={15} />
            <span>{injecting ? "Injecting into Live Ledger..." : "Inject Chaos Transaction Live"}</span>
          </button>
        </div>

        {/* Right Column: Live Detection Result */}
        <div className="rzp-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase', marginBottom: '10px' }}>
            Live Engine Reaction & Detection
          </div>

          {!lastInjectedResult ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-subtle)', background: 'var(--bg-subtle)', borderRadius: '6px' }}>
              <Zap size={24} color="#94A3B8" style={{ margin: '0 auto 8px auto', display: 'block' }} />
              <p style={{ fontSize: '0.82rem', fontWeight: 500 }}>No live chaos scenario injected in this session yet.</p>
              <p style={{ fontSize: '0.73rem', marginTop: '4px' }}>Select a scenario on the left and click 'Inject Chaos Transaction Live'.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              <div style={{ padding: '12px', background: '#ECFDF5', borderRadius: '6px', border: '1px solid #A7F3D0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#047857', fontWeight: 600, fontSize: '0.82rem', marginBottom: '4px' }}>
                  <CheckCircle2 size={15} /> Anomaly Successfully Injected & Detected
                </div>
                <div style={{ fontSize: '0.74rem', color: '#065F46' }}>
                  Order ID: <strong style={{ fontFamily: 'var(--font-mono)' }}>{lastInjectedResult.order_id}</strong> • Vendor: <strong>{lastInjectedResult.vendor_id}</strong> • Amount: <strong>₹{lastInjectedResult.amount}</strong>
                </div>
              </div>

              {lastInjectedResult.detected_exception && (
                <div style={{ padding: '12px', background: 'var(--bg-subtle)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>
                    Detector Output
                  </div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#B91C1C', marginBottom: '4px' }}>
                    {lastInjectedResult.detected_exception.exception_type}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    Calculated Discrepancy: <strong style={{ color: '#B91C1C' }}>₹{lastInjectedResult.detected_exception.discrepancy_amount}</strong>
                  </div>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
                    Re-reconciliation completed in <strong>{lastInjectedResult.batch_total}</strong> total transactions. Navigate to <em>Exceptions Hub</em> to inspect the full AI investigation trace.
                  </p>
                </div>
              )}

            </div>
          )}

        </div>

      </div>

    </div>
  );
};
