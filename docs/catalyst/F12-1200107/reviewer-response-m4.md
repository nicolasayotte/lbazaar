# Milestone 4 — Response to Reviewer Feedback

Thank you both for the thorough reviews. Below is a point-by-point response to the "Not Approved" review. Items are grouped as **Fixed** (code changed this round), **Clarified** (already implemented / by-design, explained here), and **Planned** (acknowledged, scheduled for a later milestone).

A reviewer test account is provided at the end so the teacher workflow can be exercised immediately.

---

## Fixed in this round

### 1. Wallet connection now detects all CIP-30 wallets (Nami no longer hardcoded)
The wallet connector previously listed exactly three wallets (Eternl, Flint, Nami) via hardcoded branches. It now **dynamically enumerates `window.cardano`** and lists every installed CIP-30-compatible wallet (those exposing `.enable()` + `.apiVersion`), using each wallet's own `.name`/`.icon`. No wallet is hardcoded, so newer wallets (Lace, Begin, Typhon, Yoroi, etc.) appear automatically and the deprecated-Nami concern is resolved.
- `resources/js/components/cards/WalletConnector.jsx` (+ updated unit tests asserting multi-wallet detection).

### 2. Course language is now selectable at creation, and the filter is populated
A required **Language** selector was added to the course create/edit forms, backed by a single source of truth (`config/languages.php`). The browse-page language filter now lists those languages instead of only "All". (The DB column and the search filter already existed; the gap was the missing form field + an empty options list.)
- `config/languages.php` (new), `resources/js/pages/Portal/Course/Create.jsx`, the edit form, `Search.jsx`, `CourseRequest`/`CourseUpdateRequest` validation.

### 3. "Cancel Booking" no longer silently no-ops on paid bookings
The button worked for free/points bookings but, for bookings paid with real money (ADA or Stripe), only marked the booking cancelled without issuing a refund — which looked broken. Refunds are **intentionally admin-handled** (for accounting/compliance). The student UI is now honest: for a paid booking it shows a clear "refunds are handled by support — contact an administrator" message instead of a dead self-cancel button; free/points bookings keep the working self-cancel.
- Server flag `paid_with_money` on `CourseHistory`; `CourseScheduleList.jsx` / `CourseScheduleTable.jsx` (+ new behavioral tests).
- The admin refund path the reviewer saw passing in `php-unit-tests.log` (`AdminRefundController`, ADA + Stripe) is the supported refund mechanism.

### 4. The 7 skipped Playwright tests — fixed (now run and pass)
All seven were **conditional skips** guarding a missing data/selector precondition, not failures. We diagnosed each against the real app and made them run unconditionally:

| Test | Root cause | Fix |
|---|---|---|
| F-08.2b / F-08.2c (edit / delete NFT config) | their precondition step (F-08.2a "create") tripped a Playwright strict-mode error because a successful create shows **both** a new row and a success snackbar | added a trailing `.first()` to the `.or()` locator; 2b/2c now run and pass |
| F-08.3 (exam page renders) | the attend page renders the exam link as `<Link as="span">` (a `<span>`, no `<a href>`), so the `a[href*="/exams/"]` selector never matched | read the published exam id from the Inertia page props and build the URL |
| TS-01.06 / TS-01.07 (ADA price live refresh / drift) | the helper navigated to the *first* course card (which had no ADA price), so the "Buy with ADA" button was absent | prefer a card showing a dual JPY+ADA (`~₳`) price; both now exercise the live-poll + drift logic |
| F-03.3 (create-course page for approved application) | the approved fixture was paginated off page 1 by the pending applications other tests submit | navigate with `?status=approved` so approved fixtures stay visible |
| F-02.6 (user status can be toggled) | depended on another test seeding a throwaway user first | seeded a dedicated, non-login "E2E Test" toggle-target user so it's deterministic |

The previously-flaky admin duplicate-email test (F-02.5) was also hardened (it now selects the required country field so the duplicate-email error is the sole, deterministic outcome). And while validating, the suite surfaced a genuine bug — on a fresh database the admin **General Settings** form could not be saved at all, because two `required` settings (`vote-passing-percentage`, `donate-commission`) were never seeded, so the whole save was rejected; we added them to the seeder.

**Result:** the full Playwright suite is now **225 passed, 0 skipped, 0 failed, 0 flaky** (was 208 passed / 1 flaky / 7 skipped). See `docs/test-reports/playwright-tests.log`.

