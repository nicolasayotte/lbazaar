# Spec: E2E Playwright Tests — Student Workflows

**Source:** Operator request for comprehensive Playwright browser tests
**Epic:** E-02 Student Workflows
**Glossary:** specs/glossary.md
**See also:** specs/e2e-tests.xrefs.md
**Generated:** 2026-02-27
**Status:** IMPLEMENTED — all features covered by Playwright tests in `tests/Browser/auth/`

---

## System Constraints

- **SC-01**: All Student workflow tests use a pre-authenticated session (stored session state) for the test Student user. Login is handled by setup fixtures, not repeated per test.
- **SC-02**: Tests must not depend on external services (Blockfrost, Stripe, Cardano network). Wallet connection, ADA payments, and NFT minting are out of scope — only UI rendering and navigation are tested.
- **SC-03**: Tests must wait for Inertia/React app hydration before DOM interaction.
- **SC-04**: Tests that depend on specific seed data (course history, purchase records, certificates) must skip gracefully if that data is absent.
- **SC-05**: Tests must not perform destructive actions on shared test data (e.g., canceling the only booked schedule).

---

## F-01: MyPage Navigation | MUST

**F-01.1: MyPage redirects authenticated student to profile**
- **GIVEN** an authenticated Student
- **WHEN** the Student navigates to the MyPage root URL
- **THEN** the browser redirects to the profile page

**F-01.2: MyPage sidebar/navigation shows all student sections**
- **GIVEN** an authenticated Student is on the profile page
- **WHEN** the page finishes loading
- **THEN** navigation links are visible for: Profile, Class History, Purchase History, Wallet History, Certificates, and Badges/Rewards. `[ASSUMPTION: all these sections are visible in a sidebar or navigation menu on every MyPage page.]`

**F-01.3: Each MyPage section is reachable via navigation**
- **GIVEN** an authenticated Student is on the profile page
- **WHEN** the Student clicks each navigation link in sequence
- **THEN** each page loads without server errors (status < 500) and the URL reflects the expected path

---

## F-02: Profile Management | MUST

**F-02.1: Profile page displays current user information**
- **GIVEN** an authenticated Student navigates to the profile page
- **WHEN** the page finishes loading
- **THEN** the profile form is visible with pre-populated fields showing the Student's current information (name, email at minimum)

**F-02.2: Profile form can be edited and submitted**
- **GIVEN** an authenticated Student is on the profile page
- **WHEN** the Student modifies a non-critical field (e.g., display name) and submits the form
- **THEN** a success message is displayed and the updated value persists on page reload. `[ASSUMPTION: editing the profile does not require re-entering the password for non-sensitive fields.]`

**F-02.3: Password change form is accessible**
- **GIVEN** an authenticated Student is on the profile page
- **WHEN** the page finishes loading
- **THEN** a password change section or form is visible with fields for current password, new password, and new password confirmation

**F-02.4: Password change with mismatched confirmation shows error**
- **GIVEN** an authenticated Student is on the profile page
- **WHEN** the Student enters a current password, a new password, and a different confirmation value, then submits
- **THEN** a validation error is displayed indicating the passwords do not match

---

## F-03: Course History | MUST

**F-03.1: Course history page loads without errors**
- **GIVEN** an authenticated Student navigates to the class history page
- **WHEN** the page finishes loading
- **THEN** the page renders without server errors (status < 500) and the URL matches the class history path

**F-03.2: Course history displays records or empty state**
- **GIVEN** an authenticated Student is on the class history page
- **WHEN** the page finishes loading
- **THEN** either a list/table of course history records is displayed, or an empty-state message is shown if the Student has no history

**F-03.3: Course history records show essential details**
- **GIVEN** an authenticated Student is on the class history page and has at least one course history record
- **WHEN** the page finishes loading
- **THEN** each record displays at minimum: the class name and a status indicator. If no records exist, the test skips.

---

## F-04: Purchase History | MUST

**F-04.1: Purchase history page loads without errors**
- **GIVEN** an authenticated Student navigates to the purchase history page
- **WHEN** the page finishes loading
- **THEN** the page renders without server errors and the URL matches the purchase history path

**F-04.2: Purchase history displays records or empty state**
- **GIVEN** an authenticated Student is on the purchase history page
- **WHEN** the page finishes loading
- **THEN** either purchase records are displayed (showing payment method, amount, date at minimum) or an empty-state message is shown

---

## F-05: Wallet History | SHOULD

**F-05.1: Wallet history page loads without errors**
- **GIVEN** an authenticated Student navigates to the wallet history page
- **WHEN** the page finishes loading
- **THEN** the page renders without server errors and the URL matches the wallet history path

**F-05.2: Wallet history displays records or empty state**
- **GIVEN** an authenticated Student is on the wallet history page
- **WHEN** the page finishes loading
- **THEN** either wallet transaction records are displayed or an empty-state message is shown

