# Test Scenarios: F-12 — Wallet Flow Verification

**Source spec:** milestone-4-spec.md
**Scope:** F-12 (with mid-flow disconnect coverage intersecting F-02)
**Generated:** 2026-02-19
**Status:** DRAFT — requires operator review

---

## Prerequisites

- The platform is deployed and accessible
- A Student account `[Student_A]` exists with a custodial wallet
- A Teacher account `[Teacher_A]` exists with permission to create and manage classes
- A supported external browser wallet `[Wallet_Supported]` is installed in the test browser and unlocked
- A second supported external browser wallet `[Wallet_Supported_B]` is available (distinct from `[Wallet_Supported]`) for multi-wallet scenarios
- An unsupported browser wallet `[Wallet_Unsupported]` is installed in the test browser
- A class `[Class_Alpha]` exists, created by `[Teacher_A]`, with a price set in JPY and an ADA equivalent available
- `[Student_A]` has not yet purchased `[Class_Alpha]`

---

## Scenarios

### TS-12.01: Student connects a supported wallet successfully

**Traces to:** F-12.1
**Category:** HAPPY PATH
**Criticality:** BLOCKING

**GIVEN:**
- `[Student_A]` is logged in
- `[Wallet_Supported]` is installed and unlocked in the browser

**WHEN:**
- `[Student_A]` initiates wallet connection from the platform

**THEN:**
- The platform displays `[Student_A]`'s connected wallet address
- The wallet connection status is visually indicated as connected

---

### TS-12.02: Teacher connects a supported wallet successfully

**Traces to:** F-12.1
**Category:** HAPPY PATH
**Criticality:** BLOCKING

**GIVEN:**
- `[Teacher_A]` is logged in
- `[Wallet_Supported]` is installed and unlocked in the browser

**WHEN:**
- `[Teacher_A]` initiates wallet connection from the platform

**THEN:**
- The platform displays `[Teacher_A]`'s connected wallet address
- The wallet connection status is visually indicated as connected

---

### TS-12.03: Student can access wallet-dependent actions after connecting

**Traces to:** F-12.1
**Category:** HAPPY PATH
**Criticality:** HIGH

**GIVEN:**
- `[Student_A]` is logged in
- `[Student_A]` has successfully connected `[Wallet_Supported]`
- `[Class_Alpha]` is viewable and purchasable

**WHEN:**
- `[Student_A]` navigates to the purchase UI for `[Class_Alpha]`

**THEN:**
- The ADA payment option is enabled and interactive
- `[Student_A]` can initiate the ADA payment flow

---

### TS-12.04: Teacher can access wallet-dependent actions after connecting

**Traces to:** F-12.1
**Category:** HAPPY PATH
**Criticality:** HIGH

**GIVEN:**
- `[Teacher_A]` is logged in
- `[Teacher_A]` has successfully connected `[Wallet_Supported]`
- `[Class_Alpha]` has at least one student who has completed the class

**WHEN:**
- `[Teacher_A]` navigates to the class roster for `[Class_Alpha]`

**THEN:**
- The mint-and-send certificate action is enabled and interactive for completed students

---

### TS-12.05: Unsupported wallet connection is rejected with guidance

**Traces to:** F-12.2
**Category:** FAILURE
**Criticality:** HIGH

**GIVEN:**
- `[Student_A]` is logged in
- `[Wallet_Unsupported]` is the only wallet installed in the browser

**WHEN:**
- `[Student_A]` attempts to connect a wallet from the platform

**THEN:**
- The connection does not succeed
- `[Student_A]` sees a message listing the wallets that are supported

**NOTES:** The specific set of supported wallets is unresolved (OQ-01). The downstream agent should derive the expected list from platform configuration. This scenario is conditional on OQ-01 being resolved.

---

### TS-12.06: Locked wallet is treated as a connection failure

**Traces to:** F-12.1
**Category:** FAILURE
**Criticality:** HIGH

**GIVEN:**
- `[Student_A]` is logged in
- `[Wallet_Supported]` is installed but locked (password-protected, not yet unlocked by the user)

**WHEN:**
- `[Student_A]` initiates wallet connection from the platform

