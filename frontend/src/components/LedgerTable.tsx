import React, { useState } from 'react';
import { Search, Eye, CheckCircle2, AlertTriangle, HelpCircle, ShieldCheck, ChevronLeft, ChevronRight, Copy, Check } from 'lucide-react';
import type { SettlementRecord } from '../types';

interface LedgerProps {
  records: SettlementRecord[];
  onSelectRecord: (orderId: string, exceptionId?: string) => void;
  selectedOrderId?: string;
}

export const LedgerTable: React.FC<LedgerProps> = ({
  records,
  onSelectRecord,
  selectedOrderId
}) => {
  const [filterStatus, setFilterStatus] = useState<string>("EXCEPTIONS_ONLY");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const pageSize = 20;

  const filteredRecords = records.filter(rec => {
    const matchesSearch = 
      rec.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.vendor_id.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filterStatus === "ALL") return true;
    if (filterStatus === "EXCEPTIONS_ONLY") return rec.status !== "MATCHED";
    return rec.status === filterStatus;
  });

  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;
  const paginatedRecords = filteredRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleCopy = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "MATCHED":
        return <span className="badge badge-matched"><CheckCircle2 size={11} /> MATCHED</span>;
      case "AUTO_RESOLVABLE":
        return <span className="badge badge-resolvable"><AlertTriangle size={11} /> AUTO-RESOLVABLE</span>;
      case "HUMAN_REVIEW":
        return <span className="badge badge-review"><HelpCircle size={11} /> HUMAN REVIEW</span>;
      case "VERIFIED_RESOLVED":
        return <span className="badge badge-verified"><ShieldCheck size={11} /> VERIFIED ₹0</span>;
      case "APPROVED":
        return <span className="badge badge-blue">APPROVED</span>;
      default:
        return <span className="badge badge-resolvable">{status}</span>;
    }
  };

  // Summary figures
  const totalGross = records.reduce((sum, r) => sum + r.gross_amount, 0);
  const totalActual = records.reduce((sum, r) => sum + r.actual_settlement, 0);
  const totalDelta = records.reduce((sum, r) => sum + r.net_discrepancy, 0);

  return (
    <div className="rzp-panel" style={{ padding: '16px 20px' }}>
      
      {/* Table Top Header & Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Settlement Ledger Records
          </h2>
          <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
            Showing <span className="num-mono" style={{ fontWeight: 600 }}>{filteredRecords.length}</span> of <span className="num-mono">{records.length}</span> multi-source transactions
          </p>
        </div>

        {/* Filter buttons & Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          
          {/* Search Input */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={13} color="var(--text-muted)" style={{ position: 'absolute', left: '9px' }} />
            <input
              type="text"
              placeholder="Search Order / Vendor..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                background: '#FFFFFF',
                border: '1px solid var(--border-hairline)',
                borderRadius: '6px',
                padding: '5px 10px 5px 28px',
                color: 'var(--text-primary)',
                fontSize: '0.78rem',
                outline: 'none',
                width: '190px'
              }}
            />
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', background: 'var(--bg-subtle)', padding: '2px', borderRadius: '6px', border: '1px solid var(--border-hairline)' }}>
            {[
              { label: 'Exceptions Only', value: 'EXCEPTIONS_ONLY' },
              { label: 'Auto-Resolvable', value: 'AUTO_RESOLVABLE' },
              { label: 'Human Review', value: 'HUMAN_REVIEW' },
              { label: 'Verified', value: 'VERIFIED_RESOLVED' },
              { label: 'All', value: 'ALL' }
            ].map(tab => (
              <button
                key={tab.value}
                onClick={() => {
                  setFilterStatus(tab.value);
                  setCurrentPage(1);
                }}
                style={{
                  background: filterStatus === tab.value ? '#FFFFFF' : 'transparent',
                  color: filterStatus === tab.value ? '#0B72E7' : 'var(--text-muted)',
                  border: filterStatus === tab.value ? '1px solid var(--border-hairline)' : 'none',
                  borderRadius: '4px',
                  padding: '4px 9px',
                  fontSize: '0.72rem',
                  fontWeight: filterStatus === tab.value ? 600 : 500,
                  cursor: 'pointer',
                  boxShadow: filterStatus === tab.value ? '0 1px 2px rgba(0,0,0,0.04)' : 'none'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* Quick Summary Strip */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 12px',
        background: 'var(--bg-subtle)',
        borderRadius: '6px',
        border: '1px solid var(--border-hairline)',
        marginBottom: '12px',
        fontSize: '0.72rem',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Batch Gross: </span>
            <strong className="num-mono" style={{ color: 'var(--text-primary)' }}>₹{totalGross.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Net Disbursed: </span>
            <strong className="num-mono" style={{ color: 'var(--text-primary)' }}>₹{totalActual.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Unresolved Exposure: </span>
            <strong className="num-mono" style={{ color: '#B91C1C' }}>₹{totalDelta.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
          </div>
        </div>
        <div style={{ color: 'var(--text-muted)' }}>
          Showing <strong>{paginatedRecords.length}</strong> records on Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
        </div>
      </div>

      {/* Table Content */}
      <div style={{ overflowX: 'auto', maxHeight: '480px', overflowY: 'auto', borderRadius: '6px', border: '1px solid var(--border-hairline)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.78rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-hairline)', color: 'var(--text-muted)', background: 'var(--bg-subtle)', position: 'sticky', top: 0, zIndex: 10 }}>
              <th style={{ padding: '8px 12px' }}>ORDER ID</th>
              <th style={{ padding: '8px 12px' }}>VENDOR ID</th>
              <th style={{ padding: '8px 12px', textAlign: 'right' }}>GROSS AMOUNT</th>
              <th style={{ padding: '8px 12px', textAlign: 'right' }}>EXPECTED SHARE</th>
              <th style={{ padding: '8px 12px', textAlign: 'right' }}>ACTUAL SETTLED</th>
              <th style={{ padding: '8px 12px', textAlign: 'right' }}>NET DELTA</th>
              <th style={{ padding: '8px 12px' }}>LEDGER STATUS</th>
              <th style={{ padding: '8px 12px', textAlign: 'center' }}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRecords.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '28px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No records found matching current criteria.
                </td>
              </tr>
            ) : (
              paginatedRecords.map((rec) => {
                const isSelected = selectedOrderId === rec.order_id;
                const hasDiscrepancy = rec.net_discrepancy > 0;
                const isCopied = copiedId === rec.order_id;

                return (
                  <tr
                    key={rec.id}
                    onClick={() => onSelectRecord(rec.order_id, rec.exception_id)}
                    style={{
                      borderBottom: '1px solid var(--border-hairline)',
                      background: isSelected ? '#EFF6FF' : '#FFFFFF',
                      cursor: 'pointer',
                      transition: 'background 0.1s'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'var(--bg-subtle)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = '#FFFFFF';
                    }}
                  >
                    <td className="num-mono" style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{rec.order_id}</span>
                        <button
                          onClick={(e) => handleCopy(rec.order_id, e)}
                          title="Copy Order ID"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: isCopied ? '#047857' : 'var(--text-subtle)',
                            padding: '2px',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          {isCopied ? <Check size={11} /> : <Copy size={11} />}
                        </button>
                      </div>
                    </td>
                    <td className="num-mono" style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>
                      {rec.vendor_id}
                    </td>
                    <td className="num-mono" style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 500, color: 'var(--text-primary)' }}>
                      ₹{rec.gross_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="num-mono" style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                      ₹{rec.expected_settlement.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="num-mono" style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                      ₹{rec.actual_settlement.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="num-mono" style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: hasDiscrepancy ? '#B91C1C' : '#047857' }}>
                      {hasDiscrepancy ? `+₹${rec.net_discrepancy.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '₹0.00'}
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      {getStatusBadge(rec.status)}
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                      <button
                        className={rec.status === "MATCHED" ? "btn-secondary" : "btn-primary"}
                        style={{ padding: '3px 8px', fontSize: '0.7rem' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectRecord(rec.order_id, rec.exception_id);
                        }}
                      >
                        <Eye size={11} />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', paddingTop: '8px', borderTop: '1px solid var(--border-hairline)' }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          Page <strong className="num-mono">{currentPage}</strong> of <strong className="num-mono">{totalPages}</strong>
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            className="btn-secondary"
            style={{ padding: '4px 8px', fontSize: '0.72rem' }}
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          >
            <ChevronLeft size={13} />
            <span>Previous</span>
          </button>

          <button
            className="btn-secondary"
            style={{ padding: '4px 8px', fontSize: '0.72rem' }}
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          >
            <span>Next</span>
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

    </div>
  );
};
