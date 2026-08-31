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
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const pageSize = 20;

  const matchedCount = records.filter(r => r.status === "MATCHED").length;
  const exceptionCount = records.filter(r => r.status !== "MATCHED" && r.status !== "VERIFIED_RESOLVED").length;
  const reviewCount = records.filter(r => r.status === "HUMAN_REVIEW").length;
  const verifiedCount = records.filter(r => r.status === "VERIFIED_RESOLVED").length;

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

  return (
    <div className="blade-panel" style={{ padding: '18px 20px', background: '#FFFFFF' }}>
      
      {/* Table Top Header & Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--blade-text-primary)', fontFamily: 'var(--font-heading)' }}>
            Settlement Ledger Records
          </h2>
          <p style={{ fontSize: '0.74rem', color: 'var(--blade-text-muted)', marginTop: '2px' }}>
            Showing <span className="num-mono" style={{ fontWeight: 600, color: 'var(--blade-text-primary)' }}>{filteredRecords.length}</span> of <span className="num-mono">{records.length}</span> transactions
          </p>
        </div>

        {/* Filter Segmented Buttons & Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          
          {/* Segmented Control Pills */}
          <div style={{
            display: 'flex',
            background: 'var(--blade-bg-subtle)',
            padding: '3px',
            borderRadius: '8px',
            border: '1px solid var(--blade-border-medium)',
            gap: '2px',
          }}>
            {[
              { id: "ALL", label: "All", count: records.length },
              { id: "MATCHED", label: "Matched", count: matchedCount },
              { id: "EXCEPTIONS_ONLY", label: "Exceptions", count: exceptionCount },
              { id: "HUMAN_REVIEW", label: "Review", count: reviewCount },
              { id: "VERIFIED_RESOLVED", label: "Verified", count: verifiedCount },
            ].map((tab) => {
              const isSelected = filterStatus === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setFilterStatus(tab.id);
                    setCurrentPage(1);
                  }}
                  style={{
                    background: isSelected ? '#FFFFFF' : 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '0.74rem',
                    fontFamily: 'var(--font-heading)',
                    fontWeight: isSelected ? 700 : 500,
                    color: isSelected ? '#0B72E7' : 'var(--blade-text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    boxShadow: isSelected ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                    transition: 'all 0.12s ease',
                  }}
                >
                  <span>{tab.label}</span>
                  <span style={{
                    fontSize: '0.64rem',
                    fontWeight: 700,
                    padding: '1px 5px',
                    borderRadius: '10px',
                    background: isSelected ? '#EFF6FF' : 'var(--blade-border-medium)',
                    color: isSelected ? '#0B72E7' : 'var(--blade-text-muted)',
                  }}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={14} color="var(--blade-text-muted)" style={{ position: 'absolute', left: '10px' }} />
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
                border: '1px solid var(--blade-border-medium)',
                borderRadius: '8px',
                padding: '6px 12px 6px 30px',
                color: 'var(--blade-text-primary)',
                fontSize: '0.78rem',
                outline: 'none',
                width: '200px',
                transition: 'border-color 0.15s ease',
              }}
              onFocus={(e) => e.target.style.borderColor = '#0B72E7'}
              onBlur={(e) => e.target.style.borderColor = 'var(--blade-border-medium)'}
            />
          </div>

        </div>
      </div>

      {/* Main Table */}
      <div style={{ overflowX: 'auto', border: '1px solid var(--blade-border-medium)', borderRadius: '8px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid var(--blade-border-medium)' }}>
              <th style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--blade-text-muted)', textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '0.05em' }}>Order ID</th>
              <th style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--blade-text-muted)', textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '0.05em' }}>Vendor Entity</th>
              <th style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--blade-text-muted)', textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '0.05em', textAlign: 'right' }}>Gross GMV</th>
              <th style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--blade-text-muted)', textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '0.05em', textAlign: 'right' }}>Expected Share</th>
              <th style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--blade-text-muted)', textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '0.05em', textAlign: 'right' }}>Actual Payout</th>
              <th style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--blade-text-muted)', textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '0.05em', textAlign: 'right' }}>Net Delta</th>
              <th style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--blade-text-muted)', textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '0.05em' }}>Status</th>
              <th style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--blade-text-muted)', textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '0.05em', textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRecords.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '36px', textAlign: 'center', color: 'var(--blade-text-muted)' }}>
                  No matching transaction records found.
                </td>
              </tr>
            ) : (
              paginatedRecords.map((rec) => {
                const isSelected = selectedOrderId === rec.order_id;
                const hasDiscrepancy = Math.abs(rec.net_discrepancy) > 0.01;

                return (
                  <tr
                    key={rec.id}
                    onClick={() => onSelectRecord(rec.order_id, rec.exception_id || undefined)}
                    style={{
                      borderBottom: '1px solid #F1F5F9',
                      background: isSelected ? '#EFF6FF' : hasDiscrepancy ? '#FEFCFC' : '#FFFFFF',
                      cursor: 'pointer',
                      transition: 'background-color 0.12s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = '#F8FAFC';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = hasDiscrepancy ? '#FEFCFC' : '#FFFFFF';
                    }}
                  >
                    {/* Order ID with Click-to-Copy */}
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <span className="num-mono" style={{ fontWeight: 600, color: '#0B72E7' }}>
                          {rec.order_id}
                        </span>
                        <button
                          onClick={(e) => handleCopy(rec.order_id, e)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '2px',
                            color: 'var(--blade-text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                          title="Copy Order ID"
                        >
                          {copiedId === rec.order_id ? <Check size={11} color="#059669" /> : <Copy size={11} />}
                        </button>
                      </div>
                    </td>

                    {/* Vendor Entity */}
                    <td style={{ padding: '10px 14px', color: 'var(--blade-text-secondary)', fontWeight: 500 }}>
                      <span className="num-mono" style={{ fontSize: '0.74rem' }}>{rec.vendor_id}</span>
                    </td>

                    {/* Gross GMV */}
                    <td className="num-mono" style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, color: 'var(--blade-text-primary)' }}>
                      ₹{rec.gross_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    {/* Expected Share */}
                    <td className="num-mono" style={{ padding: '10px 14px', textAlign: 'right', color: 'var(--blade-text-secondary)' }}>
                      ₹{rec.expected_settlement.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    {/* Actual Payout */}
                    <td className="num-mono" style={{ padding: '10px 14px', textAlign: 'right', color: 'var(--blade-text-secondary)' }}>
                      ₹{rec.actual_settlement.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    {/* Net Delta */}
                    <td className="num-mono" style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700 }}>
                      {hasDiscrepancy ? (
                        <span style={{ color: '#DC2626' }}>
                          ₹{rec.net_discrepancy.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      ) : (
                        <span style={{ color: '#059669' }}>₹0.00</span>
                      )}
                    </td>

                    {/* Status */}
                    <td style={{ padding: '10px 14px' }}>
                      {getStatusBadge(rec.status)}
                    </td>

                    {/* Action Button */}
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                      <button
                        className="btn-secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectRecord(rec.order_id, rec.exception_id || undefined);
                        }}
                        style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                      >
                        <Eye size={12} />
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '14px', flexWrap: 'wrap', gap: '10px' }}>
        <span style={{ fontSize: '0.74rem', color: 'var(--blade-text-muted)' }}>
          Page <span className="num-mono" style={{ fontWeight: 600, color: 'var(--blade-text-primary)' }}>{currentPage}</span> of <span className="num-mono">{totalPages}</span> ({filteredRecords.length} records)
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            className="btn-secondary"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            style={{ padding: '4px 8px', opacity: currentPage === 1 ? 0.5 : 1 }}
          >
            <ChevronLeft size={13} />
            <span>Prev</span>
          </button>

          <button
            className="btn-secondary"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            style={{ padding: '4px 8px', opacity: currentPage === totalPages ? 0.5 : 1 }}
          >
            <span>Next</span>
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

    </div>
  );
};
