# Test Scenarios: F-08, F-09 — Student Reward Delivery on Completion

**Source spec:** specs/milestone-4-spec.md
**Scope:** F-08 (Student Receives NFT Certificate on Completion), F-09 (Student Receives Token Reward on Completion), F-07.1 cascade (combined reward delivery)
**Generated:** 2026-02-19
**Revised:** 2026-02-19 — operator clarifications on external wallets for tokens, duplicate completion, teacher retry roster, and course failure exclusion
**Status:** DRAFT — requires operator review

---

## Prerequisites

Conditions that must hold before any scenario in this set can run:

- The platform is deployed and accessible
- [Teacher_Alpha] has an active teacher account with permission to create and configure classes
- [Student_Custodial] has an active student account with a platform-managed custodial wallet; no external wallet is connected
- [Student_External] has an active student account, a custodial wallet, and a valid external browser wallet connected
- [Student_InvalidWallet] has an active student account and an external wallet connected whose on-chain address is not a valid receiving address
- [Student_B] has an active student account with a custodial wallet and no external wallet connected (used in concurrency scenarios)
- [Student_Failed] has an active student account and is enrolled in the relevant class but has failed the course examination
- [Class_NFT_Only] has been created by [Teacher_Alpha] with an NFT certificate reward configured and no token reward configured
- [Class_Token_Only] has been created by [Teacher_Alpha] with a token reward configured and no NFT certificate reward configured
- [Class_Both_Rewards] has been created by [Teacher_Alpha] with both an NFT certificate reward and a token reward configured
- [Class_No_Reward] has been created by [Teacher_Alpha] with no completion reward of any kind configured
- All students are enrolled in all relevant classes and have not yet completed them, unless a specific scenario states otherwise
- **"Completion" means passing the course examination successfully.** Students who fail the examination do not complete the course and are never eligible for rewards. This is the existing platform behavior and applies to all scenarios below.
- The platform's existing course completion criteria are deterministic and can be reliably triggered in a test environment

---

## F-08 Scenarios: Student Receives NFT Certificate on Completion

---

### TS-08.01: NFT certificate delivered to custodial wallet on completion

**Traces to:** F-08.1
**Category:** HAPPY PATH
**Criticality:** BLOCKING

**GIVEN:**
- [Student_Custodial] is enrolled in [Class_NFT_Only] and has not yet completed it
- [Student_Custodial] has no external wallet connected

**WHEN:**
- [Student_Custodial] meets the completion criteria for [Class_NFT_Only]

**THEN:**
- The NFT certificate for [Class_NFT_Only] is visible in [Student_Custodial]'s custodial wallet
- [Student_Custodial] sees a notification or UI element confirming receipt of the NFT certificate

**NOTES:** Confirmation without delivery, or delivery without confirmation, are both failures. "Visible in custodial wallet" means the NFT appears in whatever wallet or profile view the platform exposes for custodial wallet contents.

---

### TS-08.02: NFT certificate delivered to external wallet when connected

**Traces to:** F-08.2
**Category:** HAPPY PATH
**Criticality:** HIGH

**GIVEN:**
- [Student_External] is enrolled in [Class_NFT_Only] and has not yet completed it
- [Student_External] has a valid external wallet connected

**WHEN:**
- [Student_External] meets the completion criteria for [Class_NFT_Only]

**THEN:**
- The NFT certificate for [Class_NFT_Only] is delivered to [Student_External]'s external wallet
- The NFT certificate is NOT present in [Student_External]'s custodial wallet
- [Student_External] sees a notification or UI element confirming receipt

**NOTES:** The negative assertion ("NOT in custodial") is essential — delivery to the wrong wallet is a silent bug. Operator confirmed: when a valid external wallet is connected, the delivery target is the external wallet. This supersedes Assumption A-04 for the external-wallet case.

---

### TS-08.03: Minting failure — student sees pending notice, completion preserved

**Traces to:** F-08.3
**Category:** FAILURE
**Criticality:** HIGH

**GIVEN:**
- [Student_Custodial] has met the completion criteria for [Class_NFT_Only]
- The on-chain minting or delivery transaction for [Student_Custodial]'s NFT certificate fails

