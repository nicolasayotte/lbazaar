# Milestone 4 — Changelog

**Period:** 2026-01-22 to 2026-03-25
**Commits:** 279 (since `catalyst/f12/milestone-3`)
**Branch:** `catalyst/f12/m4`

---

## Test Results Summary

| Suite | Tests | Passed | Skipped |
|-------|-------|--------|---------|
| PHP (PHPUnit/ParaTest) | 548 | 548 | 6 |
| Web3 (Vitest) | 103 | 103 | 0 |
| E2E (Playwright) | 56 | 51 | 5 |
| **Total** | **707** | **702** | **11** |

Test report logs: [`docs/test-reports/`](../../test-reports/)

---

## Features

### Payments — ADA (Cardano)

- `323afb4` feat: live ADA price polling, drift warning, and quote countdown in course details
- `0eeed07` feat: lock ADA price quote window and block concurrent duplicate payments
- `923cf78` feat: add ADA payment status polling, tx confirmation, and refund system
- `7f0f260` feat(payments): show live X/10 confirmation count for pending ADA purchases (purchase history)
- `ff00ba0` feat: add ADA tx confirmation guard and stale-payment timeout
- `f2f11e3` feat: allow rebooking after a failed ADA payment
- `d16c4a6` feat: show ADA-price-unavailable fallback and pending-payment UI
- `b1de778` feat: degrade gracefully when ADA rate is unavailable on course details page
- `ccdc16b` feat: add exchange rate availability check and public ADA price API endpoint
- `9729b73` feat: expose pending-payment state, Stripe availability, and attend gate
- `8f9618d` feat: pass requiredConfirmations to purchase history page
- `d438b8f` feat(php): resolve payment addresses via custodial wallet in CoursePurchaseService
- `5482f1f` feat(web3): add purchase transaction build and submit scripts
- `06aebe1` feat(pricing): add ExchangeRateService and JPY/ADA dual pricing across course listings
- `9c4822f` feat(service): add course purchase service for payment handling
- `221fe82` feat(api): add course payment controller for transaction endpoints

### Payments — Stripe (Credit Card)

- `dec8416` feat(stripe): add Stripe credit card payment flow with PaymentIntent, webhook, and checkout UI
- `6c83d81` feat: add purchase history page listing ADA and Stripe transactions

### Rewards — NFT Certificates

- `f48892d` feat(rewards): soul-bound certificate metadata and no-burn minting policy (NFT certificate config)
- `9525377` feat(rewards): add SOUL_BOUND constant to minting-policy.mjs (NFT certificate config)
- `781384a` feat(rewards): lock certificate config fields after student enrollment (NFT certificate config)
- `493e036` feat(rewards): cert image validation, airdrop duplicate guard, on-chain revocation (NFT config, combined mint, batch airdrop, reward invalidation)
- `0718084` feat(rewards): mint NFT + token reward in a single on-chain transaction (combined mint)
- `c3babb2` feat(rewards): wire AirdropFeeDialog before airdrop and add eligibility badge (batch airdrop, completion notification)
- `b381d77` feat(rewards): wire CIP-30 self-mint into course completion page (student self-mint)
- `da976c3` feat(rewards): trigger on-chain certificate revocation from RewardInvalidationService (reward invalidation on refund)
- `02f40de` feat(rewards): add clawback_flagged status and fix wallet_type rendering in RewardsTable (student rewards view)
- `80409f8` feat: certificate image URL on courses, enrollment snapshot, and completion notification
- `b081ffd` feat: use enrollment snapshot overrides in cert metadata and auto-sync minted status
- `a5b6294` feat: add admin certificate management endpoints and roster view
- `82468cd` feat: admin certificate roster includes reward status and revocation fields
- `bab04a0` feat: student CIP-30 self-mint endpoint and course completion UI
- `bab04a0` feat: unified student rewards view for certificates and tokens
- `cb0c606` feat(certificates): update controller with new endpoints for minting
- `0e727f6` feat(certificates): batch and single minting to certificate service
- `bdd6837` feat(ui): add certificate management interface for teachers
- `de03c13` feat(php): expose certificate policy ID via deriveCertificatePolicyId
- `8c312ab` feat(php): add student CIP-30 mint endpoints — buildMintTx and submitMintTx
- `81bc054` feat(web3/run): add student CIP-30 self-mint scripts

