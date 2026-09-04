# System Architecture — Razorpay Route Settlement Controller

**Track 04 — AI Finance Controller**
**Razorpay Buildathon 2026**

---

## 1. Core Architectural Principle

> **"The LLM investigates. Deterministic code establishes financial truth."**

The system enforces a strict three-layer separation:

| Layer | What it does | What it cannot do |
|---|---|---|
| **Deterministic Engine** | All monetary arithmetic — fees, GST, commissions, tolerance checks, exception detection | Call LLM for any calculation |
| **AI Agent (GPT-4o-mini)** | Root cause narrative, policy citation, correction proposal text | Mutate money records directly |
| **Human Approver** | Final sign-off on consequential ledger adjustments | Be bypassed — RBAC enforced at API level |

---

## 2. System Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                     React 19 + TypeScript Frontend               │
│  Settlement Ledger · Exceptions Hub · Copilot · Cash · Forecast  │
└──────────────────────────────┬───────────────────────────────────┘
                               │ REST / JSON
┌──────────────────────────────▼───────────────────────────────────┐
│                    FastAPI 0.111 Backend                         │
│         RBAC · Auth · Routes · Reconciler · Agent · Ledger       │
└──────┬────────────────┬──────────────────┬────────────────┬──────┘
       │                │                  │                │
       ▼                ▼                  ▼                ▼
┌────────────┐  ┌───────────────┐  ┌────────────┐  ┌────────────────┐
│Deterministic│  │ ReAct AI      │  │ Double-Entry│  │ Razorpay APIs  │
│ Reconciler  │  │ Investigator  │  │  Journal    │  │ Route/Reversals│
│ 5 Detectors │  │ GPT-4o-mini   │  │  Ledger     │  │ Recon / OAuth  │
└──────┬──────┘  └───────┬───────┘  └─────┬──────┘  └────────────────┘
       │                 │                │
       └─────────────────▼────────────────┘
                         │
              ┌──────────▼──────────┐
              │  SQLite WAL (dev)   │
              │  Supabase PG (prod) │
              │  7 relational tables│
              └─────────────────────┘
```

---

## 3. The 5-Source Reconciliation Join

For every order, the engine joins across 5 independent data sources in O(1) via pre-built index maps:

```
Order ──────────────────────────────────────────────────┐
Payment (gateway capture, MDR fee, GST, UTR) ───────────┤
Splits  (vendor share, platform commission, Route fee) ─┼──► 5 Detectors
Payouts (bank IMPS UTR, settled_at timestamp) ──────────┤
Refunds (clawback_required, clawback_status) ───────────┘
```

Each order hits all 5 detectors sequentially. First detector to fire wins — exception is recorded and reconciler moves to next order.

---

## 4. The 5 Deterministic Detectors

### `RefundClawbackDetector`
```
TRIGGER: refund.status == PROCESSED
         AND payout.status == SETTLED
         AND refund.clawback_amount < expected_vendor_share
EXPOSURE: discrepancy = expected_vendor_share - refund.clawback_amount
```
Catches: customer returned goods after vendor was already paid via IMPS. Marketplace would absorb the loss without a clawback debit.

### `ExcessCommissionDetector`
```
TRIGGER: split.platform_commission > (order.amount × policy.commission_pct) + tolerance
EXPOSURE: discrepancy = actual_commission - expected_commission
```
Catches: duplicate commission lines, promotional rate misconfiguration, split-level overcharge.

### `TaxRuleMismatchDetector`
```
TRIGGER: recorded_gst_rate != policy.tax_rules[order.tax_class]
EXPOSURE: discrepancy = abs(actual_tax - expected_tax)
```
Catches: wrong GST slab applied — e.g. 28% luxury rate on standard goods (18%), or taxing exempt goods.

### `OrphanedPayoutDetector`
```
TRIGGER: payout.status == SETTLED
         AND (payment is None OR payment.status == FAILED)
EXPOSURE: discrepancy = payout.amount
```
Catches: bank IMPS UTR executed but upstream Razorpay gateway payment never captured — disbursement without valid collection.

### `RoundingDriftDetector`
```
TRIGGER: abs(expected_vendor_share - split.vendor_amount) > policy.rounding_tolerance
EXPOSURE: discrepancy = abs(expected - actual)
```
Catches: fractional paisa accumulation across split sub-ledgers exceeding the ₹0.50 configured tolerance.

---

## 5. The Closed Finance-Ops Loop

```
RECONCILE ──► INVESTIGATE ──► PROPOSE ──► APPROVE ──► VERIFY
    │               │              │           │           │
  <2ms          GPT-4o-mini    Idempotent   RBAC       Re-run
  75 records    5 tool calls    journal    enforced    detectors
  48k rec/s     policy cite     entry      HTTP 403    delta=₹0.00
