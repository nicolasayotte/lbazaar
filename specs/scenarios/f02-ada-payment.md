# Test Scenarios: F-02 — ADA Payment Flow

**Source spec:** milestone-4-spec.md
**Scope:** F-02 (ADA Pending State, Confirmation Threshold, Transaction Failure, Insufficient Balance, No Wallet Connected)
**Generated:** 2026-02-19
**Status:** DRAFT — TS-02.14 blocked pending OQ-03 (timeout duration)

---

## Prerequisites

- The platform is deployed and accessible
- A student account `[Student_A]` exists and is authenticated
- A paid class `[Class_General]` exists with a JPY price and a valid ADA equivalent
- `[Student_A]` has not yet purchased `[Class_General]` unless explicitly stated
- A supported browser wallet `[Wallet_Supported]` is installed and unlocked where wallet scenarios require it
- The platform's global confirmation threshold is set to 10 on-chain confirmations (SC-02)
- `MIN_ADA=2000000` (minimum UTXO requirement) is configured

---

## F-02.1: ADA Pending State

---

### TS-02.01: Pending state shown after wallet confirms transaction

**Traces to:** F-02.1
**Category:** HAPPY PATH
**Criticality:** BLOCKING

**GIVEN:**
- `[Student_A]` is logged in with `[Wallet_Supported]` connected
- `[Student_A]` has initiated an ADA payment for `[Class_General]` and confirmed the transaction in the wallet

**WHEN:**
- `[Student_A]` views the detail page for `[Class_General]`

**THEN:**
- `[Student_A]` sees a pending-state indicator (e.g., progress bar or status text) showing the payment is being confirmed on-chain
- The "Buy with ADA" button is either absent or disabled

---

### TS-02.02: Class content not accessible while payment is pending

**Traces to:** F-02.1
**Category:** HAPPY PATH
**Criticality:** HIGH

**GIVEN:**
- `[Student_A]` has a pending ADA payment for `[Class_General]` (submitted but not yet confirmed)

**WHEN:**
- `[Student_A]` attempts to access `[Class_General]` content

**THEN:**
- `[Student_A]` is not granted access to the class content
- No re-purchase option is shown (to prevent duplicate payments)

---

### TS-02.03: Duplicate ADA payment blocked while one is pending

**Traces to:** F-02.1
**Category:** EDGE CASE
**Criticality:** HIGH

**GIVEN:**
- `[Student_A]` has a pending ADA payment for `[Class_General]`

**WHEN:**
- `[Student_A]` attempts to initiate a second ADA payment for the same class

**THEN:**
- The system blocks the second payment attempt
- `[Student_A]` sees a message indicating a payment is already pending

---

### TS-02.04: Credit card payment blocked while ADA payment is pending

**Traces to:** F-02.1
**Category:** EDGE CASE
**Criticality:** HIGH

**GIVEN:**
- `[Student_A]` has a pending ADA payment for `[Class_General]`

**WHEN:**
- `[Student_A]` attempts to initiate a credit card payment for the same class

**THEN:**
- The system blocks the credit card payment attempt
- The credit card payment endpoint returns an error indicating a pending ADA payment exists

**NOTES:** This prevents a race condition where a student could pay twice for the same class using different payment methods.

---

### TS-02.05: Unauthenticated user cannot access ADA payment flow

**Traces to:** IMPLICIT — no direct spec scenario
**Category:** EDGE CASE
**Criticality:** MEDIUM

**GIVEN:**
- A visitor is not logged in

**WHEN:**
- The visitor views the detail page for `[Class_General]`
- The visitor attempts to access ADA payment endpoints directly

**THEN:**
- No active payment buttons are visible on the detail page
- Direct API calls to build-purchase-tx and submit-purchase-tx return 401

---

## F-02.2: ADA Confirmation Threshold (SC-02)

> **Constraint SC-02:** Pessimistic finality at exactly 10 on-chain confirmations. 9 confirmations must NOT unlock access. 10 confirmations MUST unlock access.

---

### TS-02.06: Access granted at 10 on-chain confirmations

**Traces to:** F-02.2
**Category:** HAPPY PATH
**Criticality:** BLOCKING

**GIVEN:**
- `[Student_A]` has a pending ADA payment for `[Class_General]`
- The on-chain transaction has been submitted

**WHEN:**
- The transaction reaches 10 on-chain confirmations

**THEN:**
- `[Student_A]`'s payment status transitions from "pending" to "confirmed"
- `[Student_A]` is granted access to `[Class_General]` content

---

### TS-02.07: Purchase history updated after confirmation

**Traces to:** F-02.2
**Category:** HAPPY PATH
**Criticality:** HIGH

**GIVEN:**
- `[Student_A]`'s ADA payment for `[Class_General]` has reached 10 confirmations and is confirmed

**WHEN:**
- `[Student_A]` views their purchase/course history

