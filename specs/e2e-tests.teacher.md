# Spec: E2E Playwright Tests — Teacher Workflows

**Source:** Operator request for comprehensive Playwright browser tests
**Epic:** E-03 Teacher Workflows
**Glossary:** specs/glossary.md
**See also:** specs/e2e-tests.xrefs.md
**Generated:** 2026-02-27
**Status:** DRAFT — requires operator review

---

## System Constraints

- **SC-01**: All Teacher workflow tests use a pre-authenticated session (stored session state) for the test Teacher user.
- **SC-02**: Tests must not depend on external services (Blockfrost, Stripe, Cardano network). Certificate minting, token reward minting, and ADA transactions are out of scope — only UI rendering and form interactions are tested.
- **SC-03**: Tests must wait for Inertia/React app hydration before DOM interaction.
- **SC-04**: Tests that create or modify data (class applications, courses, exams, schedules) should use clearly identifiable test data and clean up where possible. `[ASSUMPTION: the test database is reset between full test suite runs, so cleanup is best-effort, not mandatory.]`
- **SC-05**: Teachers also have access to Student-level pages (profile, course history, etc.). These are covered in E-02 and not re-tested here unless behavior differs for Teacher role.

---

## F-01: Class Applications | MUST

**F-01.1: Class applications list page loads**
- **GIVEN** an authenticated Teacher navigates to the class applications page
- **WHEN** the page finishes loading
- **THEN** the page renders without server errors and displays either a list of existing applications or an empty state

**F-01.2: Create class application form renders**
- **GIVEN** an authenticated Teacher navigates to the create class application page
- **WHEN** the page finishes loading
- **THEN** the application form is visible with input fields (class name, description, and other required fields) and a submit button

**F-01.3: Submitting a valid class application succeeds**
- **GIVEN** an authenticated Teacher is on the create class application page
- **WHEN** the Teacher fills in all required fields with valid data and submits
- **THEN** the browser navigates to the applications list or a success view and the new application appears in the list. `[ASSUMPTION: the required fields for a class application are at minimum: class name, description, and category.]`

**F-01.4: Submitting an incomplete class application shows validation errors**
- **GIVEN** an authenticated Teacher is on the create class application page
- **WHEN** the Teacher submits the form with required fields left empty
- **THEN** validation errors are displayed for the missing fields

**F-01.5: Class application detail page renders**
- **GIVEN** an authenticated Teacher has at least one class application
- **WHEN** the Teacher navigates to the detail view of that application
- **THEN** the application details are displayed. If no application exists, the test skips.

---

## F-02: Manage Classes Dashboard | MUST

**F-02.1: Manage classes page loads**
- **GIVEN** an authenticated Teacher navigates to the manage classes page
- **WHEN** the page finishes loading
- **THEN** the page renders without server errors and shows either a list of the Teacher's classes or an empty state

**F-02.2: Manage class tabs are accessible**
- **GIVEN** an authenticated Teacher has at least one class
- **WHEN** the Teacher navigates to the manage class detail for that class
- **THEN** tabs or navigation for Feedbacks, Exams, Schedules, and Certificates are visible. If no class exists, the test skips.

**F-02.3: Feedbacks tab renders**
- **GIVEN** an authenticated Teacher is viewing a class they own
- **WHEN** the Teacher navigates to the feedbacks tab/page
- **THEN** the page renders without errors and shows feedback records or an empty state

**F-02.4: Exams tab renders**
- **GIVEN** an authenticated Teacher is viewing a class they own
- **WHEN** the Teacher navigates to the exams tab/page
- **THEN** the page renders without errors and shows exam records or an empty state

**F-02.5: Schedules tab renders**
- **GIVEN** an authenticated Teacher is viewing a class they own
- **WHEN** the Teacher navigates to the schedules tab/page
- **THEN** the page renders without errors and shows schedule records or an empty state

**F-02.6: Certificates tab renders**
- **GIVEN** an authenticated Teacher is viewing a class they own
- **WHEN** the Teacher navigates to the certificates tab/page
- **THEN** the page renders without errors and shows certificate records or an empty state

---

## F-03: Course CRUD | SHOULD

**Requires:** F-01 (Class Applications — an approved application creates a Class)

