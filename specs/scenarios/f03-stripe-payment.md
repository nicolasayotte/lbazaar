# Test Scenarios: F-03 — Credit Card (Stripe) Payment Flow

**Source spec:** milestone-4-spec.md
**Scope:** F-03 (Stripe Checkout Success, Card Decline, Checkout Abandonment)
**Generated:** 2026-02-19
**Status:** DRAFT — requires operator review

---

## Prerequisites

- The platform is deployed and accessible
- A student account `[Student_A]` exists and is authenticated
- A paid class `[Class_General]` exists with a JPY price set
- Stripe is configured and the Stripe payment flow is functional
- `[Student_A]` has not yet purchased `[Class_General]` unless explicitly stated
- A-01 / SC-04: Japan Stripe compliance is handled at the Stripe account level — no in-app regulatory disclosure is injected into the checkout flow

---

## F-03.1: Stripe Checkout Success

---

### TS-03.01: Access granted immediately after successful payment

**Traces to:** F-03.1
**Category:** HAPPY PATH
**Criticality:** BLOCKING

**GIVEN:**
- `[Student_A]` has initiated a credit card payment for `[Class_General]`
- The payment succeeds (Stripe `payment_intent.succeeded` webhook received)

**WHEN:**
- `[Student_A]` views the checkout success page or navigates to `[Class_General]`

**THEN:**
- `[Student_A]` is granted immediate access to `[Class_General]` content
- A course history record is created for `[Student_A]` and `[Class_General]`

---

### TS-03.02: Purchase history updated after successful payment

**Traces to:** F-03.1
**Category:** HAPPY PATH
**Criticality:** HIGH

**GIVEN:**
- `[Student_A]`'s credit card payment for `[Class_General]` has succeeded

**WHEN:**
- `[Student_A]` views their course history

**THEN:**
- `[Class_General]` appears in `[Student_A]`'s purchase/course history
- The Stripe payment record status is "succeeded" with a `course_history_id` reference

---

### TS-03.03: Confirmation page shows receipt information

**Traces to:** F-03.1
**Category:** HAPPY PATH
**Criticality:** HIGH

**GIVEN:**
- `[Student_A]`'s credit card payment for `[Class_General]` has succeeded
- The Stripe payment record includes a `receipt_url`

**WHEN:**
- `[Student_A]` views the checkout success page

**THEN:**
- `[Student_A]` sees a confirmation that the payment was successful
- Payment and course information are displayed
- The receipt URL is stored and accessible

---

### TS-03.04: No regulatory disclosure UI injected into checkout flow

**Traces to:** A-01, SC-04
**Category:** CONSTRAINT VALIDATION
**Criticality:** MEDIUM

**GIVEN:**
- `[Student_A]` is on the detail page for a paid class

**WHEN:**
- `[Student_A]` clicks "Pay with Credit Card" and the Stripe payment dialog opens

**THEN:**
- The Stripe PaymentElement or iframe is present
- No regulatory consent form, 特定商取引法 disclosure, or `[data-testid='regulatory-consent']` element is visible within the checkout flow

**NOTES:** A-01 / SC-04: Japan Stripe compliance (特定商取引法) is handled at the Stripe account configuration level, not injected into the in-app checkout UX. The downstream agent should verify no such UI elements are present.

---

## F-03.2: Stripe Card Decline

---

### TS-03.05: Error message shown when card is declined

**Traces to:** F-03.2
**Category:** FAILURE
**Criticality:** HIGH

**GIVEN:**
- `[Student_A]` has initiated a credit card payment for `[Class_General]`

**WHEN:**
- The card is declined by the payment processor

**THEN:**
- `[Student_A]` sees an error message indicating the card was declined
- The error is displayed in the payment UI (e.g., an alert role element)

---

### TS-03.06: No access granted after card decline

**Traces to:** F-03.2
**Category:** FAILURE
**Criticality:** HIGH

**GIVEN:**
- `[Student_A]`'s credit card payment for `[Class_General]` was declined

**WHEN:**
- The system processes the decline (Stripe `payment_intent.payment_failed` webhook)

**THEN:**
- No course history record is created for `[Student_A]` and `[Class_General]`
- `[Student_A]` is not granted access to the class content
- The Stripe payment record status is "failed"

---

### TS-03.07: Student can retry credit card payment after decline

