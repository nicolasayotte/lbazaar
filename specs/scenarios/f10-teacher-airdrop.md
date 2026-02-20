# Test Scenarios: F-10 — Teacher Mints and Sends Certificates

**Source spec:** milestone-4-spec.md
**Scope:** F-10
**Generated:** 2026-02-19
**Status:** DRAFT — requires operator review

---

## Prerequisites

- The platform is deployed and accessible
- [Teacher_A] owns [Class_Alpha], which has an NFT certificate reward configured (per F-05)
- [Student_Completed] has met the completion criteria for [Class_Alpha]
- [Student_InProgress] is enrolled in [Class_Alpha] but has not met the completion criteria
- [Student_NotStarted] is enrolled in [Class_Alpha] but has not begun any coursework
- [Student_WithNFT] has met the completion criteria for [Class_Alpha] and already holds an NFT certificate for it
- [Student_ExternalWallet] has met the completion criteria for [Class_Alpha] and has a supported external wallet connected
- [Student_ExternalInvalid] has met the completion criteria for [Class_Alpha] and has an external wallet connected, but the wallet is in an invalid state (e.g., disconnected, unsupported)
- [Teacher_B] exists but does not own [Class_Alpha]
- [Class_Alpha] has multiple completed students: [Student_Batch_1], [Student_Batch_2], [Student_Batch_3], [Student_Batch_4] — all have met completion criteria
- [Class_NoNFT] is a class owned by [Teacher_A] that does not have an NFT certificate reward configured
- The platform has a global configuration parameter for the number of on-chain confirmations required to settle a transaction (default: 10)

---

## Scenarios

### TS-10.01: Teacher sends certificate to completed student — teacher-side confirmation

**Traces to:** F-10.1
**Category:** HAPPY PATH
**Criticality:** BLOCKING

**GIVEN:**
- [Teacher_A] is viewing the class roster for [Class_Alpha]
- [Student_Completed] is visible in the roster as having completed the class

**WHEN:**
- [Teacher_A] initiates the mint-and-send action for [Student_Completed]

**THEN:**
- [Teacher_A] sees a confirmation indicating the NFT certificate was successfully minted and sent to [Student_Completed]

---

### TS-10.02: Teacher sends certificate to completed student — student receives NFT

**Traces to:** F-10.1
**Category:** HAPPY PATH
**Criticality:** BLOCKING

**GIVEN:**
- [Teacher_A] has successfully completed the mint-and-send action for [Student_Completed] on [Class_Alpha]

**WHEN:**
- [Student_Completed] views their wallet or rewards

**THEN:**
- [Student_Completed] can see the NFT certificate for [Class_Alpha] in their custodial wallet

---

### TS-10.03: Teacher re-sends certificate to student who already holds one

**Traces to:** F-10.1
**Category:** HAPPY PATH
**Criticality:** HIGH

**GIVEN:**
- [Teacher_A] is viewing the class roster for [Class_Alpha]
- [Student_WithNFT] already holds an NFT certificate for [Class_Alpha]

**WHEN:**
- [Teacher_A] initiates the mint-and-send action for [Student_WithNFT]

**THEN:**
- The action succeeds and [Teacher_A] sees a confirmation
- [Student_WithNFT] holds the newly minted certificate (the certificate is bound to the student via metadata, making re-minting idempotent)

**NOTES:** Operator confirmed: re-sending is intentionally allowed for lost certificate recovery. Certificate identity is bound to the student via metadata (e.g., email), so minting multiple is idempotent.

---

### TS-10.04: Certificate delivered to external wallet when available and valid

**Traces to:** F-10.1, F-08.2
**Category:** HAPPY PATH
**Criticality:** HIGH

**GIVEN:**
- [Teacher_A] is viewing the class roster for [Class_Alpha]
- [Student_ExternalWallet] has completed [Class_Alpha] and has a valid, supported external wallet connected

**WHEN:**
- [Teacher_A] initiates the mint-and-send action for [Student_ExternalWallet]

