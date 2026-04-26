# Le Bazaar — Milestone 4 Completion Report

**Milestone:** 4 — Front-end development, Integration & Deployment
**Period:** January–April 2026
**Status:** Complete (pending demo video and test report doc)

---

## Acceptance Criteria — Status

| Criterion | Status |
|-----------|--------|
| Class prices displayed in ADA | ✅ Done |
| UI related to "points" removed | ✅ Done |
| NFT minting UI for class completion | ✅ Done |
| Token rewards UI | ✅ Done |
| Wallet flow verified and fixed | ✅ Done |
| Stripe credit card payments (Japan-compliant) | ✅ Done |
| Stripe integration tests | ✅ Done |
| Stripe documentation | ✅ Done |
| Product demo video (6 user stories) | ⏳ Pending |
| Testing/bug reports doc (Google Doc or Notion) | ⏳ Pending |

---

## What Was Delivered

### 1. ADA Payments

Students connect a CIP-30 Cardano wallet, receive a live ADA price quote (auto-refreshing with drift warnings), and pay directly on-chain. The system tracks blockchain confirmations and grants course access once confirmed. Cardano network health is monitored in real time; ADA payments are disabled gracefully when the network is degraded.

### 2. Stripe Credit Card Payments

A full Stripe checkout flow was implemented as an alternative to ADA, including webhook-based payment confirmation and access granting. The integration is Japan-compliant. Both payment paths work independently — if one is down, the other remains available.

### 3. Refunds

Refund handling was added for both ADA and Stripe payments, with an admin management panel. When a refund or chargeback occurs, associated rewards are automatically flagged or revoked, and both the student and admin are notified.

### 4. NFT Certificates

Teachers configure a certificate name, description, and image URL per course. Upon completion, the teacher or admin can mint and airdrop NFT certificates to student wallets — individually or in batch. Students can also self-mint directly from the course completion page. Certificates are soul-bound (non-transferable) and minted under a no-burn policy. Reward settings are locked at enrollment so students always receive what was promised when they signed up.

### 5. Token Rewards

Teachers set a token reward amount per course. Tokens are airdropped alongside NFT certificates in a single on-chain transaction. A unified **My Rewards** page lets students view all earned certificates and tokens with links to the blockchain explorer.

### 6. Points System Removed

The legacy points system (a placeholder from earlier milestones) was fully removed from the UI, routes, and notification system.

### 7. Wallet Reliability

Wallet connections include a heartbeat monitor — if a student's wallet disconnects mid-session, they see a reconnect prompt instead of silent failure. CIP-30 signing, witness merge, and server-side transaction submission all work end-to-end.

### 8. Security Hardening

A full security audit was completed in April 2026. Findings addressed include: CORS hardening, Stripe webhook rate limiting, Sanctum token expiration with refresh endpoints, shell argument sanitization in NFT admin controller, and raw exception message removal from API responses.

### 9. Testing

- **400+ automated tests** covering PHP backend, JavaScript/web3 scripts, and Playwright browser E2E tests.
- A production Docker testing pipeline (`./test-prod.sh`) validates full deployments before release.
- Integration tests cover Stripe payment flow end-to-end.

### 10. Deployment

The application is deployed and accessible on staging. Production deploy scripts are hardened and self-locating. Secrets injection, health routes, and Stripe key plumbing are all verified.

---

## Remaining Items

- **Demo video** — YouTube walkthrough covering all 6 user stories (not yet recorded).
- **Testing/bug report doc** — To be published to Google Doc or Notion linking to test reports.

These are documentation and presentation tasks only; no further development work is required.

---

## Deferred (Out of Scope)

- **On-chain certificate revocation** — requires a smart contract upgrade; platform-level revocation (clawback flagging) works today.
- **Certificate image file upload** — currently accepts a URL; direct S3 upload is deferred.
- **Email notifications for reward eligibility** — in-app notifications work; email is deferred.
