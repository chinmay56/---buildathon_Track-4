# ⚡ Razorpay Route • AI Finance Controller

> **Razorpay Buildathon 2026 — Track 04: AI Finance Controller**  
> *"Run the books and the cash position. The 2026 builder consensus: verification capacity, not generation speed, is the bottleneck."*

[![FastAPI](https://img.shields.io/badge/FastAPI-0.111.0-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![Razorpay SDK](https://img.shields.io/badge/Razorpay%20SDK-v2.0.1-0B72E7.svg?style=flat&logo=razorpay)](https://razorpay.com/docs/)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg?style=flat&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6.svg?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E.svg?style=flat&logo=supabase)](https://supabase.com)
[![Reconciliation Precision](https://img.shields.io/badge/Precision-100.0%25-brightgreen.svg)]()
[![Throughput](https://img.shields.io/badge/Throughput-34%2C000%2B%20rec%2Fsec-blue.svg)]()
[![Pytest](https://img.shields.io/badge/Pytest-18%2F18%20Passed-success.svg)]()

---

## 📑 Table of Contents
1. [Executive Summary & Core Loop](#-executive-summary--core-loop)
2. [The Problem: Marketplace Settlement & Clawback Dilemma](#-the-problem-marketplace-settlement--clawback-dilemma)
3. [Our Solution & Architecture](#-our-solution--architecture)
4. [System Architecture & Layer Breakdown](#-system-architecture--layer-breakdown)
5. [Official Razorpay Services Integration](#-official-razorpay-services-integration)
6. [Hero Scenario & Ambiguous Safeguard](#-hero-scenario--ambiguous-safeguard)
7. [Settlement Q&A Copilot & 7-Day Liquidity Forecaster](#-settlement-qa-copilot--7-day-liquidity-forecaster)
8. [Fintech RBAC Security & Dual-Mode Database](#-fintech-rbac-security--dual-mode-database)
9. [5-Minute Live Judge Demo Runbook](#-5-minute-live-judge-demo-runbook)
10. [Automated Benchmark Matrix & Verification](#-automated-benchmark-matrix--verification)
11. [API Specification & Swagger Endpoints](#-api-specification--swagger-endpoints)
12. [Quick Start & Local Execution](#-quick-start--local-execution)

---

## 🎯 Executive Summary & Core Loop

Settlement Controller is **not a replacement for Razorpay's refund or payment APIs**. Razorpay provides the world's most robust payment, transfer, refund, reversal, and settlement infrastructure.

Our product is the **autonomous finance-control and reconciliation intelligence layer** that verifies whether those financial events collectively produced the correct ledger state across complex multi-party flows.

### The Core Operating Loop:
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 RECONCILE ➔ INVESTIGATE ➔ RESOLVE ➔ VERIFY                   │
└─────────────────────────────────────────────────────────────────────────────┘
  1. RECONCILE (Deterministic Engine):
     Cross-references 500+ records across 5 disparate sources in <15ms.
     Flags discrepancies using strict mathematical balance equations.

  2. INVESTIGATE (Scoped ReAct AI Agent):
     Autonomously invokes 10 read-only diagnostic tools to trace the transaction
     timeline, pinpoint the exact root cause, and cite contract policies.

  3. RESOLVE (Consequential Human-in-the-Loop):
     Generates an idempotent double-entry journal proposal. Upon human controller
     sign-off, invokes the Razorpay Route Reversals API to recover trapped capital.

  4. VERIFY (Closed-Loop Mathematical Proof):
     Re-runs full multi-source reconciliation after correction to prove the net
     financial discrepancy collapses to ₹0.00 (VERIFIED_RESOLVED).
```

---

## ⚠️ The Problem: Marketplace Settlement & Clawback Dilemma

In modern multi-vendor marketplaces (e.g., Swiggy, Flipkart, Amazon India), funds flow across 5 independent systems:
1. **Orders Database**: Customer basket volume and tax categories.
2. **Razorpay Payment Gateway**: Customer payment capture, MDR fees, and GST.
3. **Razorpay Route Splits**: Automated transfers to vendor linked accounts.
4. **Bank IMPS/NEFT Payouts**: Bank UTR disbursements.
5. **Customer Returns & Refunds**: Late refunds initiated post-settlement.

### The Breakdown Point:
* A customer purchases **₹10,000 boAt headphones**.
* The marketplace takes **10% commission (₹1,000)**, Razorpay takes **2% MDR (₹200)**, and **₹8,500 is disbursed to boAt**.
* **3 days later, the customer returns the item**. The marketplace refunds ₹10,000 to the customer.
* **The vendor was already paid ₹8,500**. Unless an automated debit clawback note is scheduled against the vendor's next settlement cycle, the marketplace absorbs a **₹8,500 cash loss**.
* In traditional finance teams, **human analysts spend 8 hours daily manually comparing Excel dumps**.

---

## 🚀 Our Solution & Architecture

Our platform provides an enterprise **AI Finance Controller** that automates reconciliation, anomaly diagnosis, and recovery execution while strictly separating mathematical verification from LLM reasoning.

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│                          RAZORPAY ROUTE SETTLEMENT CONTROLLER                     │
├───────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│  [ Orders DB ]   [ Razorpay PG ]   [ Route Splits ]   [ Bank UTRs ]   [ Refunds ] │
│        │                │                 │                 │              │      │
│        └────────────────┼─────────────────┼─────────────────┼──────────────┘      │
│                         ▼                                                         │
│        ┌──────────────────────────────────────────────────┐                       │
│        │    Deterministic Multi-Source Engine (Decimal)    │ ➔ 34,000+ rec/sec     │
│        │    • 5 Independent Exception Detectors           │ ➔ <15ms over 500 tx  │
│        └────────────────────────┬─────────────────────────┘                       │
│                                 │ Discrepancies Found                             │
│                                 ▼                                                 │
│        ┌──────────────────────────────────────────────────┐                       │
│        │    Scoped ReAct AI Investigator                  │                       │
│        │    • 10 Read-Only Diagnostic Tools               │                       │
│        │    • Contract Policy Citation (Clause 4.2)       │                       │
│        │    • Refuses to guess on Ambiguous Cases (HR)    │                       │
│        └────────────────────────┬─────────────────────────┘                       │
│                                 │ Idempotent Proposal                             │
│                                 ▼                                                 │
│        ┌──────────────────────────────────────────────────┐                       │
│        │    Human Controller Review & Approval            │                       │
│        │    • RBAC Guard: FINANCE_CONTROLLER Role         │                       │
│        └────────────────────────┬─────────────────────────┘                       │
│                                 │ Approved                                        │
│                                 ▼                                                 │
│        ┌──────────────────────────────────────────────────┐                       │
│        │    Razorpay Route Reversals API Execution        │                       │
│        │    • POST /v1/transfers/:id/reversals            │                       │
│        │    • Immutable Double-Entry Journal Posting      │                       │
│        └────────────────────────┬─────────────────────────┘                       │
│                                 │ Trigger Post-Fix Audit                          │
│                                 ▼                                                 │
│        ┌──────────────────────────────────────────────────┐                       │
│        │    Closed-Loop Mathematical Verifier             │                       │
│        │    • Re-runs 5 Detectors on Updated Ledger       │                       │
│        │    • Proves Residual Delta = ₹0.00               │                       │
│        └──────────────────────────────────────────────────┘                       │
└───────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🏛️ System Architecture & Layer Breakdown

### 1. Strict Responsibility Separation
* **Deterministic Finance Engine**: Authoritative source for monetary arithmetic, Decimal fee calculations, GST taxes, tolerance checks, and exception detection. **The LLM is NEVER used for mathematical arithmetic.**
* **AI Agent**: Responsible for autonomous multi-source record retrieval, constructing transaction timelines, citing contract policy clauses, and formulating correction proposals. **The AI cannot directly mutate money records.**
* **Human Approver**: Responsible for approving consequential ledger adjustments and resolving ambiguous policy exceptions.

### 2. 5 Independent Deterministic Detectors
1. **`RefundClawbackDetector`**: Detects late customer returns where vendor payout occurred but debit clawback was not initiated or under-reversed.
2. **`ExcessCommissionDetector`**: Detects duplicate platform commissions exceeding agreed contract rates.
3. **`TaxRuleMismatchDetector`**: Detects GST rate variances (18% standard vs 5% essentials vs 0% exempt).
4. **`OrphanedPayoutDetector`**: Detects bank IMPS transfer records with missing or uncaptured gateway payment intents.
5. **`RoundingToleranceDetector`**: Detects multi-party fractional rounding drift exceeding configured ₹0.05 tolerance.

---

## ⚡ Official Razorpay Services Integration

| Razorpay Service / API | Official Endpoint | How We Use It in the Architecture |
| :--- | :--- | :--- |
| **Razorpay Route Transfers** | `POST /v1/payments/:id/transfers` | Splits customer marketplace payments into vendor linked accounts with `account_id`, `amount_in_paise`, and `on_hold` settlement schedule flags. |
| **Razorpay Route Reversals** | `POST /v1/transfers/:id/reversals` | Autonomous clawback recovery: debits the vendor's linked account when customer returns goods post-payout, collapsing discrepancy to **₹0.00**. |
| **Settlement Recon Combined** | `GET /v1/settlements/recon/combined` | Official Razorpay reconciliation feed cross-referencing gross volume, gateway processing fees, GST deductions, and bank transfer UTRs. |
| **Razorpay OAuth 2.0 Partner Flow** | `https://auth.razorpay.com/authorize` | Official partner onboarding grant exchanging authorization code for live partner tokens with `route.transfers` and `settlements.read` scopes. |
| **Cryptographic Webhooks** | `POST /api/razorpay/webhooks` | Real-time event ingestion (`payment.captured`, `transfer.reversed`, `refund.processed`) verified with **HMAC-SHA256** signatures (`X-Razorpay-Signature`). |
| **Official `razorpay` Python SDK** | `razorpay.Client(auth=(key, secret))` | Native API client integration (v2.0.1). |

---

## 🌟 Hero Scenario & Ambiguous Safeguard

### 1. Primary Hero Scenario (`ord_0010`)
* **Customer Payment**: ₹10,000 (`pay_0010`)
* **Configured Policy**: 10% Platform Commission, 2% Razorpay MDR Fee, 88% Vendor Share (₹8,500 net)
* **Lifecycle**:
  1. Customer Payment captured: ₹10,000
  2. Route Transfer created to `boAt Lifestyle Audio`: ₹8,500
  3. Bank IMPS Payout settled: ₹8,500 (`UTR_LIVE_HDFC_0010`)
  4. Customer return/refund processed: ₹10,000
  5. Actual vendor reversal recorded: ₹8,000 (Discrepancy: ₹500)
* **AI Diagnosis**: Cites *Policy Clause 4.2 (Clawback Offset on Returns)*, proposes ₹500 reversal debit against next payout cycle, human approves, and ledger verifies to **₹0.00 delta**.

### 2. Human Review & Policy Safeguard (`ord_0013`)
* **Rule**: When vendor item category or contractual tax tier is missing, the AI **refuses to guess**.
* **Result**: Tagged as `HUMAN REVIEW` with explicit reason: *"Vendor contractual tier is missing from policy mapping"* and list of `required_human_inputs: ["Vendor Category", "GSTIN Classification"]`.

---

## 🤖 Settlement Q&A Copilot & 7-Day Liquidity Forecaster

### 1. Settlement Operations Q&A Copilot
An interactive natural-language operations copilot embedded directly in the finance workspace:
* Ask: *"Why did `ord_0010` fail reconciliation?"* ➔ Delivers structured order breakdown, timeline, and cited policy clauses.
* Ask: *"What is our total trapped clawback exposure?"* ➔ Analyzes unrecovered debit balances across BoAt, Noise, and Mamaearth.
* Features 1-click action buttons: **Approve & Execute Correction**, **Inspect Ledger Row**, **View Route Split DAG**.

### 2. Forward 7-Day Cash Liquidity Forecaster
* Models rolling T+2 marketplace settlement obligations, safe disbursement float buffers, and scheduled vendor clawback recovery offsets.
* Categorizes daily projection health (`SAFE`, `TIGHT_FLOAT`, `ACTION_REQUIRED`) to protect net working capital.

---

## 🛡️ Fintech RBAC Security & Dual-Mode Database

### 1. Role-Based Access Control (RBAC)
* **`FINANCE_CONTROLLER`** (*Arjun Mehta*): Full permissions (`read_ledger`, `investigate_ai`, `approve_corrections`, `run_reconciliation`, `inject_chaos`). Authorized to execute double-entry ledger adjustments.
* **`COMPLIANCE_AUDITOR`** (*Priya Sharma*): Read-only audit access (`view_audit_trail`, `view_benchmarks`, `view_cash_position`). Blocked with `403 Forbidden` if attempting to post journal entries.
* **`SETTLEMENT_OPERATOR`** (*Rohan Verma*): Triage & ReAct investigation only.
* **1-Click Role Switcher**: Interactive modal in header allows judges to test permission enforcement with 1 click.

### 2. Dual-Mode Database Layer
* **Default (Zero-Setup)**: High-performance SQLite in WAL mode (`settlement_ledger.db`). Judges can clone and run without installing local PostgreSQL or Docker.
* **Production Cloud Ready**: Automatically connects to **Supabase PostgreSQL** when `DATABASE_URL` / `SUPABASE_URL` is set in `.env`.
* **7 Relational Tables**: `orders`, `payments`, `splits`, `payouts`, `refunds`, `settlement_exceptions`, `ledger_journal_entries`.

---

## ⏱️ 5-Minute Live Judge Demo Runbook

| Timestamp | Workspace Screen | What to Show & Say |
| :--- | :--- | :--- |
| **0:00 - 0:30** | **500-Batch Ledger** | *"Payment success does not guarantee settlement correctness. Here are 500 live multi-vendor marketplace transactions across boAt, Noise, and Mamaearth."* Click **"Reconcile 500"** (runs in 15ms). |
| **0:30 - 1:15** | **KPI Overview** | Point out **471 Matched**, **19 Exceptions**, **100% Precision**, **34,000+ rec/sec Throughput**, and **Total Financial Exposure**. |
| **1:15 - 2:45** | **Hero Exception (`ord_0010`)** | Open `ord_0010`. Show the **Transaction Timeline** and **Expected (₹8,500) vs Actual (₹8,000)** side-by-side. |
| **2:45 - 3:45** | **AI Trace & Verification** | Run AI Investigation. Show the tool execution trace (`get_order`, `get_splits`, `get_refunds`), policy citation, and click **"Approve & Execute"** to demonstrate **₹500 → ₹0.00 Verified Closure**. |
| **3:45 - 4:15** | **Human Review Safeguard (`ord_0013`)** | Open `ord_0013`. Explain why the AI refuses to guess when contract data is ambiguous. |
| **4:15 - 5:00** | **Q&A Copilot & Forecaster** | Ask Copilot a natural language query, show the 7-day cash forecast, and show the **18/18 passing Pytest suite**. |

---

## 📊 Automated Benchmark Matrix & Verification

```
============================= test session starts =============================
platform win32 -- Python 3.11.9, pytest-9.1.1, pluggy-1.6.0
collected 18 items

backend/tests/test_benchmark_metrics.py::test_ground_truth_and_benchmark_report PASSED [  5%]
backend/tests/test_database_persistence.py::test_database_tables_exist PASSED [ 11%]
backend/tests/test_database_persistence.py::test_double_entry_journal_persistence PASSED [ 16%]
backend/tests/test_detectors.py::test_refund_clawback_detector PASSED    [ 22%]
backend/tests/test_detectors.py::test_excess_commission_detector PASSED  [ 27%]
backend/tests/test_razorpay_oauth.py::test_razorpay_oauth_authorize_url_generation PASSED [ 33%]
backend/tests/test_razorpay_oauth.py::test_razorpay_oauth_callback_and_connection_status PASSED [ 38%]
backend/tests/test_razorpay_services.py::test_razorpay_route_transfer_reversal_api PASSED [ 44%]
backend/tests/test_razorpay_services.py::test_razorpay_combined_settlement_recon_api PASSED [ 50%]
backend/tests/test_razorpay_services.py::test_razorpay_webhook_hmac_signature_verification PASSED [ 55%]
backend/tests/test_rbac_security.py::test_controller_can_approve_correction PASSED [ 61%]
backend/tests/test_rbac_security.py::test_auditor_cannot_approve_correction PASSED [ 66%]
backend/tests/test_rbac_security.py::test_auth_me_returns_active_permissions PASSED [ 72%]
backend/tests/test_state_calculator.py::test_commission_and_vendor_share_calculation PASSED [ 77%]
backend/tests/test_state_calculator.py::test_tax_rules_calculation PASSED [ 83%]
backend/tests/test_state_calculator.py::test_proportional_clawback_calculation PASSED [ 88%]
backend/tests/test_supabase_config.py::test_supabase_client_is_configured PASSED [ 94%]
backend/tests/test_verification_loop.py::test_full_reconciliation_investigation_and_verification_loop PASSED [100%]

============================= 18 passed in 0.88s ==============================
```

| Metric | Target / Benchmark | Measured Score | Status |
| :--- | :--- | :--- | :--- |
| **Reconciliation Precision** | $\ge 95.0\%$ | **100.0%** | 🟢 PASSED |
| **Reconciliation Recall** | $\ge 95.0\%$ | **100.0%** | 🟢 PASSED |
| **F1 Score** | $\ge 0.95$ | **1.000** | 🟢 PASSED |
| **Monetary Accuracy** | $100.0\%$ | **100.0%** | 🟢 PASSED |
| **Processing Throughput** | $\ge 1,000\text{ rec/s}$ | **34,246 rec/sec** | 🟢 PASSED |
| **Post-Correction Delta** | ₹0.00 | **₹0.00 (Zero Residual)** | 🟢 PASSED |

---

## 📡 API Specification & Swagger Endpoints

Interactive Swagger Documentation available at **`http://127.0.0.1:8000/docs`**:

```
Authentication & RBAC:
  POST  /api/auth/login                       - Login with role credentials
  GET   /api/auth/me                          - Get current user profile & permissions
  GET   /api/auth/demo-accounts               - List pre-configured 1-click evaluation roles

Razorpay OAuth 2.0 & Services:
  GET   /api/oauth/authorize-url              - Generate official Razorpay OAuth URL
  POST  /api/oauth/callback                   - Exchange authorization code for tokens
  GET   /api/oauth/status                     - Get connected merchant status
  POST  /api/oauth/disconnect                 - Disconnect partner OAuth connection
  POST  /api/razorpay/route/transfers         - Execute Razorpay Route split transfer
  POST  /api/razorpay/route/reversals         - Execute Razorpay Route transfer reversal
  GET   /api/razorpay/recon/combined          - Fetch Combined Settlement Recon feed
  POST  /api/razorpay/webhooks                - Ingest HMAC-SHA256 verified webhooks

Reconciliation & Ledger:
  GET   /api/reconciliation/current           - Fetch active 500-record batch metrics
  POST  /api/reconciliation/run?record_count= - Trigger deterministic reconciliation batch
  GET   /api/reconciliation/ledger            - Query double-entry settlement records

AI Investigation & Actions:
  GET   /api/exceptions                       - Filter exceptions by category/status
  GET   /api/exceptions/{id}                  - Fetch multi-source transaction context
  POST  /api/exceptions/{id}/investigate      - Trigger ReAct AI tool investigation
  POST  /api/exceptions/{id}/approve          - Approve correction & execute verification

Copilot & Cash Forecasting:
  POST  /api/copilot/query                    - Natural language settlement Q&A query
  GET   /api/cash/position                    - Fetch safe disbursement float position
  GET   /api/cash/forecast                    - Generate 7-day liquidity projection report

Benchmark & Chaos:
  GET   /api/benchmark/report                 - Evaluate ground-truth matrix
  POST  /api/chaos/inject                     - Inject real-time anomaly scenario
```

---

## 🛠️ Quick Start & Local Execution

### 1. Prerequisites
* Python 3.10+
* Node.js 18+ and npm

### 2. Backend Setup
```powershell
# Navigate to project root
cd "c:\Users\chinm\Documents\razorpay"

# Install dependencies
pip install -r backend/requirements.txt

# Run FastAPI backend server
python -m uvicorn backend.app.main:app --reload --port 8000
```
*API Swagger Documentation: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)*

### 3. Frontend Setup
```powershell
# In a new terminal tab, navigate to frontend directory
cd "c:\Users\chinm\Documents\razorpay\frontend"

# Install dependencies
npm install

# Start Vite React dashboard
npm run dev
```
*Dashboard User Interface: [http://localhost:5173](http://localhost:5173)*

### 4. Run Automated Test Suite
```powershell
cd "c:\Users\chinm\Documents\razorpay"
python -m pytest backend/tests/ -v
```

---

### 🏆 Built with precision for Razorpay Buildathon 2026 • Track 04
