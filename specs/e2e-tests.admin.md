# Spec: E2E Playwright Tests — Admin Workflows

**Source:** Operator request for comprehensive Playwright browser tests
**Epic:** E-04 Admin Workflows
**Glossary:** specs/glossary.md
**See also:** specs/e2e-tests.xrefs.md
**Generated:** 2026-02-27
**Status:** IMPLEMENTED — all features covered by Playwright tests in `tests/Browser/admin/`

---

## System Constraints

- **SC-01**: All Admin workflow tests use a pre-authenticated session (stored session state) for the test Admin user. Admin login is tested in E-01 (Guest Workflows F-05).
- **SC-02**: Tests must not depend on external services (Blockfrost, Stripe, Cardano network).
- **SC-03**: Tests must wait for Inertia/React app hydration before DOM interaction.
- **SC-04**: Admin tests that create or modify settings data (categories, classifications, NFT configs) must use clearly identifiable test names and clean up after themselves where possible. `[ASSUMPTION: test database is reset between full runs.]`
- **SC-05**: Destructive admin actions (deleting users, deleting categories) should only be tested on test-created data, never on seed data that other tests depend on.

---

## F-01: Admin Profile | MUST

**F-01.1: Admin profile page loads**
- **GIVEN** an authenticated Admin navigates to the admin profile page
- **WHEN** the page finishes loading
- **THEN** the page renders without server errors and displays a profile form with pre-populated admin information

**F-01.2: Admin profile can be updated**
- **GIVEN** an authenticated Admin is on the profile page
- **WHEN** the Admin modifies a field and submits the form
- **THEN** a success message is displayed and the change persists on page reload

---

## F-02: User Management | MUST

**F-02.1: Users list page loads**
- **GIVEN** an authenticated Admin navigates to the users list page
- **WHEN** the page finishes loading
- **THEN** the page renders a table/list of users with columns for at minimum: name, email, role, and status

**F-02.2: User detail page loads**
- **GIVEN** an authenticated Admin clicks on a user from the users list
- **WHEN** the detail page finishes loading
- **THEN** the page renders the user's detailed information without errors

**F-02.3: Create user page renders**
- **GIVEN** an authenticated Admin navigates to the create user page
- **WHEN** the page finishes loading
- **THEN** the user creation form renders with fields for name, email, role, password, and a submit button

**F-02.4: Creating a user with valid data succeeds**
- **GIVEN** an authenticated Admin is on the create user page
- **WHEN** the Admin fills in all required fields with valid, unique data and submits
- **THEN** the browser navigates to the users list or user detail page and the new user appears. `[ASSUMPTION: admin-created users do not require email verification.]`

**F-02.5: Creating a user with duplicate email shows error**
- **GIVEN** an authenticated Admin is on the create user page
- **WHEN** the Admin submits with an email that already exists
- **THEN** a validation error is displayed

**F-02.6: User status can be toggled**
- **GIVEN** an authenticated Admin is viewing a user's detail page (not the Admin's own account)
- **WHEN** the Admin triggers a status change action (activate/deactivate)
- **THEN** the user's status updates and the change is reflected on the page. `[ASSUMPTION: toggling status is done via a button or link on the user detail page, not inline on the list.]`

---

## F-03: Inquiries Management | SHOULD

**F-03.1: Inquiries list page loads**
- **GIVEN** an authenticated Admin navigates to the admin inquiries page
- **WHEN** the page finishes loading
- **THEN** the page renders a table/list of inquiries or an empty state

**F-03.2: Inquiry detail page loads**
- **GIVEN** an authenticated Admin and at least one inquiry exists
- **WHEN** the Admin clicks on an inquiry from the list
- **THEN** the inquiry detail page renders showing the submitter's information and message. If no inquiries exist, the test skips.

---

## F-04: Class Applications Management | MUST

**F-04.1: Class applications list page loads**
- **GIVEN** an authenticated Admin navigates to the admin class applications page
- **WHEN** the page finishes loading
- **THEN** the page renders a table/list of class applications or an empty state

**F-04.2: Class application detail page loads**
- **GIVEN** an authenticated Admin and at least one class application exists
- **WHEN** the Admin clicks on a class application from the list
- **THEN** the detail page renders showing the application information (class name, teacher, status). If no applications exist, the test skips.

**F-04.3: Class application status can be updated**
- **GIVEN** an authenticated Admin is viewing a pending class application
- **WHEN** the Admin triggers a status change action (approve or reject)
- **THEN** the application's status updates on the page. If no pending application exists, the test skips. `[ASSUMPTION: status update is done via buttons on the detail page, not via a dropdown or inline edit on the list.]`

---

## F-05: Settings — Course Categories | SHOULD

**F-05.1: Categories settings page loads**
- **GIVEN** an authenticated Admin navigates to the course categories settings page
- **WHEN** the page finishes loading
- **THEN** the page renders a list of existing categories (or empty state) and a way to create a new category

**F-05.2: Creating a new category via dialog succeeds**
- **GIVEN** an authenticated Admin is on the categories settings page
- **WHEN** the Admin opens the create dialog, fills in a unique category name, and confirms
- **THEN** the dialog closes and the new category appears in the list

