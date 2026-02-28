# E2E Tests — Cross-Epic References

**Generated:** 2026-02-27

This file maps interfaces and shared state between the 4 E2E test epics.

---

## Auth Session Fixtures

**Owner:** E-01 (Guest Workflows)
**Consumers:** E-02, E-03, E-04

The auth setup fixtures (student.setup.js, teacher.setup.js, admin.setup.js) create stored session states used by all authenticated epics. E-01 tests the login flow itself; E-02/E-03/E-04 consume the saved session state to skip login.

- E-01 F-04 (Portal Login) → produces student/teacher session fixtures
- E-01 F-05 (Admin Login) → produces admin session fixture
- E-02 all features → consume student session fixture
- E-03 all features → consume teacher session fixture
- E-04 all features → consume admin session fixture

---

## Route Protection

**Owner:** E-01 (Guest Workflows F-06)
**Related:** E-02, E-03, E-04

E-01 F-06 tests that unauthenticated users are redirected and that wrong-role users are rejected. This validates the middleware that E-02/E-03/E-04 depend on implicitly.

---

## Test Seed Data Dependencies

**Owner:** Test database seeder (outside spec scope)
**Consumers:** All epics

All epics depend on seed data. Features that require specific seed state (courses, schedules, course history, class applications) defensively skip when data is absent. The minimum expected seed data:

- At least one published course with at least one schedule (used by E-01 F-02/F-03, E-02 F-08/F-09)
- Test Student with at least one course history record (used by E-02 F-03, F-04, F-06)
- Test Teacher with at least one owned class and one class application (used by E-03 F-01, F-02, F-03)
- At least one inquiry submitted (used by E-04 F-03)
- At least one pending class application (used by E-04 F-04)

---

## Shared Pages

**Teacher also sees Student pages:** The Teacher role has access to all Student-level MyPage pages (profile, course history, wallet history, etc.). These are tested in E-02 using the Student session. E-03 does not re-test them unless behavior differs for the Teacher role.

**Course browsing is cross-role:** E-01 tests course browsing as Guest. E-02 F-09 tests that the authenticated Student sees booking controls on the detail page. These are separate features but share the same pages.

---

## Existing Test Coexistence

**Policy:** Keep existing tests, add new ones alongside.

Existing test files and their overlap with new specs:

- `top-page.spec.js` — overlaps E-01 F-01, F-04. Keep as-is.
- `course-browsing.spec.js` — overlaps E-01 F-02, F-03. Keep as-is.
- `auth/login.spec.js` — overlaps E-01 F-04, F-06. Keep as-is.
- `auth/registration.spec.js` — overlaps E-01 F-07. Keep as-is.
- `auth/logout.spec.js` — overlaps E-02 F-10. Keep as-is.
- `admin/admin-pages.spec.js` — overlaps E-04 F-15 (smoke test). Keep as-is.
- `auth/ada-*.spec.js`, `auth/stripe-*.spec.js` — external service tests, no overlap. Keep as-is.

New spec tests should be placed in new files grouped by epic to avoid merge conflicts with existing tests.
