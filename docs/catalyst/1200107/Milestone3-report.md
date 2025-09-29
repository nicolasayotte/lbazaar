# Milestone 3 Completion Report

Project: (Project Name / Catalyst Proposal ID 1200107)  
Milestone: 3 – Back-end development & Marketing  
Original Milestone Submission Date: 2024-08-05 23:59 (UTC)  
Report Date: 2025-09-29  
Repository: <https://github.com/lebazaarweb2/groundfloor> (public)  
Branch / Tag for Milestone 3 Delivery: `milestone3` (recommend tagging final commit as `milestone3-complete`)

> NOTE: Replace any remaining placeholders (marked TODO) with concrete links / data before final external publication.

---
## 1. Executive Summary

During Milestone 3 we completed the core back-end, blockchain integration foundations, NFT/token minting flows, pricing model migration from “points” to ADA, payment wallet integration groundwork, and executed both automated and manual QA cycles.

In parallel, targeted outreach and marketing validation activities with local authorities and schools were conducted to gather adoption signals and refine go‑to‑market assumptions.

All required source code and documentation have been made publicly accessible, enabling community review.

---

## 2. Scope Delivered vs Original Plan

| Planned Work Item | Status | Notes |
|-------------------|--------|-------|
| Back-end development | Completed | Core service layer, models, migrations updated for ADA-based pricing. |
| Blockchain development | Completed (Phase 1) | NFT + token minting endpoints/templates integrated; further optimization planned next milestone. |
| Unit testing | Completed (baseline) | Coverage established for critical services (pricing, mint orchestration, wallet ops). |
| Manual testing | Completed | Multi-developer exploratory sessions; defects triaged & fixed. |
| Bug fixing | Completed | All high/critical defects resolved; no open Sev1 at close. |
| Deployment | Completed | Deployed to staging & (if applicable) production environments; build scripts updated. |
| Documentation | Completed | Added/updated technical docs & this completion report. |
| ADA price migration | Completed | DB schema & application logic refactored off legacy “points” abstraction. |
| Credit card → ADA wallet integration (custodial) | In Progress (Foundational) | Vendor evaluation & API abstraction layer scaffolded; full transaction settlement in next milestone. |
| NFT minting on class completion | Completed | Event-driven mint trigger & metadata template implemented. |
| Token rewards minting | Completed | Reward issuance service + configurable policy parameters. |
| Marketing & outreach (events, authorities, schools) | Completed (Milestone scope) | Minimum event & engagement targets met (see Section 6). |
| Onboard test local government & school | Completed | At least one municipality + one school onboarded (details anonymized where required). |
| Stakeholder interviews for wallet spec (Milestone 1 dependency) | Referenced | Incorporated into integration architecture decisions. |

---

## 3. Technical Deliverables

### 3.1 Codebase

- Public repository with branch `milestone3` reflecting merged deliverables.
- Refactored pricing logic to denominate internally in Lovelace (1 ADA = 1,000,000 Lovelace) replacing prior point system.
- Introduced migration scripts to backfill / translate historical “points” → ADA where needed (idempotent, reversible via transaction log).
- Established service classes for:
  - NFT mint orchestration
  - Token reward issuance
  - Wallet/payment abstraction (pluggable gateway interface)
  - Pricing & conversion utilities

### 3.2 Database & Schema

- Modified relevant tables to store ADA (decimal or integer Lovelace) instead of abstract points.
- Added audit columns for conversion (e.g., `original_points`, `conversion_rate`, `converted_at`).
- Ensured all Eloquent factories updated to reflect new monetary fields.

### 3.3 Blockchain & Minting

- NFT metadata templates (`templates/class-certificate.json`, `templates/class-ticket.json`) extended with dynamic attributes (class ID, completion timestamp, issuer).
- Manual mint trigger available for the teacher and the student for class certificates
- Policy keys / identifiers abstracted (no secrets committed)

### 3.4 Wallet / Payment Integration (Credit Card to ADA)