**WHEN:**
- [Student_Custodial] views their reward status or the class completion page

**THEN:**
- [Student_Custodial] sees a notice indicating the NFT certificate delivery is pending (not an actionable error)
- [Student_Custodial]'s completion status for [Class_NFT_Only] remains intact and is not reverted

**NOTES:** Operator confirmed: the student sees "pending," not an error they must act on. Resolution is handled at the teacher level (see TS-08.04, TS-08.13).

---

### TS-08.04: Minting failure — teacher sees failure notification

**Traces to:** F-08.3
**Category:** FAILURE
**Criticality:** HIGH

**GIVEN:**
- [Student_Custodial] has met the completion criteria for [Class_NFT_Only]
- The on-chain minting or delivery transaction for [Student_Custodial]'s NFT certificate has failed

**WHEN:**
- [Teacher_Alpha] views the class roster or a relevant notification area for [Class_NFT_Only]

**THEN:**
- [Teacher_Alpha] sees a clear failure notification indicating that the NFT certificate delivery for [Student_Custodial] has failed
- The notification identifies [Student_Custodial] and [Class_NFT_Only] specifically, not just a generic platform error

**NOTES:** Operator confirmed: surfacing the failure to the teacher is the resolution mechanism. The teacher can then retry delivery (see TS-08.13). Exact placement of this notification (roster view, dashboard, email) is an implementation decision.

---

### TS-08.05: Invalid external wallet address — delivery fails, no custodial fallback

**Traces to:** F-08.2
**Category:** FAILURE
**Criticality:** HIGH

**GIVEN:**
- [Student_InvalidWallet] is enrolled in [Class_NFT_Only] and has not yet completed it
- [Student_InvalidWallet] has an external wallet connected whose on-chain address is not a valid receiving address

**WHEN:**
- [Student_InvalidWallet] meets the completion criteria for [Class_NFT_Only]

**THEN:**
- The NFT certificate is not delivered to [Student_InvalidWallet]'s external wallet
- The NFT certificate is not delivered to [Student_InvalidWallet]'s custodial wallet (no fallback for invalid address)
- [Student_InvalidWallet] sees a notice indicating the NFT certificate delivery has failed or is pending
- [Student_InvalidWallet]'s completion status for [Class_NFT_Only] is not reverted

**NOTES:** Operator confirmed: invalid wallet address = hard failure, not a silent fallback to custodial. Fallback to custodial only occurs when the wallet is disconnected (see TS-08.06), not when it is connected but invalid.

---

### TS-08.06: External wallet disconnected before delivery — fallback to custodial

**Traces to:** F-08.2
**Category:** EDGE CASE
**Criticality:** HIGH

**GIVEN:**
- [Student_External] is enrolled in [Class_NFT_Only] and has not yet completed it
- [Student_External] had a valid external wallet connected at the time completion criteria were met
- Before the NFT delivery is executed, [Student_External]'s external wallet becomes disconnected

**WHEN:**
- The system attempts to deliver the NFT certificate for [Class_NFT_Only] to [Student_External]

**THEN:**
- The NFT certificate is delivered to [Student_External]'s custodial wallet (fallback)
- [Student_External] sees a notification confirming receipt
- The NFT certificate is not lost or left undelivered due to the wallet disconnection

**NOTES:** Operator confirmed: disconnection before delivery triggers custodial fallback. The precise timing boundary is an implementation decision.

---

### TS-08.07: No NFT reward configured — no reward notification on completion

**Traces to:** IMPLICIT — no direct spec scenario
**Category:** EDGE CASE
**Criticality:** MEDIUM

**GIVEN:**
- [Student_Custodial] is enrolled in [Class_No_Reward]
- [Class_No_Reward] has no NFT certificate reward configured

**WHEN:**
- [Student_Custodial] meets the completion criteria for [Class_No_Reward]

**THEN:**
- No NFT certificate notification or delivery confirmation is shown to [Student_Custodial]
- No delivery attempt for any NFT certificate is initiated
- [Student_Custodial]'s completion status for [Class_No_Reward] is recorded normally

**NOTES:** Guard scenario. Verifies the completion trigger does not erroneously invoke the NFT delivery pipeline when no reward is configured.