**THEN:**
- `[Class_General]` appears in `[Student_A]`'s course history
- The payment is recorded with a confirmed status

---

### TS-02.08: Confirmation includes transaction reference

**Traces to:** F-02.2
**Category:** HAPPY PATH
**Criticality:** HIGH

**GIVEN:**
- `[Student_A]`'s ADA payment for `[Class_General]` has been confirmed

**WHEN:**
- `[Student_A]` views the confirmation or their course history

**THEN:**
- A transaction hash or blockchain explorer link is visible, allowing `[Student_A]` to verify the on-chain transaction

---

### TS-02.09: No access at 9 on-chain confirmations

**Traces to:** SC-02
**Category:** BOUNDARY
**Criticality:** BLOCKING

**GIVEN:**
- `[Student_A]` has a pending ADA payment for `[Class_General]`
- The on-chain transaction has been submitted

**WHEN:**
- The transaction reaches 9 on-chain confirmations (one fewer than the required threshold)

**THEN:**
- `[Student_A]`'s payment status remains "pending"
- `[Student_A]` is NOT granted access to `[Class_General]` content

**NOTES:** This is the critical SC-02 boundary test. The system must enforce exactly 10 confirmations — not 9.

---

### TS-02.10: Access granted at exactly 10 confirmations (SC-02 boundary)

**Traces to:** SC-02
**Category:** BOUNDARY
**Criticality:** BLOCKING

**GIVEN:**
- `[Student_A]` has a pending ADA payment for `[Class_General]`
- The transaction has 9 confirmations and is not yet confirmed

**WHEN:**
- The transaction reaches exactly 10 confirmations

**THEN:**
- The payment status transitions to "confirmed"
- `[Student_A]` is granted access
- The `payment_confirmed_at` timestamp is recorded

**NOTES:** TS-02.09 and TS-02.10 together form the SC-02 boundary pair. Both must pass.

---

## F-02.3: ADA Transaction Failure

---

### TS-02.11: Pre-purchase state restored on transaction failure

**Traces to:** F-02.3
**Category:** FAILURE
**Criticality:** HIGH

**GIVEN:**
- `[Student_A]` has a pending ADA payment for `[Class_General]`
- The on-chain transaction fails

**WHEN:**
- The system processes the transaction failure

**THEN:**
- `[Student_A]`'s payment status transitions to "failed"
- The associated wallet transaction is also marked as failed
- `[Student_A]` is returned to the pre-purchase state for `[Class_General]`

---

### TS-02.12: Failure message with retry guidance shown to student

**Traces to:** F-02.3
**Category:** FAILURE
**Criticality:** HIGH

**GIVEN:**
- `[Student_A]`'s ADA payment for `[Class_General]` has failed

**WHEN:**
- `[Student_A]` views the detail page for `[Class_General]`

**THEN:**
- `[Student_A]` sees a failure message indicating the payment did not succeed
- The message includes guidance that `[Student_A]` can retry the purchase
- The "Buy with ADA" button is re-enabled or a retry option is visible

---

### TS-02.13: No access granted after payment failure

**Traces to:** F-02.3
**Category:** FAILURE
**Criticality:** HIGH

**GIVEN:**
- `[Student_A]`'s ADA payment for `[Class_General]` has failed

**WHEN:**
- `[Student_A]` attempts to access `[Class_General]` content

**THEN:**
- `[Student_A]` is not granted access to the class content
- A failed payment does not count as enrollment

---

### TS-02.14: Timeout failure returns student to pre-purchase state

**Traces to:** F-02.3
**Category:** EDGE CASE
**Criticality:** HIGH

**GIVEN:**
- `[Student_A]` has a pending ADA payment for `[Class_General]`
- The on-chain transaction has not received any confirmations within the operator-defined timeout duration

**WHEN:**
- The timeout elapses

**THEN:**
- The system marks the payment as failed
- `[Student_A]` is returned to the pre-purchase state

**NOTES:** BLOCKED pending OQ-03 / A-03. The operator must define the ADA transaction timeout duration before this scenario can be implemented. Expected: a scheduled job calls the failure handler after the timeout.

---

## F-02.4: Insufficient ADA Balance

---

### TS-02.15: No transaction submitted when wallet balance is insufficient

**Traces to:** F-02.4
**Category:** FAILURE
**Criticality:** HIGH

**GIVEN:**
- `[Student_A]` is logged in with `[Wallet_Supported]` connected
- `[Student_A]`'s wallet balance is less than the ADA price of `[Class_General]`

**WHEN:**
- `[Student_A]` attempts to initiate an ADA payment for `[Class_General]`

**THEN:**
- No transaction is submitted on-chain
- The build-transaction step fails with an insufficient-funds indicator

---

### TS-02.16: Shortfall message shown to student

**Traces to:** F-02.4
**Category:** FAILURE
**Criticality:** HIGH

**GIVEN:**
- `[Student_A]` attempted an ADA payment and the balance check failed

