# 5-Minute Hackathon Demo Script & Judge Pitch

**Product**: Razorpay Settlement Controller  
**Track 04**: AI Finance Controller — *Run the books and the cash position*

---

## ⏱️ Minute 0:00 - 1:00 | The Problem & Real-World Reality
> *"Good morning judges. In 2026, verification capacity—not generation speed—is the bottleneck in finance operations.*
> 
> *A customer's payment can succeed on Razorpay, but downstream marketplace ledgers can still be broken. A customer refunds an item 4 hours after a vendor is paid; a duplicate commission line is deducted; or rounding drift accumulates.*
> 
> *Today, we present **Settlement Controller**: an autonomous AI finance controller that closes the finance-ops loop across 500+ multi-source transactions with deterministic math guarantees, verifiable proof, and honest ambiguity handling."*

---

## ⏱️ Minute 1:00 - 2:00 | Batch Reconciler & Speed
- Click **"Reconcile 500 Batch"**.
- Point to the KPI Cards:
  > *"Notice our engine processed 500 multi-entity records (orders, payments, splits, payouts, refunds, taxes) in under 40 milliseconds — that's over **12,000 records/second** throughput.*
  > *It identified **24 exceptions** representing **₹1,49,677.30** in at-risk cash exposure."*
- Point to the **Cash Float Widget**:
  > *"We don't just match rows; we run the cash position: showing trapped vendor clawback float and calculating the safe T+2 settlement buffer to disburse."*

---

## ⏱️ Minute 2:00 - 3:15 | The Hero Investigation: Refund Post-Payout
- In the Ledger Table, click **Inspect** on `ord_0010`.
- Open the Investigation Drawer:
  > *"Look at the multi-entity timeline DAG: Order placed $\to$ Payment captured $\to$ ₹9,000 Payout settled to vendor $\to$ Customer refunded ₹10,000 with ₹0 clawback recorded.*
  > 
  > *Our AI Agent did NOT guess the numbers. It called scoped read-only tools (`get_order`, `get_payment`, `calculate_expected_state`), cited **POLICY_SEC_4_2_CLAWBACK_MANDATORY**, and formulated a safe Debit Adjustment proposal."*

---

## ⏱️ Minute 3:15 - 4:00 | Human Approval & Verification Proof
- Click **"Approve & Execute Correction"**.
- Confetti fires and status turns to **`VERIFIED RESOLVED (₹0.00)`**:
  > *"The action was posted to the mock double-entry ledger. But more importantly: our engine immediately re-ran deterministic reconciliation on this transaction to prove that the financial delta collapsed to exactly **₹0.00**."*

---

## ⏱️ Minute 4:00 - 4:40 | Live Chaos Injection ("Break the Ledger")
- Click **"Break the Ledger (Chaos)"**.
- Select **"Late Refund on Settled Vendor"** for ₹14,500 on `vend_014` and click **"Inject Discrepancy Live"**.
  > *"Let's test live chaos. We just injected a late refund on a settled transaction. The dashboard instantly re-reconciled, flagged the new cash leakage, and traced the live UTR."*

---

## ⏱️ Minute 4:40 - 5:00 | Benchmark Report & Honest Ambiguity
- Click **"Ground Truth Benchmark"**.
- Display the Confusion Matrix:
  > *"We evaluated our system against an isolated hidden ground-truth dataset:*
  > - **100% Precision** (Zero false positives)
  > - **100% Recall**
  > - **100% Monetary Exposure Accuracy**
  > - And for unmapped vendor contract tiers, our agent safely routes to **`HUMAN REVIEW`** rather than hallucinating accounting policies.*
  > 
  > *Settlement Controller delivers throughput, measured accuracy, and a verified closed loop. Thank you."*