---

### TS-08.08: Custodial wallet delivery — no private key material exposed to client

**Traces to:** IMPLICIT — SC-03
**Category:** CONSTRAINT VALIDATION
**Criticality:** HIGH

**GIVEN:**
- [Student_Custodial] is enrolled in [Class_NFT_Only] and has not yet completed it
- [Student_Custodial] has no external wallet connected

**WHEN:**
- [Student_Custodial] meets the completion criteria for [Class_NFT_Only] and the NFT certificate is delivered to their custodial wallet

**THEN:**
- At no point during the delivery flow does any page, network response, or client-accessible state (including browser storage, rendered UI, or API responses) expose private key material belonging to [Student_Custodial]'s custodial wallet

**NOTES:** Directly validates SC-03. Operator confirmed: private keys are never shown, full stop. This applies to all reward delivery types (NFT and token) and all wallet targets (custodial and external). The downstream agent should treat this constraint as universal.

---

### TS-08.09: Concurrent completions — two students each receive their own NFT

**Traces to:** IMPLICIT — no direct spec scenario
**Category:** EDGE CASE
**Criticality:** MEDIUM

**GIVEN:**
- Both [Student_Custodial] and [Student_B] are enrolled in [Class_NFT_Only] and have not yet completed it
- Neither student has an external wallet connected

**WHEN:**
- [Student_Custodial] and [Student_B] both meet the completion criteria for [Class_NFT_Only] at approximately the same time

**THEN:**
- [Student_Custodial] receives an NFT certificate in their custodial wallet
- [Student_B] receives a separate NFT certificate in their custodial wallet
- Neither student receives the other's certificate
- Each student sees their own independent delivery confirmation

**NOTES:** Tests that the delivery pipeline is not subject to race conditions that could result in one student receiving both NFTs, or neither receiving any.

---

### TS-08.10: Duplicate completion trigger — warning shown before second mint