**THEN:**
- The NFT certificate is delivered to [Student_ExternalWallet]'s external wallet (not the custodial wallet)
- [Teacher_A] sees confirmation of successful delivery

**NOTES:** Operator confirmed: wallet routing prefers external wallet if available and valid, otherwise falls back to custodial.

---

### TS-10.04a: Certificate falls back to custodial wallet when external wallet is invalid

**Traces to:** F-10.1, F-08.2
**Category:** EDGE CASE
**Criticality:** HIGH

**GIVEN:**
- [Teacher_A] is viewing the class roster for [Class_Alpha]
- [Student_ExternalInvalid] has completed [Class_Alpha] and has an external wallet connected, but it is in an invalid state

**WHEN:**
- [Teacher_A] initiates the mint-and-send action for [Student_ExternalInvalid]

**THEN:**
- The NFT certificate is delivered to [Student_ExternalInvalid]'s custodial wallet as a fallback
- [Teacher_A] sees confirmation of successful delivery

**NOTES:** Operator confirmed: external wallet if available AND valid, otherwise custodial. This tests the fallback path when the external wallet exists but is not in a valid state.

---

### TS-10.05: Teacher attempts to send to student who has not completed the class

**Traces to:** F-10.2
**Category:** FAILURE
**Criticality:** BLOCKING

**GIVEN:**
- [Teacher_A] is viewing the class roster for [Class_Alpha]
- [Student_NotStarted] is visible in the roster and has not met the completion criteria

**WHEN:**
- [Teacher_A] attempts to initiate the mint-and-send action for [Student_NotStarted]

**THEN:**
- The action is blocked
- [Teacher_A] sees a message explaining that [Student_NotStarted] has not completed the class

---

### TS-10.06: Teacher attempts to send to student who is in-progress but not completed

**Traces to:** F-10.2
**Category:** BOUNDARY
**Criticality:** HIGH

**GIVEN:**
- [Teacher_A] is viewing the class roster for [Class_Alpha]
- [Student_InProgress] has started [Class_Alpha] but has not met the completion criteria

**WHEN:**
- [Teacher_A] attempts to initiate the mint-and-send action for [Student_InProgress]

**THEN:**
- The action is blocked
- [Teacher_A] sees a message explaining that [Student_InProgress] has not completed the class

**NOTES:** This tests the boundary between "enrolled and active" vs. "completed." The system must not treat partial progress as completion.

---

### TS-10.07: On-chain minting fails — teacher sees failure message

**Traces to:** F-10.3
**Category:** FAILURE
**Criticality:** BLOCKING

**GIVEN:**
- [Teacher_A] is viewing the class roster for [Class_Alpha]
- [Student_Completed] has met the completion criteria
- The on-chain minting service is in a state that will cause a transaction failure

**WHEN:**
- [Teacher_A] initiates the mint-and-send action for [Student_Completed]

**THEN:**
- [Teacher_A] sees a clear failure message indicating the minting did not succeed

---

### TS-10.08: After minting failure, no partial or invalid NFT is delivered

**Traces to:** F-10.3
**Category:** FAILURE
**Criticality:** BLOCKING

**GIVEN:**
- [Teacher_A] initiated the mint-and-send action for [Student_Completed] on [Class_Alpha]
- The on-chain minting transaction failed

**WHEN:**
- [Student_Completed] views their wallet or rewards

**THEN:**
- No NFT certificate for [Class_Alpha] is present in [Student_Completed]'s wallet
- No partial, invalid, or orphaned certificate artifact is visible to [Student_Completed]

---

### TS-10.09: Teacher retries send after a previous failure

**Traces to:** F-10.3
**Category:** EDGE CASE
**Criticality:** HIGH

**GIVEN:**
- [Teacher_A] previously attempted to mint-and-send a certificate to [Student_Completed] for [Class_Alpha] and the attempt failed
- [Teacher_A] is viewing the class roster for [Class_Alpha]

**WHEN:**
- [Teacher_A] initiates the mint-and-send action for [Student_Completed] again

