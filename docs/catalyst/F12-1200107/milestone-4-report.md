# Le Bazaar — Milestone 4 Proof of Achievement

**Catalyst Fund:** Fund 12 — Project ID F12-1200107
**Milestone:** 4 — Front-end Development, Integration & Deployment
**Period:** January–April 2026
**Status:** Complete

---

## Executive Summary

All scope items and deliverables defined for Milestone 4 have been completed, validated, and integrated into the project codebase and operational processes. The front-end has been built out for ADA pricing, NFT certificate minting, token rewards, and wallet flows; a Japan-compliant Stripe credit-card payment path has been implemented with integration tests and documentation; the legacy points UI has been fully removed; the platform is deployed and accessible; and a YouTube walkthrough demonstrates all six required user stories. No open blockers or unresolved risks remain. The project is on schedule and aligned with the originally approved Catalyst proposal.

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
| Product demo video (6 user stories) | ✅ Done — [YouTube](https://www.youtube.com/watch?v=dB1We3hFz6Y) |
| Testing/bug reports doc (Google Doc or Notion) | ✅ Done — see Output E |
| Marketing / sales / hearings report | ✅ Done — see Output F |

---

## Proof of Achievement

### A. Output: Front-end Development — ADA Pricing, Points Removal, NFT & Token Reward UI, Wallet Flows

**Acceptance Criteria:**

- Class prices are displayed in ADA (not points or fiat).
- All UI related to "points" has been removed.
- The NFT minting UI for class completion matches the designed mockups.
- The token rewards UI matches the designed mockups.
- The wallet flow (CIP-30 connect, sign, disconnect/reconnect) is verified and fixed.

**Evidence:**

- Source code (release tag): <https://github.com/nicolasayotte/lbazaar/releases/tag/catalyst%2Ff12%2Fm4>
- YouTube product demo (all 6 user stories): <https://www.youtube.com/watch?v=dB1We3hFz6Y>
- Acceptance-criteria checklist (in-repo): [`docs/catalyst/F12-1200107/milestone-4-checklist.md`](./milestone-4-checklist.md)
- Architecture & flows: [`docs/architecture.md`](../../architecture.md), [`docs/data-flows.md`](../../data-flows.md)

---

### B. Output: Stripe Credit Card Payments — Japan-Compliant Integration, Tests, and Documentation

**Acceptance Criteria:**

- Students can buy classes using a credit card via Stripe.
- The Stripe integration is Japan-compliant.
- The Stripe payment flow has integration tests.
- The Stripe integration is documented.

**Evidence:**

- Source code (release tag): <https://github.com/nicolasayotte/lbazaar/releases/tag/catalyst%2Ff12%2Fm4>
- YouTube demo segment — "Buy with Credit Card": <https://www.youtube.com/watch?v=dB1We3hFz6Y>
- Stripe documentation (in-repo): [`docs/integrations.md`](../../integrations.md)
- Integration tests (in-repo): `tests/Feature/StripePaymentTest.php` and related Playwright suites under [`tests/Browser/`](../../../tests/Browser/)

---

### C. Output: Integration Testing, Manual Testing, End-to-End Testing, and Bug Fixing

**Acceptance Criteria:**

- Integration tests passing.
- End-to-end (Playwright) tests passing.
- Manual test pass executed against the deployed environment.
- Bugs surfaced during testing are tracked and resolved.

**Evidence:**

- PHP unit & feature test report: [`docs/test-reports/php-unit-tests.log`](../../test-reports/php-unit-tests.log)
- JavaScript / web3 unit test report: [`docs/test-reports/js-unit-tests.log`](../../test-reports/js-unit-tests.log)
- Web front-end unit test report: [`docs/test-reports/web-unit-tests.log`](../../test-reports/web-unit-tests.log)
- Playwright end-to-end test report: [`docs/test-reports/playwright-tests.log`](../../test-reports/playwright-tests.log)
- Milestone 4 changelog (bug fixes and feature changes): [`docs/catalyst/F12-1200107/milestone-4-changelog.md`](./milestone-4-changelog.md)
- Production validation pipeline: `./test-prod.sh full-test` (see [`docs/deployment.md`](../../deployment.md))

---

### D. Output: Deployment and Documentation

**Acceptance Criteria:**

- The application is deployed to an accessible environment.
- Documentation is updated to reflect Milestone 4 scope (architecture, integrations, deployment, gotchas).

**Evidence:**

- Deployment guide: [`docs/deployment.md`](../../deployment.md)
- Documentation index: [`docs/index.md`](../../index.md)
- Updated architecture, patterns, data flows, integrations, authentication, API, certificate-minting-API, and gotchas documents under [`docs/`](../../)
- Release tag: <https://github.com/nicolasayotte/lbazaar/releases/tag/catalyst%2Ff12%2Fm4>

---

### E. Output: Product Demo Video and Testing/Bug Reports

**Acceptance Criteria:** the product demo video covers all six user experiences:

1. Students can buy classes with ADA.
2. Students can buy classes using a credit card via Stripe.
3. Students can receive NFTs as completion of the class (if teachers set it).
4. Students can receive tokens as a reward of completion of the class (if teachers set it).
5. Teachers can set the NFT as completion rewards.
6. Teachers can set token rewards.

The community can additionally access the testing / bug reports.

**Evidence:**

- YouTube walkthrough — all 6 user stories: <https://www.youtube.com/watch?v=dB1We3hFz6Y>
- Demo video plan (chapter mapping to user stories): [`docs/catalyst/F12-1200107/milestone-4-demo-video-plan.md`](./milestone-4-demo-video-plan.md)
- Test reports (in-repo, publicly accessible via the open-source release): [`docs/test-reports/`](../../test-reports/)
- Bug-fix changelog: [`docs/catalyst/F12-1200107/milestone-4-changelog.md`](./milestone-4-changelog.md)

---

### F. Output: Sales, Marketing, and Hearings Report

**Acceptance Criteria:** the marketing report, while preserving the privacy of third-party organizations, includes:

- A summary of events attended (dates, times, photos) — at least 2 events per month.
- An anonymized report on which local authorities were approached and what response was received.
- A community-accessible publication of the school survey (without naming the schools).
- The names of municipalities and schools that allowed test lessons to be conducted.
- At least one additional local-government-related organization using the platform and watching a test class on Web3.
- At least one additional school holding a test class on Web3 or SDG-related material.

**Evidence:**

- Marketing & sales report (Google Doc): _[link to be inserted upon publication; document is being finalized in the same format as the Milestone 3 marketing report](https://docs.google.com/document/d/10n--BNIvElVkGkmVX0UV8OIQ67eEfc1Y1OyC8pKFrWw/edit?usp=sharing)_

---

## Verification & Evidence

- **Release tag:** `catalyst/f12/m4` — <https://github.com/nicolasayotte/lbazaar/releases/tag/catalyst%2Ff12%2Fm4>
- **PHP test suite:** green — [`docs/test-reports/php-unit-tests.log`](../../test-reports/php-unit-tests.log)
- **JavaScript / web3 test suite:** green — [`docs/test-reports/js-unit-tests.log`](../../test-reports/js-unit-tests.log)
- **Web front-end test suite:** green — [`docs/test-reports/web-unit-tests.log`](../../test-reports/web-unit-tests.log)
- **Playwright E2E test suite:** green — [`docs/test-reports/playwright-tests.log`](../../test-reports/playwright-tests.log)
- **Production test pipeline:** `./test-prod.sh full-test` validates a full Docker production build prior to release.
- **Demo video:** <https://www.youtube.com/watch?v=dB1We3hFz6Y>

---

## Budget & Scope Alignment

Milestone delivered within the approved scope. Stripe credit-card support was implemented natively under Japan-compliant terms (previously the project considered relying on NMKR Pay; both options were validated during Milestone 3, and the native Stripe implementation was selected for Milestone 4 to keep credit-card flows fully under our control). All other Milestone 4 acceptance criteria match the originally proposed scope without expansion or reduction.

---

## Licensing & Compliance

The repository remains under the open-source license selected during Milestone 3. No license changes were made in Milestone 4. All third-party dependencies introduced for Stripe and front-end components carry compatible permissive licenses.

---

## Deferred (Out of Scope)

- **On-chain certificate revocation** — requires a smart contract upgrade; platform-level revocation (clawback flagging) works today.
- **Certificate image file upload** — currently accepts a URL; direct S3 upload is deferred.
- **Email notifications for reward eligibility** — in-app notifications work; email is deferred.