```

### Step-by-step

**1. RECONCILE** — `MultiSourceReconciler.reconcile_batch()`
- Builds O(1) index maps for payments, splits, payouts, refunds
- Runs 5 detectors on each order
- Returns `BatchReconciliationResult` with exceptions list + settlement records

**2. INVESTIGATE** — `AIInvestigator.investigate()`
- Calls 5 read-only `AgentToolRegistry` methods
- Sends multi-source context to GPT-4o-mini with system prompt enforcing JSON output
- Falls back to deterministic narrative if OpenAI unavailable
- Ambiguous policy categories → `HUMAN_REVIEW` immediately, no LLM call

**3. PROPOSE** — `AgentToolRegistry.create_correction_proposal()`
- Creates `CorrectionProposal` with idempotency key, action type, adjustment amount
- Builds double-entry journal entry structure (debit/credit accounts)
- Does NOT execute — proposal only

**4. APPROVE** — `POST /api/exceptions/{id}/approve`
- `require_permission("approve_corrections")` enforced via FastAPI Depends
- `COMPLIANCE_AUDITOR` → HTTP 403
- On approval: `CorrectionExecutor.execute_correction()` mutates domain state and posts to `DoubleEntryJournalLedger`
- Calls `RazorpayServiceClient.execute_route_reversal()` for clawback types

**5. VERIFY** — `PostCorrectionVerifier.verify()`
- Re-runs `MultiSourceReconciler.reconcile_batch()` on updated state
- Checks residual discrepancy == 0 within tolerance
- Status updated to `VERIFIED_RESOLVED` only if delta == ₹0.00

---

## 6. Official Razorpay API Integration

| API | Endpoint | When Called |
|---|---|---|
| Route Transfers | `POST /v1/payments/:id/transfers` | Splitting payment to vendor linked accounts |
| Route Reversals | `POST /v1/transfers/:id/reversals` | Clawback execution on approval |
| Settlement Recon | `GET /v1/settlements/recon/combined` | Feeding MDR, GST, UTR cross-reference |
| OAuth 2.0 | `https://auth.razorpay.com/authorize` | Partner authorization code grant |
| Webhooks | `X-Razorpay-Signature` HMAC-SHA256 | Real-time `payment.captured`, `transfer.reversed` |

---

## 7. Security Architecture

- **Auth**: Opaque demo tokens mapped server-side to roles. No token → HTTP 401. Wrong permission → HTTP 403.
- **CORS**: Restricted to `http://localhost:5173` only. `allow_credentials=True` with explicit origin list.
- **RBAC**: FastAPI `Depends(require_permission("..."))` on every mutating route.
- **Webhooks**: HMAC-SHA256 signature verification before any payload processing.
- **Idempotency**: `executed_idempotency_keys` set prevents double-execution of corrections.
- **No secrets in repo**: All API keys via env vars. `.env` in `.gitignore`.

---

## 8. Database Schema

```
orders                   payments                splits
──────────────           ────────────────        ──────────────────
id (PK)                  id (PK)                 id (PK)
customer_id              order_id (FK)           order_id (FK)
vendor_id                amount                  vendor_id
amount                   gateway_fee             vendor_amount
status                   gateway_tax             platform_commission
item_category            status                  route_transfer_fee
tax_class                method
created_at               utr

payouts                  refunds                 settlement_exceptions
────────────────         ────────────────        ─────────────────────────
id (PK)                  id (PK)                 id (PK)
order_id (FK)            order_id (FK)           order_id
vendor_id                amount                  exception_type
amount                   clawback_required       discrepancy_amount
status                   clawback_amount         status
utr                      clawback_status         root_cause
settled_at               reason                  proposed_correction

ledger_journal_entries
──────────────────────────
id (PK)
order_id
vendor_id
entry_type
debit
credit
description
is_correction
parent_exception_id
timestamp
```

---

## 9. Performance Characteristics

| Metric | Value |
|---|---|
| Batch size | 75 records |
| Reconciliation time | < 2ms |
| Throughput | 48,000+ records/sec |
| Detectors per order | 5 (sequential, stops at first match) |
| AI investigation latency | ~1-3s (GPT-4o-mini) |
| Fallback (no OpenAI key) | Instant deterministic narrative |
| Database | SQLite WAL (dev) / Supabase PostgreSQL (prod) |