**F-03.1: Edit course page renders for owned class**
- **GIVEN** an authenticated Teacher owns at least one class
- **WHEN** the Teacher navigates to the edit page for that class
- **THEN** the edit form loads pre-populated with the class's current data. If no owned class exists, the test skips.

**F-03.2: Updating course with valid data succeeds**
- **GIVEN** an authenticated Teacher is on the edit page for a class they own
- **WHEN** the Teacher modifies a field (e.g., description) and submits the form
- **THEN** a success message is displayed or the page redirects to the class detail, and the updated data persists

**F-03.3: Create course page renders**
- **GIVEN** an authenticated Teacher has an approved class application
- **WHEN** the Teacher navigates to the create course page for that application
- **THEN** the course creation form renders with required fields. If no approved application exists, the test skips. `[ASSUMPTION: course creation is linked to an approved class application — teachers create courses from applications, not independently.]`

---

## F-04: Exam Management | SHOULD

**Requires:** F-02 (Manage Classes — navigation to exams)

**F-04.1: Create exam page renders**
- **GIVEN** an authenticated Teacher owns a class
- **WHEN** the Teacher navigates to create an exam for that class
- **THEN** the exam creation form renders with fields for questions, answers, and a submit button. If no owned class exists, the test skips.

**F-04.2: Edit exam page renders**
- **GIVEN** an authenticated Teacher owns a class with at least one exam
- **WHEN** the Teacher navigates to the edit page for that exam
- **THEN** the exam form loads pre-populated with the exam's current data. If no exam exists, the test skips.

---

## F-05: Schedule Management | SHOULD

**Requires:** F-02 (Manage Classes — navigation to schedules)

**F-05.1: Create schedule page renders**
- **GIVEN** an authenticated Teacher owns a class
- **WHEN** the Teacher navigates to create a schedule for that class
- **THEN** the schedule creation form renders with date/time fields and a submit button. If no owned class exists, the test skips.

**F-05.2: Schedule detail page renders**
- **GIVEN** an authenticated Teacher owns a class with at least one schedule
- **WHEN** the Teacher navigates to the schedule detail page
- **THEN** the page renders with schedule information and a student list (or empty state for students). If no schedule exists, the test skips.

**F-05.3: Student view within schedule renders**
- **GIVEN** an authenticated Teacher owns a class with a schedule that has at least one enrolled student
- **WHEN** the Teacher navigates to view that student within the schedule
- **THEN** the student detail page renders with the student's attendance/completion information. If no enrolled student exists, the test skips.

---

## F-06: Teaching Schedules Overview | SHOULD

**F-06.1: Teaching schedules page loads**
- **GIVEN** an authenticated Teacher navigates to the MyPage schedules page
- **WHEN** the page finishes loading
- **THEN** the page renders without errors and shows either a list of the Teacher's upcoming/past schedules or an empty state

---

## F-07: Certificate Management UI | COULD

**Requires:** F-02 (Manage Classes — certificates tab)

**F-07.1: Certificate roster renders eligible students**
- **GIVEN** an authenticated Teacher is on the certificates tab for a class with at least one student who completed the class
- **WHEN** the page finishes loading
- **THEN** the roster shows the student(s) with their certificate eligibility status. If no eligible students exist, the test skips.

**F-07.2: Mint/airdrop button is present**
- **GIVEN** an authenticated Teacher is on the certificates tab with eligible students
- **WHEN** the page finishes loading
- **THEN** a mint or airdrop action button is visible (clicking it is out of scope since it requires blockchain interaction). If no eligible students exist, the test skips.

---

---

## F-08: Route Smoke Test — Teacher | MUST

**F-08.1: All teacher-accessible routes return non-500 responses**
- **GIVEN** an authenticated Teacher
- **WHEN** the Teacher navigates to each known teacher-accessible route in sequence: MyPage profile, class history, purchase history, wallet history, certificates, badges, class applications, manage classes, teaching schedules, course listing
- **THEN** every route returns a response with status < 500

---

## Open Questions

- OQ-01: Does the test seeder create at least one approved class application and one class owned by the test Teacher user?
- OQ-02: Are course creation and class application creation separate flows, or does creating a class application automatically create the course upon approval?

## Assumptions

- A-01: Test database is reset between full test suite runs.
- A-02: Class application required fields include at minimum: name, description, and category.
- A-03: Course creation is linked to an approved class application.