---

## F-06: Certificates | SHOULD

**F-06.1: Certificates page loads without errors**
- **GIVEN** an authenticated Student navigates to the certificates page
- **WHEN** the page finishes loading
- **THEN** the page renders without server errors and the URL matches the certificates path

**F-06.2: Certificates page displays earned certificates or empty state**
- **GIVEN** an authenticated Student is on the certificates page
- **WHEN** the page finishes loading
- **THEN** either a list of earned certificates is displayed (showing class name and certificate status at minimum) or an empty-state message is shown

---

## F-07: Badges & Rewards | SHOULD

**F-07.1: Badges page loads without errors**
- **GIVEN** an authenticated Student navigates to the badges page
- **WHEN** the page finishes loading
- **THEN** the page renders without server errors and the URL matches the badges path

**F-07.2: Badges page displays badges and/or rewards sections**
- **GIVEN** an authenticated Student is on the badges page
- **WHEN** the page finishes loading
- **THEN** the page shows either a badges section, a rewards section, or both. If neither section has data, an empty-state is shown.

---

## F-08: Course Attendance Flow | SHOULD

**Requires:** Seeded course history with a booked schedule for the test Student

**F-08.1: Attend page loads for a booked schedule**
- **GIVEN** an authenticated Student has a booked schedule
- **WHEN** the Student navigates to the attendance page for that schedule
- **THEN** the page renders without errors and displays the class information. If no booked schedule exists in seed data, the test skips.

**F-08.2: Watch page renders if accessible**
- **GIVEN** an authenticated Student has a booked schedule for a class with video content
- **WHEN** the Student navigates to the watch page
- **THEN** the page renders without server errors (status < 500). If no video-type class is in seed data, the test skips.

**F-08.3: Exam page renders if accessible**
- **GIVEN** an authenticated Student has a booked schedule for a class with an active exam
- **WHEN** the Student navigates to the exam view page
- **THEN** the page renders without server errors. If no exam exists in seed data, the test skips.

**F-08.4: Feedback page renders if accessible**
- **GIVEN** an authenticated Student has attended a class
- **WHEN** the Student navigates to the feedback page for that schedule
- **THEN** the page renders without server errors. If the prerequisite state doesn't exist, the test skips.

---

## F-09: Course Browsing as Authenticated Student | SHOULD

**F-09.1: Course listing page shows booking controls when authenticated**
- **GIVEN** an authenticated Student navigates to the course listing page
- **WHEN** the page finishes loading
- **THEN** the course listing displays the same content as the Guest view (courses, filters, pagination) `[ASSUMPTION: course listing looks the same for Guests and authenticated users — booking happens on the detail page, not the listing.]`

**F-09.2: Course detail page shows booking/purchase options for authenticated student**
- **GIVEN** an authenticated Student navigates to a course detail page for a class with available schedules
- **WHEN** the page finishes loading
- **THEN** a booking or purchase action (button, form, or link) is visible that is not shown to Guests. If no class with available schedules exists, the test skips.

---

## F-10: Logout | MUST

**F-10.1: Student can log out**
- **GIVEN** an authenticated Student is on any page
- **WHEN** the Student triggers the logout action
- **THEN** the browser navigates to the login page or top page and the Student's session is invalidated (subsequent navigation to MyPage redirects to login)

---

---

## F-11: Route Smoke Test — Student | MUST

**F-11.1: All student-accessible routes return non-500 responses**
- **GIVEN** an authenticated Student
- **WHEN** the Student navigates to each known student-accessible route in sequence: MyPage profile, class history, purchase history, wallet history, certificates, badges, course listing, course detail (ID 1, skip on 404)
- **THEN** every route returns a response with status < 500

---

## Open Questions

- ~~OQ-01~~: **RESOLVED** — Yes, partially. `PlaywrightTestSeeder` creates pw-student with: one ongoing enrollment (upcoming schedule, 2030-01-15) and one completed enrollment (completed schedule, 2024-06-01). This provides course history records and a booked schedule for F-08 attend tests. Purchase records and certificates are **not** seeded — those tests skip gracefully when data is absent.
- ~~OQ-02~~: **RESOLVED** — The sidebar navigation is consistent across all MyPage pages. It is rendered by `SidebarMenu.jsx` which is shared across all MyPage layouts.

## Assumptions

- A-01: All MyPage sections are visible in navigation for authenticated Students. **CONFIRMED** — `SidebarMenu.jsx` renders all links regardless of page.
- A-02: Profile editing of non-sensitive fields does not require password re-entry. **CONFIRMED** — profile update uses a separate form from password change.
- A-03: Course listing looks the same for Guests and authenticated users. **CONFIRMED** — booking controls appear on the detail page, not the listing.
