# Razorpay Route • AI Finance Controller

**Settlement Controller** is an autonomous finance-control and reconciliation intelligence layer that sits above payment, transfer, payout, and refund records to detect financial exceptions, investigate their root causes with AI, propose controlled corrections, and verify that the financial state is reconciled.

**Track 04 — AI Finance Controller | Razorpay Buildathon 2026**

> 🎯 **Evaluator? Jump straight to the [5-minute demo](#5-minute-evaluator-demo).**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.111.0-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg?style=flat&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6.svg?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![Razorpay SDK](https://img.shields.io/badge/Razorpay%20SDK-v2.0.1-0B72E7.svg)](https://razorpay.com/docs/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E.svg?style=flat&logo=supabase)](https://supabase.com)
[![Pytest](https://img.shields.io/badge/Pytest-18%2F18%20Passed-success.svg)]()

---

## What is Settlement Controller?

In a multi-vendor marketplace, a single customer transaction produces events across several systems: an order is placed, Razorpay captures the payment, Route splits the funds to the vendor, the bank confirms the payout — and sometimes, days later, the customer returns the product and a refund is issued. Each individual event may look valid. The problem is that **the complete financial lifecycle can be inconsistent**: the vendor was paid ₹8,800, the customer was refunded ₹10,000, but nobody recorded a clawback against the vendor.

Settlement Controller addresses this by continuously reconciling the full lifecycle:

1. **Reconcile** — A deterministic engine joins five data sources (Orders, Payments, Route Splits, Bank Payouts, Refunds) per transaction and checks the financial state against merchant policy. This is pure arithmetic — no AI involved.
2. **Investigate** — When an exception is detected, an AI agent retrieves the relevant records using read-only tools, builds a transaction timeline, and identifies the root cause and the applicable policy clause.
3. **Resolve** — The AI proposes an exact double-entry correction. A human finance controller reviews it and decides whether to approve.
4. **Verify** — After the correction is executed, the deterministic engine re-runs reconciliation and confirms the residual discrepancy is ₹0.00.

The key design principle is this separation:

| Layer | Responsibility |
|---|---|
| **Deterministic Finance Engine** | All monetary arithmetic, expected-state calculation, policy checks, exception detection |
| **AI Investigation Agent** | Evidence gathering, timeline reconstruction, root-cause reasoning, correction proposal |
| **Human Controller** | Approval or rejection of consequential financial corrections |
| **Razorpay Integration** | Route transfers, reversals, settlement recon feed, OAuth, webhooks |
| **Verification Layer** | Re-runs reconciliation to confirm actual state matches expected state |

---

## Why This Is Track 04

Track 04 asks for an **AI Finance Controller** — a system that runs the books and the cash position. The key challenge in finance operations is that **transactions can be individually valid while the aggregate financial lifecycle is wrong**. A payment captured, a transfer executed, a payout settled — all individually correct events — can still leave the marketplace with an unrecovered loss.

Settlement Controller implements the controller model:

```
RECONCILE → INVESTIGATE → RESOLVE → VERIFY
```

The AI is used precisely where reasoning has value: correlating evidence across multiple records, identifying why a discrepancy occurred, citing the applicable policy clause, and producing an explanation a human can evaluate. The AI is explicitly excluded from the steps where deterministic correctness is required: arithmetic, expected-state calculation, and post-correction verification.

---

## The Financial Problem

> **This project uses a synthetic demo dataset with a configurable merchant settlement policy. The numbers below reflect the demo scenario, not a specific Razorpay production formula.**

In a marketplace using Razorpay Route, a typical transaction lifecycle looks like this:

```
Customer pays ₹10,000
        ↓
Razorpay captures payment (deducts MDR fee)
        ↓
Route Transfer splits funds:
  → Platform commission (10%): ₹1,000
  → Vendor share (90%): ₹9,000
        ↓
Bank IMPS payout settles ₹9,000 to vendor account (UTR confirmed)
        ↓
3 days later: customer returns item, ₹10,000 refunded
        ↓
❌ Vendor clawback debit: ₹0 — never executed
        ↓
Marketplace absorbs ₹9,000 loss silently
```

This is the class of problem Settlement Controller detects. The five detectors each target a different failure mode in this lifecycle.

Razorpay provides the financial primitives — payment capture, Route transfers, reversals, refund processing, settlement recon feeds. Settlement Controller adds the **control and verification layer** that checks whether those primitives collectively produced a correct financial outcome.

---

## Architecture

```
  Orders · Payments · Route Splits · Bank Payouts · Refunds
                            ↓
               POST /api/reconciliation/run
                            ↓
          ┌─────────────────────────────────────┐
          │      Deterministic Finance Engine    │
          │  DeterministicStateCalculator        │
          │  5 × Exception Detectors             │
          └──────────────┬──────────────────────┘
                         │ exceptions[]
                         ↓
          ┌─────────────────────────────────────┐
          │      AI Investigation Agent          │
          │  POST /api/exceptions/{id}/investigate│
          │  AgentToolRegistry (read-only tools) │
          │  GPT-4o-mini (root cause + proposal) │
          └──────────────┬──────────────────────┘
                         │ CorrectionProposal
                         ↓
          ┌─────────────────────────────────────┐
          │      Human Controller UI             │
          │  POST /api/exceptions/{id}/approve  │
          │  RBAC: FINANCE_CONTROLLER only       │
          └──────────────┬──────────────────────┘
                         │ approved
                         ↓
          ┌─────────────────────────────────────┐
          │      Correction Executor             │
          │  CorrectionExecutor                  │
          │  DoubleEntryJournalLedger            │
          │  RazorpayServiceClient               │
          │  (Route Reversals API for clawbacks) │
          └──────────────┬──────────────────────┘
                         │
                         ↓
          ┌─────────────────────────────────────┐
          │      Post-Correction Verifier        │
          │  PostCorrectionVerifier              │
          │  Re-runs reconciliation              │
          │  Confirms delta = ₹0.00              │
          └─────────────────────────────────────┘
```

**Component summary:**

- **`MultiSourceReconciler`** ([`backend/app/engine/reconciler.py`](backend/app/engine/reconciler.py)) — Joins the five data sources per order and runs all detectors. Returns a `BatchReconciliationResult` with matched records, exceptions, and throughput metrics.
- **`DeterministicStateCalculator`** ([`backend/app/engine/state_calculator.py`](backend/app/engine/state_calculator.py)) — All monetary arithmetic: expected commission, vendor share, gateway fee, GST, clawback amount, rounding tolerance check.
- **`AIInvestigator`** ([`backend/app/agent/investigator.py`](backend/app/agent/investigator.py)) — Calls `AgentToolRegistry` tools sequentially, builds context, invokes GPT-4o-mini, falls back to deterministic narrative if OpenAI is unavailable.
- **`AgentToolRegistry`** ([`backend/app/agent/tools.py`](backend/app/agent/tools.py)) — Six read-only tools the AI calls. Cannot mutate any financial record.
- **`CorrectionExecutor`** ([`backend/app/ledger/correction_executor.py`](backend/app/ledger/correction_executor.py)) — Executes approved proposals, posts double-entry journal entries, calls Razorpay reversals API for clawback types.
- **`PostCorrectionVerifier`** ([`backend/app/ledger/verifier.py`](backend/app/ledger/verifier.py)) — Re-runs the full reconciliation after correction and confirms residual delta is within tolerance.

---

## Where the AI Actually Matters

### The deterministic engine asks: *"What is financially correct?"*

- What is the expected vendor share given the merchant policy?
- What commission should have been charged?
- What is the required clawback amount given the refund?
- Is this payout orphaned (no valid captured payment)?
- Does the vendor share deviate from expected by more than the rounding tolerance?

This is pure arithmetic. It uses Python `float` with `round()` throughout and is driven by the `MerchantSettlementPolicy` model ([`backend/app/models/policy.py`](backend/app/models/policy.py)). The LLM is never called for any of these calculations.

### The AI investigator asks: *"Why did this exception happen?"*

The AI agent in [`backend/app/agent/investigator.py`](backend/app/agent/investigator.py) calls six tools from `AgentToolRegistry`:

| Tool | What it retrieves | Read-only? |
|---|---|---|
| `get_order` | Order amount, status, item category, tax class | ✅ Yes |
| `get_payment` | Payment capture status, method, UTR, gateway fee | ✅ Yes |
| `get_splits` | Route split amounts, platform commission, transfer fee | ✅ Yes |
| `get_payouts` | Bank payout amounts, UTR, settled_at timestamp | ✅ Yes |
| `get_refunds` | Refund amount, clawback status, clawback amount | ✅ Yes |
| `calculate_expected_state` + `calculate_financial_exposure` | Expected vs actual financial state from policy | ✅ Yes |

**The AI agent does not directly mutate any financial record.** It gathers evidence, reasons over it using GPT-4o-mini, and produces a `CorrectionProposal` with a specific action type, adjustment amount, and policy citation. That proposal requires human approval before anything is executed.

The system prompt ([`backend/app/agent/prompts.py`](backend/app/agent/prompts.py)) explicitly instructs the agent:
- Every finding must cite explicit record IDs
- Never invent arithmetic — use the calculator tools
- When data or policy tier is missing, return `HUMAN_REVIEW` — do not guess

### The human controller asks: *"Should I approve this correction?"*

The Finance Controller sees the full evidence package — transaction timeline, expected vs actual amounts, AI root cause, proposed double-entry journal entry — and clicks Approve. The RBAC layer enforces this: `POST /api/exceptions/{id}/approve` requires the `approve_corrections` permission. Compliance Auditors receive HTTP 403.

---

## Deterministic Finance Engine

Five independent detectors each check a specific rule. The first one to fire for an order raises an exception — the remaining detectors are skipped for that order.

### `RefundClawbackDetector`
**Source:** [`backend/app/engine/detectors/refund_clawback.py`](backend/app/engine/detectors/refund_clawback.py)

```
Input:  order, settled payouts, processed refunds
Rule:   expected_clawback > actual_clawback AND difference > tolerance
        (expected_clawback = vendor_payout × (refund_amount / order_amount))
Output: REFUND_AFTER_PAYOUT_UNRECOVERED — discrepancy = shortfall in clawback
```

Catches vendor payouts where a subsequent customer refund was not matched by a proportional clawback debit.

### `ExcessCommissionDetector`
**Source:** [`backend/app/engine/detectors/excess_commission.py`](backend/app/engine/detectors/excess_commission.py)

```
Input:  order, splits
Rule:   sum(split.platform_commission) > order.amount × policy.commission_pct + tolerance
Output: EXCESS_COMMISSION_DOUBLE_COUNT — discrepancy = overcharge amount
```

Catches duplicate or inflated commission lines in the Route split record.

### `TaxRuleMismatchDetector`
**Source:** [`backend/app/engine/detectors/tax_rule_mismatch.py`](backend/app/engine/detectors/tax_rule_mismatch.py)

```
Input:  order.tax_class, order.item_category
Rule A: tax_class == UNKNOWN_TAX_GROUP → AMBIGUOUS_POLICY_CATEGORY (→ HUMAN_REVIEW)
Rule B: tax_class == GST_28 but policy max is GST_18 → TAX_RULE_MISMATCH
Output: AMBIGUOUS_POLICY_CATEGORY (human review) or TAX_RULE_MISMATCH (auto-resolvable)
```

Also the entry point for the ambiguous-policy safety case (see below).

### `OrphanedPayoutDetector`
**Source:** [`backend/app/engine/detectors/orphaned_payout.py`](backend/app/engine/detectors/orphaned_payout.py)

```
Input:  settled payouts, payment record
Rule:   payout.status == SETTLED AND (payment is None OR payment.status == FAILED)
Output: ORPHANED_PAYOUT_RECORD — discrepancy = total orphaned payout amount
```

Catches bank IMPS/UTR disbursements that went out without a valid upstream captured payment.

### `RoundingDriftDetector`
**Source:** [`backend/app/engine/detectors/rounding_drift.py`](backend/app/engine/detectors/rounding_drift.py)

```
Input:  order, splits
Rule:   commission matches expected BUT abs(expected_vendor_share - actual_vendor_share) > policy.rounding_tolerance_inr
Output: ROUNDING_DRIFT_EXCEEDED — discrepancy = drift amount
```

Catches sub-paisa accumulation across split sub-ledgers that exceeds the configured ₹0.50 tolerance.

---

## Hero Scenario: `ord_0010`

> **Synthetic demo scenario.** This is generated data, not a real Razorpay transaction.

```
1.  Customer places order for ₹X (demo amount varies by run)
          ↓
2.  Razorpay captures payment — MDR fee deducted
          ↓
3.  Route Transfer splits funds:
      • Platform commission = order × 10% (demo policy)
      • Vendor share = remainder
          ↓
4.  Bank IMPS payout settled to vendor with UTR confirmation
          ↓
5.  Customer returns item — full refund processed
          ↓
6.  Clawback debit against vendor = ₹0 (never executed)
          ↓
7.  RefundClawbackDetector fires:
      expected_clawback = vendor_payout × (refund / order_amount)
      actual_clawback   = ₹0.00
      discrepancy       = expected_clawback − ₹0.00
          ↓
8.  AI agent calls 5 read-only tools, builds timeline,
    cites Policy Clause 4.2 (Clawback Mandatory Post-Payout),
    proposes CREATE_VENDOR_CLAWBACK_DEBIT for exact discrepancy amount
          ↓
9.  Finance Controller reviews evidence + proposal, clicks Approve
          ↓
10. CorrectionExecutor posts double-entry journal entry,
    calls RazorpayServiceClient.execute_route_reversal()
          ↓
11. PostCorrectionVerifier re-runs reconciliation
    → residual discrepancy = ₹0.00
    → status: VERIFIED_RESOLVED
```

---

## Safety Case: `ord_0013` — The AI Refuses to Guess

Three orders in the demo batch have `tax_class = UNKNOWN_TAX_GROUP` and `item_category = UNMAPPED_CUSTOM_TIER`.

When `TaxRuleMismatchDetector` encounters these:
- It cannot calculate an expected tax — the policy has no mapping for this vendor tier
- It does **not** default to any GST rate
- It raises `AMBIGUOUS_POLICY_CATEGORY` with `status = HUMAN_REVIEW`
- It records `required_human_inputs: ["vendor_tax_classification", "applicable_gst_slab"]`

When the AI investigator encounters `AMBIGUOUS_POLICY_CATEGORY`, it short-circuits immediately — no LLM call is made, no correction is proposed. The exception is flagged for human resolution with a clear explanation of what information is missing.

This is a deliberate design choice: **the system treats ambiguity as a valid outcome rather than making an assumption that could propagate a wrong financial figure.**

---

## Razorpay Integration

> Settlement Controller does not replace Razorpay's financial APIs. It is a control and reconciliation layer around financial events. When an approved correction must be executed, it uses Razorpay primitives to do so.

| Razorpay Capability | How this project uses it |
|---|---|
| **Route Transfers** `POST /v1/payments/:id/transfers` | Modelled in `RazorpayServiceClient.create_route_transfer()` — splits a payment to vendor linked accounts with `on_hold` flags |
| **Route Reversals** `POST /v1/transfers/:id/reversals` | Called by `CorrectionExecutor` on approved clawback corrections — debits the vendor account to recover unrecovered refunds |
| **Settlement Recon Combined** `GET /v1/settlements/recon/combined` | Returns gross volume, MDR fees, GST deductions, and UTRs in one feed — used to cross-reference the reconciliation batch |
| **OAuth 2.0 Partner Flow** `https://auth.razorpay.com/authorize` | Authorization code grant with `route.transfers` and `settlements.read` scopes — implemented in `RazorpayOAuthService` |
| **Webhooks + HMAC-SHA256** `POST /api/razorpay/webhooks` | Ingests `payment.captured`, `transfer.reversed`, `refund.processed` events — signature verified against `X-Razorpay-Signature` before processing |
| **Python SDK v2.0.1** `razorpay.Client(auth=(key, secret))` | Official SDK used in `RazorpayServiceClient` when the package is available |

The Razorpay API calls in this project are **simulated locally** (demo mode — no live Razorpay credentials required to run). The integration code follows the official Razorpay API schemas and can be pointed at real credentials by setting `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in `.env`.

---

## 5-Minute Evaluator Demo

**Prerequisites:** Backend running on port 8000, frontend on port 5173 (see [Quick Start](#quick-start)).

### 0:00 — Open the dashboard at `http://localhost:5173`

You should see the **Settlement Ledger** with 75 transactions pre-loaded across vendors like boAt, Noise, Mamaearth, Lenskart.

### 0:30 — Click **Reconcile** in the header

The deterministic engine processes all 75 records against 5 data sources. Results appear in ~2ms:
- **53 Matched** — all detectors passed
- **22 Exceptions** — at least one detector fired
- **100% Precision** — zero false positives (verified by ground truth evaluator)
- **48,000+ rec/sec** throughput

### 1:00 — Open **Exceptions Hub** → click `ord_0010`

This is the hero exception. You will see:
- Transaction timeline (payment → split → payout → refund)
- Expected vs actual amounts side by side
- Discrepancy amount calculated by `RefundClawbackDetector`
- Exception type: `REFUND_AFTER_PAYOUT_UNRECOVERED`

### 1:30 — Click **Run AI Investigation**

The AI agent calls its read-only tools in sequence (visible in the tool call trace), then GPT-4o-mini reasons over the assembled evidence and returns:
- Root cause explanation (citing the specific payment IDs and UTR)
- Policy citation: `POLICY_SEC_4_2_CLAWBACK_MANDATORY_POST_PAYOUT`
- Proposed action: `CREATE_VENDOR_CLAWBACK_DEBIT` for the exact discrepancy amount

### 2:30 — Review the proposed correction

The double-entry journal entry is shown:
- Debit: `Vendor_Receivable_{vendor_id}` — recovers the unrecovered clawback
- Credit: `Marketplace_Customer_Refund_Clearing`

### 3:00 — Click **Approve & Execute**

The correction is executed. `PostCorrectionVerifier` re-runs reconciliation.
- Status becomes: **VERIFIED_RESOLVED**
- Residual discrepancy: **₹0.00**

### 3:30 — Open `ord_0013`

Click **Run AI Investigation**. The AI detects `AMBIGUOUS_POLICY_CATEGORY` and immediately returns `HUMAN_REVIEW` without making any LLM call or proposing a correction. Required inputs are listed explicitly.

### 4:00 — Click **Razorpay OAuth** button in the header

The modal shows the service starts **Disconnected**. Click **Connect** to see the authorization URL generated (`https://auth.razorpay.com/authorize?client_id=...&scope=route.transfers,settlements.read`). After callback, status flips to Connected.

### 4:15 — Click **Cash & Float Health**

Live working capital position derived from the reconciliation batch:
- Unrecovered vendor clawbacks: sum of all unresolved `REFUND_AFTER_PAYOUT_UNRECOVERED` exception amounts
- Orphaned payout exposure: sum of all unresolved `ORPHANED_PAYOUT_RECORD` amounts
- Float risk index and safe T+2 disbursement float

### 4:30 — Click **Operations Copilot**

Ask: *"Why did ord_0010 fail reconciliation?"*
Then ask a follow-up: *"Which vendor has the highest exposure?"*

The conversation history is sent to the backend on every query — the model has context for follow-ups. Responses are grounded in the live reconciliation state.

### 4:50 — Switch role to **Priya Sharma (Compliance Auditor)** via the header

Attempt to approve any exception. The API returns **HTTP 403 Forbidden** — `approve_corrections` permission is required. This is enforced at the FastAPI route level, not just hidden in the UI.

### 5:00 — Run tests
```bash
python -m pytest backend/tests/ -v
```
18 tests, all passing.

---

## What This Demonstrates

| Capability | Where to see it |
|---|---|
| Multi-source financial reconciliation across 5 systems | Reconcile button → KPI cards |
| Deterministic financial correctness (no LLM for math) | `state_calculator.py`, `detectors/` |
| AI investigation with read-only evidence tools | Exceptions Hub → Run AI Investigation |
| Evidence-backed root cause with policy citation | Investigation drawer → root cause text |
| Human approval for consequential financial corrections | Approve button → RBAC enforcement |
| Razorpay Route Reversals API on correction | `correction_executor.py` → `razorpay_client.py` |
| Post-action verification proving ₹0.00 residual | Status → VERIFIED_RESOLVED |
| AI refusing to guess on ambiguous policy | `ord_0013` → HUMAN_REVIEW |
| RBAC with HTTP 403 at API level | Switch to Auditor role → attempt Approve |
| OAuth 2.0 partner flow | Razorpay button in header |
| 7-day cash liquidity forecast | Forward 7-Day Forecast tab |

---

## Evaluation

The `GroundTruthEvaluator` ([`backend/app/data/ground_truth.py`](backend/app/data/ground_truth.py)) maintains a known-answer dataset generated alongside the synthetic batch with `random.seed(42)`. It computes precision, recall, F1, and monetary accuracy after each reconciliation run.

```
python -m pytest backend/tests/ -v

18 passed in ~1s
```

Tests cover:
- All 5 detectors against isolated synthetic cases (`test_detectors.py`)
- Full reconcile → investigate → approve → verify loop (`test_verification_loop.py`)
- RBAC enforcement: controller can approve, auditor cannot (`test_rbac_security.py`)
- OAuth authorize URL generation and callback token exchange (`test_razorpay_oauth.py`)
- Razorpay Route transfer, reversal, recon, and webhook HMAC (`test_razorpay_services.py`)
- Double-entry journal persistence to database (`test_database_persistence.py`)
- `DeterministicStateCalculator` arithmetic (`test_state_calculator.py`)
- Ground truth precision/recall/F1 (`test_benchmark_metrics.py`)
- Supabase client configuration (`test_supabase_config.py`)

The ground truth dataset is **synthetic** — it is generated programmatically to validate the detector logic, not sourced from real Razorpay transactions.

---

## Safety & Financial Controls

- **RBAC** — Three roles with distinct permission sets enforced via `Depends(require_permission(...))` on every mutating FastAPI route: `FINANCE_CONTROLLER`, `COMPLIANCE_AUDITOR`, `SETTLEMENT_OPERATOR`
- **Authentication** — Opaque demo tokens mapped server-side to roles. Unknown token → HTTP 401.
- **Read-only AI tools** — `AgentToolRegistry` methods only read from in-memory state. No tool can post a journal entry or call an external API.
- **Human approval gate** — `CorrectionExecutor.execute_correction()` is only reachable through `POST /api/exceptions/{id}/approve` which requires `approve_corrections` permission
- **Idempotency** — `executed_idempotency_keys` set in `CorrectionExecutor` prevents double-execution if the approval endpoint is called twice
- **Webhook signature verification** — HMAC-SHA256 on `X-Razorpay-Signature` verified before any webhook payload is processed
- **Audit trail** — Every detection, investigation step, and correction is appended to `exception.audit_trail`
- **Post-correction verification** — The system will not mark an exception `VERIFIED_RESOLVED` unless the re-run reconciliation confirms the discrepancy is within tolerance

---

## API Reference

### Reconciliation
| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/reconciliation/current` | Active batch KPIs and metrics |
| `POST` | `/api/reconciliation/run?record_count=N` | Trigger a fresh deterministic reconciliation |
| `GET` | `/api/reconciliation/ledger` | Query double-entry settlement records |

### AI Investigation & Approval
| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/exceptions` | List exceptions with status/type filters |
| `GET` | `/api/exceptions/{id}` | Full multi-source transaction context |
| `POST` | `/api/exceptions/{id}/investigate` | Run AI investigation (read-only) |
| `POST` | `/api/exceptions/{id}/approve` | Approve correction — requires `FINANCE_CONTROLLER` |

### Razorpay Integration
| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/oauth/authorize-url` | Generate Razorpay OAuth 2.0 authorization URL |
| `POST` | `/api/oauth/callback` | Exchange authorization code for partner token |
| `GET` | `/api/oauth/status` | Connected merchant status |
| `POST` | `/api/razorpay/route/transfers` | Execute Route split transfer (demo) |
| `POST` | `/api/razorpay/route/reversals` | Execute Route reversal/clawback (demo) |
| `GET` | `/api/razorpay/recon/combined` | Fetch combined settlement recon feed (demo) |
| `POST` | `/api/razorpay/webhooks` | Ingest HMAC-SHA256 verified webhook event |

### Copilot & Liquidity
| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/copilot/query` | Natural language query with conversation history |
| `GET` | `/api/cash/position` | Live working capital and float position |
| `GET` | `/api/cash/forecast` | 7-day rolling liquidity projection |

### Authentication & Evaluation
| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/auth/login` | Login by email — returns scoped Bearer token |
| `GET` | `/api/auth/me` | Current user profile and permissions |
| `GET` | `/api/auth/demo-accounts` | List all pre-configured demo accounts |
| `GET` | `/api/benchmark/report` | Ground-truth precision/recall evaluation |
| `POST` | `/api/chaos/inject` | Inject a live anomaly into the batch |

Swagger UI: **`http://127.0.0.1:8000/docs`**

---

## Repository Structure

```
.
├── backend/
│   ├── app/
│   │   ├── engine/
│   │   │   ├── reconciler.py          ← MultiSourceReconciler (start here)
│   │   │   ├── state_calculator.py    ← All monetary arithmetic
│   │   │   └── detectors/             ← 5 independent exception detectors
│   │   ├── agent/
│   │   │   ├── investigator.py        ← AI agent orchestration
│   │   │   ├── tools.py               ← Read-only tool registry
│   │   │   └── prompts.py             ← System prompt
│   │   ├── ledger/
│   │   │   ├── correction_executor.py ← Executes approved corrections
│   │   │   ├── journal_ledger.py      ← Double-entry journal
│   │   │   └── verifier.py            ← Post-correction verifier
│   │   ├── services/
│   │   │   ├── razorpay_client.py     ← Razorpay Route/Reversal/Recon client
│   │   │   └── razorpay_oauth.py      ← OAuth 2.0 partner flow
│   │   ├── api/                       ← FastAPI route handlers
│   │   ├── core/auth.py               ← RBAC and token validation
│   │   ├── data/
│   │   │   ├── synthetic_generator.py ← Demo batch generation (seed=42)
│   │   │   └── ground_truth.py        ← Precision/recall evaluator
│   │   └── models/                    ← Pydantic domain models
│   └── tests/                         ← 18 pytest tests
├── frontend/
│   └── src/
│       ├── components/                ← React UI components
│       └── api.ts                     ← API client
├── docs/
│   ├── ARCHITECTURE.md
│   └── DEMO_SCRIPT.md
├── .env.example                       ← All required env vars documented
└── README.md
```

---

## Quick Start

### 1. Clone and configure
```bash
git clone https://github.com/chinmay56/---buildathon_Track-4.git
cd buildathon_Track-4
cp .env.example .env
# Optional: add OPENAI_API_KEY for live AI investigation
# Without it, the app uses a deterministic fallback narrative
```

### 2. Backend
```powershell
pip install -r backend/requirements.txt
python -m uvicorn backend.app.main:app --reload --port 8000
```
Swagger UI → `http://127.0.0.1:8000/docs`

### 3. Frontend
```powershell
cd frontend
npm install
npm run dev
```
Dashboard → `http://localhost:5173`

### 4. Tests
```powershell
python -m pytest backend/tests/ -v
```

The app works without any external credentials. SQLite is used by default (no Docker). Set `DATABASE_URL` in `.env` to connect to Supabase PostgreSQL in production.

---

## Demo Credentials

| Role | Email | Token | Key Permissions |
|---|---|---|---|
| Finance Controller | `arjun.mehta@nexusmarket.in` | `demo_ctrl_arjun_NexusMarket` | Reconcile, Investigate, Approve, Chaos |
| Compliance Auditor | `priya.sharma@deloitte-audit.com` | `demo_audt_priya_DeloitteAudit` | Read ledger, View audit trail only |
| Settlement Operator | `rohan.verma@nexusmarket.in` | `demo_ops_rohan_NexusMarket` | Read ledger, Investigate (cannot approve) |

Use the 1-click role switcher in the dashboard header to switch roles without re-logging in.

---

## Technical Implementation

| Component | Technology | Why |
|---|---|---|
| Backend | FastAPI 0.111 + Python 3.11 | Async routes, automatic OpenAPI, `Depends()` for RBAC |
| Frontend | React 19 + TypeScript 6 + Vite | Fast iteration, type-safe API client |
| AI model | GPT-4o-mini via `openai` SDK | Low latency, JSON-mode output, cost-efficient for tool-call style agent |
| Database | SQLite WAL (dev) / Supabase PostgreSQL (prod) | Zero-setup default, production-ready upgrade path |
| Razorpay | `razorpay` Python SDK v2.0.1 | Official SDK for Route/Reversal/Recon API calls |
| Auth | Opaque demo tokens + FastAPI `HTTPBearer` | Evaluator-friendly, no signup required |
| Tests | pytest 9.1 | 18 tests covering detectors, AI loop, RBAC, Razorpay APIs |

---

## Limitations

Be aware of the following intentional simplifications for the buildathon:

- **Synthetic data** — The 75-record batch is generated programmatically with `random.seed(42)`. It is not sourced from real marketplace transactions.
- **Demo Razorpay credentials** — All Razorpay API calls (transfers, reversals, recon) are simulated locally and do not hit live Razorpay endpoints unless you provide real credentials in `.env`.
- **In-memory state** — The reconciliation state lives in a Python singleton (`AppState`). A fresh server restart regenerates the batch. The DB layer persists records for audit purposes but the primary state is in-memory.
- **GPT-4o-mini** — The AI investigation uses `gpt-4o-mini` with `max_tokens=250`. For complex cases the narrative may be truncated. The deterministic fallback activates automatically if OpenAI is unavailable.
- **Single-exception-per-order** — The reconciler stops at the first detector that fires for each order. An order cannot have two simultaneous exception types in this implementation.
- **Demo OAuth** — The OAuth callback simulates a Razorpay token exchange response. It does not redirect to a real Razorpay authorization page.

---

## In One Sentence

Settlement Controller is an AI-powered financial control layer that reconciles fragmented payment lifecycles across five independent data sources, uses a deterministic engine to establish financial truth, deploys an AI agent to investigate exceptions and explain root causes, requires human approval for every consequential correction, and verifies that the resulting financial state is mathematically reconciled.

---

*Razorpay Buildathon 2026 — Track 04: AI Finance Controller*
