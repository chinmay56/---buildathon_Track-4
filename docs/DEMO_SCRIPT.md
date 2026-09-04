# Settlement Controller — Judge Demo Script
## Razorpay AI Buildathon 2026 · Track 04: AI Finance Controller

---

## 🎯 One-Line Thesis

> Razorpay provides the financial primitives — payments, Route transfers, refunds, reversals, settlements.
> **Settlement Controller** is the intelligence layer that continuously verifies those primitives collectively produce the correct financial state.

---

## ⏱️ Demo Flow (8–10 minutes)

---

### STEP 1 — Open the Dashboard (30 sec)

URL: **http://localhost:5173**

**Talk Track:**
> "This is the Settlement Controller — an AI Finance Operations controller built on top of Razorpay Route primitives. It processes a live synthetic batch of marketplace transactions, detects ledger anomalies, and autonomously investigates and resolves them using a ReAct reasoning loop grounded on real Razorpay API semantics."

**Point out the top KPI row:**
- **Reconciliation Match Rate** — e.g. 70.67% — percentage of transactions with zero discrepancy across all sources
- **Engine Throughput** — 75 transactions processed in ~X ms
- **Net Discrepancy Exposure** — total ₹ trapped in unresolved exceptions
- **Verified Closures** — count of exceptions AI has verified resolved at ₹0 delta

**Then point to the AI Detection Model Matrix below:**
> "Precision 76%, Recall 80%, F1 Score **77.94%** — computed from ground-truth labelled synthetic anomalies. The 2x2 confusion matrix shows True Positives (correctly flagged), False Positives (false alerts), False Negatives (missed), and True Negatives (clean correctly matched)."

---

### STEP 2 — Settlement Ledger (1 min)

Click **Settlement Ledger** in the left sidebar.

**Talk Track:**
> "Every row is a marketplace order flowing through Razorpay Route. The ledger fuses four financial sources for each transaction: the gateway Payment, the Route Transfer/Split, the vendor Payout, and any Refund records."

**Show the status chips:**
- `MATCHED` — payment + split + payout all reconcile to ₹0 delta
- `EXCEPTION` — detected discrepancy requiring investigation

> "Click any EXCEPTION row to open its investigation context."

The **Investigation Drawer** opens — point out:
- Order ID, Payment ID (`pay_*`), Route Transfer (`trf_*`), Settlement UTR
- Calculated discrepancy amount in ₹
- Exception type label (e.g. `REFUND_CLAWBACK_UNRECOVERED`)
- Status: `DETECTED` — needs AI investigation

---

### STEP 3 — Exceptions Hub & ReAct AI Investigation (3 min)

Click **Exceptions Hub** in the sidebar.

**Talk Track:**
> "This is the triage queue. Every detected ledger anomaly surfaces here with its financial impact and current resolution status."

**The 5 exception types the AI detects:**
1. `REFUND_CLAWBACK_UNRECOVERED` — customer refunded, vendor payout already settled, clawback ₹0
2. `EXCESS_COMMISSION_DEDUCTED` — platform deducted 25% instead of the contracted 10%
3. `GHOST_PAYOUT_DETECTED` — bank payout settled against a failed/uncaptured payment
4. `TAX_MISMATCH_DETECTED` — GST calculation diverges from policy-specified tax class
5. `AMBIGUOUS_VENDOR_TIER` — unmapped contract tier triggers a mandatory human review safety halt

**Click any exception → "Investigate with AI":**
> "The AI runs a ReAct reasoning loop — it pulls the order record, checks the payment capture event, reads the Route transfer and split sub-ledger, computes the expected vendor amount against the merchant policy contract, then synthesizes a root cause and a concrete correction proposal."

**Show the investigation output:**
- Root cause narrative
- Evidence chain: `ord_*` → `pay_*` → `trf_*` → `rfnd_*`
- Proposed correction action with ₹ delta
- Confidence level

**Click "Approve & Simulate Correction":**
> "On approval, the controller executes a closed-loop verification — re-runs the multi-source reconciliation equation for this order and confirms the residual delta is ₹0. Status moves to `VERIFIED_RESOLVED`."