**THEN:**
- The connection does not succeed
- `[Student_A]` sees a failure indication that the wallet could not be accessed
- Wallet-dependent actions remain disabled

**NOTES:** A locked wallet means the user has not proven they can access it. The platform must not treat a locked wallet as connected.

---

### TS-12.07: No wallet extension installed

**Traces to:** F-12.2
**Category:** FAILURE
**Criticality:** HIGH

**GIVEN:**
- `[Student_A]` is logged in
- No browser wallet extension is installed

**WHEN:**
- `[Student_A]` initiates wallet connection from the platform

**THEN:**
- The connection does not succeed
- `[Student_A]` sees a message indicating that no wallet was detected and listing the supported wallets

---

### TS-12.08: Wallet disconnects mid-session — wallet-dependent actions disabled

**Traces to:** F-12.3
**Category:** EDGE CASE
**Criticality:** HIGH

**GIVEN:**
- `[Student_A]` is logged in
- `[Student_A]` has successfully connected `[Wallet_Supported]`
- Wallet-dependent actions are currently enabled

**WHEN:**
- `[Wallet_Supported]` is disconnected (browser extension disabled or user manually disconnects through the wallet)

**THEN:**
- The platform no longer displays a connected wallet address for `[Student_A]`
- Wallet-dependent actions (such as ADA payment) are disabled
- `[Student_A]` sees a prompt to reconnect a wallet

---

### TS-12.09: Wallet disconnects mid-session — Teacher actions disabled

**Traces to:** F-12.3
**Category:** EDGE CASE
**Criticality:** HIGH

**GIVEN:**
- `[Teacher_A]` is logged in
- `[Teacher_A]` has successfully connected `[Wallet_Supported]`
- `[Teacher_A]` is viewing a class roster with wallet-dependent actions enabled

**WHEN:**
- `[Wallet_Supported]` is disconnected

**THEN:**
- The platform no longer displays a connected wallet address for `[Teacher_A]`
- Wallet-dependent actions (such as mint-and-send certificate) are disabled
- `[Teacher_A]` sees a prompt to reconnect a wallet

---

### TS-12.10: Wallet disconnects during active ADA payment flow

**Traces to:** F-12.3, F-02.1
**Category:** EDGE CASE
**Criticality:** HIGH

**GIVEN:**
- `[Student_A]` is logged in
- `[Student_A]` has successfully connected `[Wallet_Supported]`
- `[Student_A]` has initiated an ADA payment for `[Class_Alpha]` but has not yet confirmed the transaction in the wallet

**WHEN:**
- `[Wallet_Supported]` is disconnected before `[Student_A]` confirms the transaction

**THEN:**
- The payment flow does not complete
- No payment is submitted on-chain
- `[Student_A]` is not granted access to `[Class_Alpha]`
- `[Student_A]` sees an indication that the wallet was disconnected and is prompted to reconnect
- `[Student_A]` can re-initiate purchase from the class page after reconnecting

---

### TS-12.11: Wallet disconnects while ADA payment is pending confirmation

**Traces to:** F-12.3, F-02.2
**Category:** EDGE CASE
**Criticality:** MEDIUM

**GIVEN:**
- `[Student_A]` is logged in
- `[Student_A]` has successfully connected `[Wallet_Supported]`
- `[Student_A]` has confirmed an ADA payment for `[Class_Alpha]` and the transaction has been submitted but has not yet reached 10 on-chain confirmations

**WHEN:**
- `[Wallet_Supported]` is disconnected after the transaction is submitted

**THEN:**
- The platform continues to track the pending transaction regardless of wallet connection state
- `[Student_A]` sees the pending payment status for `[Class_Alpha]`
- The wallet disconnection does not cancel or invalidate the already-submitted transaction

**NOTES:** Once a transaction is on-chain, the wallet connection state should not affect its confirmation tracking. The platform should still detect the disconnect and prompt reconnection, but the pending transaction state is independent.

---

### TS-12.12: Duplicate wallet connection attempt while already connected

**Traces to:** F-12.1
**Category:** EDGE CASE
**Criticality:** LOW

**GIVEN:**
- `[Student_A]` is logged in
- `[Student_A]` has already connected `[Wallet_Supported]`

**WHEN:**
- `[Student_A]` initiates wallet connection again