**THEN:**
- The retry is permitted (the action is not permanently locked from the previous failure)
- If the on-chain transaction succeeds this time, [Teacher_A] sees confirmation and [Student_Completed] receives the certificate

---

### TS-10.10: Teacher rapidly initiates send twice for the same student

**Traces to:** IMPLICIT — no direct spec scenario
**Category:** EDGE CASE
**Criticality:** MEDIUM

**GIVEN:**
- [Teacher_A] is viewing the class roster for [Class_Alpha]
- [Student_Completed] has met the completion criteria

**WHEN:**
- [Teacher_A] initiates the mint-and-send action for [Student_Completed] twice in rapid succession (e.g., double-click)

**THEN:**
- The system does not process two concurrent minting transactions for the same student and class
- [Teacher_A] sees exactly one outcome (either one confirmation or one failure) — not two

**NOTES:** Since re-minting is idempotent, a double-send is not catastrophic. However, the system should still prevent redundant concurrent on-chain transactions as a resource concern.

---

### TS-10.11: Mint-and-send action is only available on NFT-configured classes

**Traces to:** IMPLICIT — no direct spec scenario (informed by F-05 interaction)
**Category:** CONSTRAINT VALIDATION
**Criticality:** HIGH

**GIVEN:**
- [Teacher_A] is viewing the class roster for [Class_NoNFT]
- [Class_NoNFT] does not have an NFT certificate reward configured

**WHEN:**
- [Teacher_A] looks for the mint-and-send action in the roster

**THEN:**
- The mint-and-send action is not available (not visible or not initiable)

**NOTES:** Operator confirmed: mint-and-send is only possible when an NFT is configured as a class reward. This scenario validates that the action does not appear for classes without the configuration.

---

### TS-10.12: Student cannot access the mint-and-send action

**Traces to:** IMPLICIT — no direct spec scenario
**Category:** CONSTRAINT VALIDATION
**Criticality:** HIGH

**GIVEN:**
- [Student_Completed] is logged in and has completed [Class_Alpha]

**WHEN:**
- [Student_Completed] navigates to any view related to [Class_Alpha]

**THEN:**
- No mint-and-send action is available to [Student_Completed]
- The class roster with teacher mint-and-send controls is not accessible to [Student_Completed]

---

### TS-10.13: Teacher cannot send certificates for a class they do not own

**Traces to:** IMPLICIT — no direct spec scenario
**Category:** CONSTRAINT VALIDATION
**Criticality:** HIGH

**GIVEN:**
- [Teacher_B] is logged in
- [Teacher_B] does not own [Class_Alpha]

**WHEN:**
- [Teacher_B] attempts to access the class roster or mint-and-send action for [Class_Alpha]

**THEN:**
- [Teacher_B] cannot initiate the mint-and-send action for [Class_Alpha]
- The system either does not display [Class_Alpha]'s roster to [Teacher_B] or blocks the action with an appropriate message

---

### TS-10.14: No private key material exposed during teacher-initiated mint flow

**Traces to:** SC-03
**Category:** CONSTRAINT VALIDATION
**Criticality:** BLOCKING

**GIVEN:**
- [Teacher_A] is initiating the mint-and-send action for [Student_Completed] on [Class_Alpha]

**WHEN:**
- The mint-and-send flow executes from initiation through confirmation (or failure)

**THEN:**
- At no point during the flow is any private key material for any custodial wallet displayed, included in any user-visible message, or exposed in any client-accessible response

**NOTES:** SC-03 requires that no private key material for custodial wallets is exposed to the client. This scenario may require a specialized verification approach beyond standard UI testing (e.g., inspecting network responses). The downstream agent should determine the appropriate verification method.

---

### TS-10.15: Class roster reflects certificate-sent status after successful send

**Traces to:** F-10.1
**Category:** HAPPY PATH
**Criticality:** MEDIUM

**GIVEN:**
- [Teacher_A] has successfully minted and sent a certificate to [Student_Completed] for [Class_Alpha]

**WHEN:**
- [Teacher_A] views the class roster for [Class_Alpha]

