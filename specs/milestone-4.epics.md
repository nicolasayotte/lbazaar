# Epic Index: Milestone 4 — Front-End Development

**Source:** milestone-4.md
**Generated:** 2026-02-20

## Shared Preamble

See `specs/milestone-4.shared.md` for Domain Glossary and System Constraints that apply across all epics.

## Epics

### E-01: Payments & Wallet

Class pricing in ADA, purchasing with ADA, purchasing with credit card (Stripe), parallel payment path presentation, wallet connection flows, refund/access revocation, network status, and purchase history.
**Estimated features:** 8 (F-01, F-02, F-03, F-04, F-12, F-13, F-14, F-15)

### E-02: Rewards

Teacher configuration of NFT certificate and token rewards, teacher/admin-initiated airdrop (batch or individual), student self-mint, reward eligibility notifications, reward invalidation on refund, and student rewards portfolio.
**Estimated features:** 8 (F-05, F-06, F-07, F-10, F-16, F-17, F-18, F-19)
**Depends on:** E-01 (Payments & Wallet) for wallet infrastructure (custodial and external wallet concepts), refund triggers (F-13)

### E-03: Platform Hygiene

Removal of all legacy points system UI.
**Estimated features:** 1 (F-11)
**Depends on:** None