**THEN:**
- The platform remains in a connected state with the same wallet address displayed
- No error or inconsistent state occurs
- Wallet-dependent actions remain enabled

---

### TS-12.13: Connect a different wallet while one is already connected

**Traces to:** F-12.1
**Category:** EDGE CASE
**Criticality:** MEDIUM

**GIVEN:**
- `[Student_A]` is logged in
- `[Student_A]` has connected `[Wallet_Supported]`
- `[Wallet_Supported_B]` is also installed and unlocked in the browser

**WHEN:**
- `[Student_A]` initiates wallet connection and selects `[Wallet_Supported_B]`

**THEN:**
- The platform updates to display the address of `[Wallet_Supported_B]`
- The previously connected `[Wallet_Supported]` is no longer shown as the active wallet
- Wallet-dependent actions remain enabled using the newly connected wallet

---

### TS-12.14: Each supported wallet type connects successfully (SC-06 parametric)

**Traces to:** F-12.1, SC-06
**Category:** CONSTRAINT VALIDATION
**Criticality:** BLOCKING

**GIVEN:**
- `[Student_A]` is logged in
- A wallet of type `[Wallet_Type_N]` is installed and unlocked, where `[Wallet_Type_N]` is each wallet in the platform's supported set

**WHEN:**
- `[Student_A]` initiates wallet connection using `[Wallet_Type_N]`

**THEN:**
- The connection succeeds
- The platform displays the connected wallet address
- Wallet-dependent actions are enabled

**NOTES:** This scenario must be executed once per supported wallet type. The full list depends on OQ-01 resolution. SC-06 requires that ALL currently supported wallets function correctly for purchasing, minting/receiving NFT certificates, and teacher send operations. This scenario validates the connection prerequisite for each wallet type.

---

### TS-12.15: Wallet connection state does not persist after logout

**Traces to:** F-12.1
**Category:** EDGE CASE
**Criticality:** MEDIUM

**GIVEN:**
- `[Student_A]` is logged in
- `[Student_A]` has connected `[Wallet_Supported]`

**WHEN:**
- `[Student_A]` logs out and logs back in

**THEN:**
- The platform does not show a connected wallet
- Wallet-dependent actions are disabled until `[Student_A]` connects a wallet again

---

### TS-12.16: Unauthenticated user cannot access wallet connection

**Traces to:** IMPLICIT — no direct spec scenario
**Category:** EDGE CASE
**Criticality:** MEDIUM

**GIVEN:**
- A user is visiting the platform without being logged in

**WHEN:**
- The user attempts to access any wallet connection UI

**THEN:**
- The wallet connection flow is not available
- The user is directed to log in first

---

## Coverage Summary

| Spec Scenario | Test Scenarios | Categories Covered |
|---------------|----------------|--------------------|
| F-12.1 | TS-12.01, TS-12.02, TS-12.03, TS-12.04, TS-12.12, TS-12.13, TS-12.14, TS-12.15 | Happy Path, Edge Case, Constraint Validation |
| F-12.2 | TS-12.05, TS-12.07 | Failure |
| F-12.3 | TS-12.08, TS-12.09, TS-12.10, TS-12.11 | Edge Case |
| (implicit) | TS-12.06, TS-12.16 | Failure, Edge Case |

**Total spec scenarios in scope:** 3
**Total test scenarios generated:** 16
**Expansion ratio:** 5.3x

### Gaps

- **Supported wallet enumeration (OQ-01):** TS-12.05, TS-12.07, and TS-12.14 all depend on knowing the exact set of supported wallets. Until OQ-01 is resolved, the downstream agent must derive the list from platform configuration. TS-12.14 cannot be fully instantiated until then.
- **Concurrent wallet connections across tabs:** The spec does not address what happens if a user connects a wallet in one browser tab and disconnects in another. Not covered here — flagged as potentially unspecified.
- **Mobile / non-desktop wallet support:** The spec refers to "browser-based" wallets only. No mobile wallet scenarios are generated. If mobile support is planned, additional scenarios would be needed.
- **Session expiry with wallet connected:** The spec covers manual disconnect and logout but not session timeout while a wallet is connected. Flagged as potentially unspecified.