### Rewards — Token Rewards

- `34302e0` feat(rewards): lock token reward config after student enrollment (token reward config)
- `0582dd5` feat: add token reward minting system and airdrop fee estimation
- `c660543` feat: reward invalidation service with refund notifications (revoke NFT + clawback token on refund)

### Enrollment Snapshots

- `49243d2` feat: snapshot reward config at enrollment time across all enrollment paths
- `e532392` feat: add enrollment snapshot fields and effective* accessors to CourseHistory
- `c818c71` feat: add enrollment reward snapshot columns to course_histories migration

### Wallet & CIP-30

- `ad24d3d` feat: validate Cardano network ID on wallet connect
- `44d8ca9` feat: add CIP-30 account and network change event listeners to WalletConnector
- `0f37d99` feat: add wallet heartbeat and disconnection UX in WalletConnector
- `d3d245a` feat: wallet reconnect button on disconnect banner (CIP-30 wallet handling)
- `fa8c697` feat(ui): integrate CIP-30 wallet connector into badges/rewards page
- `2ad334f` feat(ui): update certificates page for CIP-30 airdrop flow

### Web3 / Blockchain

- `bad58d9` feat(web3/contracts): replace VERSION constant with time-locked LOCK_DATE
- `ed79b42` feat(web3/common): refactor UTXO fetching, network utils, and Helios metadata encoding
- `ab8551a` feat(web3/run): update run scripts to use new utils and bech32 addresses

### Network Health & Monitoring

- `1ee047a` feat: add Cardano network health monitoring service and API endpoint
- `3a1b880` feat: live Cardano network status polling and teacher pricing preview

### Admin

- `7b79522` feat: admin refund management UI (ADA and Stripe refunds with reward invalidation)
- `a5bf699` feat: add migrations and model fields for certificate metadata, token rewards, and refund status

### Security & Auth

- `9494639` feat(auth): add Sanctum token expiration with logout and refresh endpoints
- `c9b9d8b` feat(security): harden CORS config and add webhook rate limiting
- `478539d` feat(deploy): harden staging and production deploy scripts

### UI & i18n

- `a7dab99` feat: remove legacy points Discord notification and dead controller methods
- `38e1f32` feat: add i18n strings for payments, refunds, token rewards, and purchase history
- `55979c6` feat: add reward configuration to course create/edit and manage class certificate UI
- `aefae8b` feat(ui): integrate payment flow into course pages
- `76eb61f` feat: register API and web routes for payments, token rewards, and purchase history
- `3bfb805` feat(i18n): add certificate and NFT action translations for Japanese
- `6c980e3` feat(certificates): add student certificate listing page
- `7c422e9` feat(categories): class filters by categories
- `e665c94` feat(docker): deployment method update

### Database

- `270f938` feat(db): add certificate and payment fields to schema
- `c6b7266` feat(db): extend certificate_status enum with not_eligible and pending
- `1c047f0` feat: add revoked/clawback_flagged enum values to course_histories

### E2E Tests (as features)

- `310c2b7` feat(e2e): playwright tests for student profile
- `d3477de` feat(e2e): Playwright course-browsing tests with auth helpers and seeder

---

## Bug Fixes

### Payments

- `3352c8a` fix(payments): send refund notifications unconditionally on ADA and Stripe refunds
- `84d97ea` fix: chargeback webhook triggers reward invalidation
- `63ed6a0` fix: use getRawOriginal('price') to bypass number_format accessor
- `c73a8fe` fix(class-applications): resolve 500 when addPriceInAdaToCourses called on DTO arrays
- `2a10653` fix(purchase): guard runCommand() in tests + fix price float cast
- `39818d8` fix(payment): use absolute paths and guard exec() in tests
- `78362f8` fix(web3): fix error propagation and BigInt serialization in submit-purchase-tx
- `90e6c34` fix(exchange-rate): handle API failures gracefully in addPriceInAdaToCourses
- `f879a0d` fix(API): ExchangeRateService hang fix
- `a4ff456` fix(stripe): fix StripeCheckout test mock hoisting and import order

### Rewards

