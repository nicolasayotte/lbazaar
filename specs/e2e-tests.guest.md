# Spec: E2E Playwright Tests — Guest Workflows

**Source:** Operator request for comprehensive Playwright browser tests
**Epic:** E-01 Guest Workflows
**Glossary:** specs/glossary.md
**See also:** specs/e2e-tests.xrefs.md
**Generated:** 2026-02-27
**Status:** IMPLEMENTED — all features covered by Playwright tests in `tests/Browser/guest/` and `tests/Browser/auth/route-protection.spec.js`

---

## System Constraints

- **SC-01**: Tests run against a seeded local environment (Sail). Test data may vary — tests must gracefully skip when expected seed data is absent rather than fail.
- **SC-02**: Tests must not depend on external services (Blockfrost, Stripe, Cardano network). Any feature requiring these is out of scope for this epic.
- **SC-03**: All assertions must wait for the Inertia/React app to hydrate before interacting with DOM elements.
- **SC-04**: Guest tests must use empty session state (no cookies, no auth tokens) to guarantee unauthenticated context.
- **SC-06**: Existing Playwright tests (auth/, course-browsing.spec.js, top-page.spec.js, admin/) are kept as-is. New tests fill coverage gaps. Some overlap between existing and new tests is acceptable.
- **SC-05**: Registration tests perform full integration (actually create users in the DB). They use unique, timestamped email addresses to avoid conflicts. `[ASSUMPTION: the test database is reset between full test runs via seeder or migration refresh.]`

---

## F-01: Top Page Rendering | MUST

**F-01.1: Top page loads successfully**
- **GIVEN** a Guest visits the root URL
- **WHEN** the page finishes loading
- **THEN** the page title contains the platform name and no server error (5xx) is returned

**F-01.2: Top page displays navigation elements**
- **GIVEN** a Guest visits the root URL
- **WHEN** the page finishes loading
- **THEN** the main navigation contains a visible link to the course listing page and a visible link to the login page

**F-01.3: Top page displays featured content**
- **GIVEN** a Guest visits the root URL and seeded courses exist
- **WHEN** the page finishes loading
- **THEN** at least one course card or promotional content section is visible. If no seeded data exists, the test skips gracefully.

---

## F-02: Course Browsing & Filtering | MUST

**Requires:** F-01 (Top Page — navigation to course listing)

**F-02.1: Course listing page renders filter panel**
- **GIVEN** a Guest navigates to the course listing page
- **WHEN** the page finishes loading
- **THEN** the following filter controls are visible: a text search input, a course type select, a language select, a professor/teacher select, and a submit/filter button

**F-02.2: Text search filters courses**
- **GIVEN** a Guest is on the course listing page
- **WHEN** the Guest enters a search term and submits the filter form
- **THEN** the URL updates to include the search parameter and the course listing reflects the filtered results

**F-02.3: Type filter filters courses**
- **GIVEN** a Guest is on the course listing page and at least one course type exists in the database
- **WHEN** the Guest selects a non-default course type from the type filter
- **THEN** the URL updates to include the type filter parameter and the listing updates. If no course types exist, the test skips.

**F-02.4: Search with no results shows empty state**
- **GIVEN** a Guest is on the course listing page
- **WHEN** the Guest searches for a term that matches no courses
- **THEN** an empty-state message is displayed indicating no records were found

**F-02.5: Course cards display required information**
- **GIVEN** a Guest is on the course listing page and seeded courses exist
- **WHEN** the page finishes loading
- **THEN** each course card displays: a title, a professor attribution, a course type chip, and a link to the course detail page. If no courses exist, the test skips.

**F-02.6: Pagination is functional**
- **GIVEN** a Guest is on the course listing page and more courses exist than the per-page limit
- **WHEN** the Guest clicks the second page button in the pagination control
- **THEN** the URL updates to include the page parameter and the listing shows a different set of courses. If fewer courses than the per-page limit exist, the test skips.

---

## F-03: Course Detail Page | MUST

**Requires:** F-02 (Course Browsing — navigation to detail)

**F-03.1: Course detail page renders from listing navigation**
- **GIVEN** a Guest is on the course listing page and at least one course exists
- **WHEN** the Guest clicks the detail link on a course card
- **THEN** the browser navigates to the course detail URL and the page displays the course title in a heading

**F-03.2: Course detail page renders from direct URL**
- **GIVEN** a Guest navigates directly to a course detail URL for an existing course
- **WHEN** the page finishes loading
- **THEN** the course title is displayed in a heading and no server error occurs

