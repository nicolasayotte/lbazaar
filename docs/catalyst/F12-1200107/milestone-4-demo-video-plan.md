# Milestone 4 — Demo Video Plan

**Goal:** Single YouTube walkthrough that proves the 6 Milestone 4 user stories work end-to-end. Target length: 8–12 minutes.

**Audience:** Catalyst reviewers — they want concrete evidence each acceptance criterion is met. Skip marketing fluff; show the working flow.

---

## Pre-Recording Setup

Have these ready in separate browser windows/tabs to avoid login screens mid-recording:

1. **Student account** — logged in, has at least one course completion eligible for reward
2. **Teacher account** — logged in, owns a course with rewards configured
3. **Admin account** — logged in, ready for refund/airdrop scenarios
4. **Cardano wallet** — Eternl (or Nami) on Preprod with at least 50 tADA
5. **Stripe test card** — `4242 4242 4242 4242`, any future expiry, any CVC
6. **Cardanoscan Preprod** tab — `https://preprod.cardanoscan.io/` for showing on-chain confirmations

**Seed data checklist:**
- [ ] One paid course priced in JPY (~5000–10000 ¥) with NFT certificate enabled
- [ ] One paid course with token reward configured (e.g. 100 tokens)
- [ ] Test student already enrolled but not yet completed in some courses
- [ ] Test student already completed in one course (to demo reward minting)

**Recording:**
- Use OBS or QuickTime; 1080p, 30fps; mic check.
- Hide bookmark bar / personal tabs.
- Pre-write the script in a notes window — read it but stay conversational.

---

## Script — 6 User Stories in Order

### Intro (30s)

> "This is the Milestone 4 walkthrough for Le Bazaar — Catalyst Fund 12, Project 1200107. I'll demo the six user stories: ADA payments, Stripe payments, NFT certificate rewards, token rewards, teacher reward configuration, and end with platform reliability."

Show: home page → login screens visible.

---

### Story 1: Student Buys a Class with ADA (90s)

**Goal:** Show the on-chain payment flow end-to-end.

1. As **student**, browse courses → click a paid course.
2. Show the price displayed in **both JPY and ADA** (live conversion indicator `~₳`).
3. Click "Buy with ADA" → wallet connect dialog.
4. Connect Eternl wallet → show address autofill.
5. Show the live ADA quote refreshing (mention drift warning if seen).
6. Click "Confirm" → wallet pops up to sign.
7. Sign in wallet → submission confirmation.
8. Switch to Cardanoscan tab — paste tx hash, show it confirming.
9. Back in app: show "access granted" / course now in My Classes.

**Talking points:** "The ADA price auto-refreshes from a live quote. We monitor Cardano network health — if the network were degraded, this button would be disabled."

---

### Story 2: Student Buys a Class with Stripe (60s)

**Goal:** Show the alternative credit-card flow works.

1. As **student**, pick a different paid course → "Buy with Credit Card".
2. Fill the Stripe checkout: `4242 4242 4242 4242`, any future date, any CVC.
3. Submit → show success page → course in My Classes.
4. Brief mention: "Stripe is Japan-compliant and uses webhook confirmation."

**Talking points:** "Both payment paths are independent — if Stripe is down, ADA still works, and vice versa."

---

### Story 3: Teacher Configures NFT Certificate Reward (60s)

**Goal:** Show teacher-side reward setup.

1. As **teacher**, go to course management → Rewards tab.
2. Enable NFT certificate, fill name, description, image URL.
3. Save → show the field becoming locked once a student is enrolled (briefly mention).

**Talking points:** "Once a student enrolls, the reward config locks — students always get what was promised at signup time."

---

### Story 4: Teacher Configures Token Rewards (30s)

**Goal:** Show token reward setup; build on the same screen.

1. Same course, same Rewards tab — enable token reward, set amount (e.g. 100).
2. Save → show both rewards now active.

**Talking points:** "Tokens and certificates airdrop together in a single on-chain transaction."

---

### Story 5: Student Receives NFT Certificate on Completion (90s)

**Goal:** Show student-side reward delivery.

1. Switch to **student** account → completed course page.
2. Click "Mint My Certificate" — wallet pops up.
3. Sign → show pending state → "Minted" confirmation with explorer link.
4. Click explorer link → Cardanoscan opens, show NFT in tx outputs.
5. Navigate to **My Rewards** page → show the new certificate listed with image and policy ID.

**Talking points:** "Certificates are soul-bound — non-transferable. The minting policy enforces that on-chain."

---

### Story 6: Student Receives Token Reward on Completion (45s)

**Goal:** Show tokens land alongside certificate.

1. Same My Rewards page — point at the token amount alongside the certificate.
2. Open Cardano wallet → show tokens visible in the wallet's asset list.

**Talking points:** "Same transaction as the certificate — one signature, both rewards delivered."

---

### Closing — Platform Reliability (60s)

Quick montage of reliability features:

1. **Wallet heartbeat:** disconnect wallet mid-session → reconnect prompt appears.
2. **Refund:** as **admin**, navigate to refund panel → show a recent transaction → trigger refund. Show the associated reward gets flagged.
3. **Network monitor:** mention (don't have to demo): "If Cardano is degraded, ADA payments are disabled with a banner."
4. **Test coverage:** flash terminal showing test report counts (PHP: 548, JS: 107, web3: 99, Playwright: ~150 tests).

---

### Outro (15s)

> "That's Milestone 4 — payments via ADA and Stripe, NFT certificates, token rewards, and teacher configuration, all live on Cardano Preprod. Thanks for watching."

Show: GitHub repo URL, deployed staging URL.

---

## Editing Checklist

- [ ] Trim wallet pop-up wait times (cut to 1–2s)
- [ ] Add captions/lower-thirds for each user story title
- [ ] Highlight tx hashes on screen (zoom/box overlay)
- [ ] Background music: low/none — voiceover should be primary
- [ ] Outro: show repo + Catalyst project ID on screen
- [ ] Upload as **unlisted** first → review internally → flip to public
- [ ] Add chapter markers per user story in YouTube description

---

## Talking Points — Cheat Sheet

If you stumble, fall back to one of these short truths:

- *"Two parallel payment paths so if one's down, the other isn't."*
- *"Reward terms lock at enrollment so students get what was promised."*
- *"NFTs are soul-bound — the minting policy enforces that on-chain."*
- *"Tokens and certificates airdrop in the same transaction — one signature."*
- *"We monitor Cardano network health and degrade gracefully."*

---

## What NOT to Show

- Internal admin dashboards beyond what's relevant to the 6 stories.
- The legacy points system (it's removed).
- Half-built features (on-chain revocation, S3 image upload, email notifications).
- Test code or terminal sessions, unless brief at the end as evidence.
