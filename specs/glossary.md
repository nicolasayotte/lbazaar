# Milestone 4 — Domain Glossary & System Constraints

This file defines the shared domain model and system-wide constraints for all Milestone 4 contracts. Individual contracts reference these definitions rather than duplicating them.

---

## Actors

**Student**
A platform user who browses, purchases, and completes classes. Every student has an implicit custodial wallet capable of receiving on-chain assets. May also connect an external browser wallet.
*Cannot:* modify class pricing, configure rewards, mint or send certificates, or access other students' wallet data or purchase history.

**Teacher**
A platform user who creates classes, sets pricing in JPY, and configures completion rewards (NFT certificates and/or tokens). Can mint and send certificates to students who complete their class.
*Cannot:* access student custodial wallets, modify platform-level configuration, or override completion criteria.

**Admin**
A platform operator with elevated privileges for platform-level configuration and oversight.
*Cannot:* access or transact with student or teacher wallets directly, or modify individual class pricing or reward configuration on behalf of a Teacher.

**Guest**
An unauthenticated visitor to the platform. Can browse public pages, view course listings and details, submit inquiries, register as a Student or Teacher, and switch language. Cannot access any authenticated routes (MyPage, manage classes, admin panel).
*Cannot:* book or purchase classes, view profiles, access any MyPage section, or perform any action requiring authentication.

**Community Member**
Any user of the platform. Not a distinct role — this is a superset label covering Students, Teachers, and Admins. Used only when a capability applies universally.

---

## Key Terms

**Class**
A purchasable learning unit created by a Teacher with a price denominated in JPY.

**Course Completion**
A state transition already defined in the existing platform. When a student meets the existing completion criteria, they become eligible for any configured rewards.

**NFT Certificate**
A non-fungible token minted on-chain representing proof of class completion. Configured per-class by the Teacher.

**Token Reward**
A fungible token distributed on-chain to a student upon class completion. Configured per-class by the Teacher.

**Custodial Wallet**
A platform-managed wallet assigned implicitly to every student. Capable of receiving NFT certificates and token rewards without requiring the student to connect an external wallet.

**External Wallet**
A browser-based CIP-30 wallet (e.g., the set of wallets currently supported by the platform) that a student may optionally connect for direct ADA payments and self-minting.

**ADA Price**
The class price expressed in ADA, derived from the teacher-set JPY price via a market-rate conversion at the time of purchase.

**Schedule**
A specific date/time offering of a Class. A single Class may have multiple Schedules. Students book and attend Schedules, not Classes directly.

**Class Application**
A Teacher's request to create a new Class on the platform. Must be reviewed and approved by an Admin before the Class becomes available.

**Classification**
A platform-level categorization tag used to organize Classes (distinct from Course Category and Course Type).

**Inquiry**
A contact form submission from any visitor (Guest or authenticated user). Stored for Admin review.

---

## System Constraints

- **SC-01**: All class prices are authored by Teachers in JPY. Any ADA-denominated price displayed to the user must be a conversion from the canonical JPY price.
- **SC-02**: ADA payment confirmation uses pessimistic finality: a transaction is considered confirmed only after 10 on-chain confirmations.
- **SC-03**: No private key material for custodial wallets may be exposed to the client at any point.
- **SC-04**: The Stripe integration must be configured through the Japanese Stripe onboarding flow. Any regulatory or disclosure requirements imposed by that flow must be satisfied. `[ASSUMPTION: the specific regulatory requirements are handled at the Stripe account configuration level and do not impose additional in-app UI beyond standard Stripe checkout.]`
- **SC-05**: All UI related to the legacy "points" system must be fully removed. No migration or communication is required — the platform is not yet live and no user data exists for points.
- **SC-06**: All currently supported external wallets must function correctly for: purchasing classes with ADA, minting/receiving NFT certificates, and (for Teachers) minting and sending certificates to students.

---

## Epic-Specific Constraints

### E-01 Payments & Wallet

- **SC-E01-01**: When a Student initiates ADA checkout, the system derives a firm ADA price quote from the current exchange rate. This quote is held for a configurable window (default: 5 minutes). The Student must confirm the quoted ADA amount before the transaction is submitted. If the quote window expires, the Student must re-initiate checkout.
- **SC-E01-02**: A Student must not gain access to a class without a fully confirmed payment (ADA: 10 confirmations; Stripe: successful charge). No optimistic access grants.
- **SC-E01-03**: A Student must not submit a duplicate payment for a class they have already purchased or have a pending payment for.

### E-02 Rewards

- **SC-E02-01**: Reward delivery failure must not alter a student's completion status. If an airdrop partially fails, successful deliveries are kept and failed deliveries are queued for retry.
- **SC-E02-02**: A student must not receive duplicate rewards for the same class. The system must prevent a second airdrop or self-mint from delivering to students who already received the reward (whether via airdrop or self-mint).
- **SC-E02-03**: Reward configuration changes to a class must not retroactively affect rewards already delivered under the previous configuration.
- **SC-E02-04**: Only students who have met the platform's existing completion criteria are eligible for reward airdrop or self-mint.
- **SC-E02-05**: The NFT minting policy must support on-chain metadata updates to enable revocation flags.
- **SC-E02-06**: The reward configuration visible to a Student is locked at the time of enrollment. If a Teacher changes reward configuration after a Student enrolls, the Student sees (and is eligible for) the configuration that existed at their enrollment time.