**F-03.3: Course detail page shows pricing**
- **GIVEN** a Guest views the detail page of a paid course
- **WHEN** the page finishes loading
- **THEN** the JPY price is visible. If the course has an ADA price, both JPY and ADA prices are displayed.

**F-03.4: Course detail page shows schedule information**
- **GIVEN** a Guest views the detail page of a course with at least one schedule
- **WHEN** the page finishes loading
- **THEN** schedule information (dates, times, or a schedule list/table) is visible. `[ASSUMPTION: schedules are visible to Guests on the detail page even though booking requires authentication.]`

**F-03.5: Nonexistent course returns appropriate response**
- **GIVEN** a Guest navigates to a course detail URL with a nonexistent ID
- **WHEN** the page finishes loading
- **THEN** the server returns a 404 status or displays a not-found message rather than a 500 error

---

## F-04: Portal Login | MUST

**F-04.1: Login page renders all form elements**
- **GIVEN** a Guest navigates to the portal login page
- **WHEN** the page finishes loading
- **THEN** an email input, password input, submit button, forgot-password link, and register link are all visible

**F-04.2: Successful student login redirects away from login**
- **GIVEN** a Guest is on the portal login page
- **WHEN** the Guest enters valid student credentials and submits
- **THEN** the browser navigates away from the login page (URL no longer contains the login path)

**F-04.3: Successful teacher login redirects away from login**
- **GIVEN** a Guest is on the portal login page
- **WHEN** the Guest enters valid teacher credentials and submits
- **THEN** the browser navigates away from the login page

**F-04.4: Invalid credentials show error**
- **GIVEN** a Guest is on the portal login page
- **WHEN** the Guest enters invalid credentials and submits
- **THEN** an error message is displayed and the user remains on the login page

**F-04.5: Empty submission triggers validation**
- **GIVEN** a Guest is on the portal login page
- **WHEN** the Guest clicks submit without entering any credentials
- **THEN** a validation error is displayed (either HTML5 native validation or server-side error)

---

## F-05: Admin Login | MUST

**F-05.1: Admin login page renders form elements**
- **GIVEN** a Guest navigates to the admin login page
- **WHEN** the page finishes loading
- **THEN** an email input, password input, and submit button are visible

**F-05.2: Successful admin login redirects to admin panel**
- **GIVEN** a Guest is on the admin login page
- **WHEN** the Guest enters valid admin credentials and submits
- **THEN** the browser navigates to the admin profile or dashboard page

**F-05.3: Invalid admin credentials show error**
- **GIVEN** a Guest is on the admin login page
- **WHEN** the Guest enters invalid credentials and submits
- **THEN** an error message is displayed and the user remains on the admin login page

---

## F-06: Route Protection | MUST

**F-06.1: Unauthenticated access to MyPage redirects to login**
- **GIVEN** a Guest is not authenticated
- **WHEN** the Guest attempts to access any MyPage route (profile, course history, etc.)
- **THEN** the browser redirects to the portal login page

**F-06.2: Unauthenticated access to admin panel redirects to admin login**
- **GIVEN** a Guest is not authenticated
- **WHEN** the Guest attempts to access any admin route (users, settings, etc.)
- **THEN** the browser redirects to the admin login page

**F-06.3: Non-admin user accessing admin routes is rejected**
- **GIVEN** a Student is authenticated
- **WHEN** the Student attempts to access an admin route
- **THEN** the browser redirects away from the admin panel (to the top page or an error page)

**F-06.4: Non-teacher user accessing teacher routes is rejected**
- **GIVEN** a Student is authenticated
- **WHEN** the Student attempts to access a teacher-only route (manage classes, class applications)
- **THEN** the browser redirects away or returns a 403 response

---

## F-07: Registration | SHOULD

**F-07.1: Registration index page shows role selection**
- **GIVEN** a Guest navigates to the registration page
- **WHEN** the page finishes loading
- **THEN** options to register as a Student or as a Teacher are visible

**F-07.2: Student registration form renders all fields**
- **GIVEN** a Guest navigates to the student registration page
- **WHEN** the page finishes loading
- **THEN** the required form fields (name, email, password, password confirmation) are visible along with a submit button

**F-07.3: Student registration with valid data succeeds**
- **GIVEN** a Guest is on the student registration page
- **WHEN** the Guest fills in all required fields with valid, unique test data and submits
- **THEN** the browser navigates to a success or email-verification page and no error is displayed. `[ASSUMPTION: the test uses a unique email like pw-e2e-student-{timestamp}@example.com to avoid conflicts.]`

**F-07.4: Student registration with duplicate email shows error**
- **GIVEN** a Guest is on the student registration page
- **WHEN** the Guest submits a registration with an email that already exists in the system
- **THEN** a validation error indicating the email is already taken is displayed