**THEN:**
- The roster entry for [Student_Completed] reflects that a certificate has been sent or delivered
- The state is distinguishable from students who have completed but not yet received a certificate

---

### TS-10.16: Teacher sees progress bar with blockchain status messages during mint-and-send

**Traces to:** F-10.1
**Category:** HAPPY PATH
**Criticality:** HIGH

**GIVEN:**
- [Teacher_A] is viewing the class roster for [Class_Alpha]
- [Student_Completed] has met the completion criteria

**WHEN:**
- [Teacher_A] initiates the mint-and-send action for [Student_Completed]
- The on-chain transaction is being processed (between initiation and final settlement)

**THEN:**
- [Teacher_A] sees a progress bar indicating the transaction is in progress
- [Teacher_A] sees relevant status messages reflecting the stages of the blockchain interaction (e.g., transaction submitted, awaiting confirmations, settled)
- The progress indicator remains visible until the transaction reaches the required number of confirmations

**NOTES:** Operator confirmed: pending state UX should show a progress bar with relevant messages from the blockchain service interaction.

---

### TS-10.17: Transaction settlement uses globally configured confirmation threshold

**Traces to:** F-10.1, SC-02
**Category:** CONSTRAINT VALIDATION
**Criticality:** HIGH

**GIVEN:**
- The platform's global confirmation threshold is set to its default value (10 confirmations)
- [Teacher_A] initiates a mint-and-send for [Student_Completed] on [Class_Alpha]

**WHEN:**
- The on-chain transaction has been submitted and is accumulating confirmations

**THEN:**
- The transaction is not considered settled until it reaches the globally configured number of confirmations
- The progress indicator reflects progress toward the configured threshold (not a hardcoded value)

**NOTES:** Operator confirmed: 10 confirmations is the Cardano standard but must be a global configuration parameter, not hardcoded. This scenario validates that settlement respects the configured value. The downstream agent should verify that changing this parameter changes the settlement behavior.

---

### TS-10.18: Airdrop to multiple students — multi-transaction progress UX

**Traces to:** F-10.1
**Category:** HAPPY PATH
**Criticality:** HIGH

**GIVEN:**
- [Teacher_A] is viewing the class roster for [Class_Alpha]
- [Student_Batch_1], [Student_Batch_2], [Student_Batch_3], and [Student_Batch_4] have all met the completion criteria
- The airdrop may require multiple on-chain transactions (even though multiple NFTs can be minted in a single transaction, the system may need to send several transactions depending on batch size or protocol limits)

**WHEN:**
- [Teacher_A] initiates a batch mint-and-send (airdrop) for all completed students

**THEN:**
- [Teacher_A] sees an airdrop-specific progress UX that reflects the multi-transaction nature of the operation
- The progress indicates how many transactions are needed and the status of each
- [Teacher_A] can see which students' certificates have been sent and which are still pending

**NOTES:** Operator confirmed: there should be a specific UX for airdrops since multiple transactions might need to be sent and waited upon. Even though batch minting in a single transaction is possible, the UX must account for multi-transaction flows.

---

### TS-10.19: Airdrop — partial success when some transactions fail

**Traces to:** F-10.3
**Category:** EDGE CASE
**Criticality:** HIGH

**GIVEN:**
- [Teacher_A] initiates a batch mint-and-send (airdrop) for [Student_Batch_1], [Student_Batch_2], [Student_Batch_3], and [Student_Batch_4] on [Class_Alpha]
- One or more of the on-chain transactions in the batch fails while others succeed

**WHEN:**
- The airdrop completes processing all transactions

**THEN:**
- [Teacher_A] sees a clear summary distinguishing which students received certificates and which did not
- Students whose transactions succeeded hold their certificates
- Students whose transactions failed do not hold any partial or invalid certificate
- [Teacher_A] can retry the failed sends without re-sending to students who already received theirs

---

### TS-10.20: Teacher's wallet has insufficient funds for minting fees

**Traces to:** F-10.3
**Category:** FAILURE
**Criticality:** HIGH