- `6c1791c` fix(rewards): set certificate/token status to 'failed' on student self-mint failure
- `6775b40` fix(rewards): remove raw exception messages from API error responses
- `b5400f8` fix(rewards): remove raw exception messages from API error responses
- `e481a2a` fix: rewards UI polish — dialog exit animation and airdrop selection count
- `9d70f89` fix: exclude already-minted students from eligible minting query
- `cc3590d` fix: derive has_rewards and token_reward_enabled from per-student enrollment snapshot
- `d6d0447` fix(cert): return HTTP 400 on mint service failure
- `ac5bc19` fix(certificates): handle null/missing explorerUrl in CertificateTable

### Wallet

- `6796343` fix(ui): wallet connector auto-reconnect, localStorage persistence, bech32 address
- `85e30c6` fix(php): handle self_minted in refund eligibility, null wallet guard, Sanctum stateful
- `ddbc58a` fix(wallet): guard against null wallet in WalletTransactionHistoryController
- `830c7a2` fix(portal): remove NMKR Pay popup from course booking dialog
- `95ef5aa` fix(portal): guard WalletConnector render when auth is missing

### Admin

- `62bc439` fix(admin): fix date formatting and collection merge in RefundController
- `3515537` fix(admin): sanitize shell args and add error handling in NftController
- `1a96c99` fix(admin): fix classifications delete crash caused by wrong prop name
- `4b7a2ee` fix(admin): make NFT `points` field optional in validation and controller
- `0824e5b` fix(admin): null-safe category filter in CourseApplicationRepository
- `53b1c13` fix(admin): inline ADA price conversion for paginated DTO arrays
- `7b8316d` fix(admin): null-safe wallet query when admin has no wallet

### Web3 / Blockchain

- `0ae5abf` fix(web3): use ctx.get_current_minting_policy_hash() in NFT minting policy
- `e8e0a8a` fix(web3): add flushPromises to fix async timing in tx builder tests
- `3db6cc9` fix(web3): update certificate metadata tests for Helios map format and instructor rename

### Frontend

- `5d0fbf3` fix: guard against null professor in Course card
- `44e9788` fix(frontend): guard null course_type in Course card
- `44fecfc` fix: null-safe from-address fallback in all mail classes

### Tests & Infrastructure

- `2209b0d` fix(tests): update PHP unit tests for new service constructor signatures
- `afe37bb` fix: harden parallel test worker stability under 8-worker ParaTest
- `5c544e5` fix: auto-run config:clear after updating STRIPE_WEBHOOK_SECRET
- `c466b6d` fix(test-prod.sh): fix dynamic step count and add test-integration subcommand
- `fc690f8` fix(php): tests output to test-reports
- `8f6daae` fix(tests): php tests do not hang, 321 pass, 6 failed
- `8afc456` fix(models): add $fillable to Country and CourseType

### E2E Tests

- `e698d24` fix(e2e): replace fragile MUI selectors with text assertions, fix post-submit wait
- `c083bac` fix(e2e): fix admin test failures and skip known app bugs
- `1a824ee` fix(e2e): fix teacher test failures and skip known app bugs
- `483ff9a` fix(e2e): fix all remaining Playwright test failures (workers, storageState, logout, pagination)

### Data Queries

- `c0760a6` fix(history): replace dropped course_category_id JOIN with pivot table subquery

---

## Tests Added

### PHP Unit & Feature Tests

- `fc8ba08` test: add comprehensive test coverage for certificates and payments
- `68757f5` test: add PHP tests for payment confirmation, timeout, and attend gate
- `053b9b3` test: add PHP/Web3 live integration tests with InteractsWithRealServices safety trait
- `452e37a` test: add enrollment snapshot, cert service, and duplicate prevention tests
- `bfa59c9` test: update course completion and student certificate feature tests
- `2ffb78d` test: course reward config and history unit tests
- `891e151` test: fix and extend M4 payments test suite
- `66da74e` test: add is_teacher prop assertions to CourseControllerPriceTest
- `137c411` test: fix JPY minimum amount in Stripe connectivity test
- `ac6e107` test: remove Stripe key skip guards from feature tests
- `caa5fae` test: convert skipped Stripe unit tests to real integration tests
- `04e3254` test: fix CourseControllerPriceTest
- `502a540` test(php): update unit tests for refactored services
- `df08252` test: remove boilerplate now inherited from base TestCase (33 files)
- `490758d` test: centralize DatabaseTransactions, Mockery::close(), createTestUser in base TestCase
- `46f5fb7` test: migrate PHPUnit tests to TestCase helper methods
- `78d929a` test: add mysqlnd.net_read_timeout=15 to catch zombie queries
- `cbd6924` test(seeder): add ongoing schedule, seeded NFT, and available application