**F-07.5: Teacher registration form renders all fields**
- **GIVEN** a Guest navigates to the teacher registration page
- **WHEN** the page finishes loading
- **THEN** the required form fields are visible along with a submit button

**F-07.6: Teacher registration with valid data succeeds**
- **GIVEN** a Guest is on the teacher registration page
- **WHEN** the Guest fills in all required fields with valid, unique test data and submits
- **THEN** the browser navigates to the teacher registration success page. `[ASSUMPTION: teacher registration does not require admin approval before the user can log in — it only requires email verification.]`

---

## F-08: Inquiries | SHOULD

**F-08.1: Inquiries page renders the contact form**
- **GIVEN** a Guest navigates to the inquiries page
- **WHEN** the page finishes loading
- **THEN** the inquiry form is visible with input fields and a submit button

**F-08.2: Submitting a valid inquiry shows confirmation**
- **GIVEN** a Guest is on the inquiries page
- **WHEN** the Guest fills in all visible required input fields with valid test data and submits the form
- **THEN** a success/confirmation message is displayed or the page navigates to a thank-you state. The test discovers fields dynamically from the form rather than hardcoding field names.

**F-08.3: Submitting an invalid inquiry shows validation errors**
- **GIVEN** a Guest is on the inquiries page
- **WHEN** the Guest submits the form with empty required fields
- **THEN** validation errors are displayed for the missing fields

---

## F-09: Language Switching | COULD

**F-09.1: Language switch changes page content**
- **GIVEN** a Guest is on any page
- **WHEN** the Guest triggers the language switch (e.g., clicks a language toggle or navigates to the language-set route)
- **THEN** the page content updates to reflect the selected language and subsequent navigations remain in the new language. `[ASSUMPTION: the platform supports at least Japanese and English.]`

---

## F-10: Forgot Password | SHOULD

**F-10.1: Forgot password page renders form**
- **GIVEN** a Guest navigates to the forgot-password page
- **WHEN** the page finishes loading
- **THEN** an email input and submit button are visible

**F-10.2: Submitting a valid email shows confirmation**
- **GIVEN** a Guest is on the forgot-password page
- **WHEN** the Guest enters a registered email address and submits
- **THEN** a confirmation message indicating a reset email was sent is displayed (or the page transitions to a success state)

**F-10.3: Submitting an unregistered email shows appropriate response**
- **GIVEN** a Guest is on the forgot-password page
- **WHEN** the Guest enters an email address not associated with any account and submits
- **THEN** the page displays a response that does not reveal whether the email exists in the system (for security) OR displays a generic confirmation message. `[ASSUMPTION: the system does not reveal email existence to prevent enumeration attacks — it shows the same "check your email" message regardless.]`

---

---

## F-11: Route Smoke Test — Guest | MUST

**F-11.1: All public routes return non-500 responses**
- **GIVEN** a Guest with no authentication
- **WHEN** the Guest navigates to each known public route in sequence: top page, course listing, inquiries, registration index, student registration, teacher registration, portal login, admin login, forgot password
- **THEN** every route returns a response with status < 500

---

## Open Questions

- ~~OQ-01~~: **RESOLVED** — The `PlaywrightTestSeeder` provides 3 test users (student, teacher, admin) and the main seeder provides courses. Tests defensively skip when specific data (schedules, featured courses) is absent.

## Assumptions

- A-01: Test database is reset between full test suite runs. **CONFIRMED** — `PlaywrightTestSeeder` re-seeds users.
- A-02: Schedules are visible to Guests on course detail pages. **CONFIRMED** — Details.jsx renders schedule section for guests. Test skips gracefully if no schedules seeded.
- A-03: Teacher registration does not require admin approval before the user can log in. **CONFIRMED** — Teacher registration creates a `TeacherApplication` and redirects to `/register/teacher/success`. No immediate login required.
- A-04: Inquiry form fields include at minimum: name, email, and message body. **UPDATED** — Actual fields are: `name`, `email`, `subject`, and `message`. The `subject` field was not anticipated.
- A-05: Language switching supports at least Japanese and English. **CONFIRMED** — `GET /lang/{locale}` sets session locale; top page renders `translatables.title.top_page` in both EN and JA.
- A-06: Forgot password does not reveal email existence (security-safe response). **INVALIDATED** — The app returns distinct error messages: registered emails get a success toast, unregistered emails get `"We can't find a user with that email address."` inline error. F-10.3 tests the actual behavior.
- A-07: Registration tests create real users in the DB (full integration). **CONFIRMED** — F-07.3 (student) and F-07.6 (teacher) use timestamped emails to avoid conflicts.