**For AMBIGUOUS_VENDOR_TIER:**
> "Notice the AI does NOT guess here. It halts and routes to `HUMAN_REVIEW` — a deliberate safety boundary. The controller identifies exactly which contract fields are missing and queues it for a human finance controller."

---

### STEP 4 — Operations Copilot Q&A (2 min)

Click **Operations Copilot** in the sidebar.

**Talk Track:**
> "Natural-language interface grounded on the live batch state and policy rules. Uses GPT-4o-mini with ReAct to answer finance operations questions with citations."

**Suggested queries (click the chips or type):**

1. **"What is our trapped clawback capital?"**
   → Returns current unrecovered vendor clawback balance in ₹

2. **"Explain root cause of ord_0010"**
   → Pulls the specific order, identifies exception type, explains the financial chain

3. **"Why are some cases in Human Review?"**
   → Explains the AMBIGUOUS_TIER safety policy and missing contract fields

4. **"Check reconciliation speed & accuracy"**
   → Cites match rate, throughput, and current exposure from live state

> "Action buttons on each response are clickable — they send a follow-up query automatically. Responses render with proper bold text, structured lists, and policy citations."

---

### STEP 5 — Chaos Simulator (1.5 min)

Click **Chaos Simulator** in the sidebar.

**Talk Track:**
> "Live adversarial testbench. Inject custom financial corruptions into the active ledger in real time."

**Demo: Inject a Late Refund:**
1. Select **"Late Refund on Settled Vendor (Clawback Failure)"**
2. Set Amount: `₹18,500`
3. Set Vendor ID: `vend_live_demo`
4. Click **"Inject Chaos Transaction Live"**

> "The backend creates a new order with a settled payout but ₹0 clawback, inserts it into the active batch, immediately re-runs the reconciliation engine. The new exception appears in the Exceptions Hub — discrepancy is ₹16,650 (90% of ₹18,500 vendor payout)."

Navigate to **Exceptions Hub** — confirm the new exception is flagged, then Investigate.

---

### STEP 6 — Cash & Float Health (30 sec)

Click **Cash & Float Health**.

> "Working capital position — safe T+2 float buffer, trapped clawback reserve (vendor payouts we need to recover), and orphaned payout freeze balance. This is what protects the platform from net negative settlement cycles."

---

## 🏁 Closing Statement

> "Settlement Controller demonstrates that AI adds most value not by replacing Razorpay's payment primitives, but by wrapping them with a continuous verification intelligence layer — detecting when Route transfers, refunds, and payouts collectively violate the expected financial state, investigating root causes with evidence from multiple sub-ledgers, and closing the loop with verified ₹0 resolution or a safe human escalation.
>
> The system operates on real Razorpay API semantics: `pay_*`, `trf_*`, `rfnd_*`, `rfr_*`, UTR numbers, and merchant policy contracts — making every finding directly actionable in production."

---

## 🧪 Technical Q&A Prep

| Question | Answer |
|---|---|
| How does it know what's an exception? | 5 rule-based anomaly detectors post-reconciliation: RefundClawback, ExcessCommission, GhostPayout, TaxMismatch, AmbiguousTier |
| How does the AI investigate? | ReAct loop via GPT-4o-mini grounded on live batch state — not a static prompt |
| What Razorpay APIs does it use? | Route Transfer, Route Reversal, Combined Settlement Recon, Webhook HMAC verification |
| Is the Chaos data live? | Yes — chaos injection mutates in-memory state, re-runs reconciler, and updates the exception queue in real time |
| Precision 76% / Recall 80% — how measured? | Ground-truth labels generated alongside synthetic data; detected exceptions compared against those labels |
| What if contract tier is missing? | AMBIGUOUS_TIER detector halts and escalates to HUMAN_REVIEW — AI never guesses on policy |
| Is RBAC enforced? | Yes — Auditor role cannot approve corrections; Controller role required |
| Database persistence? | SQLite via SQLAlchemy — correction journal entries are double-entry bookkeeping records persisted across restarts |