### Web3 / Vitest

- `84a7cfd` test(web3): add unit tests for new scripts and update purchase tx tests
- `62c993f` test(web3): update minting-policy tests; remove NMKR helpers and spec
- `1247f57` test: add JS unit tests for currency helper and course components
- `b6cffee` test: add CIP-30 event listener tests for WalletConnector (wallet connection handling)
- `77180b7` test(frontend): add vitest tests for course application flow

### Playwright E2E

- `dafe7a6` test(e2e): add guest workflow Playwright specs (course browsing, registration, route protection, rewards pages)
- `8f08ca0` test(e2e): add admin workflow tests (settings, user management, refunds, certificate roster)
- `ac3aa5b` test(e2e): add teacher workflow tests (class management, exams, schedules, certificates)
- `ec0581c` test: add Playwright tests for ADA price and Stripe availability scenarios
- `a45ee47` test(playwright): add student CIP-30 wallet browser tests and mock helper
- `25f3e00` test(e2e): add Playwright E2E infrastructure with top-page smoke tests
- `88e45ae` test(playwright): add admin project, setup file, and admin page tests
- `83b8e1e` test(playwright): fix submit-button strict-mode and certificate table column selector
- `bc0bfca` test(playwright): expand PlaywrightTestSeeder with course, exam and enrollment data
- `f7b1a01` test(e2e): fix NFT input selector and sidebar exact-text matchers
- `eb11c8c` test(e2e): add student MyPage route smoke test
- `d48cc1c` test(e2e): fix locators, labels, and route paths across specs
- `d66aa3f` test(e2e): replace hardcoded IDs with dynamic discovery in attendance flow
- `5c21ca5` test(e2e): implement ADA price freshness tests with clock API and route interception
- `3649a83` test(e2e): replace env-var guards with route interception for ADA/Stripe failure specs
- `dccc7b4` test: fix logout Playwright tests

---

## Chore & Infrastructure

- `6139fdb` chore: remove legacy points system from UI, routes, and email templates
- `b0ef18f` chore: remove NMKR_API_KEY, NMKR_PROJECT_ID, NMKR_PKH env vars
- `4362dcc` chore: delete NMKR web3 scripts, contract, and API docs
- `f357917` chore: remove Postman testing infrastructure
- `1f1062a` chore(test-infra): parallel PHP tests with isolated DB and TestCase helpers
- `0932f16` chore(deps): add @playwright/test and newman, unify npm test scripts
- `629ebf4` chore(deps): bump axios to 1.13.6, form-data to 4.0.5, vitest to 4.1.1, npm to 11.12.0
- `9281d1c` chore: add nodejs_22 to Nix flake, tighten gitignore, reduce test parallelism
- `1562e8d` chore: add CARDANO_NETWORK_ID and PAYMENT_QUOTE_WINDOW_MINUTES config keys
- `cf61789` chore: add .cbad runtime dir to .gitignore

---

## Documentation

- `df08c00` docs: add advanced Playwright patterns, update agent refs and test commands
- `8c8cf64` docs: document CIP-30 self-mint flow and new API endpoints
- `f4bf8a0` docs: fill documentation gaps from m4 payment and ADA UX changes
- `90e6c34` docs: add API, auth, tech-stack, workflow docs and update agents/CLAUDE.md
- `8dbead9` docs: document Playwright multi-project auth architecture
- `a8ea750` docs: update testing guide for dual-pipeline strategy and refresh test log
- `c5afd5c` docs: add milestone 4 behavioral spec and test scenarios
- `b9471e0` docs: dependency audit Feb 2026
- `33f4aff` docs: rewrite README as concise project overview
- `151bd72` docs: remove NMKR documentation and update integration references
