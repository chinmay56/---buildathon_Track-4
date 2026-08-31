import React, { useState, useEffect } from 'react';
import { GlobalHeader } from './components/GlobalHeader';
import { Sidebar } from './components/Sidebar';
import type { ActiveTab } from './components/Sidebar';
import { MetricsOverview } from './components/MetricsOverview';
import { CashPositionCard } from './components/CashPositionCard';
import { CashForecastView } from './components/CashForecastView';
import { SettlementQACopilot } from './components/SettlementQACopilot';
import { LedgerTable } from './components/LedgerTable';
import { ExceptionsHub } from './components/ExceptionsHub';
import { ChaosSimulatorView } from './components/ChaosSimulatorView';
import { BenchmarkView } from './components/BenchmarkView';
import { InvestigationDrawer } from './components/InvestigationDrawer';
import { ChaosInjectorModal } from './components/ChaosInjectorModal';
import { LoginModal } from './components/LoginModal';
import { RazorpayOAuthModal } from './components/RazorpayOAuthModal';
import {
  fetchCurrentUser,
  fetchDemoAccounts,
  setAuthRole,
  fetchOAuthStatus,
  fetchCurrentStatus,
  runBatchReconciliation,
  fetchLedgerRecords,
  fetchExceptions,
  fetchExceptionDetail,
  runAIInvestigation,
  approveCorrection,
  fetchCashPosition,
  fetchBenchmarkReport
} from './api';
import type { BatchStatus, SettlementRecord, SettlementException, CashPosition, BenchmarkReport, AuthUser } from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [demoAccounts, setDemoAccounts] = useState<AuthUser[]>([]);
  const [oauthStatus, setOauthStatus] = useState<{ connected: boolean; merchant_id?: string; scope?: string; connected_at?: string; client_id?: string } | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [oauthModalOpen, setOauthModalOpen] = useState<boolean>(false);

  const [batchStatus, setBatchStatus] = useState<BatchStatus | null>(null);
  const [cashPosition, setCashPosition] = useState<CashPosition | null>(null);
  const [ledgerRecords, setLedgerRecords] = useState<SettlementRecord[]>([]);
  const [exceptionsList, setExceptionsList] = useState<SettlementException[]>([]);
  const [benchmarkReport, setBenchmarkReport] = useState<BenchmarkReport | null>(null);
  
  const [selectedException, setSelectedException] = useState<SettlementException | null>(null);
  const [selectedContext, setSelectedContext] = useState<any>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | undefined>(undefined);
  
  const [loading, setLoading] = useState<boolean>(false);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [chaosModalOpen, setChaosModalOpen] = useState<boolean>(false);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [user, demos, oauth, status, cash, ledger, excs, bench] = await Promise.all([
        fetchCurrentUser(),
        fetchDemoAccounts(),
        fetchOAuthStatus(),
        fetchCurrentStatus(),
        fetchCashPosition(),
        fetchLedgerRecords("ALL", 500, 0),
        fetchExceptions("ALL", "ALL"),
        fetchBenchmarkReport()
      ]);
      setCurrentUser(user);
      setDemoAccounts(demos);
      setOauthStatus(oauth);
      setBatchStatus(status);
      setCashPosition(cash);
      setLedgerRecords(ledger.records);
      setExceptionsList(excs.exceptions);
      setBenchmarkReport(bench);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleSelectUser = async (user: AuthUser) => {
    setAuthRole(user.role, `token_${user.role.toLowerCase()}`);
    setCurrentUser(user);
    await loadAllData();
  };

  const handleRunBatch = async () => {
    setLoading(true);
    try {
      await runBatchReconciliation(500);
      await loadAllData();
    } catch (err) {
      alert("Error reconciling batch: " + err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRecord = async (orderId: string, exceptionId?: string) => {
    setSelectedOrderId(orderId);
    setLoading(true);
    try {
      const idToFetch = exceptionId || `EXC_RC_${orderId}`;
      try {
        const detail = await fetchExceptionDetail(idToFetch);
        setSelectedException(detail.exception);
        setSelectedContext(detail.context);
      } catch {
        const rec = ledgerRecords.find(r => r.order_id === orderId);
        setSelectedException(null);
        setSelectedContext({
          order: { id: rec?.order_id, amount: rec?.gross_amount, item_category: 'standard_goods', vendor_id: rec?.vendor_id },
          payment: { id: `pay_${rec?.order_id?.slice(4)}`, status: 'captured', method: 'upi' },
          payouts: [{ id: `pout_${rec?.order_id?.slice(4)}`, amount: rec?.actual_settlement, status: 'settled' }],
          refunds: []
        });
      }
      setDrawerOpen(true);
    } catch (err) {
      console.error("Error fetching record detail:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectExceptionObj = async (exc: SettlementException) => {
    await handleSelectRecord(exc.order_id, exc.id);
  };

  const handleInvestigate = async (exceptionId: string) => {
    setLoading(true);
    try {
      const res = await runAIInvestigation(exceptionId);
      setSelectedException(res.exception);
      await loadAllData();
    } catch (err) {
      alert("Investigation failed: " + err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (exceptionId: string) => {
    setLoading(true);
    try {
      const res = await approveCorrection(exceptionId, `${currentUser?.name || "Arjun Mehta"} (${currentUser?.role || "Controller"})`);
      setSelectedException(res.exception);
      await loadAllData();
    } catch (err: any) {
      alert(err.message || "Approval/verification failed: " + err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--blade-bg-app)' }}>
      
      {/* Top Global Navigation Bar */}
      <GlobalHeader
        currentUser={currentUser}
        oauthConnected={oauthStatus?.connected ?? true}
        loading={loading}
        onRefresh={loadAllData}
        onRunBatch={handleRunBatch}
        onOpenChaosModal={() => setChaosModalOpen(true)}
        onOpenAuthModal={() => setAuthModalOpen(true)}
        onOpenOAuthModal={() => setOauthModalOpen(true)}
      />

      {/* Main Layout (Sidebar + Content Canvas) */}
      <div style={{ display: 'flex', flex: 1, minWidth: 0 }}>
        
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          exceptionCount={exceptionsList.length}
          unresolvedCount={batchStatus?.unresolved_count || 0}
        />

        {/* Main Content Area */}
        <main style={{ flex: 1, padding: '20px 24px', overflowY: 'auto', minWidth: 0 }}>
          
          {/* Breadcrumb & Section Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--blade-text-muted)', marginBottom: '2px' }}>
                <span>Razorpay Route</span>
                <span>/</span>
                <span>Settlements</span>
                <span>/</span>
                <span style={{ fontWeight: 600, color: '#0B72E7' }}>
                  {activeTab === 'overview' ? '500-Batch Ledger' 
                    : activeTab === 'exceptions' ? 'Exceptions Triage' 
                    : activeTab === 'copilot' ? 'Q&A Copilot' 
                    : activeTab === 'cash' ? 'Cash & Float' 
                    : activeTab === 'forecast' ? 'Forward Forecast' 
                    : activeTab === 'chaos' ? 'Chaos Lab' 
                    : 'Benchmark Report'}
                </span>
              </div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--blade-text-primary)', letterSpacing: '-0.02em' }}>
                {activeTab === 'overview' ? 'Settlement Ledger' 
                  : activeTab === 'exceptions' ? 'Exceptions Investigation Hub' 
                  : activeTab === 'copilot' ? 'Settlement Operations Q&A Copilot'
                  : activeTab === 'cash' ? 'Cash Float & Liquidity Position' 
                  : activeTab === 'forecast' ? 'Forward 7-Day Liquidity Forecast'
                  : activeTab === 'chaos' ? 'Chaos Scenario Simulator' 
                  : 'Ground Truth Benchmark Matrix'}
              </h1>
            </div>
          </div>

          {/* Tab 1: Overview & Settlement Ledger */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <MetricsOverview status={batchStatus} />
              <LedgerTable
                records={ledgerRecords}
                onSelectRecord={handleSelectRecord}
                selectedOrderId={selectedOrderId}
              />
            </div>
          )}

          {/* Tab 2: Exceptions Hub */}
          {activeTab === 'exceptions' && (
            <ExceptionsHub
              exceptions={exceptionsList}
              onSelectException={handleSelectExceptionObj}
              onInvestigate={handleInvestigate}
              onApprove={handleApprove}
              loading={loading}
            />
          )}

          {/* Tab 3: Settlement Q&A Copilot */}
          {activeTab === 'copilot' && (
            <SettlementQACopilot
              onInspectOrder={(orderId) => handleSelectRecord(orderId)}
            />
          )}

          {/* Tab 4: Cash Position */}
          {activeTab === 'cash' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <CashPositionCard cash={cashPosition} />
              
              <div className="blade-panel" style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--blade-text-primary)', marginBottom: '10px' }}>
                  Settlement Risk & Trapped Float Analysis
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--blade-text-muted)', lineHeight: 1.5, marginBottom: '14px' }}>
                  In marketplace operations, funds released to vendors prior to customer returns represent unrecovered debit balances. The Settlement Controller ensures unrecovered clawbacks are tagged against next rolling settlement cycles, protecting your net working capital float.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ padding: '14px', background: 'var(--blade-bg-subtle)', borderRadius: '6px', border: '1px solid var(--blade-border-subtle)' }}>
                    <div style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--blade-text-primary)', marginBottom: '4px' }}>
                      Automated Vendor Clawback Buffer
                    </div>
                    <p style={{ fontSize: '0.72rem', color: 'var(--blade-text-muted)' }}>
                      Debit adjustments are automatically scheduled against future vendor split payouts.
                    </p>
                  </div>

                  <div style={{ padding: '14px', background: 'var(--blade-bg-subtle)', borderRadius: '6px', border: '1px solid var(--blade-border-subtle)' }}>
                    <div style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--blade-text-primary)', marginBottom: '4px' }}>
                      Orphaned Payout Freeze Policy
                    </div>
                    <p style={{ fontSize: '0.72rem', color: 'var(--blade-text-muted)' }}>
                      Bank UTR transfers without captured payment events are frozen pending reconciliation audit.
                    </p>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Tab 5: Forward 7-Day Forecast */}
          {activeTab === 'forecast' && (
            <CashForecastView />
          )}

          {/* Tab 6: Chaos Simulator View */}
          {activeTab === 'chaos' && (
            <ChaosSimulatorView
              onScenarioInjected={async (newExc) => {
                await loadAllData();
                if (newExc) {
                  handleSelectRecord(newExc.order_id, newExc.id);
                }
              }}
              loading={loading}
            />
          )}

          {/* Tab 7: Ground Truth Benchmark View */}
          {activeTab === 'benchmark' && (
            <BenchmarkView
              report={benchmarkReport}
              loading={loading}
            />
          )}

        </main>

      </div>

      {/* Investigation Drawer Modal */}
      {drawerOpen && (
        <InvestigationDrawer
          exception={selectedException}
          context={selectedContext}
          loading={loading}
          onClose={() => setDrawerOpen(false)}
          onInvestigate={handleInvestigate}
          onApprove={handleApprove}
        />
      )}

      {/* Chaos Injector Quick Modal */}
      {chaosModalOpen && (
        <ChaosInjectorModal
          onClose={() => setChaosModalOpen(false)}
          onSuccess={async (newExc) => {
            await loadAllData();
            if (newExc) {
              handleSelectRecord(newExc.order_id, newExc.id);
            }
          }}
        />
      )}

      {/* RBAC Identity & Login Switcher Modal */}
      {authModalOpen && (
        <LoginModal
          currentUser={currentUser}
          demoAccounts={demoAccounts}
          onClose={() => setAuthModalOpen(false)}
          onSelectUser={handleSelectUser}
        />
      )}

      {/* Razorpay OAuth 2.0 Partner Modal */}
      {oauthModalOpen && (
        <RazorpayOAuthModal
          oauthStatus={oauthStatus}
          onClose={() => setOauthModalOpen(false)}
          onRefresh={loadAllData}
        />
      )}

    </div>
  );
};

export default App;
