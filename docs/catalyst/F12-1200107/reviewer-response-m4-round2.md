# Milestone 4 — Response to Reviewer Feedback (Round 2)

Thank you for the continued, hands-on review and for testing the platform with a real
teacher account — that is exactly the kind of scrutiny that makes the product better.
We agree with your recommendation and **will prepare a detailed end-to-end walkthrough
video (teacher and student journeys) for the final milestone**.

Below we address each point. Items are grouped as **Fixed/scheduled** (a real defect we
confirmed), **Clarified** (already implemented — we explain where and why it wasn't
obvious), and **Documented / planned** (business-model and outreach items, answered with
honest current status rather than overstated claims). Where the answer is a real-world
artifact, we point to the Marketing & Sales report (Google Doc) already linked in the PoA.

Before that, we'd like to raise one point respectfully — in good faith and, we believe,
in the interest of both sides and the wider Catalyst process.

---

## A note on milestone scope and approval

This proposal is milestone-based. Each milestone carries a defined set of deliverables and
acceptance criteria, agreed at the outset in the Statement of Milestones. Milestone 4's
criteria are the six Outputs (**A–F**) enumerated in the Proof of Achievement, and the
evidence for each has been provided and is, we believe, complete. This milestone also
already received **one approval** in the first review; the present response is to a single
not-approved review.

We genuinely value the product feedback in your review — much of it reflects exactly where
we want to take the platform, and we have **added those items to our roadmap**: richer
multi-lesson/package discovery UX, a teacher earnings view, an ADA opt-out for teachers, a
fuller governance dashboard with live metrics, and a finalized token economic model. We
will pursue them, and your review has made the roadmap better.

At the same time, several of these suggestions describe capabilities **beyond this
milestone's acceptance criteria**, and in one case (a finalized token economic model)
**gated by external regulatory constraints in Japan that we cannot responsibly pre-empt**. Using newly-introduced product requirements as
conditions for approving an already-delivered milestone extends the project's timeline
without a corresponding change to the agreed scope or budget. A milestone that is
functionally complete, held open for out-of-scope additions, ultimately works against the
project's success — and against the contributors and community waiting on it.

We therefore respectfully ask that the milestone be assessed against **its stated
acceptance criteria**. Where your feedback identifies a genuine *in-scope* gap, we have
owned it without reservation and acted on it:

- the **Edit Class defect** — a real bug, now root-caused and scheduled (Output C,
  bug-fixing); and
- the **§F outreach criteria** — the additional local-government-related organization and
  school test classes, which are carried out and evidenced in the Marketing report.

For everything that falls outside the agreed criteria, we will gladly carry it forward,
and we'd welcome a short call to align on what belongs in the **final** milestone versus
the longer-term roadmap. Once Milestone 4's acceptance criteria are met — together with the
bug fix and the detailed walkthrough video you recommended — we hope we can converge on
approval so the project can keep moving on schedule.

---

## 1. Teacher-account observations

### 1a. JPY → ADA conversion — now documented; ADA opt-out is a fair request (planned)

You are right that the conversion mechanism should be explicit. The full mechanism:

- Teachers price a class in **JPY** (the single source-of-truth price). ADA is **derived
  for display and at checkout**, never stored as the canonical price.
- The ADA/JPY rate is fetched from **CoinGecko** (`/simple/price?ids=cardano&vs_currencies=jpy`),
  **cached for 10 minutes** (`ExchangeRateService`), with a DB-setting **fallback rate** if
  the API is unavailable, so the platform degrades gracefully rather than breaking checkout.
- At checkout the quoted ADA amount is **locked for a short quote window (5 min)** so the
  price cannot move under the buyer mid-payment; the converted amount is what becomes the
  on-chain lovelace total.
- The course page **live-polls the rate (~60 s)** and shows a **drift warning if the price
  moves >5%** since the page loaded, prompting the student to re-confirm.
- Prices are shown **dually** everywhere — e.g. `¥10,000 (~₳100)` — so neither buyers nor
  teachers lose sight of the fiat figure they actually set.

> We have written this up as a dedicated section so it is reviewable. (`docs/integrations.md` /
> `docs/data-flows.md`.)

**On giving teachers the choice not to accept ADA:** we agree this is valuable for teachers
not yet comfortable with crypto, and we are **adding it to the roadmap** as a per-class
payment-method toggle (e.g. "card only / ADA only / both"). Note that today every paid
class already exposes **both** a "Buy with ADA" and a "Pay with Credit Card" path, so a
crypto-averse teacher's students can already pay entirely by card; the toggle simply lets
the teacher hide the ADA path explicitly. We chose to flag this as planned rather than
ship a half-considered flag this round.