**GIVEN:**
- [Teacher_A] is viewing the class roster for [Class_Alpha]
- [Student_Completed] has met the completion criteria
- [Teacher_A]'s wallet does not have sufficient ADA to cover the minting transaction fees

**WHEN:**
- [Teacher_A] initiates the mint-and-send action for [Student_Completed]

**THEN:**
- The action fails with a clean, user-friendly error message
- The error message explains that there are insufficient funds in the teacher's wallet to cover minting fees
- No NFT certificate is minted or delivered
- The action can be retried after the teacher adds funds to their wallet

**NOTES:** Operator confirmed: minting fees come from the teacher's wallet. Insufficient funds should trigger a clean UX error with an explanation, not a generic system error.

---

### TS-10.21: Airdrop — insufficient funds error reflects total batch cost

**Traces to:** F-10.3
**Category:** FAILURE
**Criticality:** MEDIUM

**GIVEN:**
- [Teacher_A] is viewing the class roster for [Class_Alpha]
- [Student_Batch_1], [Student_Batch_2], [Student_Batch_3], and [Student_Batch_4] have all met the completion criteria
- [Teacher_A]'s wallet has some ADA but not enough to cover fees for the full batch airdrop

**WHEN:**
- [Teacher_A] initiates a batch mint-and-send (airdrop) for all completed students

**THEN:**
- [Teacher_A] sees a clear error indicating insufficient funds for the airdrop
- The error conveys the scope of the shortfall (the teacher understands that the cost relates to the batch size, not a single send)
- No certificates are minted or delivered in a partial state

**NOTES:** This tests the pre-flight check for batch operations. The system should ideally estimate costs before starting the airdrop rather than failing mid-batch due to funds running out.

---

## Coverage Summary

**F-10.1** — TS-10.01, TS-10.02, TS-10.03, TS-10.04, TS-10.04a, TS-10.15, TS-10.16, TS-10.18 (Happy Path, Edge Case)
**F-10.2** — TS-10.05, TS-10.06 (Failure, Boundary)
**F-10.3** — TS-10.07, TS-10.08, TS-10.09, TS-10.19, TS-10.20, TS-10.21 (Failure, Edge Case)
**(implicit)** — TS-10.10 (Edge Case)
**(implicit — F-05 interaction)** — TS-10.11 (Constraint Validation)
**(implicit — authorization)** — TS-10.12, TS-10.13 (Constraint Validation)
**SC-02 / SC-03** — TS-10.14, TS-10.17 (Constraint Validation)

**Total spec scenarios in scope:** 3
**Total test scenarios generated:** 21
**Expansion ratio:** 7.0x

### Resolved Gaps (via operator clarification)

- **Wallet routing** — RESOLVED: External wallet if available and valid, otherwise custodial fallback. Covered by TS-10.04 and TS-10.04a.
- **Pending state UX** — RESOLVED: Progress bar with blockchain status messages. Specific airdrop UX for multi-transaction flows. Covered by TS-10.16, TS-10.17, TS-10.18.
- **Minting fee source** — RESOLVED: Fees come from teacher's wallet. Insufficient funds triggers clean UX error. Covered by TS-10.20, TS-10.21.

### Remaining Gaps

- **Airdrop initiation UX:** The spec and clarifications describe what the airdrop progress looks like, but do not specify how the teacher initiates a batch send vs. individual sends. Is there a "select all completed students" action, individual checkboxes, or an "airdrop all" button? The downstream agent should determine the initiation mechanism from the UI.
- **External wallet validation criteria:** TS-10.04a tests the fallback when an external wallet is "invalid," but the spec does not define what makes a wallet invalid (disconnected? wrong network? expired session?). The downstream agent should test with whatever invalid states the system recognizes.
- **Fee estimation visibility:** TS-10.20 and TS-10.21 test failure when funds are insufficient, but it is unspecified whether the teacher sees an estimated cost *before* initiating the action. A pre-flight cost estimate would improve UX but is not explicitly required by the spec.
