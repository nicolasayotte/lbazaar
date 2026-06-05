# Le Bazaar — Milestone 4 Proof of Achievement

## Executive Summary

All scope items and deliverables defined for Milestone 4 have been completed, validated, and integrated into the project codebase and operational processes. The front-end has been built out for ADA pricing, NFT certificate minting, token rewards, and wallet flows; a Japan-compliant Stripe credit-card payment path has been implemented with integration tests and documentation; the legacy points UI has been fully removed; the platform is deployed and accessible; and a YouTube walkthrough demonstrates all six required user stories. No open blockers or unresolved risks remain.

The staging project is live at: <https://stage.l-e-bazaar.com/>

---

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

- Marketing & sales report (Google Doc): <https://docs.google.com/document/d/1sTQz6uk4G8VZzjcJ8s35XgdSiMyj1Go0V6Xo9lD1LTg/edit?usp=sharing>

---

## Response to Reviewer Feedback

Milestone 4 received a split review (one approval, one not-approved). Every point in the not-approved review was triaged against the codebase and resolved. The items below summarize the outcome; the full point-by-point reply is in [`reviewer-response-m4.md`](./reviewer-response-m4.md).

### Fixed (code changes)

| Reviewer concern | Resolution |
|---|---|
| Wallet connection supports only 3 wallets (Nami deprecated) | The connector now **dynamically detects every installed CIP-30 wallet** from `window.cardano` instead of a hardcoded list — no wallet is pinned, and newer wallets appear automatically. (`resources/js/components/cards/WalletConnector.jsx`) |
| Course language filter shows only "All"; no language field at creation | Added a **required language selector** to the course create/edit form and a canonical `config/languages.php`; the browse-page filter is now populated from it. |
| "Cancel Booking" button appears non-functional | For paid (ADA/Stripe) bookings the button now shows a **clear admin-refund notice** instead of silently doing nothing; free/points bookings keep the working self-cancel. Refunds remain admin-handled by design (the refund path the reviewer saw passing in the logs). |
| 7 skipped Playwright tests | All seven were conditional skips guarding missing fixtures; each was diagnosed and fixed. The suite is now **225 passed / 0 skipped / 0 failed / 0 flaky** (was 208 passed / 1 flaky / 7 skipped). While fixing them we also found and fixed a real bug — the admin **General Settings** form could not be saved on a fresh database because two `required` settings were never seeded. |
| No CI for the testing pipeline | Added a **GitHub Actions workflow** (`.github/workflows/ci.yml`) running the JS, web3, and PHPUnit suites on every push and pull request. |

### Clarified (already implemented / by-design)

| Reviewer concern | Clarification |
|---|---|
| Teacher account stays locked / no verification email | **By design.** Teacher onboarding runs through a **Discord-bot community vote** — a person is voted in as a teacher, then applies per-class through the same vote (`CourseApplication.approved_at`). The "your information needs to be verified" message reflects that pending community vote, not a broken flow. A **pre-approved demo teacher account is seeded** so the reviewer can test the full teacher workflow immediately (credentials in the response doc). |
| Certificate NFT looks like CIP-25, not CIP-68 | Correct — the certificate is **CIP-25 by design** (metadata under label 721). The `(100)`/`(222)` asset-name prefixes follow CIP-68's *labelling convention* for clean reference/user-token separation, but metadata is **not** stored in a reference-token datum (the defining feature of CIP-68). Documented in [`docs/certificate-minting-api.md`](../../certificate-minting-api.md). |
| Commenting on courses/lessons not found | Implemented as the **Course Feedback** feature (`CourseFeedback` model, `Feedback.jsx`, `CourseFeedback.jsx`). |
| Credit-card buyers viewing their certificate NFT | Works today — certificate airdrop is independent of payment method. It was simply not shown in the demo video; it will be included in an updated demo. |

### Documented / planned

| Reviewer concern | Outcome |
|---|---|
| Token reward purpose & tokenomics unclear | Documented the current mechanics and the **explicitly open** design questions (utility vs. loyalty, supply/caps, use cases) in [`docs/token-reward.md`](../../token-reward.md), rather than overstate a finalized economic model. |
| Separate teacher/student account types | Acknowledged as input; the split exists today because teachers carry community-approval state and payout/commission settings. Reconsidering it is noted for a future iteration. |
| Draft content, category reorganization, example/intro lessons | Content/curation work (not platform defects); introductory Web3/Cardano onboarding lessons and category grouping are scheduled. |

---

## Verification & Evidence

- **Release tag:** `catalyst/f12/m4` — <https://github.com/nicolasayotte/lbazaar/releases/tag/catalyst%2Ff12%2Fm4>
- **PHP test suite:** green — [`docs/test-reports/php-unit-tests.log`](../../test-reports/php-unit-tests.log)
- **JavaScript / web3 test suite:** green — [`docs/test-reports/js-unit-tests.log`](../../test-reports/js-unit-tests.log)
- **Web front-end test suite:** green — [`docs/test-reports/web-unit-tests.log`](../../test-reports/web-unit-tests.log)
- **Playwright E2E test suite:** green — **225 passed / 0 skipped / 0 failed** — [`docs/test-reports/playwright-tests.log`](../../test-reports/playwright-tests.log)
- **Production test pipeline:** `./test-prod.sh full-test` validates a full Docker production build prior to release.
- **Demo video:** <https://www.youtube.com/watch?v=dB1We3hFz6Y>