**Traces to:** IMPLICIT — no direct spec scenario (resolves Gap #2 from v1)
**Category:** EDGE CASE
**Criticality:** HIGH

**GIVEN:**
- [Student_Custodial] has already completed [Class_NFT_Only] and received the NFT certificate for it

**WHEN:**
- [Student_Custodial] attempts to request a second NFT certificate for [Class_NFT_Only]

**THEN:**
- The system displays a clear warning that includes all of the following:
  - Blockchain delivery takes time (up to five minutes)
  - Minting a second certificate will cost additional ADA (or JPY)
  - The certificate will contain [Student_Custodial]'s own user ID and cannot be given to someone else
- [Student_Custodial] is not charged and no second certificate is minted until they explicitly confirm past the warning

**NOTES:** Operator confirmed: duplicate minting is allowed but gated by an explicit, multi-point warning. The warning must mention all three points — time, cost, and non-transferability. The student must take a deliberate action to proceed.

---

### TS-08.11: Duplicate completion trigger — second NFT minted with student user ID

**Traces to:** IMPLICIT — no direct spec scenario (resolves Gap #2 from v1)
**Category:** EDGE CASE
**Criticality:** MEDIUM

**GIVEN:**
- [Student_Custodial] has already completed [Class_NFT_Only] and received the NFT certificate
- [Student_Custodial] has been shown the duplicate-mint warning (see TS-08.10)

**WHEN:**
- [Student_Custodial] confirms they want to proceed with the second mint

**THEN:**
- A second NFT certificate is minted and delivered to [Student_Custodial]'s wallet
- The second certificate contains [Student_Custodial]'s user ID (making it non-transferable / attributable to them)
- [Student_Custodial] sees a delivery confirmation for the second certificate
- The additional cost (ADA or JPY) is charged to [Student_Custodial]

**NOTES:** The certificate's user ID binding ensures it cannot be repurposed for another student. The downstream agent should verify that the second certificate is distinct from the first and carries the student's identity.

---

### TS-08.12: Teacher roster shows per-student NFT delivery status

**Traces to:** F-08.3 (teacher visibility into delivery outcomes)
**Category:** HAPPY PATH
**Criticality:** HIGH

**GIVEN:**
- [Class_NFT_Only] has multiple enrolled students
- Some students have completed the course and received their NFT certificate successfully
- Some students have completed the course but their NFT delivery failed
- [Student_Failed] has failed the course examination

**WHEN:**
- [Teacher_Alpha] views the reward delivery status for [Class_NFT_Only]

**THEN:**
- [Teacher_Alpha] sees a per-student breakdown showing which completed students received their NFT certificate and which did not
- Students whose delivery failed are clearly distinguishable from students whose delivery succeeded
- [Student_Failed] is NOT shown in the reward roster (failed-course students are excluded entirely)

**NOTES:** Operator confirmed: the teacher needs to know WHO received and WHO didn't, so they can retry only for failed deliveries. Students who failed the examination are never eligible for rewards and must not appear in the reward roster at all.

---

### TS-08.13: Teacher retries NFT delivery for student whose delivery failed

**Traces to:** F-08.3
**Category:** HAPPY PATH
**Criticality:** HIGH

**GIVEN:**
- [Student_Custodial] has completed [Class_NFT_Only] but their NFT delivery previously failed
- [Teacher_Alpha] can see [Student_Custodial] in the reward roster as having a failed delivery (see TS-08.12)

**WHEN:**
- [Teacher_Alpha] initiates a retry of the NFT delivery for [Student_Custodial]

**THEN:**
- The system attempts to mint and deliver the NFT certificate to [Student_Custodial] again
- If the retry succeeds, [Student_Custodial] receives the NFT in their wallet and sees a confirmation
- If the retry succeeds, [Teacher_Alpha]'s roster view updates to reflect the successful delivery

**NOTES:** This scenario tests the success path of a teacher-initiated retry. If the retry also fails, the behavior is the same as the original failure (TS-08.03 and TS-08.04 apply again). The downstream agent should consider testing both retry outcomes.

---

### TS-08.14: Failed-course students excluded from reward eligibility

**Traces to:** IMPLICIT — operator clarification on eligibility
**Category:** CONSTRAINT VALIDATION
**Criticality:** HIGH

**GIVEN:**
- [Student_Failed] is enrolled in [Class_NFT_Only] but has failed the course examination
- [Student_Custodial] is enrolled in [Class_NFT_Only] and has passed the course examination

**WHEN:**
- The system processes reward eligibility for [Class_NFT_Only]

**THEN:**
- [Student_Failed] does not receive an NFT certificate
- [Student_Failed] does not see any reward notification or pending state
- [Student_Failed] does not appear in [Teacher_Alpha]'s reward delivery roster for [Class_NFT_Only]
- [Student_Custodial]'s reward eligibility is unaffected by [Student_Failed]'s failure

**NOTES:** Operator confirmed: "ONLY SUCCESSFUL (examinations success) students receive the rewards." This applies to both NFT certificates and token rewards (see TS-09.10). Failed students are invisible to the reward system entirely.

---

## F-09 Scenarios: Student Receives Token Reward on Completion

---

### TS-09.01: Token reward delivered to custodial wallet on completion

**Traces to:** F-09.1
**Category:** HAPPY PATH
**Criticality:** BLOCKING

**GIVEN:**
- [Student_Custodial] is enrolled in [Class_Token_Only] and has not yet completed it
- [Student_Custodial] has no external wallet connected

**WHEN:**
- [Student_Custodial] meets the completion criteria for [Class_Token_Only]

**THEN:**
- The token reward for [Class_Token_Only] is delivered to [Student_Custodial]'s custodial wallet
- [Student_Custodial] sees a notification or UI element confirming the specific amount of tokens received

**NOTES:** "Specific amount" means the quantity configured by [Teacher_Alpha] for [Class_Token_Only] — not a generic success message.

---

### TS-09.02: Distribution failure — student sees pending notice, completion preserved

**Traces to:** F-09.2
**Category:** FAILURE
**Criticality:** HIGH

**GIVEN:**
- [Student_Custodial] has met the completion criteria for [Class_Token_Only]
- The on-chain token distribution transaction fails

**WHEN:**
- [Student_Custodial] views their reward status or the class completion page

**THEN:**
- [Student_Custodial] sees a notice indicating the token reward delivery is pending (not an actionable error)
- [Student_Custodial]'s completion status for [Class_Token_Only] remains intact and is not reverted

**NOTES:** Mirrors TS-08.03 for tokens. Student-facing behavior is "pending," not an error they must act on.

---

### TS-09.03: Distribution failure — teacher sees failure notification

**Traces to:** F-09.2
**Category:** FAILURE
**Criticality:** HIGH

**GIVEN:**
- [Student_Custodial] has met the completion criteria for [Class_Token_Only]
- The on-chain token distribution transaction has failed

**WHEN:**
- [Teacher_Alpha] views the class roster or a relevant notification area for [Class_Token_Only]

**THEN:**
- [Teacher_Alpha] sees a clear failure notification indicating that the token reward delivery for [Student_Custodial] has failed
- The notification identifies [Student_Custodial] and [Class_Token_Only] specifically

**NOTES:** Mirrors TS-08.04 for tokens. Teacher can then retry (see TS-09.09).

---

### TS-09.04: No token reward configured — no reward notification on completion

**Traces to:** IMPLICIT — no direct spec scenario
**Category:** EDGE CASE
**Criticality:** MEDIUM

**GIVEN:**
- [Student_Custodial] is enrolled in [Class_No_Reward]
- [Class_No_Reward] has no token reward configured

**WHEN:**
- [Student_Custodial] meets the completion criteria for [Class_No_Reward]

**THEN:**
- No token reward notification or delivery confirmation is shown to [Student_Custodial]
- No token distribution attempt is initiated
- [Student_Custodial]'s completion status for [Class_No_Reward] is recorded normally

**NOTES:** Guard scenario. Mirrors TS-08.07 for the token delivery pipeline.

---

### TS-09.05: Token reward delivered to external wallet when connected

**Traces to:** F-09.1 (extended by operator clarification)
**Category:** HAPPY PATH
**Criticality:** HIGH

**GIVEN:**
- [Student_External] is enrolled in [Class_Token_Only] and has not yet completed it
- [Student_External] has a valid external wallet connected

**WHEN:**
- [Student_External] meets the completion criteria for [Class_Token_Only]

**THEN:**
- The token reward for [Class_Token_Only] is delivered to [Student_External]'s external wallet
- The token reward is NOT present in [Student_External]'s custodial wallet
- [Student_External] sees a notification confirming the amount of tokens received

**NOTES:** Operator confirmed: token rewards follow the same external wallet logic as NFT certificates — deliver to external wallet if connected and valid, otherwise to custodial. This closes Gap #1 from the v1 document.

---

### TS-09.06: Invalid external wallet address — token delivery fails, no custodial fallback

**Traces to:** F-09.1 (extended by operator clarification)
**Category:** FAILURE
**Criticality:** HIGH

**GIVEN:**
- [Student_InvalidWallet] is enrolled in [Class_Token_Only] and has not yet completed it
- [Student_InvalidWallet] has an external wallet connected whose on-chain address is not a valid receiving address

**WHEN:**
- [Student_InvalidWallet] meets the completion criteria for [Class_Token_Only]

**THEN:**
- The token reward is not delivered to [Student_InvalidWallet]'s external wallet
- The token reward is not delivered to [Student_InvalidWallet]'s custodial wallet (no fallback for invalid address)
- [Student_InvalidWallet] sees a notice indicating the token reward delivery has failed or is pending
- [Student_InvalidWallet]'s completion status for [Class_Token_Only] is not reverted

**NOTES:** Mirrors TS-08.05 for tokens. Invalid address = hard failure, not a silent fallback to custodial.

---

### TS-09.07: External wallet disconnected before delivery — token falls back to custodial

**Traces to:** F-09.1 (extended by operator clarification)
**Category:** EDGE CASE
**Criticality:** HIGH

**GIVEN:**
- [Student_External] is enrolled in [Class_Token_Only] and has not yet completed it
- [Student_External] had a valid external wallet connected at the time completion criteria were met
- Before the token delivery is executed, [Student_External]'s external wallet becomes disconnected

**WHEN:**
- The system attempts to deliver the token reward for [Class_Token_Only] to [Student_External]

**THEN:**
- The token reward is delivered to [Student_External]'s custodial wallet (fallback)
- [Student_External] sees a notification confirming the amount of tokens received
- The token reward is not lost or left undelivered due to the wallet disconnection

**NOTES:** Mirrors TS-08.06 for tokens. Disconnection triggers custodial fallback.

---

### TS-09.08: Teacher roster shows per-student token delivery status

**Traces to:** F-09.2 (teacher visibility into delivery outcomes)
**Category:** HAPPY PATH
**Criticality:** HIGH

**GIVEN:**
- [Class_Token_Only] has multiple enrolled students
- Some students have completed the course and received their token reward successfully
- Some students have completed the course but their token delivery failed
- [Student_Failed] has failed the course examination

**WHEN:**
- [Teacher_Alpha] views the reward delivery status for [Class_Token_Only]

**THEN:**
- [Teacher_Alpha] sees a per-student breakdown showing which completed students received their token reward and which did not
- Students whose delivery failed are clearly distinguishable from students whose delivery succeeded
- [Student_Failed] is NOT shown in the reward roster

**NOTES:** Mirrors TS-08.12 for tokens. The implementation may present NFT and token delivery status on the same roster view — this is an implementation decision.

---

### TS-09.09: Teacher retries token delivery for student whose delivery failed

**Traces to:** F-09.2
**Category:** HAPPY PATH
**Criticality:** HIGH

**GIVEN:**
- [Student_Custodial] has completed [Class_Token_Only] but their token delivery previously failed
- [Teacher_Alpha] can see [Student_Custodial] in the reward roster as having a failed delivery

**WHEN:**
- [Teacher_Alpha] initiates a retry of the token delivery for [Student_Custodial]

**THEN:**
- The system attempts to distribute the token reward to [Student_Custodial] again
- If the retry succeeds, [Student_Custodial] receives the tokens in their wallet and sees a confirmation
- If the retry succeeds, [Teacher_Alpha]'s roster view updates to reflect the successful delivery

**NOTES:** Mirrors TS-08.13 for tokens.

---

### TS-09.10: Failed-course students excluded from token reward eligibility

**Traces to:** IMPLICIT — operator clarification on eligibility
**Category:** CONSTRAINT VALIDATION
**Criticality:** HIGH

**GIVEN:**
- [Student_Failed] is enrolled in [Class_Token_Only] but has failed the course examination
- [Student_Custodial] is enrolled in [Class_Token_Only] and has passed the course examination

**WHEN:**
- The system processes reward eligibility for [Class_Token_Only]

**THEN:**
- [Student_Failed] does not receive a token reward
- [Student_Failed] does not see any reward notification or pending state
- [Student_Failed] does not appear in [Teacher_Alpha]'s reward delivery roster for [Class_Token_Only]
- [Student_Custodial]'s reward eligibility is unaffected by [Student_Failed]'s failure

**NOTES:** Mirrors TS-08.14 for tokens. Operator confirmed: only examination-successful students receive rewards.

---

## Cascade Scenarios: F-07.1 — Both Rewards on the Same Completion Trigger

---

### TS-CASCADE.01: Both NFT and token delivered on the same completion trigger

**Traces to:** F-07.1
**Category:** HAPPY PATH
**Criticality:** HIGH

**GIVEN:**
- [Student_Custodial] is enrolled in [Class_Both_Rewards] and has not yet completed it
- [Student_Custodial] has no external wallet connected
- [Class_Both_Rewards] has both an NFT certificate reward and a token reward configured

**WHEN:**
- [Student_Custodial] meets the completion criteria for [Class_Both_Rewards]

**THEN:**
- The NFT certificate for [Class_Both_Rewards] is delivered to [Student_Custodial]'s custodial wallet
- The token reward for [Class_Both_Rewards] is delivered to [Student_Custodial]'s custodial wallet
- [Student_Custodial] sees confirmation of both the NFT certificate delivery and the token reward amount
- Neither reward is delivered to the exclusion of the other

**NOTES:** Validates F-07.1's requirement that both rewards are distributed on the same completion trigger. The implementation may deliver them sequentially or in parallel; the observable requirement is that both arrive and both are confirmed.

---

### TS-CASCADE.02: NFT delivery fails, token delivery succeeds — partial failure

**Traces to:** F-07.1, F-08.3
**Category:** FAILURE
**Criticality:** MEDIUM

**GIVEN:**
- [Student_Custodial] has met the completion criteria for [Class_Both_Rewards]
- The on-chain NFT minting transaction fails
- The on-chain token distribution transaction succeeds

**WHEN:**
- [Student_Custodial] views their reward status or the class completion page

**THEN:**
- The token reward is visible in [Student_Custodial]'s custodial wallet with a delivery confirmation
- [Student_Custodial] sees a pending notice for the NFT certificate and no pending notice for the token reward
- [Student_Custodial]'s completion status for [Class_Both_Rewards] is not reverted
- [Teacher_Alpha] sees a failure notification for the NFT certificate delivery only, not for the token reward

**NOTES:** Verifies that rewards are handled independently — a failure in one delivery pipeline does not prevent or roll back the other. The inverse permutation (token fails, NFT succeeds) has identical logic; the downstream agent should consider testing both permutations.

---

## Coverage Summary

| Spec Scenario | Test Scenarios | Categories Covered |
|---|---|---|
| F-08.1 | TS-08.01 | Happy Path |
| F-08.2 | TS-08.02, TS-08.05, TS-08.06 | Happy Path, Failure, Edge Case |
| F-08.3 | TS-08.03, TS-08.04, TS-08.12, TS-08.13 | Failure, Happy Path |
| F-09.1 | TS-09.01, TS-09.05, TS-09.07 | Happy Path, Edge Case |
| F-09.2 | TS-09.02, TS-09.03, TS-09.08, TS-09.09 | Failure, Happy Path |
| F-07.1 (cascade) | TS-CASCADE.01, TS-CASCADE.02 | Happy Path, Failure |
| (implicit — guard) | TS-08.07, TS-09.04 | Edge Case |
| (implicit — SC-03) | TS-08.08 | Constraint Validation |
| (implicit — concurrency) | TS-08.09 | Edge Case |
| (implicit — duplicate) | TS-08.10, TS-08.11 | Edge Case |
| (implicit — eligibility) | TS-08.14, TS-09.10 | Constraint Validation |
| (implicit — ext. wallet tokens) | TS-09.05, TS-09.06, TS-09.07 | Happy Path, Failure, Edge Case |

**Total spec scenarios in scope:** 5 (F-08.1, F-08.2, F-08.3, F-09.1, F-09.2) + 1 cascade (F-07.1)
**Total test scenarios generated:** 25
**Expansion ratio:** 25/6 = 4.2×

### Gaps (updated)

1. ~~F-09 external wallet variant~~ — **CLOSED.** Operator confirmed tokens follow the same external wallet logic as NFTs. Scenarios TS-09.05, TS-09.06, TS-09.07 added.

2. ~~Idempotency / duplicate completion~~ — **CLOSED.** Operator confirmed: second mint is allowed, gated by a warning covering time, cost, and non-transferability. Scenarios TS-08.10, TS-08.11 added. **Open sub-gap:** Does the same duplicate-with-warning logic apply to token rewards? The operator's answer referenced "a second certificate" (NFT-specific language). If a student could also request a second token distribution, equivalent scenarios for F-09 would be needed.

3. **Retry outcome (teacher-initiated)** — **PARTIALLY CLOSED.** Scenarios TS-08.13 and TS-09.09 cover teacher-initiated retry. The retry-failure path (retry also fails) is implicitly covered by the original failure scenarios (TS-08.03/04, TS-09.02/03).

4. ~~SC-03 for tokens~~ — **CLOSED.** Operator confirmed: private keys are never shown, universally. TS-08.08 notes this applies to all delivery types.

5. **Token reward amount boundary** (carried forward): The spec does not define minimum or maximum token reward amounts a teacher can configure. No boundary scenarios were generated for the token quantity itself; those would belong to F-06 (teacher configuration).

6. **Duplicate token distribution** (new): The operator's duplicate-completion answer was NFT-specific ("a second certificate"). Whether a student can also request a duplicate token distribution — and what warnings would apply — is unspecified. Flag for operator review.