**Traces to:** F-03.2
**Category:** EDGE CASE
**Criticality:** MEDIUM

**GIVEN:**
- `[Student_A]`'s credit card payment was declined

**WHEN:**
- `[Student_A]` dismisses the error and returns to the detail page

**THEN:**
- The "Pay with Credit Card" button is still visible and not disabled
- `[Student_A]` can re-initiate the credit card payment flow

---

### TS-03.08: Student can switch to ADA payment after card decline

**Traces to:** F-03.2
**Category:** EDGE CASE
**Criticality:** MEDIUM

**GIVEN:**
- `[Student_A]`'s credit card payment was declined
- `[Student_A]` has dismissed the checkout dialog

**WHEN:**
- `[Student_A]` views the payment options for `[Class_General]`

**THEN:**
- The "Buy with ADA" button is visible and accessible
- `[Student_A]` can switch to the ADA payment path as an alternative

---

## F-03.3: Stripe Checkout Abandonment

---

### TS-03.09: No payment processed when checkout is abandoned

**Traces to:** F-03.3
**Category:** EDGE CASE
**Criticality:** HIGH

**GIVEN:**
- `[Student_A]` has opened the credit card checkout dialog for `[Class_General]`

**WHEN:**
- `[Student_A]` cancels or closes the checkout dialog without completing payment

**THEN:**
- No payment is processed
- The Stripe payment record status is "canceled" (not "succeeded" or "pending")

---

### TS-03.10: No access granted after checkout abandonment

**Traces to:** F-03.3
**Category:** EDGE CASE
**Criticality:** HIGH

**GIVEN:**
- `[Student_A]` abandoned the credit card checkout for `[Class_General]`

**WHEN:**
- `[Student_A]` views their course history

**THEN:**
- No course history record exists for `[Student_A]` and `[Class_General]`
- `[Student_A]` is not granted access to the class content

---

### TS-03.11: Student can re-initiate checkout after abandonment

**Traces to:** F-03.3
**Category:** EDGE CASE
**Criticality:** MEDIUM

**GIVEN:**
- `[Student_A]` previously abandoned the credit card checkout for `[Class_General]`
- The Stripe payment record for the abandoned attempt is in "canceled" status

**WHEN:**
- `[Student_A]` returns to the detail page for `[Class_General]` and clicks "Pay with Credit Card"

**THEN:**
- A new checkout dialog opens cleanly
- A new payment intent can be created (the canceled record does not block re-purchase)
- `[Student_A]` can complete the payment flow

**NOTES:** This scenario may surface a bug if the payment authorization logic incorrectly treats a "canceled" Stripe payment as blocking for new payment attempts.

---

### TS-03.12: Unauthenticated user cannot access credit card payment flow

**Traces to:** IMPLICIT — no direct spec scenario
**Category:** EDGE CASE
**Criticality:** MEDIUM

**GIVEN:**
- A visitor is not logged in

**WHEN:**
- The visitor views the detail page for a paid class
- The visitor attempts to access the Stripe payment endpoint directly

**THEN:**
- No active credit card payment button is visible on the detail page
- Direct API calls to the Stripe payment-intent endpoint return 401
- Navigating to the checkout success route redirects to the login page

---

## Coverage Summary

**F-03.1** — TS-03.01, TS-03.02, TS-03.03, TS-03.04 (Happy Path, Constraint Validation)
**F-03.2** — TS-03.05, TS-03.06, TS-03.07, TS-03.08 (Failure, Edge Case)
**F-03.3** — TS-03.09, TS-03.10, TS-03.11 (Edge Case)
**(implicit)** — TS-03.12 (Edge Case)

**Total spec scenarios in scope:** 3
**Total test scenarios generated:** 12
**Expansion ratio:** 12/3 (4.0x)

### Gaps

- **Stripe webhook retry behavior:** Stripe retries failed webhook deliveries. The spec does not address idempotency of webhook handling (e.g., receiving `payment_intent.succeeded` twice for the same payment). Flagged as potentially unspecified.
- **Partial payment / 3D Secure:** The spec does not address the intermediate state during 3D Secure authentication (where the payment is `requires_action`). No scenario generated.
- **Currency display on Stripe checkout:** Whether the Stripe checkout shows JPY or another currency is handled by Stripe configuration, not the platform UI. No scenario generated.
