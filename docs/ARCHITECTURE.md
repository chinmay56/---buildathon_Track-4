# Razorpay Settlement Controller - System Architecture

**Track 04 — AI Finance Controller: Run the Books and the Cash Position**  
*Razorpay Buildathon 2026*

---

## 1. Executive Summary

Settlement Controller is an autonomous AI-assisted financial operations system designed for multi-source marketplace settlement reconciliation. It processes 500+ record batches across orders, payments, splits, payouts, refunds, and taxes; detects ledger discrepancies using 5 deterministic detectors; investigates them via an AI ReAct agent using scoped read-only tools; proposes bounded corrective journal entries; enforces human-in-the-loop sign-off; and mathematically proves that the post-correction delta is **₹0.00**.

---

## 2. Core Architectural Principle

> **"AI investigates financial discrepancies; deterministic code establishes financial truth."**

- **Authoritative Math**: All balance calculations, fee schedules, GST tax deductions, and clawback formulas are executed by pure Python deterministic calculators.
- **AI Agent**: Navigates multi-entity records, compiles evidence packages, cites specific merchant policy clauses, identifies root causes, and structures corrective proposals.
- **Ambiguity as a First-Class Citizen**: Ambiguous records (e.g. missing contract category) are safely routed to `HUMAN_REVIEW` rather than making hallucinated assumptions.

---

## 3. System Architecture Diagram

```
                                  ┌────────────────────────────────────────┐
                                  │      Next.js / React Frontend          │
                                  │  • Batch Overview & Throughput Speed   │
                                  │  • Visual Investigation & Timeline     │
                                  │  • Human Review Approval Drawer        │
                                  │  • "Break the Ledger" Live Chaos Sim   │
                                  └───────────────────┬────────────────────┘
                                                      │ REST API
                                  ┌───────────────────▼────────────────────┐
                                  │          FastAPI Backend Core          │
                                  └───────┬────────────────────────┬───────┘
                                          │                        │
               ┌──────────────────────────┴──────────┐   ┌─────────┴────────────────────────┐
               ▼                                     ▼   ▼                                  ▼
┌──────────────────────────────┐ ┌─────────────────────────────────────┐ ┌──────────────────────────────────┐
│ Deterministic Reconciler     │ │ AI Investigation Agent (ReAct)      │ │ Simulated Marketplace Ledger     │
│ • Expected State Calculator  │ │ • Read-only entity query tools      │ │ • Orders, Payments, Splits       │
│ • Tolerance & Policy Engine  │ │ • Timeline & Policy inspector       │ │ • Refunds, Payouts, Taxes        │
│ • 5 Exception Detectors      │ │ • Generates structured proposal     │ │ • Idempotent Corrective Journal  │
└──────────────┬───────────────┘ └───────────────────┬─────────────────┘ └──────────────────┬───────────────┘
               │                                     │                                      │
               └─────────────────────────────────────┼──────────────────────────────────────┘
                                                     ▼
                               ┌────────────────────────────────────────┐
                               │ Ground Truth & Benchmarking Engine     │
                               │ • Precision / Recall / Confusion Matrix│
                               │ • Monetary Discrepancy Error (₹ Delta) │
                               │ • Throughput (records / sec)           │
                               └────────────────────────────────────────┘
```

---

## 4. The 5 Deterministic Exception Detectors

1. **`RefundClawbackDetector`**:
   - Rule: `refund.timestamp > payout.settled_at AND required_clawback > existing_clawback`
   - Detects unrecovered vendor payouts when a customer is refunded post-settlement.
2. **`ExcessCommissionDetector`**:
   - Rule: `actual_commission > expected_commission + tolerance`
   - Detects duplicate commission fee lines or overcharges.
3. **`TaxRuleMismatchDetector`**:
   - Rule: `recorded_tax_rate != configured_policy_rate`
   - Catches incorrect GST slabs (e.g. 28% luxury rate applied to standard goods).
4. **`OrphanedPayoutDetector`**:
   - Rule: `payout.status == settled AND (payment is None OR payment.status == failed)`
   - Detects payout events that occurred without valid captured payments.
5. **`RoundingDriftDetector`**:
   - Rule: `abs(expected_vendor_share - actual_vendor_share) > rounding_tolerance`
   - Detects sub-cent fractional paisa rounding drift across split sub-ledgers.

---

## 5. The Closed Finance-Ops Loop

```
   ┌─────────────┐
   │  RECONCILE  │  Ingest 500 records & flag 5 detector discrepancies
   └──────┬──────┘
          │
          ▼
   ┌─────────────┐
   │ INVESTIGATE │  AI Agent queries read-only tools, cites policy & builds evidence
   └──────┬──────┘
          │
          ▼
   ┌─────────────┐
   │   PROPOSE   │  Generate idempotent corrective journal adjustment
   └──────┬──────┘
          │
          ▼
   ┌─────────────┐
   │   APPROVE   │  Human finance lead reviews & signs off
   └──────┬──────┘
          │
          ▼
   ┌─────────────┐
   │   VERIFY    │  Deterministic reconciler re-runs $\to$ proves delta = ₹0.00
   └─────────────┘
```
