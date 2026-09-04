# ⚡ Razorpay Route • AI Finance Controller

> **Razorpay Buildathon 2026 — Track 04: AI Finance Controller**
> *"Run the books and the cash position. Verification capacity, not generation speed, is the bottleneck."*

[![FastAPI](https://img.shields.io/badge/FastAPI-0.111.0-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![Razorpay SDK](https://img.shields.io/badge/Razorpay%20SDK-v2.0.1-0B72E7.svg?style=flat&logo=razorpay)](https://razorpay.com/docs/)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg?style=flat&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6.svg?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E.svg?style=flat&logo=supabase)](https://supabase.com)
[![Throughput](https://img.shields.io/badge/Throughput-48%2C000%2B%20rec%2Fsec-blue.svg)]()
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
│                 RECONCILE ➔ INVESTIGATE ➔ RESOLVE ➔ VERIFY                  │
└─────────────────────────────────────────────────────────────────────────────┘
  1. RECONCILE (Deterministic Engine):
     Cross-references 75 records across 5 disparate sources in <2ms.
     Flags discrepancies using strict mathematical balance equations.
     Throughput: 48,000+ records/sec.

  2. INVESTIGATE (Scoped ReAct AI Agent):
     Autonomously invokes 5 read-only diagnostic tools to trace the transaction
     timeline, pinpoint the exact root cause, and cite contract policy clauses.

  3. RESOLVE (Consequential Human-in-the-Loop):
     Generates an idempotent double-entry journal proposal. Upon human controller
     sign-off, executes the Razorpay Route Reversals API to recover trapped capital.

  4. VERIFY (Closed-Loop Mathematical Proof):
     Re-runs full multi-source reconciliation after correction to prove the net
     financial discrepancy collapses to ₹0.00 (VERIFIED_RESOLVED).
```

---

## ⚠️ The Problem: Marketplace Settlement & Clawback Dilemma

In modern multi-vendor marketplaces (Swiggy, Flipkart, Amazon India), funds flow across 5 independent systems:

1. **Orders Database** — Customer basket volume and tax categories
2. **Razorpay Payment Gateway** — Customer payment capture, MDR fees, and GST
3. **Razorpay Route Splits** — Automated transfers to vendor linked accounts
4. **Bank IMPS/NEFT Payouts** — Bank UTR disbursements
5. **Customer Returns & Refunds** — Late refunds initiated post-settlement

### The Breakdown Point:
- A customer purchases **₹10,000 boAt headphones**
- Marketplace takes **10% commission (₹1,000)**, Razorpay takes **2% MDR (₹200)**, **₹8,800 disbursed to boAt**
- **3 days later, the customer returns the item** — marketplace refunds ₹10,000
- **The vendor was already paid ₹8,800** — unless an automated clawback debit note is scheduled, the marketplace absorbs an **₹8,800 cash loss**
- Traditional finance teams spend **8 hours daily** manually reconciling Excel dumps across these 5 sources

---

## 🚀 Our Solution & Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        RAZORPAY ROUTE SETTLEMENT CONTROLLER                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  [ Orders DB ]  [ Razorpay PG ]  [ Route Splits ]  [ Bank UTRs ]  [ Refunds ]  │
│       │               │                │                │              │        │
│       └───────────────┼────────────────┼────────────────┼──────────────┘        │
│                       ▼                                                         │
│      ┌──────────────────────────────────────────────────┐                       │
│      │   Deterministic Multi-Source Engine (Decimal)    │ ➔ 48,000+ rec/sec     │
│      │   • 5 Independent Exception Detectors            │ ➔ <2ms over 75 tx    │
│      └────────────────────────┬─────────────────────────┘                       │
│                               │ Discrepancies Found                             │
│                               ▼                                                 │
│      ┌──────────────────────────────────────────────────┐                       │
│      │   Scoped ReAct AI Investigator (GPT-4o-mini)     │                       │
│      │   • 5 Read-Only Diagnostic Tool Calls            │                       │
│      │   • Contract Policy Citation                     │                       │
│      │   • Refuses to guess on Ambiguous Cases → HR     │                       │
│      └────────────────────────┬─────────────────────────┘                       │
│                               │ Idempotent Proposal                             │
│                               ▼                                                 │
│      ┌──────────────────────────────────────────────────┐                       │
│      │   Human Controller Review & Approval             │                       │
│      │   • RBAC Guard: FINANCE_CONTROLLER Role          │                       │
│      │   • 403 Forbidden for COMPLIANCE_AUDITOR         │                       │
│      └────────────────────────┬─────────────────────────┘                       │
│                               │ Approved                                        │
│                               ▼                                                 │
│      ┌──────────────────────────────────────────────────┐                       │
│      │   Razorpay Route Reversals API Execution         │                       │
│      │   • POST /v1/transfers/:id/reversals             │                       │
│      │   • Immutable Double-Entry Journal Posting       │                       │
│      └────────────────────────┬─────────────────────────┘                       │
│                               │ Trigger Post-Fix Audit                          │
│                               ▼                                                 │
│      ┌──────────────────────────────────────────────────┐                       │
│      │   Closed-Loop Mathematical Verifier              │                       │
│      │   • Re-runs 5 Detectors on Updated Ledger        │                       │
│      │   • Proves Residual Delta = ₹0.00                │                       │
│      └──────────────────────────────────────────────────┘                       │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🏛️ System Architecture & Layer Breakdown

### Strict Responsibility Separation

| Layer | Responsibility | What It Cannot Do |
|---|---|---|
| **Deterministic Engine** | All monetary arithmetic, fee calculations, GST, tolerance checks, exception detection | Cannot call LLM for any calculation |
| **AI Agent (GPT-4o-mini)** | Root cause narrative, policy citation, correction proposal text | Cannot mutate money records directly |
| **Human Approver** | Final sign-off on consequential ledger adjustments | Cannot be bypassed — RBAC enforced at API level |

### 5 Independent Deterministic Detectors

| Detector | Rule | What It Catches |
|---|---|---|
| `RefundClawbackDetector` | `refund.timestamp > payout.settled_at AND clawback == 0` | Vendor paid before customer return; clawback never executed |
| `ExcessCommissionDetector` | `actual_commission > policy_rate × amount + tolerance` | Duplicate commission entries, overcharges |
| `TaxRuleMismatchDetector` | `recorded_gst_rate != policy.tax_rules[order.tax_class]` | Wrong GST slab applied (28% luxury vs 18% standard) |
| `OrphanedPayoutDetector` | `payout.status == SETTLED AND payment.status == FAILED` | Bank UTR sent but gateway payment never captured |
| `RoundingDriftDetector` | `abs(expected - actual) > policy.rounding_tolerance` | Fractional paisa drift across sub-ledgers |

---

## ⚡ Official Razorpay Services Integration

| Service | Endpoint | Usage |
|---|---|---|
| **Route Transfers** | `POST /v1/payments/:id/transfers` | Split payments to vendor linked accounts with `on_hold` flags |
| **Route Reversals** | `POST /v1/transfers/:id/reversals` | Clawback recovery — debits vendor linked account, collapses delta to ₹0.00 |
| **Settlement Recon Combined** | `GET /v1/settlements/recon/combined` | Cross-reference gross volume, MDR fees, GST, bank UTRs |
| **OAuth 2.0 Partner Flow** | `https://auth.razorpay.com/authorize` | Authorization code grant, scopes: `route.transfers`, `settlements.read` |
| **Cryptographic Webhooks** | `POST /api/razorpay/webhooks` | `payment.captured`, `transfer.reversed`, `refund.processed` — HMAC-SHA256 verified |
| **razorpay Python SDK v2.0.1** | `razorpay.Client(auth=(key, secret))` | Official SDK integration |

---

## 🌟 Hero Scenario & Ambiguous Safeguard

### Hero Exception (`ord_0010`) — Refund After Payout
- Order placed, payment captured via Razorpay
- Route Transfer splits funds: platform commission deducted, vendor receives their share
- Bank IMPS payout settled to vendor with UTR confirmation
- **Customer returns item** — full refund processed to customer
- **Clawback debit never executed against vendor** → trapped capital

**AI Diagnosis:** Cites Policy Clause 4.2 (Clawback Mandatory Post-Payout), proposes exact reversal amount, human approves, ledger verifies to **₹0.00 delta**.

### Human Review Safeguard (`ord_0013`) — Ambiguous Policy
- Vendor has an unmapped contractual tier — GST classification unknown
- AI **refuses to assume** a tax rate
- Tagged `HUMAN_REVIEW` with `required_human_inputs: ["vendor_commission_tier", "item_tax_classification"]`
- No hallucination. No silent wrong calculation.

---

## 🤖 Settlement Q&A Copilot & 7-Day Liquidity Forecaster

### Settlement Operations Q&A Copilot
- Full **conversation history** maintained — follow-up questions have context
- Grounded in live reconciliation data — not hallucinated responses
- Renders proper markdown: headers, bold figures, bullet lists, inline code
- Example queries:
  - *"Why did ord_0010 fail reconciliation?"*
  - *"Which vendor has the highest clawback exposure?"*
  - *"What is our safe T+2 disbursement float?"*

### Forward 7-Day Cash Liquidity Forecaster
- Models T+2 rolling settlement obligations from live batch data
- Shows scheduled vendor clawback recovery amortised across 5 days
- Categorises each day: `SAFE`, `TIGHT_FLOAT`, `ACTION_REQUIRED`
- All numbers derived from the live reconciliation engine — not static mocks

---

## 🛡️ Fintech RBAC Security & Dual-Mode Database

### Role-Based Access Control

| Role | User | Permissions |
|---|---|---|
| `FINANCE_CONTROLLER` | Arjun Mehta | `read_ledger`, `investigate_ai`, `approve_corrections`, `run_reconciliation`, `inject_chaos` |
| `COMPLIANCE_AUDITOR` | Priya Sharma | `read_ledger`, `view_audit_trail`, `view_benchmarks`, `view_cash_position` |
| `SETTLEMENT_OPERATOR` | Rohan Verma | `read_ledger`, `investigate_ai` |

- RBAC enforced at **FastAPI dependency injection level** — not just hidden UI buttons
- Unknown tokens → HTTP 401. Permission violation → HTTP 403.
- 1-click role switcher in header for judge evaluation

### Dual-Mode Database
- **Default (zero-setup):** SQLite WAL mode — clone and run, no Docker needed
- **Production:** Supabase PostgreSQL — set `DATABASE_URL` in `.env`
- 7 relational tables: `orders`, `payments`, `splits`, `payouts`, `refunds`, `settlement_exceptions`, `ledger_journal_entries`

---

## ⏱️ 5-Minute Live Judge Demo Runbook

| Time | Screen | What to Show |
|---|---|---|
| **0:00–0:30** | Settlement Ledger | 75-record multi-vendor batch loaded. Click **Reconcile**. |
| **0:30–1:00** | KPI Overview | 53 matched, 22 exceptions, **48,000+ rec/sec**, total exposure. |
| **1:00–2:30** | Hero Exception | Open `ord_0010`. Show transaction timeline, expected vs actual amounts. |
| **2:30–3:30** | AI Investigate | Run investigation — show tool calls, policy citation, proposed action. Click **Approve**. Show status → `VERIFIED_RESOLVED ₹0.00`. |
| **3:30–4:00** | Human Review | Open `ord_0013`. Show AI refusing to guess on ambiguous vendor tier. |
| **4:00–4:30** | Cash & Copilot | Show live clawback exposure, float risk %. Ask copilot a follow-up question. |
| **4:30–5:00** | Tests & Benchmark | Show `18/18 pytest passing`. |

---

## 📊 Automated Benchmark Matrix & Verification

```
============================= test session starts =============================
platform win32 -- Python 3.11.9, pytest-9.1.1, pluggy-1.6.0
collected 18 items

backend/tests/test_benchmark_metrics.py::test_ground_truth_and_benchmark_report PASSED
backend/tests/test_database_persistence.py::test_database_tables_exist PASSED
backend/tests/test_database_persistence.py::test_double_entry_journal_persistence PASSED
backend/tests/test_detectors.py::test_refund_clawback_detector PASSED
backend/tests/test_detectors.py::test_excess_commission_detector PASSED
backend/tests/test_razorpay_oauth.py::test_razorpay_oauth_authorize_url_generation PASSED
backend/tests/test_razorpay_oauth.py::test_razorpay_oauth_callback_and_connection_status PASSED
backend/tests/test_razorpay_services.py::test_razorpay_route_transfer_reversal_api PASSED
backend/tests/test_razorpay_services.py::test_razorpay_combined_settlement_recon_api PASSED
backend/tests/test_razorpay_services.py::test_razorpay_webhook_hmac_signature_verification PASSED
backend/tests/test_rbac_security.py::test_controller_can_approve_correction PASSED
backend/tests/test_rbac_security.py::test_auditor_cannot_approve_correction PASSED
backend/tests/test_rbac_security.py::test_auth_me_returns_active_permissions PASSED
backend/tests/test_state_calculator.py::test_commission_and_vendor_share_calculation PASSED
backend/tests/test_state_calculator.py::test_tax_rules_calculation PASSED
backend/tests/test_state_calculator.py::test_proportional_clawback_calculation PASSED
backend/tests/test_supabase_config.py::test_supabase_client_is_configured PASSED
backend/tests/test_verification_loop.py::test_full_reconciliation_investigation_and_verification_loop PASSED

======================== 18 passed in 0.88s ==============================
```

---

## 📡 API Specification & Swagger Endpoints

Interactive Swagger UI: **`http://127.0.0.1:8000/docs`**

```
Authentication & RBAC
  POST  /api/auth/login                       Login — returns scoped Bearer token
  GET   /api/auth/me                          Current user profile & permissions
  GET   /api/auth/demo-accounts               Pre-configured judge evaluation accounts

Razorpay OAuth 2.0 & Services
  GET   /api/oauth/authorize-url              Generate Razorpay OAuth 2.0 URL
  POST  /api/oauth/callback                   Exchange auth code for partner token
  GET   /api/oauth/status                     Connected merchant status
  POST  /api/oauth/disconnect                 Revoke OAuth connection
  POST  /api/razorpay/route/transfers         Execute Route split transfer
  POST  /api/razorpay/route/reversals         Execute Route transfer reversal (clawback)
  GET   /api/razorpay/recon/combined          Fetch Combined Settlement Recon feed
  POST  /api/razorpay/webhooks                HMAC-SHA256 verified webhook ingestion

Reconciliation & Ledger
  GET   /api/reconciliation/current           Active batch metrics & KPIs
  POST  /api/reconciliation/run               Trigger deterministic reconciliation
  GET   /api/reconciliation/ledger            Query double-entry settlement records

AI Investigation & Actions
  GET   /api/exceptions                       List exceptions with filters
  GET   /api/exceptions/{id}                  Full multi-source transaction context
  POST  /api/exceptions/{id}/investigate      Trigger ReAct AI investigation
  POST  /api/exceptions/{id}/approve          Approve correction + run verification

Copilot & Cash Forecasting
  POST  /api/copilot/query                    Natural language query (with history)
  GET   /api/cash/position                    Live working capital & float position
  GET   /api/cash/forecast                    7-day liquidity projection

Benchmark & Chaos
  GET   /api/benchmark/report                 Ground-truth precision/recall matrix
  POST  /api/chaos/inject                     Inject live anomaly scenario
```

---

## 🛠️ Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Clone & configure
```bash
git clone https://github.com/chinmay56/---buildathon_Track-4.git
cd buildathon_Track-4
cp .env.example .env
# Fill in your OPENAI_API_KEY in .env (optional — app works without it using deterministic fallback)
```

### 2. Backend
```powershell
pip install -r backend/requirements.txt
python -m uvicorn backend.app.main:app --reload --port 8000
```
Swagger UI → http://127.0.0.1:8000/docs

### 3. Frontend
```powershell
cd frontend
npm install
npm run dev
```
Dashboard → http://localhost:5173

### 4. Tests
```powershell
cd ..
python -m pytest backend/tests/ -v
```

### Demo Accounts (no signup needed)

| Role | Email | Token |
|---|---|---|
| Finance Controller | arjun.mehta@nexusmarket.in | `demo_ctrl_arjun_NexusMarket` |
| Compliance Auditor | priya.sharma@deloitte-audit.com | `demo_audt_priya_DeloitteAudit` |
| Settlement Operator | rohan.verma@nexusmarket.in | `demo_ops_rohan_NexusMarket` |

---

*Built with precision for Razorpay Buildathon 2026 • Track 04 — AI Finance Controller*
