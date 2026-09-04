import type { 
  AuthUser,
  BatchStatus, 
  SettlementRecord, 
  SettlementException, 
  CashPosition, 
  ForwardCashForecastReport,
  BenchmarkReport,
  CopilotQueryResponse 
} from './types';

// Read the backend base URL from the Vite environment.
// Set VITE_API_BASE_URL in frontend/.env (e.g. http://127.0.0.1:8000/api).
// Falls back to localhost for local development if the variable is not set.
const API_BASE: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ??
  "http://127.0.0.1:8000/api";

// Token is populated after login — no default that reveals the auth scheme.
let currentToken: string = "";
let currentRole: string = "FINANCE_CONTROLLER";

export function setAuthRole(role: string, token: string = "") {
  currentRole = role;
  currentToken = token;
}

function getHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-User-Role': currentRole,
  };
  // Only attach Authorization header when we actually have a token.
  if (currentToken) {
    headers['Authorization'] = `Bearer ${currentToken}`;
  }
  return headers;
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  const res = await fetch(`${API_BASE}/auth/me`, { headers: getHeaders() });
  if (!res.ok) throw new Error("Failed to fetch user");
  return res.json();
}

export async function fetchDemoAccounts(): Promise<AuthUser[]> {
  const res = await fetch(`${API_BASE}/auth/demo-accounts`);
  if (!res.ok) throw new Error("Failed to fetch demo accounts");
  return res.json();
}

export async function loginUser(email: string): Promise<{ access_token: string; user: AuthUser }> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  if (!res.ok) throw new Error("Failed to login");
  const data = await res.json();
  setAuthRole(data.user.role, data.access_token);
  return data;
}

export async function fetchOAuthStatus(): Promise<{ connected: boolean; merchant_id?: string; scope?: string; connected_at?: string; client_id?: string }> {
  const res = await fetch(`${API_BASE}/oauth/status`, { headers: getHeaders() });
  if (!res.ok) throw new Error("Failed to fetch OAuth status");
  return res.json();
}

export async function authorizeOAuthDemo(code: string = "code_nexus99_authorized"): Promise<any> {
  const res = await fetch(`${API_BASE}/oauth/callback`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ code })
  });
  if (!res.ok) throw new Error("Failed to authorize Razorpay OAuth");
  return res.json();
}

export async function disconnectOAuth(): Promise<any> {
  const res = await fetch(`${API_BASE}/oauth/disconnect`, {
    method: 'POST',
    headers: getHeaders()
  });
  if (!res.ok) throw new Error("Failed to disconnect OAuth");
  return res.json();
}

export async function fetchCurrentStatus(): Promise<BatchStatus> {
  const res = await fetch(`${API_BASE}/reconciliation/current`, { headers: getHeaders() });
  if (!res.ok) throw new Error("Failed to fetch status");
  return res.json();
}

export async function runBatchReconciliation(count: number = 75): Promise<{ status: string; batch_id: string; total_records: number; matched_records: number; exception_count: number; processing_time_ms: number; throughput_records_per_sec: number }> {
  const res = await fetch(`${API_BASE}/reconciliation/run?record_count=${count}`, {
    method: 'POST',
    headers: getHeaders()
  });
  if (!res.ok) throw new Error("Failed to run batch reconciliation");
  return res.json();
}

export async function fetchLedgerRecords(statusFilter: string = "ALL", limit: number = 100, skip: number = 0): Promise<{ total: number; records: SettlementRecord[] }> {
  const queryParam = statusFilter && statusFilter !== "ALL" ? `&status=${statusFilter}` : "";
  const res = await fetch(`${API_BASE}/reconciliation/ledger?limit=${limit}&offset=${skip}${queryParam}`, { headers: getHeaders() });
  if (!res.ok) throw new Error("Failed to fetch ledger records");
  const data = await res.json();
  return {
    total: data.total || (data.records ? data.records.length : 0),
    records: data.records || []
  };
}

export async function fetchExceptions(statusFilter: string = "ALL", typeFilter: string = "ALL"): Promise<{ total: number; exceptions: SettlementException[] }> {
  const sParam = statusFilter && statusFilter !== "ALL" ? `&status=${statusFilter}` : "";
  const tParam = typeFilter && typeFilter !== "ALL" ? `&exception_type=${typeFilter}` : "";
  const res = await fetch(`${API_BASE}/exceptions?${sParam}${tParam}`, { headers: getHeaders() });
  if (!res.ok) throw new Error("Failed to fetch exceptions");
  const data = await res.json();
  return {
    total: data.count || (data.exceptions ? data.exceptions.length : 0),
    exceptions: data.exceptions || []
  };
}

export async function fetchExceptionDetail(exceptionId: string): Promise<{ exception: SettlementException; context: any }> {
  const res = await fetch(`${API_BASE}/exceptions/${exceptionId}`, { headers: getHeaders() });
  if (!res.ok) throw new Error("Failed to fetch exception detail");
  return res.json();
}

export async function runAIInvestigation(exceptionId: string): Promise<{ status: string; exception: SettlementException }> {
  const res = await fetch(`${API_BASE}/exceptions/${exceptionId}/investigate`, {
    method: 'POST',
    headers: getHeaders()
  });
  if (!res.ok) throw new Error("Failed to run AI investigation");
  return res.json();
}

export async function approveCorrection(exceptionId: string, reviewerId?: string): Promise<{ status: string; exception: SettlementException; message?: string }> {
  const res = await fetch(`${API_BASE}/exceptions/${exceptionId}/approve`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ approved_by: reviewerId })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to approve correction");
  }
  return res.json();
}

export async function fetchCashPosition(): Promise<CashPosition> {
  const res = await fetch(`${API_BASE}/cash/position`, { headers: getHeaders() });
  if (!res.ok) throw new Error("Failed to fetch cash position");
  return res.json();
}

export async function fetchCashForecast(): Promise<ForwardCashForecastReport> {
  const res = await fetch(`${API_BASE}/cash/forecast`, { headers: getHeaders() });
  if (!res.ok) throw new Error("Failed to fetch cash forecast");
  return res.json();
}

export async function fetchBenchmarkReport(): Promise<BenchmarkReport> {
  const res = await fetch(`${API_BASE}/benchmark/report`, { headers: getHeaders() });
  if (!res.ok) throw new Error("Failed to fetch benchmark report");
  return res.json();
}

export async function injectChaosScenario(scenario: string, amount: number, vendorId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/chaos/inject`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      scenario_type: scenario,
      order_amount: amount,
      target_vendor_id: vendorId
    })
  });
  if (!res.ok) throw new Error("Failed to inject chaos scenario");
  return res.json();
}

export async function queryCopilot(
  message: string,
  orderId?: string,
  vendorId?: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }> = []
): Promise<CopilotQueryResponse> {
  const res = await fetch(`${API_BASE}/copilot/query`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      message,
      order_id: orderId,
      vendor_id: vendorId,
      history
    })
  });
  if (!res.ok) throw new Error("Failed to query settlement copilot");
  return res.json();
}
