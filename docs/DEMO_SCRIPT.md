# 5-Minute Judge Demo Script

**Razorpay Buildathon 2026 — Track 04: AI Finance Controller**

> Before recording: backend on port 8000, frontend on port 5173, both running.
> Use Finance Controller account (Arjun Mehta) by default.

---

## [0:00 – 0:30] Hook — The Problem

**Say:**
> "Every Indian marketplace running on Razorpay Route faces the same silent problem. A customer buys ₹10,000 boAt headphones. Razorpay splits the payment — 10% commission, 2% MDR fee — ₹8,800 lands in boAt's bank account. 3 days later the customer returns the item. Razorpay refunds them ₹10,000. But nobody clawed back the ₹8,800 from boAt. The marketplace just absorbed an ₹8,800 loss — silently, in the ledger. Finance teams catch this 8 hours later in Excel. We catch it in 2 milliseconds."

**Show:** The Settlement Ledger tab with 75 transactions pre-loaded.

---

## [0:30 – 1:00] Reconcile

**Do:** Click **Reconcile** in the header.

**Point at the 4 KPI cards and say:**
> "75 multi-vendor marketplace transactions. 5 independent data sources — Orders, Razorpay Payments, Route Splits, Bank UTRs, Customer Refunds — cross-referenced simultaneously. 53 matched clean. 22 exceptions flagged. 100% precision — zero false positives. 48,000 records per second throughput. Under 2 milliseconds total."

**Razorpay API to name-drop:**
> "The engine cross-references Razorpay's **Combined Settlement Recon API** — `GET /v1/settlements/recon/combined` — giving us gross volume, MDR fees, GST deductions, and bank UTRs in one authoritative feed."

---

## [1:00 – 2:30] Hero Exception — ord_0010

**Do:** Click **Exceptions Hub** in the sidebar. Click on `ord_0010`.

**Say:**
> "This is the hero scenario. `ord_0010`. Customer paid, Route Transfer executed to the vendor, Bank IMPS settled with a valid UTR. Then the customer returned the item — full refund processed — but the vendor clawback was never executed. That's trapped working capital."

**Point at the transaction timeline:**
> "The deterministic engine calculated the exact discrepancy — not an estimate, not an LLM guess. Pure arithmetic from the merchant policy: 10% commission rate, vendor share formula, policy version v2.1."

**Do:** Click **Run AI Investigation**.

**Say:**
> "Now our ReAct AI Investigator runs. It calls 5 read-only diagnostic tools — get_order, get_payment, get_splits, get_payouts, get_refunds — builds the complete evidence package, and cites the exact policy clause."

**Point at root cause text:**
> "Root cause identified. Policy Clause 4.2 — Clawback Mandatory Post-Payout. Proposed action: CREATE_VENDOR_CLAWBACK_DEBIT via **Razorpay Route Reversals API** — `POST /v1/transfers/:id/reversals`."

**Do:** Click **Approve & Execute**.

**Say:**
> "Status: VERIFIED RESOLVED. Delta: ₹0.00. The system re-ran the full reconciliation after correction and mathematically proved the discrepancy collapsed to zero. Closed loop."

---

## [2:30 – 3:00] Human Review Safeguard — ord_0013

**Do:** Click on `ord_0013` in the exceptions list.

**Say:**
> "This is what separates production-grade AI from a demo. `ord_0013` has an unmapped vendor contract tier — we don't know the correct GST slab. Watch what happens when we investigate."

**Do:** Click **Run AI Investigation**.

**Say:**
> "The AI refuses to guess. No hallucinated tax rate. Status: HUMAN_REVIEW. Required inputs listed explicitly: vendor_commission_tier, item_tax_classification. The finance controller gets notified. The LLM is never used for monetary arithmetic — ever."

---

## [3:00 – 3:30] Razorpay OAuth 2.0

**Do:** Click the Razorpay logo / Connect button in the header. Show the OAuth modal.

**Say:**
> "OAuth starts disconnected — the service never pre-authenticates. Click Connect."

**Do:** Click **Connect with Razorpay**.

**Say:**
> "This implements the official **Razorpay OAuth 2.0 Partner Authorization Code Grant**. Authorization URL hits `https://auth.razorpay.com/authorize` with client_id, response_type=code, scope=route.transfers,settlements.read. Callback exchanges the code for a live Bearer token with delegated access to execute Route Transfers and read Settlement Recon on behalf of the merchant. Fully RFC 6749 compliant."

---

## [3:30 – 4:00] Cash Float & 7-Day Forecast

**Do:** Click **Cash & Float Health** in the sidebar.

**Say:**
> "Live working capital position. Right now: ₹32,000 in unrecovered vendor clawbacks, ₹44,000 in orphaned payout exposure — UTR transfers where the gateway payment failed. Float risk index at 7.8%. Safe T+2 disbursement float calculated in real time from the reconciliation engine."

**Do:** Click **Forward 7-Day Forecast**.

**Say:**
> "7-day rolling liquidity projection. T+2 settlement obligations, clawback recovery schedule amortised across 5 days. Every number derived from the live batch — not a static spreadsheet."

---

## [4:00 – 4:30] Settlement Copilot

**Do:** Click **Operations Copilot**. Type: *"Why did ord_0010 fail reconciliation?"*

**Say:**
> "Natural language query grounded in live ledger data. Exact order IDs, UTRs, discrepancy amounts, policy citations."

**Do:** Type follow-up: *"Which vendor has the highest exposure right now?"*

**Say:**
> "Full conversation history maintained — context-aware follow-ups. Not a stateless Q&A. The AI answers from the actual reconciliation state, not a hallucination."

**Also mention:**
> "Incoming Razorpay events arrive via webhooks — payment.captured, transfer.reversed, refund.processed — all verified with **HMAC-SHA256** on the X-Razorpay-Signature header before ingestion."

---

## [4:30 – 5:00] RBAC + Tests — Close Strong

**Do:** Switch role to Priya Sharma (Compliance Auditor) via the header role switcher.

**Do:** Try to approve an exception.

**Say:**
> "403 Forbidden. RBAC enforced at the FastAPI dependency level — not hidden CSS. The Auditor role has read_ledger and view_audit_trail. Approve_corrections requires FINANCE_CONTROLLER. This is enforced on every API route."

**Do:** Show terminal or README with pytest output.

**Say:**
> "18 automated tests. 18 passing. They cover all 5 exception detectors, the full investigate-approve-verify loop, RBAC enforcement, OAuth flow, HMAC webhook verification, Supabase config, and double-entry journal persistence."

**Close:**
> "Razorpay provides the world's best payment infrastructure. We built the verification intelligence layer on top — autonomous reconciliation, AI root cause analysis, closed-loop proof that the ledger is correct, and human-in-the-loop controls for when the AI should not act alone. This is the AI Finance Controller for the next generation of Indian marketplaces."

---

## Quick Reference — Razorpay APIs to name in the video

| Moment | API |
|---|---|
| Reconciliation step | `GET /v1/settlements/recon/combined` |
| Approve correction | `POST /v1/transfers/:id/reversals` |
| OAuth connect | `https://auth.razorpay.com/authorize` |
| Route split transfer | `POST /v1/payments/:id/transfers` |
| Webhook security | `X-Razorpay-Signature` HMAC-SHA256 |
| SDK | `razorpay.Client(auth=(key, secret))` v2.0.1 |