**F-05.3: Editing a category via dialog succeeds**
- **GIVEN** an authenticated Admin and at least one category exists
- **WHEN** the Admin opens the edit dialog for a category, modifies the name, and confirms
- **THEN** the dialog closes and the updated name appears in the list. If no categories exist, the test skips.

**F-05.4: Deleting a test-created category succeeds**
- **GIVEN** an authenticated Admin and a test-created category exists (created in F-05.2)
- **WHEN** the Admin triggers the delete action and confirms any confirmation dialog
- **THEN** the category is removed from the list

---

## F-06: Settings — Course Types | SHOULD

**F-06.1: Course types settings page loads**
- **GIVEN** an authenticated Admin navigates to the course types settings page
- **WHEN** the page finishes loading
- **THEN** the page renders without errors displaying course type configuration

---

## F-07: Settings — Classifications | SHOULD

**F-07.1: Classifications settings page loads**
- **GIVEN** an authenticated Admin navigates to the classifications settings page
- **WHEN** the page finishes loading
- **THEN** the page renders a list of existing classifications (or empty state) and a way to create a new classification

**F-07.2: CRUD operations on classifications work via dialogs**
- **GIVEN** an authenticated Admin is on the classifications settings page
- **WHEN** the Admin creates a new classification via dialog, edits it via dialog, then deletes it with confirmation
- **THEN** each operation succeeds: the classification appears, updates, then disappears from the list

---

## F-08: Settings — NFT Configuration | SHOULD

**F-08.1: NFT settings page loads**
- **GIVEN** an authenticated Admin navigates to the NFT settings page
- **WHEN** the page finishes loading
- **THEN** the page renders a list of existing NFT configurations (or empty state) and a way to create a new configuration

**F-08.2: CRUD operations on NFT configs work via dialogs**
- **GIVEN** an authenticated Admin is on the NFT settings page
- **WHEN** the Admin creates a new NFT config via dialog, edits it via dialog, then deletes it with confirmation
- **THEN** each operation succeeds without errors

---

## F-09: Settings — Translations | SHOULD

**F-09.1: Translations settings page loads**
- **GIVEN** an authenticated Admin navigates to the translations settings page
- **WHEN** the page finishes loading
- **THEN** the page renders a list/table of translation strings

**F-09.2: Editing a translation succeeds**
- **GIVEN** an authenticated Admin is on the translations settings page
- **WHEN** the Admin modifies a translation value and submits
- **THEN** a success message is displayed and the updated value persists on page reload

---

## F-10: Settings — General | SHOULD

**F-10.1: General settings page loads**
- **GIVEN** an authenticated Admin navigates to the general settings page
- **WHEN** the page finishes loading
- **THEN** the page renders without errors displaying configurable platform settings

**F-10.2: Updating general settings succeeds**
- **GIVEN** an authenticated Admin is on the general settings page
- **WHEN** the Admin modifies a setting and submits the form
- **THEN** a success message is displayed and the change persists

---

## F-11: Wallet History | SHOULD

**F-11.1: Admin wallet history page loads**
- **GIVEN** an authenticated Admin navigates to the admin wallet history page
- **WHEN** the page finishes loading
- **THEN** the page renders without server errors and shows wallet transaction records or an empty state

---

## F-12: Refunds | SHOULD

**F-12.1: Refunds page loads**
- **GIVEN** an authenticated Admin navigates to the refunds page
- **WHEN** the page finishes loading
- **THEN** the page renders without server errors and shows refund records or an empty state

---

## F-13: Admin Certificate Roster | COULD

**F-13.1: Admin can view certificate roster for any course**
- **GIVEN** an authenticated Admin and at least one course exists
- **WHEN** the Admin navigates to the certificate roster for that course
- **THEN** the page renders showing enrolled students and their certificate status. If no courses exist, the test skips.

---

## F-14: Admin Navigation | MUST

**F-14.1: Admin sidebar/navigation shows all admin sections**
- **GIVEN** an authenticated Admin is on any admin page
- **WHEN** the page finishes loading
- **THEN** navigation links are visible for: Profile, Users, Inquiries, Class Applications, Settings, Wallet History, and Refunds

**F-14.2: Each admin section is reachable via navigation**
- **GIVEN** an authenticated Admin is on the profile page
- **WHEN** the Admin clicks each navigation link in sequence
- **THEN** each page loads without server errors (status < 500) and the URL reflects the expected path

---

---

## F-15: Route Smoke Test — Admin | MUST

**F-15.1: All admin routes return non-500 responses**
- **GIVEN** an authenticated Admin
- **WHEN** the Admin navigates to each known admin route in sequence: profile, users, inquiries, class applications, categories settings, course types settings, classifications settings, NFT settings, translations settings, general settings, wallet history, refunds
- **THEN** every route returns a response with status < 500

---

## Open Questions

- OQ-01: Can the Admin create users of any role (student, teacher, admin), or only specific roles?
- OQ-02: Does the Admin panel have a sidebar navigation that is consistent across all admin pages?

## Assumptions

- A-01: Test database is reset between full test suite runs.
- A-02: Admin-created users do not require email verification.
- A-03: Status toggle for users is done on the detail page.
- A-04: Class application status updates are done via buttons on the detail page.