**WHEN:**
- `[Student_A]` views the payment result

**THEN:**
- `[Student_A]` sees a descriptive message indicating insufficient ADA balance
- The message is user-friendly (not a raw error code)

---

### TS-02.17: Credit card alternative suggested after insufficient balance

**Traces to:** F-02.4
**Category:** EDGE CASE
**Criticality:** MEDIUM

**GIVEN:**
- `[Student_A]`'s ADA payment attempt failed due to insufficient balance

**WHEN:**
- `[Student_A]` views the detail page for `[Class_General]`

**THEN:**
- The "Pay with Credit Card" button is visible and not disabled
- `[Student_A]` can switch to the credit card payment path as an alternative

---

### TS-02.18: Payment blocked at exactly (price - 1 lovelace)

**Traces to:** F-02.4
**Category:** BOUNDARY
**Criticality:** HIGH

**GIVEN:**
- The ADA price of `[Class_General]` is `CLASS_PRICE_LOVELACE`
- `[Student_A]`'s wallet contains exactly `CLASS_PRICE_LOVELACE - 1` lovelace

**WHEN:**
- `[Student_A]` attempts to initiate an ADA payment

**THEN:**
- The transaction build fails with an insufficient-funds indicator
- No transaction is submitted on-chain

**NOTES:** Factor in `MIN_ADA=2000000` minimum UTXO requirement in all lovelace calculations. This is the lower boundary — one lovelace short of sufficient.

---

### TS-02.19: Payment proceeds at exactly the required price

**Traces to:** F-02.4
**Category:** BOUNDARY
**Criticality:** HIGH

**GIVEN:**
- The ADA price of `[Class_General]` is `CLASS_PRICE_LOVELACE`
- `[Student_A]`'s wallet contains exactly `CLASS_PRICE_LOVELACE` lovelace (plus fees)

**WHEN:**
- `[Student_A]` attempts to initiate an ADA payment

**THEN:**
- The transaction build succeeds
- The transaction can be submitted on-chain

**NOTES:** TS-02.18 and TS-02.19 form the boundary pair for insufficient balance detection.

---

## F-02.5: No Wallet Connected

---

### TS-02.20: Connect-wallet prompt shown when no wallet is connected

**Traces to:** F-02.5
**Category:** FAILURE
**Criticality:** HIGH

**GIVEN:**
- `[Student_A]` is logged in
- No browser wallet extension is connected (or no wallet is installed)

**WHEN:**
- `[Student_A]` views the detail page for `[Class_General]` with payment options

**THEN:**
- The "Buy with ADA" button is disabled
- A wallet connection prompt or wallet connector UI is visible, guiding `[Student_A]` to connect a wallet

---

### TS-02.21: Pending/confirmation UI not shown until wallet is connected

**Traces to:** F-02.5
**Category:** EDGE CASE
**Criticality:** MEDIUM

**GIVEN:**
- `[Student_A]` is logged in
- No browser wallet is connected

**WHEN:**
- `[Student_A]` views the detail page for `[Class_General]`

**THEN:**
- No pending-state indicator (progress bar, "Building transaction", "Please sign", "Submitting") is visible
- The payment flow UI does not render any transaction-in-progress elements

**NOTES:** This ensures the UI doesn't display misleading transaction states when there is no wallet to transact with.

---

## Coverage Summary

| Spec Scenario | Test Scenarios | Categories Covered |
|---------------|----------------|--------------------|
| F-02.1 | TS-02.01, TS-02.02, TS-02.03, TS-02.04 | Happy Path, Edge Case |
| F-02.2 | TS-02.06, TS-02.07, TS-02.08, TS-02.09, TS-02.10 | Happy Path, Boundary |
| F-02.3 | TS-02.11, TS-02.12, TS-02.13, TS-02.14 | Failure, Edge Case |
| F-02.4 | TS-02.15, TS-02.16, TS-02.17, TS-02.18, TS-02.19 | Failure, Edge Case, Boundary |
| F-02.5 | TS-02.20, TS-02.21 | Failure, Edge Case |
| (implicit) | TS-02.05 | Edge Case |

**Total spec scenarios in scope:** 5
**Total test scenarios generated:** 21
**Expansion ratio:** 21/5 (4.2x)

### Gaps

- **Transaction timeout duration (OQ-03 / A-03):** TS-02.14 is blocked until the operator defines the ADA transaction timeout. Expected implementation: a scheduled job marks pending payments as failed after the timeout.
- **Wallet balance detection scope:** Insufficient-funds detection happens in the Node.js `build-purchase-tx.mjs` script (returns `status:501`). The boundary tests (TS-02.18, TS-02.19) depend on whether this script can be unit-tested directly or must be tested via the PHP service layer.
- **Concurrent payment across browser tabs:** The spec does not address what happens if a student initiates ADA payment in one tab and credit card payment in another simultaneously. Flagged as potentially unspecified.