### 1b. "Edit Class" not reflecting changes — confirmed real bug, fix scheduled

Thank you for catching this — it is a **genuine, edit-specific defect**, and your report
let us reproduce and root-cause it precisely.

The course form drives its category control off a **plural `categories` array** (a recent
change that introduced multi-category support), but the server-side validation still
required the **legacy singular `category`** field. On **create** the singular value rides
along from the course-application data, so creation works; on **edit** the course object
has no singular `category`, validation fails, and the form silently bounces back — so the
edit appears to "do nothing." (Our automated tests missed it because they submitted a
hand-built payload containing the singular field that the real UI no longer sends.)

The fix was small and contained: we aligned the server-side validation to the plural
`categories` field, reconciled the create path so it derives the legacy category from the
plural input, and replaced the misleading tests with ones that submit the **real** form
payload. **This fix has now landed.** We treated the misleading test as part of the fix so
this class of "green CI, broken UI" cannot recur — the new tests now pass on the same
payload shape the UI actually sends.

### 1c. "Only one video / one lesson per course" — multi-lesson IS supported (via Course Packages)

The platform is **not** limited to a single lesson. A single `Course` record is one unit
of content, but teachers compose **multi-lesson curricula** two ways:

1. **Course Packages** — a teacher creates a package and groups multiple courses
   (lessons) under it (`CoursePackage` → many `Course`, junction table
   `course_package_courses`). On a course's detail and attendance pages, students see the
   **sibling lessons in the same package** and a "complete the classes to earn the badge"
   progression. So a "Course" is a lesson; a "Package" is the multi-lesson course/module.
2. **Multiple sessions per live class** — a live `Course` has **many `CourseSchedule`s**,
   so a recurring/multi-session class is a first-class concept.

We acknowledge **why it looked single-lesson to you**: package grouping is created from
inside the course form (the "package" selector / "Create package" dialog) and is currently
surfaced to students only *from within a course in the package* — there is **no dedicated
"browse packages" page yet**, and there is no single bundled package checkout. Those two
gaps are real and are on the roadmap. But the underlying multi-lesson model exists, is
wired end-to-end, and students do see the full lesson set of a package. The walkthrough
video for the final milestone will demonstrate building and consuming a multi-lesson
package explicitly.

### 1d. Where teachers configure payouts — payouts are automatic; visibility UI is the gap

Teacher payouts are **automated and require no manual wallet entry**, which is why you
couldn't find a configuration screen — there intentionally isn't one for the wallet:

- **ADA sales:** each user (including teachers) is automatically assigned a **custodial
  Cardano wallet** derived deterministically from their user ID
  (`get-custodial-address.mjs`). When a student buys with ADA, the purchase transaction
  **splits on-chain in a single tx**: the teacher's custodial address receives their share
  and the platform receives commission — no intermediary holds the funds.
- **Revenue model / commission:** the split is governed by an admin **commission setting**
  (default **20% platform / 80% teacher**). The commission is taken out of the student's
  payment, not added on top.
- **Credit-card (Stripe) sales:** the platform currently collects the full card payment;
  teacher settlement for card sales is handled off-platform. (A per-teacher automated card
  payout — e.g. Stripe Connect — is **not yet implemented**; see §2.)

What is genuinely **missing is teacher-facing visibility**: there is no "earnings /
balance / payout" dashboard where a teacher can see received ADA or their custodial
address, and no self-serve withdrawal UI. We think that is the right read of your concern,
and a **teacher earnings/payout view is on the roadmap**. We've documented the payout and
commission mechanics so the flow is auditable in the meantime.

---

## 2. Economic model, token utility, and revenue model

This is a fair challenge and we want to be straight about it rather than over-claim.

- **Token reward — mechanics only, model deliberately deferred (regulatory reasons).**
  The reward token was part of the original design, and the **mechanics are fully built and
  tested** (per-course opt-in fungible mint on completion, metadata, invalidation on
  refund). However, defining a *monetary* utility/economic model for the token in Japan
  raises **real regulatory questions** (how such a token is classified and what obligations
  attach to it). Rather than ship a tokenomics design we might have to unwind, we are
  **holding the economic model open until the regulatory path is clear**, and for now the
  token functions purely as a completion-reward primitive with **no promised monetary
  value**. We'd rather be conservative and compliant here than impressive on paper.
  (`docs/token-reward.md` states exactly this — capability plus the open questions.)

- **Teacher payment flow & platform revenue — clarified (see §1d).** The revenue model is
  a **commission on sales** (default 20% platform / 80% teacher), applied on-chain for ADA
  and via the platform account for card payments. That is the platform's revenue mechanism
  today; we've now documented it explicitly so it is no longer "unclear."

