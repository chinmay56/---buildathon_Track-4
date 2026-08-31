export interface AuthUser {
  user_id: string;
  name: string;
  email: string;
  role: string; // FINANCE_CONTROLLER, COMPLIANCE_AUDITOR, SETTLEMENT_OPERATOR
  merchant_id: string;
  permissions: string[];
}

export interface BatchStatus {
  batch_id: string;
  total_records: number;
  matched_records: number;
  exception_count: number;
  resolved_count: number;
  unresolved_count: number;
  human_review_count: number;
  total_exposure_inr: number;
  match_rate_pct: number;
  processing_time_ms: number;
  throughput_records_per_sec: number;
  last_reconciled_at: string;
}

export interface SettlementRecord {
  id: string;
  order_id: string;
  vendor_id: string;
  gross_amount: number;
  expected_settlement: number;
  actual_settlement: number;
  net_discrepancy: number;
  status: string;
  exception_id?: string;
}

export interface SettlementException {
  id: string;
  order_id: string;
  vendor_id: string;
  exception_type: string;
  discrepancy_amount: number;
  status: string;
  detector_name: string;
  created_at: string;
  investigated_at?: string;
  root_cause?: string;
  financial_breakdown?: {
    expected_amount: number;
    actual_amount: number;
    discrepancy_amount: number;
  };
  evidence?: {
    order_id?: string;
    payment_id?: string;
    payout_id?: string;
    refund_id?: string;
    policy_rule_cited?: string;
    details?: Record<string, any>;
  };
  proposed_correction?: {
    action: string;
    amount: number;
    target_entity: string;
    target_id: string;
    reason: string;
    journal_entry: Record<string, any>;
  };
  human_review_reason?: string;
  required_human_inputs: string[];
  audit_trail: Array<Record<string, any>>;
}

export interface CashPosition {
  total_gmv_inr: number;
  unrecovered_vendor_clawbacks_inr: number;
  orphaned_payout_exposure_inr: number;
  safe_settlement_disbursement_float_inr: number;
  float_risk_index_pct: number;
}

export interface DailyForecastItem {
  date: string;
  day_label: string;
  projected_inflow_inr: number;
  scheduled_vendor_payouts_inr: number;
  clawback_recovery_inr: number;
  net_disbursement_inr: number;
  safe_working_capital_float_inr: number;
  status: string;
}

export interface ForwardCashForecastReport {
  generated_at: string;
  current_cash_pool_inr: number;
  total_7day_projected_inflow_inr: number;
  total_7day_scheduled_disbursements_inr: number;
  total_7day_clawback_recovery_inr: number;
  net_7day_float_buffer_inr: number;
  minimum_float_headroom_inr: number;
  liquidity_health_status: string;
  daily_projections: DailyForecastItem[];
}

export interface BenchmarkReport {
  dataset_version: string;
  metrics: {
    total_records: number;
    ground_truth_exceptions: number;
    detected_exceptions: number;
    precision_pct: number;
    recall_pct: number;
    f1_score_pct: number;
    monetary_accuracy_pct: number;
    throughput_records_per_sec: number;
  };
  confusion_matrix: {
    true_positives: number;
    false_positives: number;
    true_negatives: number;
    false_negatives: number;
  };
  by_exception_type: Array<{
    exception_type: string;
    ground_truth_count: number;
    detected_count: number;
    precision_pct: number;
    recall_pct: number;
    monetary_error_delta: number;
  }>;
}

export interface CopilotQueryResponse {
  reply: string;
  context_data?: Record<string, any>;
  suggested_actions: string[];
  cited_policy_clauses: string[];
}