- Implemented adapter interface enabling NMKR Pay and non-custodial wallet support
- Evaluated providers (custodial & fiat on-ramp) – documented selection criteria for NMKR Pay including credit card payments support. Project is international, but launched in Japan, so support of credit card transactions in Japan was required.
- Implemented backend stub + features; real transaction posting deferred to Milestone 4 to integrate with frontend transactions

### 3.5 Testing & Quality

- Unit tests cover: NFT mint job dispatch, reward token issuance logic, schema migrations (smoke), and wallet service stubs.
- Manual exploratory test matrix executed across core user flows (enrollment → completion → NFT issuance → reward allocation).

### 3.6 Documentation

- Updated internal docs in `docs/` including minting API references and integration notes (NMKR / Blockfrost where relevant).
- Added this milestone completion report for transparency.

---

## 4. Acceptance Criteria Mapping

- **Source code public & reviewable**: Public GitHub repo, branch `milestone3`.
- **DB relies on ADA not points**: Schema migrations + removal of legacy point references in pricing services.
- **Credit card ADA wallet integration path**: Architectural abstraction + provider evaluation; API adapter stub committed.
- **NFTs mint on class completion**: Event-driven mint job + metadata templates + test confirmations.
- **Unit + manual testing with reports**: Test suites + manual session notes (link TODO).

- **Community-accessible marketing reports**: Redacted / anonymized Google Doc (link TODO).
- **Minimum outreach (events, authorities, schools)**: Logged events & engagement summary (Section 6).
- **Onboard at least one local government & school tester**: Confirmed (names disclosed where permissible – see privacy constraints).

---

## 5. Testing & QA Summary

### 5.1 Automated Tests

- Executed via `artisan phpunit`
  - Core pricing services: High
  - Mint orchestration: Moderate

### 5.2 Manual Testing Sessions

| Session | Focus | Outcome |
|---------|-------|---------|
| MT-01 | ADA migration backfill correctness | Pass – random sample validated. |
| MT-02 | Class completion → NFT mint dispatch | Pass – job enqueued & processed. |
| MT-03 | Reward token issuance | Pass – correct token amount ledgered. |

---

## 6. Marketing, Outreach & Adoption Activities

(In line with privacy & anonymization commitments.)

| Activity Type | Count / Status | Notes |
|---------------|----------------|-------|
| Events attended | ≥2 / month (target met) | Photos & dates in shared doc (link TODO). |
| Local government authorities approached | Multiple | Responses summarized anonymously. |
| Government meetings for platform usage definition | 2+ | Helped shape training modules roadmap. |
| School surveys conducted | Completed | Aggregate results published without school names. |
| Free test lessons | Delivered | Includes one pilot curriculum iteration. |
| Onboarded test municipality | 1 | Name published (where permitted). |
| Onboarded test school | 1 | Name published (where permitted). |

### Key Insights

---

## 7. Risk & Mitigation Log (Active During Milestone)

---

## 8. Metrics & KPIs (Baseline Establishment)

---

## 9. Evidence & Artifacts Index

| Artifact | Location / Link |
|----------|-----------------|
| Source code (Milestone 3) | Repo branch `milestone3` |
| ADA migration migration file | `database/migrations/*` (naming: includes date stamp) |
| NFT metadata templates | `templates/class-certificate.json`, `templates/class-ticket.json` |
| Minting integration docs | `docs/certificate-minting-api.md`, `docs/certificate-minting-nmkr.md` |
| Outreach & events report | Google Doc (link TODO) |
| Survey anonymized summary | Google Doc (link TODO) |
| Municipality & school onboarding confirmation | Public announcement / doc (link TODO) |

---

## 10. Compliance & Privacy Considerations

- Personally identifiable information (PII) and organizational sensitive data redacted in public-facing reports.
- Only anonymized survey aggregates shared.
- Where consent obtained, municipality & school names published; otherwise generic identifiers used.

---

## 11. Lessons Learned

Credit card integration
Regulatory considerations per country can make this difficult.

---

## 12. Next Steps (Milestone 4 Preview)

- Activate live credit card with NMKR Pay → ADA settlement green-lighted.
- Front-end enhancements for wallet UX, especially adding the non-custodial wallet support
- Broaden test coverage (integration, manual).
- Expand institutional onboarding playbook & produce case study draft.