---

## 3. Discord community governance

The governance layer is real and the **bot works** — the mechanics are correct — but the
community is still **small and early**, so we'll scope *what it governs* precisely here and
**provide live metrics/evidence in the final milestone** rather than quote numbers we'd
have to caveat.

**What the community currently governs (implemented, via the Discord bot):**

1. **Who becomes a teacher** — a prospective teacher's application creates a vote in the
   community channel; passing the vote grants teacher status.
2. **Which classes get published** — a teacher applies **per class** through the same
   voting mechanism (an approved application → `CourseApplication.approved_at`) before the
   class can go live.

Both are enforced in code (the "your information needs to be verified" state you saw is a
*pending community vote*, not a broken flow), and the vote-passing threshold is itself an
admin/governance parameter (`vote-passing-percentage`).

**Design intent and the direction we're taking it:** the purpose is to keep **curation in
the community's hands** ("anyone may *apply* to teach or publish; the community decides")
rather than a single admin gatekeeper. Candidate decisions we intend the community to
influence as it grows — featured/curated content and categories, and dispute/quality
signals on courses — will be documented as we formalize them.

**Evidence we commit to providing in the final milestone:** the Discord invite/server
reference, current member count, an activity snapshot, examples of real teacher/class
governance votes, and partner reactions to the governance model. We have a working server
and bot today; we are choosing to present **verified** numbers at close-out rather than
soft ones now.

---

## 4. Test classes — local-government-related organization and school

These activities **were carried out during the milestone** and are evidenced in the
**Marketing & Sales report** (Google Doc linked in the PoA, §"Sales, Marketing & Hearings"),
dated May 24, 2026. Mapping to your two acceptance criteria:

**Additional school(s) holding Web3 / SDG-related test classes:**

- **More than 10 test classes** were conducted on the platform during this milestone period.
- **Seitoku Gakuen** and **Seifukan (high school)** — continuing partners from Milestone 3,
  with ongoing test-class use of the platform.
- **Seisen University** (Prof. Kanekiyo, President Yamamoto) — platform introduced and
  demonstrated; discussions toward a formal collaboration for using it as a venue for
  student-generated reports.

**Additional local-government-related organization making content / watching a test class:**

- **Akariyu Suzuran (灯湯すずらん), Chino City** — a Lake Shirakaba-area community facility
  **supported by Chino City** as part of regional-revitalization initiatives, prepared as a
  regional implementation site where local content/learning activities run on the platform
  (facility opens June 2026; ecosystem detail to be reported at close-out).
- **IBM Regional DX Center Nagano** — established under a **tripartite agreement among IBM
  Japan, Nagano Prefecture, and Nagano City** ("Smart City NAGANO"); we attended and
  discussed platform synergies for regional/education DX.
- **KIBOTCHA (Higashimatsushima)** — a disaster-prevention community facility; discussions
  on bringing disaster-preparedness (SDG-aligned) education content onto the platform.

The report also includes an **anonymized user survey (20+ respondents** — university and
high-school teachers and students, regional-government affiliate, NPO, business-association
members), with feedback themes (student-generated content, SDG/disaster-prevention content
demand, credit-card payment as an adoption enabler, NFT credentials for non-formal
learning). Where an activity is *scheduled rather than complete* (e.g. Akariyu Suzuran's
June 2026 opening), we've said so explicitly rather than imply it's already running.

---

## Summary

| # | Item | Status |
|---|------|--------|
| 1a | JPY→ADA conversion | **Documented**; ADA opt-out toggle **planned** |
| 1b | Edit Class save bug | **Fixed & landed** — validation aligned to plural `categories`, create path reconciled, real-payload tests added |
| 1c | One lesson per course | **Clarified** — multi-lesson via Course Packages + multi-session live; package *discovery/checkout* on roadmap |
| 1d | Teacher payout config | **Clarified** — auto custodial payout + commission model; teacher earnings UI **planned** |
| 2 | Economic model / token utility / revenue | Token = **mechanics only, model deferred for regulatory reasons**; revenue = **commission model, documented** |
| 3 | Discord governance | **Scoped** what's governed (works today); **metrics/evidence committed for final milestone** |
| 4 | Test classes (gov org + school) | **Done & evidenced** in Marketing report (>10 classes; Seitoku/Seifukan/Seisen; Akariyu Suzuran/Chino City, IBM DX Center Nagano, KIBOTCHA) |

We'll also deliver the **detailed teacher+student walkthrough video** you recommended for
the final milestone.
