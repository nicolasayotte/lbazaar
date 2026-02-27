# Milestone 4 — Shared Preamble

**Source:** m4.md
**Generated:** 2026-02-20
**Status:** DRAFT — requires operator review

This file contains the Domain Glossary and System Constraints shared across all Milestone 4 epics. Individual epic specs reference this file rather than duplicating these definitions.

---

## Domain Glossary

### Actors

**Student**
A platform user who browses, purchases, and completes classes. Every student has an implicit custodial wallet capable of receiving on-chain assets. May also connect an external browser wallet.
*Cannot:* modify class pricing, configure rewards, mint or send certificates, or access other students' wallet data or purchase history.

**Teacher**
A platform user who creates classes, sets pricing in JPY, and configures completion rewards (NFT certificates and/or tokens). Can mint and send certificates to students who complete their class.
*Cannot:* access student custodial wallets, modify platform-level configuration, or override completion criteria.

**Admin**
A platform operator with elevated privileges for platform-level configuration and oversight.
*Cannot:* access or transact with student or teacher wallets directly, or modify individual class pricing or reward configuration on behalf of a Teacher.

**Community Member**
Any user of the platform. Not a distinct role — this is a superset label covering Students, Teachers, and Admins. Used only when a capability applies universally.

### Key Terms

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
A browser-based wallet (e.g., the set of wallets currently supported by the platform) that a student may optionally connect for direct ADA payments.

**ADA Price**
The class price expressed in ADA, derived from the teacher-set JPY price via a market-rate conversion at the time of purchase.

---

## System Constraints

- **SC-01**: All class prices are authored by Teachers in JPY. Any ADA-denominated price displayed to the user must be a conversion from the canonical JPY price.
- **SC-02**: ADA payment confirmation uses pessimistic finality: a transaction is considered confirmed only after 10 on-chain confirmations.
- **SC-03**: No private key material for custodial wallets may be exposed to the client at any point.
- **SC-04**: The Stripe integration must be configured through the Japanese Stripe onboarding flow. Any regulatory or disclosure requirements imposed by that flow must be satisfied. `[ASSUMPTION: the specific regulatory requirements are handled at the Stripe account configuration level and do not impose additional in-app UI beyond standard Stripe checkout.]`
- **SC-05**: All UI related to the legacy "points" system must be fully removed. No migration or communication is required — the platform is not yet live and no user data exists for points.
- **SC-06**: All currently supported external wallets must function correctly for: purchasing classes with ADA, minting/receiving NFT certificates, and (for Teachers) minting and sending certificates to students.