### 5. CI pipeline added
A GitHub Actions workflow (`.github/workflows/ci.yml`) now runs the JavaScript unit tests, the web3 Node unit tests, and the PHPUnit suite (against a MySQL service) on every push and pull request. Playwright E2E is documented as a follow-up (it needs a fully booted app + seeded DB + browsers).

### 6. Documentation
- **Token reward** purpose and mechanics are now documented, with the open economic questions stated honestly — see below and `docs/token-reward.md`.
- **Certificate standard** clarified (CIP-25, not CIP-68) — see below and `docs/certificate-minting-api.md`.

---

## Clarified (already implemented / by-design)

### 7. Teacher registration and the "verification" step — this is by design
Le Bazaar is community-governed. Becoming a teacher is **not** a silent admin gate that we forgot to wire — it runs through a **Discord-bot community vote**:
1. A prospective teacher applies; the application creates a vote in the community Discord channel.
2. If the community votes them in, they are "accepted" as a teacher.
3. To publish a class, the teacher then **applies per-class** through the same voting process (an approved application → `CourseApplication.approved_at`), after which they can create the class.

This is intentional to keep curation in the community's hands ("anyone can *apply* to teach; the community decides"). The message you saw ("your information needs to be verified") reflects that pending community vote. We acknowledge this wasn't testable end-to-end for an external reviewer without Discord access, so we've **seeded a pre-approved teacher account** for you (credentials below) that can go straight to creating a class.

> On whether teacher/student types are even needed: it's a fair point. The roles exist today because teachers carry community-approval state and payout/commission settings students don't. We're noting your suggestion to reconsider the split as input for a future iteration.

### 8. "Commenting" on courses/lessons is implemented — as Course Feedback
The commenting/feedback capability ships as the **Course Feedback** feature: students leave ratings/comments on courses, surfaced on the course detail page.
- `app/Models/CourseFeedback.php`, `app/Repositories/CourseFeedbackRepository.php`, `resources/js/components/cards/Feedback.jsx`, `resources/js/pages/Portal/CourseFeedback.jsx`.

### 9. Certificate NFT standard — CIP-25 by design (not CIP-68)
The certificate is **CIP-25**: metadata is attached to the minting transaction under **label 721** (`web3/common/certificate-metadata.mjs`, `tx.addMetadata(721, …)`). We do adopt CIP-68's **asset-name labelling convention** — a `(100)` reference token and a `(222)` user token — so the two tokens are cleanly distinguishable and the platform can hold a reference token for verification/revocation. We do **not** store metadata in the reference token's datum, which is the defining feature of CIP-68; that's why it is correctly described as CIP-25. The `(100)`/`(222)` prefixes are likely what gave the CIP-68 impression. Full CIP-68 (datum-stored, updatable metadata) is a candidate for a future milestone. (Documented in `docs/certificate-minting-api.md`.)

### 10. Credit-card buyers can view their certificate NFT
This works today (certificate airdrop is independent of payment method — Stripe buyers get a custodial-wallet certificate they can view). It simply wasn't shown in the demo video; we'll include this workflow in an updated demo.

---

## Planned / acknowledged (not code defects)

### 11. Token reward — purpose & tokenomics
The **mechanics** are built and tested (fungible mint-on-completion, configurable per course; label-674 metadata; invalidation on refund). The **economic model** (utility vs. loyalty vs. governance, supply/caps, sinks/use-cases, naming) is deliberately still open and will be defined in a later milestone. We've documented exactly this — current capability + explicit open questions — in `docs/token-reward.md` rather than overstate a finalized tokenomics.

### 12. Draft content, categories, example/intro lessons
Fair observations about the demo dataset. Category grouping/reorganization and a set of introductory Web3/Cardano onboarding lessons are content/curation work we're scheduling; they are not platform defects. We'll add introductory lessons to help onboarding and partner test-lessons.

---

## Reviewer test account (pre-approved teacher)

So you can exercise the teacher workflow immediately (bypassing the Discord community vote):

- **URL:** the deployed staging/demo environment
- **Email:** `demo-teacher@lebazaar.com`
- **Password:** `Demo1234!`

This account is already community-approved and has an **approved class application with no class yet**, so after logging in you can go straight to creating a class (the create-class page is reachable from *My Page → Class Applications*). A matching `demo-student@lebazaar.com` / `Demo1234!` and `demo-admin@lebazaar.com` / `Demo1234!` are also seeded for the student and admin perspectives.

*(Seeded by `database/seeders/DemoVideoSeeder.php`; run `php artisan db:seed --class=DemoVideoSeeder` on the target environment.)*
