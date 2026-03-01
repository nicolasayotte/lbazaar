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

**Owner:** `database/seeders/PlaywrightTestSeeder.php`
**Consumers:** All epics

All epics depend on seed data. Features that require specific seed state defensively skip when data is absent. The `PlaywrightTestSeeder` creates the following fixture data (all using `firstOrCreate` for idempotency):

### Users & Wallets
- **pw-student** (`pw-student@example.com`) — student role, 100,000 points wallet
- **pw-teacher** (`pw-teacher@example.com`) — teacher role, Professor classification, 0 points wallet
- **pw-admin** (`pw-admin@example.com`) — admin role, 0 points wallet

### Course Data (owned by pw-teacher)
- **CourseApplication** "PW Pending Application" — approved, no linked course (visible on class-applications page)
- **CourseApplication** "PW Test Course" — approved, with linked course
- **Course** "PW Test Course" — published, certificate-enabled, Programming category
- **CourseSchedule** (upcoming: 2030-01-15 to 2030-01-29) — for attend/watch/exam/feedback tests
- **CourseSchedule** (completed: 2024-06-01 to 2024-06-15) — for teaching-history/certificate tests
- **Exam** "PW Test Exam" — published, 2 questions with answer choices

### Enrollments (pw-student)
- **CourseHistory** — ongoing enrollment in upcoming schedule (no `completed_at`)
- **CourseHistory** — completed enrollment in completed schedule (`completed_at` set)

### Teacher Profile
- **UserEducation** — PW Test University, MS in Computer Science
- **UserCertification** — PW Teaching Certificate
- **UserWorkHistory** — PW Tech Corp, Senior Instructor

### Reference Data
- Country (Japan/JPN), CourseType (General), CourseCategory (Programming)
- Status (Published), Classifications (Professor, 70% commission)
- Setting (ada-to-jpy = 65)

### Data used by each epic
- E-01 F-02/F-03: published course + schedule (from main seeder or PlaywrightTestSeeder)
- E-02 F-03: course history records (PlaywrightTestSeeder — 2 enrollments)
- E-02 F-08: booked schedule (PlaywrightTestSeeder — upcoming schedule enrollment)
- E-03 F-01: class applications (PlaywrightTestSeeder — "PW Pending Application")
- E-03 F-02–F-07: owned class, exam, schedules, certificates tab (PlaywrightTestSeeder)
- E-04 F-03: inquiries (created by E-01 F-08.2 guest inquiry test)
- E-04 F-04: pending class application (PlaywrightTestSeeder — approved, but admin tests use different apps)

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

---

## E-01 Guest Workflow Test Files

New files added to fill coverage gaps from `specs/e2e-tests.guest.md`:

| File | Features | Project |
|------|----------|---------|
| `guest/admin-login.spec.js` | F-05.1, F-05.2, F-05.3 | `guest` |
| `guest/course-detail-extra.spec.js` | F-01.3, F-03.4, F-03.5 | `guest` |
| `guest/forgot-password.spec.js` | F-10.1, F-10.2, F-10.3 | `guest` |
| `guest/inquiries.spec.js` | F-08.1, F-08.2, F-08.3 | `guest` |
| `guest/language-switching.spec.js` | F-09.1 | `guest` |
| `guest/registration-extra.spec.js` | F-07.1, F-07.4, F-07.5, F-07.6 | `guest` |
| `guest/route-protection.spec.js` | F-06.2 | `guest` |
| `guest/route-smoke.spec.js` | F-11.1 | `guest` |
| `auth/route-protection.spec.js` | F-06.3, F-06.4 | `student` |

**Note:** F-06.3 and F-06.4 require an authenticated student session to test that a non-admin/non-teacher student is rejected from protected routes. These live in `auth/` (matched by the `student` project) rather than `guest/`.
