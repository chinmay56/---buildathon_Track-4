import React, { useState } from 'react';
import { X, Zap, ShieldCheck, CheckCircle2, AlertTriangle, ExternalLink, Unlink } from 'lucide-react';
import { authorizeOAuthDemo, disconnectOAuth } from '../api';

interface RazorpayOAuthModalProps {
  oauthStatus: { connected: boolean; merchant_id?: string; scope?: string; connected_at?: string; client_id?: string } | null;
  onClose: () => void;
  onRefresh: () => void;
}

export const RazorpayOAuthModal: React.FC<RazorpayOAuthModalProps> = ({
  oauthStatus,
  onClose,
  onRefresh,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const isConnected = oauthStatus?.connected ?? true;

  const handleConnect = async () => {
    setLoading(true);
    try {
      await authorizeOAuthDemo("code_live_nexus99_partner_granted");
      onRefresh();
    } catch (err) {
      alert("OAuth connection failed: " + err);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect Razorpay OAuth partner integration?")) return;
    setLoading(true);
    try {
      await disconnectOAuth();
      onRefresh();
    } catch (err) {
      alert("Failed to disconnect: " + err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content"
        style={{ maxWidth: '500px', padding: '24px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              background: '#0B72E7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF'
            }}>
              <Zap size={18} fill="#FFFFFF" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--blade-text-primary)' }}>
                Razorpay OAuth 2.0 Partner Integration
              </h3>
              <p style={{ fontSize: '0.72rem', color: 'var(--blade-text-muted)' }}>
                Official Partner Authorization Code Grant (RFC 6749)
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--blade-text-muted)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Live Status Card */}
        <div style={{
          padding: '16px',
          borderRadius: '8px',
          border: isConnected ? '1px solid #A7F3D0' : '1px solid #FCD34D',
          background: isConnected ? '#F0FDF4' : '#FFFBEB',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {isConnected ? (
                <CheckCircle2 size={16} color="#059669" />
              ) : (
                <AlertTriangle size={16} color="#D97706" />
              )}
              <span style={{ fontSize: '0.84rem', fontWeight: 700, color: isConnected ? '#065F46' : '#92400E' }}>
                {isConnected ? 'Active Razorpay OAuth Connection' : 'Partner Account Disconnected'}
              </span>
            </div>
            <span style={{
              fontSize: '0.62rem',
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: '4px',
              background: isConnected ? '#DCFCE7' : '#FEF3C7',
              color: isConnected ? '#15803D' : '#B45309'
            }}>
              {isConnected ? 'LIVE AUTHENTICATED' : 'DISCONNECTED'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.72rem', color: 'var(--blade-text-secondary)' }}>
            <div>
              <span style={{ color: 'var(--blade-text-muted)' }}>Linked Merchant:</span>{' '}
              <strong className="num-mono">{oauthStatus?.merchant_id || 'acc_nexus99'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--blade-text-muted)' }}>Client ID:</span>{' '}
              <strong className="num-mono">{oauthStatus?.client_id || 'rzp_partner_nexus99'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--blade-text-muted)' }}>Token Grant:</span>{' '}
              <strong>Bearer (Auto-refresh)</strong>
            </div>
            <div>
              <span style={{ color: 'var(--blade-text-muted)' }}>Active Scopes:</span>{' '}
              <strong>Route & Settlements</strong>
            </div>
          </div>
        </div>

        {/* Granted Permissions List */}
        <div style={{ marginBottom: '18px' }}>
          <div className="micro-label" style={{ marginBottom: '6px' }}>Granted OAuth 2.0 Scopes</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: 'var(--blade-text-primary)' }}>
              <ShieldCheck size={14} color="#059669" />
              <span><code>route.transfers</code> — Initiate payment split transfers to linked vendor accounts</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: 'var(--blade-text-primary)' }}>
              <ShieldCheck size={14} color="#059669" />
              <span><code>route.reversals</code> — Execute automated customer return clawback debits</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: 'var(--blade-text-primary)' }}>
              <ShieldCheck size={14} color="#059669" />
              <span><code>settlements.read</code> — Ingest combined settlement reconciliation feeds & bank UTRs</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
          {isConnected ? (
            <button
              className="btn-danger"
              onClick={handleDisconnect}
              disabled={loading}
              style={{ fontSize: '0.75rem', padding: '6px 12px' }}
            >
              <Unlink size={13} />
              <span>Disconnect Partner</span>
            </button>
          ) : (
            <button
              className="btn-primary"
              onClick={handleConnect}
              disabled={loading}
              style={{ fontSize: '0.75rem', padding: '6px 14px' }}
            >
              <ExternalLink size={13} />
              <span>Connect with Razorpay (OAuth 2.0)</span>
            </button>
          )}

          <button
            className="btn-secondary"
            onClick={onClose}
            style={{ fontSize: '0.75rem', padding: '6px 12px' }}
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
