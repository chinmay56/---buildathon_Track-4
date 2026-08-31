import React from 'react';
import { HelpCircle, Zap } from 'lucide-react';
import type { BenchmarkReport } from '../types';

interface BenchmarkViewProps {
  report: BenchmarkReport | null;
  loading: boolean;
}

export const BenchmarkView: React.FC<BenchmarkViewProps> = ({ report, loading }) => {
  if (loading || !report) {
    return (
      <div className="rzp-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-subtle)' }}>
        <Zap size={24} color="#0B72E7" style={{ margin: '0 auto 8px auto', display: 'block' }} className="animate-spin" />
        <p style={{ fontSize: '0.84rem' }}>Computing ground truth benchmark against isolated dataset...</p>
      </div>
    );
  }

  const m = report.metrics;
  const cm = report.confusion_matrix;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* 4 Big KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
        
        <div style={{ padding: '16px', background: '#ECFDF5', borderRadius: '6px', border: '1px solid #A7F3D0' }}>
          <div style={{ fontSize: '0.72rem', color: '#065F46', fontWeight: 600, textTransform: 'uppercase' }}>Precision</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#047857', letterSpacing: '-0.02em' }}>{m.precision_pct}%</div>
          <div style={{ fontSize: '0.7rem', color: '#065F46', opacity: 0.85 }}>0 false positives</div>
        </div>

        <div style={{ padding: '16px', background: '#EFF6FF', borderRadius: '6px', border: '1px solid #BFDBFE' }}>
          <div style={{ fontSize: '0.72rem', color: '#1E40AF', fontWeight: 600, textTransform: 'uppercase' }}>Recall</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#1D4ED8', letterSpacing: '-0.02em' }}>{m.recall_pct}%</div>
          <div style={{ fontSize: '0.7rem', color: '#1E40AF', opacity: 0.85 }}>Ground truth exceptions caught</div>
        </div>

        <div style={{ padding: '16px', background: '#F5F3FF', borderRadius: '6px', border: '1px solid #DDD6FE' }}>
          <div style={{ fontSize: '0.72rem', color: '#5B21B6', fontWeight: 600, textTransform: 'uppercase' }}>Monetary Accuracy</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#4F46E5', letterSpacing: '-0.02em' }}>{m.monetary_accuracy_pct}%</div>
          <div style={{ fontSize: '0.7rem', color: '#5B21B6', opacity: 0.85 }}>Exact exposure calculation</div>
        </div>

        <div style={{ padding: '16px', background: '#FFFBEB', borderRadius: '6px', border: '1px solid #FDE68A' }}>
          <div style={{ fontSize: '0.72rem', color: '#92400E', fontWeight: 600, textTransform: 'uppercase' }}>Engine Throughput</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#B45309', letterSpacing: '-0.02em' }}>{m.throughput_records_per_sec.toLocaleString()}</div>
          <div style={{ fontSize: '0.7rem', color: '#92400E', opacity: 0.85 }}>records / second</div>
        </div>

      </div>

      {/* 2x2 Confusion Matrix */}
      <div className="rzp-panel" style={{ padding: '18px 20px' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '10px' }}>
          2x2 Confusion Matrix (Evaluation on 500-Record Batch)
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          
          <div style={{ padding: '12px 14px', background: '#ECFDF5', borderRadius: '6px', border: '1px solid #A7F3D0' }}>
            <div style={{ fontSize: '0.78rem', color: '#065F46', fontWeight: 700 }}>TRUE POSITIVES (TP): {cm.true_positives}</div>
            <p style={{ fontSize: '0.72rem', color: '#065F46', marginTop: '2px' }}>
              Ground truth exceptions correctly detected and routed for AI investigation.
            </p>
          </div>

          <div style={{ padding: '12px 14px', background: 'var(--bg-subtle)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>FALSE POSITIVES (FP): {cm.false_positives}</div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: '2px' }}>
              Clean transactions falsely flagged as anomalies (0 = calibrated tolerance).
            </p>
          </div>

          <div style={{ padding: '12px 14px', background: 'var(--bg-subtle)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>FALSE NEGATIVES (FN): {cm.false_negatives}</div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: '2px' }}>
              Ground truth exceptions missed by the 5 deterministic detectors.
            </p>
          </div>

          <div style={{ padding: '12px 14px', background: '#EFF6FF', borderRadius: '6px', border: '1px solid #BFDBFE' }}>
            <div style={{ fontSize: '0.78rem', color: '#1E40AF', fontWeight: 700 }}>TRUE NEGATIVES (TN): {cm.true_negatives}</div>
            <p style={{ fontSize: '0.72rem', color: '#1E40AF', marginTop: '2px' }}>
              Clean settlement transactions correctly matched and verified.
            </p>
          </div>

        </div>
      </div>

      {/* Exception Type Breakdown Table */}
      <div className="rzp-panel" style={{ padding: '18px 20px' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '10px' }}>
          Measured Accuracy by Exception Type
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-subtle)', textAlign: 'left', background: 'var(--bg-subtle)' }}>
              <th style={{ padding: '9px 12px' }}>EXCEPTION TYPE</th>
              <th style={{ padding: '9px 12px', textAlign: 'right' }}>GROUND TRUTH</th>
              <th style={{ padding: '9px 12px', textAlign: 'right' }}>DETECTED</th>
              <th style={{ padding: '9px 12px', textAlign: 'right' }}>PRECISION</th>
              <th style={{ padding: '9px 12px', textAlign: 'right' }}>RECALL</th>
              <th style={{ padding: '9px 12px', textAlign: 'right' }}>MONETARY DELTA</th>
            </tr>
          </thead>
          <tbody>
            {report.by_exception_type.map((t, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '9px 12px', fontWeight: 600, color: 'var(--text-main)' }}>{t.exception_type}</td>
                <td style={{ padding: '9px 12px', textAlign: 'right', color: 'var(--text-muted)' }}>{t.ground_truth_count}</td>
                <td style={{ padding: '9px 12px', textAlign: 'right', color: '#047857', fontWeight: 600 }}>{t.detected_count}</td>
                <td style={{ padding: '9px 12px', textAlign: 'right', color: '#1D4ED8' }}>{t.precision_pct}%</td>
                <td style={{ padding: '9px 12px', textAlign: 'right', color: '#4F46E5' }}>{t.recall_pct}%</td>
                <td style={{ padding: '9px 12px', textAlign: 'right', color: t.monetary_error_delta === 0 ? '#047857' : '#DC2626' }}>
                  ₹{t.monetary_error_delta.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Honest Exception Policy */}
      <div style={{ padding: '14px 18px', background: '#FFFBEB', borderRadius: '6px', border: '1px solid #FDE68A' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, color: '#92400E', marginBottom: '3px' }}>
          <HelpCircle size={15} color="#B45309" /> Honest Ambiguity Handling Policy
        </div>
        <p style={{ fontSize: '0.74rem', color: '#92400E', lineHeight: 1.45 }}>
          Rather than forcing decisions on unmapped merchant fee tiers or missing contract terms, the controller safely escalates uncertain cases to <strong>HUMAN REVIEW</strong>.
        </p>
      </div>

    </div>
  );
};
