# Token Reward Mechanism

This document describes the **course token reward** feature as it is implemented today, and explicitly lists the design/economic questions that are still **open**. It exists to answer the Catalyst reviewer's question about the token reward's purpose and tokenomics honestly: the *mechanics* are built and tested; the *economic model* is intentionally not yet finalized.

## What it is (today)

A teacher can attach a **fungible native-token reward** to a course. When a student completes such a course, the platform mints a quantity of a course-specific fungible token and sends it to the student.

This is distinct from the **certificate NFT** (a non-fungible proof of completion — see `docs/certificate-minting-api.md`). The certificate proves *who completed what*; the token reward is a *fungible* grant on top of that.

## How it works (implementation)

| Concern | Where |
|---|---|
| Teacher enables reward + sets amount per course | `token_reward_enabled`, `token_reward_amount` on `Course` / `CourseApplication`; configured in the course create/edit form |
| Enrollment-time snapshot | `enrolled_token_reward_enabled` / `enrolled_token_reward_amount` on `CourseHistory` (the reward terms are frozen at enrollment) |
| Mint orchestration | `app/Services/API/TokenRewardService.php`, `app/Http/Controllers/API/TokenRewardController.php` |
| On-chain mint | `web3/run/build-token-reward-tx.mjs` |
| Invalidation (e.g. on refund/cancel) | `app/Services/API/RewardInvalidationService.php`; `rewards_invalidated_at` on `CourseHistory` |

### On-chain shape

- **Fungible** native token: a single token name minted in quantity `N` (`tx.mintTokens(...)`), sent to the recipient. **No reference token** is minted (unlike the certificate's `(100)`/`(222)` pair) — see `build-token-reward-tx.mjs`.
- **Token name** convention: `Token-{courseId}` (parsed back out for metadata).
- **Metadata**: a transaction-metadata message under **label `674`** (the CIP-20 "message" label) describing the reward (`'Token reward'`, `Course: {courseId}`, `Quantity: {n}`). No CIP-25 image metadata is attached (it is fungible, not an NFT).
- Minted by the platform owner key (`OWNER_PKH` is added as a required signer).

### Lifecycle

1. Teacher enables the reward and sets an amount when creating/editing the course.
2. A student enrolls — the reward terms are snapshotted onto their `CourseHistory`.
3. On completion, `TokenRewardService` triggers the mint (`build-token-reward-tx.mjs`) to the student's (linked or custodial) address.
4. If the enrollment is later refunded/cancelled, `RewardInvalidationService` marks `rewards_invalidated_at` so the reward is not (or no longer) honored.

## Open design questions (NOT yet decided)

The reviewer correctly noted the documentation does not yet pin down the token's economics. These are deliberately **open** and will be resolved in a later milestone:

- **Token category** — utility token, loyalty/points-style reward, or governance? Not yet decided.
- **Use cases / sinks** — what can a student *do* with accumulated tokens (discounts on future courses, redemption, staking, reputation)? No on-platform sink is wired yet.
- **Tokenomics** — total supply, mint cap, per-course/per-student limits, inflation control: undefined. Today minting is uncapped per teacher configuration.
- **Naming / policy strategy** — currently one mint policy with per-course token names (`Token-{courseId}`); whether to use a single shared symbol or per-course symbols long-term is undecided.
- **Transferability / market** — whether rewards are meant to be tradable or soulbound-style is open.

Until these are decided, the feature should be understood as a **technical capability** (mint-on-completion of a configurable fungible reward) rather than a finalized economic instrument.
