import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import type { ActiveTab } from './components/Sidebar';
import { GlobalHeader } from './components/GlobalHeader';
import { MetricsOverview } from './components/MetricsOverview';
import { LedgerTable } from './components/LedgerTable';
import { ExceptionsHub } from './components/ExceptionsHub';
import { CashPositionCard } from './components/CashPositionCard';
import { CashForecastView } from './components/CashForecastView';
import { ChaosSimulatorView } from './components/ChaosSimulatorView';
import { SettlementQACopilot } from './components/SettlementQACopilot';
import { InvestigationDrawer } from './components/InvestigationDrawer';
import { ChaosInjectorModal } from './components/ChaosInjectorModal';
import {
  fetchCurrentUser,
  fetchDemoAccounts,
  fetchCurrentStatus,
  fetchCashPosition,
  fetchLedgerRecords,
  fetchExceptions,
  fetchExceptionDetail,
  runAIInvestigation,
  approveCorrection,
  runBatchReconciliation,
  setAuthRole
} from './api';
import type { 
  AuthUser, BatchStatus, CashPosition, 
  SettlementRecord, SettlementException 
} from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [demoAccounts, setDemoAccounts] = useState<AuthUser[]>([]);
  const [batchStatus, setBatchStatus] = useState<BatchStatus | null>(null);
  const [cashPosition, setCashPosition] = useState<CashPosition | null>(null);
  const [ledgerRecords, setLedgerRecords] = useState<SettlementRecord[]>([]);
  const [exceptionsList, setExceptionsList] = useState<SettlementException[]>([]);
  
  const [selectedException, setSelectedException] = useState<SettlementException | null>(null);
  const [selectedContext, setSelectedContext] = useState<any>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | undefined>(undefined);
  
  const [loading, setLoading] = useState<boolean>(false);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [chaosModalOpen, setChaosModalOpen] = useState<boolean>(false);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        fetchCurrentUser(),
        fetchDemoAccounts(),
        fetchCurrentStatus(),
        fetchCashPosition(),
        fetchLedgerRecords("ALL", 100, 0),
        fetchExceptions("ALL", "ALL")
      ]);

      if (results[0].status === 'fulfilled') setCurrentUser(results[0].value);
      if (results[1].status === 'fulfilled') setDemoAccounts(results[1].value);
      if (results[2].status === 'fulfilled') setBatchStatus(results[2].value);
      if (results[3].status === 'fulfilled') setCashPosition(results[3].value);
      if (results[4].status === 'fulfilled') setLedgerRecords(results[4].value.records || []);
      if (results[5].status === 'fulfilled') setExceptionsList(results[5].value.exceptions || []);
    } catch (err) {
      console.error("Error in loadAllData:", err);
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
      await runBatchReconciliation(75);
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
      const res = await fetchExceptionDetail(idToFetch);
      setSelectedException(res.exception);
      setSelectedContext(res.context);
      setDrawerOpen(true);
    } catch (err) {
      try {
        const directId = exceptionId || orderId;
        const res = await fetchExceptionDetail(directId);
        setSelectedException(res.exception);
        setSelectedContext(res.context);
        setDrawerOpen(true);
      } catch (innerErr) {
        console.warn("Could not load deep exception context:", innerErr);
        setSelectedException(null);
        setSelectedContext(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectExceptionObj = async (exc: SettlementException) => {
    setSelectedException(exc);
    setSelectedOrderId(exc.order_id);
    setLoading(true);
    try {
      const res = await fetchExceptionDetail(exc.id);
      setSelectedException(res.exception);
      setSelectedContext(res.context);
      setDrawerOpen(true);
    } catch (err) {
      console.warn("Using inline exception object:", err);
      setSelectedContext(null);
      setDrawerOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleInvestigate = async (exceptionId: string) => {
    setLoading(true);
    try {
      const res = await runAIInvestigation(exceptionId);
      setSelectedException(res.exception);
      await loadAllData();
    } catch (err: any) {
      alert("AI Investigation Note: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (exceptionId: string) => {
    setLoading(true);
    try {
      const res = await approveCorrection(exceptionId);
      setSelectedException(res.exception);
      await loadAllData();
    } catch (err: any) {
      alert("RBAC Authorization Notice: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const unresolvedCount = exceptionsList.filter(
    e => e.status !== "VERIFIED_RESOLVED"
  ).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--blade-bg-app)' }}>
      
      {/* Global Top Navbar */}
      <GlobalHeader
        currentUser={currentUser}
        demoAccounts={demoAccounts}
        loading={loading}
        onRunBatch={handleRunBatch}
        onSelectUser={handleSelectUser}
      />

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        
        {/* Left Vertical Navigation */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => setActiveTab(tab)}
          exceptionCount={unresolvedCount}
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
                  {activeTab === 'overview' ? '75-Batch Ledger' 
                    : activeTab === 'exceptions' ? 'Exceptions Triage' 
                    : activeTab === 'copilot' ? 'Q&A Copilot' 
                    : activeTab === 'cash' ? 'Cash & Float' 
                    : activeTab === 'forecast' ? 'Forward Forecast' 
                    : 'Chaos Lab'}
                </span>
              </div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--blade-text-primary)', letterSpacing: '-0.02em' }}>
                {activeTab === 'overview' ? 'Settlement Ledger' 
                  : activeTab === 'exceptions' ? 'Exceptions Investigation Hub' 
                  : activeTab === 'copilot' ? 'Settlement Operations Q&A Copilot'
                  : activeTab === 'cash' ? 'Cash Float & Liquidity Position' 
                  : activeTab === 'forecast' ? 'Forward 7-Day Liquidity Forecast'
                  : 'Chaos Scenario Simulator'}
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
            <CashPositionCard cash={cashPosition} />
          )}

          {/* Tab 5: Forward 7-Day Forecast */}
          {activeTab === 'forecast' && (
            <CashForecastView />
          )}

          {/* Tab 6: Chaos Simulator View */}
          {activeTab === 'chaos' && (
            <ChaosSimulatorView
              onScenarioInjected={async (newExc: any) => {
                await loadAllData();
                if (newExc) {
                  handleSelectRecord(newExc.order_id, newExc.id);
                }
              }}
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

      {/* Chaos Injector Modal */}
      {chaosModalOpen && (
        <ChaosInjectorModal
          onClose={() => setChaosModalOpen(false)}
          onSuccess={async (newExc: any) => {
            await loadAllData();
            if (newExc) {
              handleSelectRecord(newExc.order_id, newExc.id);
            }
          }}
        />
      )}

    </div>
  );
};

export default App;
