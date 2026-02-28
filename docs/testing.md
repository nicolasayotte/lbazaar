# Testing Strategy

> **AI Context Summary**: Dual pipeline — Fast (mocked, every commit): `sail composer test` (parallel, 8 workers), `npm test`, `cd web3 && npm test`, `npm run test:browser`. Use `sail test --filter=X` for single test/class (serial). Live Integration (real APIs, on-demand): `sail composer test:integration` (PHP), `cd web3 && npm run test:integration` (Node.js). Integration tests skip automatically when API keys are missing/placeholder. The `InteractsWithRealServices` trait (tests/Traits/) handles safety/skip logic. Base `TestCase` applies `DatabaseTransactions` and `Mockery::close()` globally — do NOT add these to individual test classes. Use `$this->createTestUser()` to suppress model events. Web3 tests use `.spec.mjs`; browser tests `.spec.js` in `tests/Browser/`. Playwright uses multi-project setup: three `*.setup.js` files log in and save `storageState` to `tests/Browser/fixtures/{role}.json`; test projects depend on these and start pre-authenticated. Requires `PlaywrightTestSeeder` for `pw-{role}@example.com` test users. Coverage target: 80% services, 70% controllers/components.

## Overview

Le Bazaar follows a **dual-pipeline test strategy**:

```
FAST PIPELINE (every commit)          LIVE PIPELINE (staging / on-demand)
─────────────────────────             ─────────────────────────────────────
PHPUnit Unit + Feature (mocked)       PHPUnit Integration (real APIs)
Vitest frontend (jsdom, mocked)       Web3 Vitest integration (real Blockfrost)
Web3 Vitest (mocked fetch)            Playwright E2E (real Stripe test card)
Playwright smoke (page loads)
```

The fast pipeline runs in parallel (8 workers), takes ~2 minutes, and mocks every external service. The live pipeline hits real testnet/test-mode APIs and self-skips when credentials are missing — safe to include in `phpunit.xml` without breaking CI.

```
      /\
     /BRW\           Playwright browser tests (smoke, user flows)
    /------\
   / LIVE INT\       PHPUnit Integration + Web3 integration (real APIs)
  /------------\
 /   FEAT INT   \    PHPUnit Feature tests + Vitest integration
/----------------\
/    UNIT         \  PHPUnit Unit tests + Vitest unit tests
/------------------\
```

## Test Organization

### Backend Tests (PHPUnit)

```
tests/
├── Unit/
│   └── Services/
│       └── API/
│           ├── CertificateServiceTest.php
│           ├── WalletServiceTest.php
│           └── UserServiceTest.php
├── Feature/
│   ├── Http/
│   │   └── Controllers/
│   │       ├── API/
│   │       │   ├── CertificateControllerTest.php
│   │       │   └── UserWalletControllerTest.php
│   │       └── Portal/
│   ├── CourseApplicationCategoryRelationTest.php
│   └── UserWalletAddressTest.php
├── Integration/                        ← real API calls (skip if no keys)
│   ├── StripeConnectivityTest.php      real PaymentIntent creation (test mode)
│   ├── BlockfrostReadTest.php          real preprod health + epoch
│   └── CoinGeckoRateTest.php           real ADA/JPY rate + service parsing
├── Traits/
│   └── InteractsWithRealServices.php   safety trait (see below)
└── TestCase.php (base class)
```

### Frontend Tests (Vitest + React Testing Library)

```
resources/js/
├── components/
│   └── payments/
│       └── StripeCheckout.test.jsx
├── pages/
│   └── Portal/
│       └── MyPage/
│           └── ManageClass/
│               ├── Certificates.test.jsx
│               └── components/
│                   └── CertificateTable.test.jsx
└── helpers/
    └── __tests__/
        └── currency.helper.test.js
```

### Browser Tests (Playwright)

```
tests/
└── Browser/
    ├── top-page.spec.js            (unauthenticated: title, nav, login form)
    ├── course-browsing.spec.js     (unauthenticated: filter panel, cards, pagination)
    ├── auth/
    │   ├── student.setup.js        (setup: login as student, save storageState)
    │   ├── teacher.setup.js        (setup: login as teacher, save storageState)
    │   ├── admin.setup.js          (setup: login as admin via /admin/login, save storageState)
    │   ├── login.spec.js           (login form rendering, success, failure, route protection)
    │   ├── logout.spec.js          (authenticated student logout flow)
    │   ├── registration.spec.js    (registration form rendering and flow)
    │   └── route-protection.spec.js (F-06.3, F-06.4: non-admin/non-teacher student rejected from protected routes)
    ├── guest/
    │   ├── admin-login.spec.js        (F-05: admin login form, success, invalid credentials)
    │   ├── course-detail-extra.spec.js (F-01.3, F-03.4, F-03.5: featured content, schedule, 404)
    │   ├── forgot-password.spec.js    (F-10: forgot password form, success, error)
    │   ├── inquiries.spec.js          (F-08: inquiry form, valid submit, empty submit)
    │   ├── language-switching.spec.js  (F-09: EN/JA language switch)
    │   ├── registration-extra.spec.js  (F-07.1, F-07.4–F-07.6: registration index, duplicate, teacher)
    │   ├── route-protection.spec.js    (F-06.2: unauthenticated admin redirect)
    │   └── route-smoke.spec.js         (F-11: 9 public routes return non-500)
    ├── admin/
    │   ├── navigation-smoke.spec.js       (F-14, F-15: sidebar navigation + route smoke for all 12 admin routes)
    │   ├── profile-users.spec.js          (F-01, F-02: profile update, user CRUD, status toggle)
    │   ├── inquiries-applications.spec.js (F-03, F-04: inquiries list/detail, class app status update)
    │   ├── settings-crud.spec.js          (F-05–F-08: categories/classifications/NFT CRUD via dialogs)
    │   └── settings-misc.spec.js          (F-09–F-13: translations, general, wallet, refunds, certificates)
    ├── teacher/
    │   ├── route-smoke.spec.js       (F-08: smoke test for all teacher-accessible routes)
    │   ├── class-applications.spec.js (F-01: class application CRUD and validation)
    │   ├── manage-classes.spec.js    (F-02: manage classes dashboard, tab navigation)
    │   ├── course-management.spec.js (F-03–F-05: course/exam/schedule CRUD)
    │   └── teaching-history.spec.js  (F-06–F-07: teaching schedules, certificate UI)
    ├── helpers/
    │   ├── wait-for-app.js         (waitForApp, waitForInertiaNavigation)
    │   └── test-users.js           (TEST_USERS credentials, STORAGE_STATE paths)
    ├── pages/
    │   └── LoginPage.js            (Page Object: goto, login, loginAndWaitForRedirect)
    └── fixtures/                   (gitignored — generated by setup projects at runtime)
        ├── student.json
        ├── teacher.json
        └── admin.json
```

### Web3 Tests (Vitest)

```
web3/
├── common/
│   └── __tests__/
│       ├── utils.spec.mjs
│       ├── certificate-metadata.spec.mjs
│       ├── minting-policy.spec.mjs
│       └── network.spec.mjs
└── run/
    └── __tests__/
        ├── blockfrost-connectivity.integration.spec.mjs      (real Blockfrost — live pipeline)
        ├── build-purchase-tx.spec.mjs
        ├── certificate-tx-utils.spec.mjs
        └── submit-purchase-tx.spec.mjs
```

The `blockfrost-connectivity.integration.spec.mjs` file uses `describe.skipIf()` to skip the entire suite when `BLOCKFROST_API_KEY` is a placeholder (< 10 chars or matches known dummy patterns from `vitest.setup.mjs`).

## Running Tests

### Backend Tests

```bash
# All tests (parallel, 8 workers) — the standard full-suite command
sail composer test

# Recreate parallel databases (after Ctrl+C or stuck locks)
sail composer test:recreate

# Specific test class or method (serial — faster for single test)
sail test --filter CertificateServiceTest
sail test --filter test_mint_and_airdrop_certificate_success

# With coverage report
sail test --coverage

# Stop on first failure
sail test --stop-on-failure

# Integration tests (real APIs — requires valid keys in .env)
sail composer test:integration
```

**`sail test` vs `sail composer test`**: `sail test` runs serial `php artisan test` — use it for `--filter` on a single test/class. `sail composer test` runs parallel via ParaTest with 8 workers — use it for the full suite.

**Parallel Testing**: Tests run via [ParaTest](https://github.com/paratestphp/paratest) with 8 worker processes. Each worker gets its own database (`testing_test_1` through `testing_test_8`). A schema dump (`database/schema/mysql-schema.sql`) is loaded instead of running migrations, keeping startup fast.

**If tests hang or lock**: Run `sail composer test:recreate` to drop and rebuild all worker databases. See [gotchas.md #17](./gotchas.md) for the multi-layer zombie defense (idle timeouts, bootstrap cleanup, PHP-side socket timeout).

### Frontend Tests

```bash
# All frontend tests (from project root)
npm test

# Watch mode (re-run on file changes)
npm run test:watch

# Coverage report
npm run test:coverage

# Specific test file
npm test StripeCheckout.test.jsx
```

### Web3 Tests

**Note**: Web3 tests have their own package.json and dependencies in the `web3/` directory.

```bash
# All web3 tests (run from web3 directory) — fast pipeline
cd web3 && npm test

# Show output in terminal (default writes to log file)
cd web3 && npm run test:show

# Watch mode (re-run on file changes)
cd web3 && npm run test:watch

# Specific test file
cd web3 && npm run test:show utils.spec.mjs

# Integration tests only (real Blockfrost — requires valid BLOCKFROST_API_KEY in .env)
cd web3 && npm run test:integration
```

### Browser Tests (Playwright)

Playwright runs on the **host machine** (not inside the Sail container), testing real user flows in Chromium against the running app.

#### Architecture

The suite uses **Playwright projects** to separate setup (auth) from tests, enabling shared authenticated sessions across test files without re-logging in:

| Project | `testMatch` | `storageState` | `dependencies` |
|---------|-------------|----------------|----------------|
| `student-setup` | `**/auth/student.setup.js` | — | — |
| `teacher-setup` | `**/auth/teacher.setup.js` | — | — |
| `admin-setup` | `**/auth/admin.setup.js` | — | — |
| `unauthenticated` | `top-page.spec.js`, `course-browsing.spec.js` | — | — |
| `guest` | `**/guest/**/*.spec.js` | — | — |
| `student` | `**/auth/**/*.spec.js` | `fixtures/student.json` | `student-setup` |
| `teacher` | `**/teacher/**/*.spec.js` | `fixtures/teacher.json` | `teacher-setup` |
| `admin` | `**/admin/**/*.spec.js` | `fixtures/admin.json` | `admin-setup` |

**Auth flow**: Each setup project logs in via `LoginPage`, then calls `page.context().storageState({ path })` to save the browser session. Dependent test projects load that saved session, so tests start already authenticated without a login step.

#### Prerequisites

1. **Sail must be running** at `localhost:8080` (`sail up -d`)
2. **Vite dev server** must be running inside Sail (`sail npm run dev`)
3. **Seed Playwright users** (one-time per DB reset):

```bash
sail artisan db:seed --class=PlaywrightTestSeeder
```

This creates three test users (all with password `Test1234!`):

| Role | Email |
|------|-------|
| student | `pw-student@example.com` |
| teacher | `pw-teacher@example.com` |
| admin | `pw-admin@example.com` |

4. **Install Chromium** (first time only):

```bash
npx playwright install --with-deps chromium
```

#### Running Tests

```bash
# Run all browser tests (writes to docs/test-reports/playwright-tests.log)
npm run test:browser

# Run in headed mode (see the browser window)
npm run test:browser:headed

# Run with interactive UI
npm run test:browser:ui

# Run a specific test file
npx playwright test tests/Browser/auth/login.spec.js

# Run a specific project only
npx playwright test --project=admin

# Run unauthenticated tests only
npx playwright test --project=unauthenticated
```

**Configuration**: `playwright.config.js` at project root. Base URL defaults to `http://localhost:8080` (override with `APP_URL` env var). Workers: 2 local, 1 CI. Retries: 2 in CI, 0 locally. Traces saved on first retry; screenshots on failure.

#### Helpers and Page Objects

**`tests/Browser/helpers/wait-for-app.js`**

```javascript
// Wait for React/Inertia to mount before asserting on React-rendered content
import { waitForApp, waitForInertiaNavigation } from '../helpers/wait-for-app.js';

await waitForApp(page);               // waits for #app to have children
await waitForInertiaNavigation(page); // networkidle + waitForApp
```

**`tests/Browser/helpers/test-users.js`**

```javascript
import { TEST_USERS, STORAGE_STATE } from '../helpers/test-users.js';

TEST_USERS.student.email     // 'pw-student@example.com'
STORAGE_STATE.admin          // 'tests/Browser/fixtures/admin.json'
```

**`tests/Browser/pages/LoginPage.js`**

```javascript
import { LoginPage } from '../pages/LoginPage.js';

const loginPage = new LoginPage(page);           // defaults to /portal/login
const adminLogin = new LoginPage(page, '/admin/login');

await loginPage.goto();
await loginPage.login(email, password);
await loginPage.loginAndWaitForRedirect(email, password); // + waits for URL change
```

#### Writing New Tests

**Unauthenticated test** — add to `tests/Browser/` and list in `playwright.config.js` `unauthenticated` `testMatch`:

```javascript
// @ts-check
import { test, expect } from '@playwright/test';
import { waitForApp } from './helpers/wait-for-app.js';

test('example unauthenticated test', async ({ page }) => {
    await page.goto('/classes');
    await waitForApp(page);

    await expect(page.locator('h1')).toBeVisible();
});
```

**Authenticated test (student)** — add to `tests/Browser/auth/` (picked up by `student` project):

```javascript
// @ts-check
import { test, expect } from '@playwright/test';
import { waitForApp } from '../helpers/wait-for-app.js';

// storageState is injected automatically from the student-setup project
test('student can view their profile', async ({ page }) => {
    await page.goto('/mypage/profile');
    await waitForApp(page);

    await expect(page).toHaveURL(/\/mypage\/profile/);
});
```

**Authenticated test (admin)** — add to `tests/Browser/admin/` (picked up by `admin` project):

```javascript
// @ts-check
import { test, expect } from '@playwright/test';
import { waitForApp } from '../helpers/wait-for-app.js';
import { STORAGE_STATE } from '../helpers/test-users.js';

test.use({ storageState: STORAGE_STATE.admin });

test('admin page renders', async ({ page }) => {
    const response = await page.goto('/admin/some-page');
    expect(response.status()).toBeLessThan(500);
    await waitForApp(page);
});
```

#### Admin & Teacher Playwright Test Patterns

The admin and teacher test suites exercise full CRUD workflows (create → edit → delete) against real server-rendered pages. Key patterns and gotchas discovered during development:

**Serial CRUD tests** — Use `test.describe.serial()` when tests depend on data created in earlier tests (e.g., create a category, then edit it, then delete it). Each test in the serial group gets a fresh `page` but shares `const` variables declared at the describe scope:

```javascript
test.describe.serial('Category CRUD', () => {
    const testName = `PW Test Category ${uid}`;

    test('create', async ({ page }) => { /* ... */ });
    test('edit',   async ({ page }) => { /* ... */ });
    test('delete', async ({ page }) => { /* ... */ });
});
```

**Input filling** — Use `pressSequentially()` (not `fill()`) for React-controlled inputs bound to Inertia `useForm` or React `useState`. Playwright's `fill()` may not fire React's synthetic `onChange`:

```javascript
const input = page.locator('input[name="title"]');
await input.click();
await input.pressSequentially('My Test Value');
```

**Server-side name validation** — Many admin settings enforce character restrictions:

| Field | Validation Rule | Safe Test Pattern |
|---|---|---|
| Category name | `alpha` (letters + spaces only) | `PW Test Category ${alphaUid}` |
| Profile first_name | `alpha` (letters + spaces only) | `Playwright ${alphaUid}` |
| NFT name | `alpha_dash` (letters, numbers, dashes, underscores) | `E2E-Test-NFT-${Date.now()}` |
| Classification name | No format restriction | Any string works |

Generate letters-only unique IDs with:
```javascript
const uid = Math.random().toString(36).replace(/[^a-z]/g, '').slice(0, 8);
```

**MUI dialog interactions** — Admin settings pages use MUI `Dialog` for create/edit/delete. Wait for the dialog to appear before interacting:

```javascript
await expect(page.locator('.MuiDialog-root')).toBeVisible({ timeout: 5000 });
await expect(page.locator('.MuiDialogTitle-root')).toContainText('Create');
// Fill fields, then confirm:
await page.locator('.MuiDialogActions-root button.MuiButton-contained').click();
```

**Number inputs** — Detect `input[type="number"]` and use numeric values instead of text suffixes:

```javascript
const inputType = await input.getAttribute('type');
const testValue = inputType === 'number'
    ? String(Number(originalValue) + 1)
    : originalValue + '_pw';
```

**Graceful skips for app bugs** — When a test discovers an application bug (not a test bug), skip with a descriptive message referencing the source file and line:

```javascript
test.skip(true, 'Known app bug — NFT form missing required "points" field (NftFormRequest.php:40-44)');
```

**After form POST** — Use `waitForInertiaNavigation(page)` (not just `waitForApp`) to ensure Inertia has fully re-rendered with server validation errors before asserting on error messages.

### All Fast-Pipeline Tests

Run the backend, frontend, and browser tests in one command:

```bash
npm run test:all
```

This executes `npm test` (Vitest), `npm run test:web3`, and `npm run test:browser` in sequence. It does **not** include integration tests or `sail test` (PHP) — run those separately.

## Live Integration Tests

Integration tests hit real external APIs (Stripe test mode, Blockfrost preprod, CoinGecko free tier). They are included in the `Integration` PHPUnit testsuite and the `test:integration` npm scripts, but **not** in the default parallel `sail composer test` run.

### Safety: `InteractsWithRealServices` Trait

All PHP integration test classes use this trait:

```php
use Tests\Traits\InteractsWithRealServices;

class StripeConnectivityTest extends TestCase
{
    use InteractsWithRealServices;

    protected function requiredServiceKeys(): array
    {
        return ['STRIPE_SECRET' => 'services.stripe.secret'];
    }
}
```

PHPUnit 9 auto-calls `setUpInteractsWithRealServices()` before each test. It:
1. Hard-blocks on `APP_ENV=production`
2. Calls `markTestSkipped()` for any key that is missing, empty, or matches placeholder patterns (`xxx`, `goes here`, `your_`, `sk_test_xxx`, `blockfrost.io key`, etc.)

### Adding a New PHP Integration Test

```php
namespace Tests\Integration;

use Tests\TestCase;
use Tests\Traits\InteractsWithRealServices;

class MyServiceConnectivityTest extends TestCase
{
    use InteractsWithRealServices;

    protected function requiredServiceKeys(): array
    {
        // Map display name → config path
        return ['MY_API_KEY' => 'services.myservice.key'];
    }

    /** @test */
    public function my_service_api_is_reachable()
    {
        // No mocks — real HTTP call
    }
}
```

### Running with Real Keys

```bash
# Set real keys in .env (test-mode only):
# STRIPE_SECRET=sk_test_...        (from Stripe dashboard → test mode)
# BLOCKFROST_API_KEY=preprodX...   (from blockfrost.io → preprod project)

# PHP integration tests
sail composer test:integration

# Web3 integration tests
cd web3 && npm run test:integration

# Production test helper
./test-prod.sh test-integration
./test-prod.sh full-test --integration
```

### CoinGecko Note

CoinGecko free tier requires no API key but enforces rate limits. The test sends `User-Agent: LeBazaar/1.0` and skips (rather than fails) on 403/429 responses. `ExchangeRateService` does not currently send a User-Agent — if CoinGecko tightens enforcement, add `->withHeaders(['User-Agent' => 'LeBazaar/1.0'])` to the `Http::get()` call in `ExchangeRateService.php`.

---

## Writing Backend Tests

### Unit Test Pattern (Services)

**Location**: `tests/Unit/Services/API/`

**Purpose**: Test service business logic in isolation, mock external dependencies.

**Template**:
```php
<?php

namespace Tests\Unit\Services\API;

use Tests\TestCase;
use App\Services\API\CertificateService;
use App\Models\User;
use App\Models\Course;
use Mockery;

class CertificateServiceTest extends TestCase
{
    // DatabaseTransactions is already applied by the base TestCase.
    // Mockery::close() is already called by the base TestCase::tearDown().
    // Do NOT override tearDown() just for Mockery cleanup.

    protected CertificateService $service;
    protected User $student;
    protected Course $course;

    protected function setUp(): void
    {
        parent::setUp();

        // Create test data (suppresses model events like web3 calls)
        $this->student = $this->createTestUser(['role' => 'student']);
        $this->course = Course::factory()->create();

        // Partially mock service to test specific methods
        $this->service = Mockery::mock(CertificateService::class)
            ->makePartial()
            ->shouldAllowMockingProtectedMethods();
    }

    public function test_mint_and_airdrop_certificate_success(): void
    {
        // Arrange: Mock dependencies
        $this->service->shouldReceive('getStudentWalletAddress')
            ->once()
            ->andReturn('addr1test...');

        $this->service->shouldReceive('mintCertificateNFT')
            ->once()
            ->andReturn([
                'success' => true,
                'transaction_id' => 'tx123',
                'wallet_address' => 'addr1test...'
            ]);

        // Act: Call method under test
        $result = $this->service->mintAndAirdropCertificate(
            $this->course,
            $this->student
        );

        // Assert: Verify response structure
        $this->assertTrue($result['success']);
        $this->assertEquals('tx123', $result['transaction_id']);
        $this->assertArrayHasKey('wallet_address', $result);
    }

    public function test_mint_fails_with_invalid_wallet(): void
    {
        // Arrange
        $this->service->shouldReceive('getStudentWalletAddress')
            ->once()
            ->andReturn(null);

        // Act
        $result = $this->service->mintAndAirdropCertificate(
            $this->course,
            $this->student
        );

        // Assert
        $this->assertFalse($result['success']);
        $this->assertStringContainsString('wallet', strtolower($result['message']));
    }
}
```

**Key Points**:
- **Do NOT add `use DatabaseTransactions`** — the base `TestCase` already applies it
- **Do NOT override `tearDown()` for Mockery** — the base `TestCase` calls `Mockery::close()` after rolling back the DB transaction (see [gotchas.md #18](./gotchas.md))
- Use `$this->createTestUser()` to suppress model events (e.g. web3 custodial address generation)
- Mock external dependencies (web3 exec calls, email service)
- Test both success and failure paths
- Verify service response contract: `['success', 'message', 'data']`

### Feature Test Pattern (Controllers)

**Location**: `tests/Feature/Http/Controllers/API/`

**Purpose**: Test HTTP request/response cycle, authentication, authorization.

**Template**:
```php
<?php

namespace Tests\Feature\Http\Controllers\API;

use Tests\TestCase;
use App\Models\User;
use App\Models\Course;
use Laravel\Sanctum\Sanctum;

class CertificateControllerTest extends TestCase
{
    // DatabaseTransactions is already applied by the base TestCase.

    protected User $teacher;
    protected User $student;
    protected Course $course;

    protected function setUp(): void
    {
        parent::setUp();

        $this->teacher = $this->createTestUser();
        $this->teacher->attachRole('teacher');

        $this->student = $this->createTestUser();
        $this->student->attachRole('student');

        $this->course = Course::factory()->create([
            'professor_id' => $this->teacher->id
        ]);
    }

    public function test_mint_certificates_requires_authentication(): void
    {
        // Act: Request without authentication
        $response = $this->postJson('/api/certificates/mint', [
            'course_id' => $this->course->id
        ]);

        // Assert: 401 Unauthorized
        $response->assertStatus(401);
    }

    public function test_mint_certificates_requires_teacher_role(): void
    {
        // Arrange: Authenticate as student
        Sanctum::actingAs($this->student);

        // Act
        $response = $this->postJson('/api/certificates/mint', [
            'course_id' => $this->course->id
        ]);

        // Assert: 403 Forbidden
        $response->assertStatus(403);
    }

    public function test_teacher_cannot_mint_for_others_course(): void
    {
        // Arrange: Create another teacher's course
        $otherTeacher = User::factory()->create();
        $otherTeacher->attachRole('teacher');
        $otherCourse = Course::factory()->create([
            'professor_id' => $otherTeacher->id
        ]);

        Sanctum::actingAs($this->teacher);

        // Act
        $response = $this->postJson('/api/certificates/mint', [
            'course_id' => $otherCourse->id
        ]);

        // Assert: 404 Not Found (course not found for this teacher)
        $response->assertStatus(404);
    }

    public function test_mint_certificates_validates_course_id(): void
    {
        Sanctum::actingAs($this->teacher);

        // Act: Invalid course_id
        $response = $this->postJson('/api/certificates/mint', [
            'course_id' => 'invalid'
        ]);

        // Assert: 422 Validation Error
        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['course_id']);
    }
}
```

**Key Points**:
- Use `Sanctum::actingAs()` for authentication
- Test authorization (roles and ownership)
- Test validation rules
- Test HTTP status codes and JSON structure

## Writing Frontend Tests

### React Component Test Pattern

**Location**: `resources/js/components/`, `resources/js/pages/`

**Purpose**: Test React component rendering, user interactions, and integration with Inertia.

**Template**:
```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import StripeCheckout from './StripeCheckout';

describe('StripeCheckout', () => {
    const mockProps = {
        courseId: 1,
        courseName: 'Test Course',
        priceAda: 100,
        priceJpy: 15000,
        onSuccess: vi.fn(),
        onCancel: vi.fn()
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders checkout form with course details', () => {
        render(<StripeCheckout {...mockProps} />);

        expect(screen.getByText('Test Course')).toBeInTheDocument();
        expect(screen.getByText('¥15,000')).toBeInTheDocument();
    });

    it('calls onSuccess when payment succeeds', async () => {
        render(<StripeCheckout {...mockProps} />);

        const submitButton = screen.getByRole('button', { name: /pay/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(mockProps.onSuccess).toHaveBeenCalledTimes(1);
        });
    });

    it('validates required fields before submission', async () => {
        render(<StripeCheckout {...mockProps} />);

        const submitButton = screen.getByRole('button', { name: /pay/i });
        fireEvent.click(submitButton);

        expect(await screen.findByText(/required/i)).toBeInTheDocument();
        expect(mockProps.onSuccess).not.toHaveBeenCalled();
    });

    it('disables submit button during processing', async () => {
        render(<StripeCheckout {...mockProps} />);

        const submitButton = screen.getByRole('button', { name: /pay/i });
        fireEvent.click(submitButton);

        expect(submitButton).toBeDisabled();
    });
});
```

**Key Points**:
- Use `@testing-library/react` for component rendering and queries
- Test user interactions with `fireEvent` or `userEvent`
- Use `waitFor` for async operations
- Mock Inertia calls with `vi.mock('@inertiajs/inertia')`
- Test accessibility (screen readers, keyboard navigation)

### Helper/Utility Test Pattern

**Location**: `resources/js/helpers/__tests__/`

**Purpose**: Test JavaScript utility functions.

**Template**:
```javascript
import { describe, it, expect } from 'vitest';
import { formatCurrency, convertAdaToJpy } from '../currency.helper';

describe('currency.helper', () => {
    describe('formatCurrency', () => {
        it('formats JPY correctly', () => {
            expect(formatCurrency(15000, 'JPY')).toBe('¥15,000');
        });

        it('formats ADA correctly', () => {
            expect(formatCurrency(100.5, 'ADA')).toBe('₳100.50');
        });

        it('handles zero values', () => {
            expect(formatCurrency(0, 'JPY')).toBe('¥0');
        });
    });

    describe('convertAdaToJpy', () => {
        it('converts ADA to JPY at given rate', () => {
            expect(convertAdaToJpy(100, 150)).toBe(15000);
        });

        it('rounds to nearest integer', () => {
            expect(convertAdaToJpy(100, 150.7)).toBe(15070);
        });
    });
});
```

## Writing Web3 Tests

### Unit Test Pattern (Utilities)

**Location**: `web3/common/__tests__/`

**Purpose**: Test pure functions in isolation.

**File naming**: Use `.spec.mjs` extension

**Template**:
```javascript
import { describe, it, expect, vi } from 'vitest';
import { validateAddress } from '../utils.mjs';

describe('utils.mjs', () => {
    describe('validateAddress', () => {
        it('should return true for valid bech32 address', () => {
            const validAddr = 'addr_test1qz2fxv2umyhttkxyxp8x0dlpdt3k6cwng5pxj3jhsydzer3jcu5d8ps7zex2k2xt3uqxgjqnnj83ws8lhrn648jjxtwq2ytjqp';
            expect(validateAddress(validAddr)).toBe(true);
        });

        it('should return false for invalid address', () => {
            expect(validateAddress('invalid')).toBe(false);
            expect(validateAddress('')).toBe(false);
            expect(validateAddress(null)).toBe(false);
        });

        it('should handle mainnet addresses', () => {
            const mainnetAddr = 'addr1qx2fxv2umyhttkxyxp8x0dlpdt3k6cwng5pxj3jhsydzer3jcu5d8ps7zex2k2xt3uqxgjqnnj83ws8lhrn648jjxtwqfjkjv7';
            expect(validateAddress(mainnetAddr)).toBe(true);
        });
    });
});
```

**Key Points**:
- Use `vi.fn()` for mocking
- Test edge cases (null, empty, invalid input)
- Test both success and error paths
- Files use `.spec.mjs` extension (NOT `.test.mjs`)
- Web3 tests run from `web3/` directory with separate package.json

## Test Data Management

### Factories (Laravel)

**Location**: `database/factories/`

**Usage**:
```php
// In tests
$user = User::factory()->create(['email' => 'test@example.com']);
$course = Course::factory()->create(['professor_id' => $user->id]);

// Create multiple
$students = User::factory()->count(10)->create();
```

### Seeders (Laravel)

**Location**: `database/seeders/`

**Usage**:
```bash
# Seed database for manual testing
sail artisan db:seed

# Seed specific seeder
sail artisan db:seed --class=UserSeeder
```

### Test Database

**Configuration**: `phpunit.xml` sets `DB_DATABASE=testing`, `DB_LOCK_WAIT_TIMEOUT=3`, `DB_WAIT_TIMEOUT=10`, and `mysqlnd.net_read_timeout=15`.

**Setup** (one-time):
```bash
# Create the base testing database
sail mysql -e "CREATE DATABASE IF NOT EXISTS testing;"

# Run migrations on it
sail bash -c "DB_DATABASE=testing php artisan migrate"

# Generate schema dump (speeds up parallel database creation)
sail bash -c "DB_DATABASE=testing php artisan schema:dump"
```

**Parallel databases**: When running `sail composer test`, Laravel automatically creates `testing_test_1` through `testing_test_8` by loading `database/schema/mysql-schema.sql`. This is instant compared to running 50+ migrations per worker.

**After adding new migrations**: Re-run `schema:dump` to keep the dump in sync:
```bash
sail bash -c "DB_DATABASE=testing php artisan migrate && php artisan schema:dump"
```

## Mocking External Services

### Mock Web3 Exec Calls

```php
// In service test
$this->service->shouldReceive('buildWeb3Command')
    ->once()
    ->with('run/build-certificate-tx.mjs', Mockery::any())
    ->andReturn('echo \'{"status": 200, "data": {"txId": "abc123"}}\'');
```

### Mock Blockfrost API

```javascript
// In web3 test
import { vi } from 'vitest';

vi.mock('../common/blockfrost.mjs', () => ({
    fetchUtxos: vi.fn().mockResolvedValue([
        { txHash: 'abc', outputIndex: 0, amount: [{ unit: 'lovelace', quantity: '5000000' }] }
    ])
}));
```

### Mock Email Service

```php
// In test
use Illuminate\Support\Facades\Mail;

Mail::fake();

// ... perform action that sends email ...

Mail::assertSent(EnrollmentConfirmation::class, function ($mail) use ($student) {
    return $mail->hasTo($student->email);
});
```

## Coverage Requirements

| Component | Minimum Coverage | Target Coverage |
|-----------|-----------------|----------------|
| Services (PHP) | 80% | 90% |
| Controllers (PHP) | 70% | 80% |
| Frontend Components (React) | 70% | 80% |
| Frontend Helpers (JS) | 80% | 90% |
| Web3 Utilities (JS) | 80% | 90% |
| Web3 CLI Scripts (JS) | 60% | 75% |
| Overall Project | 75% | 85% |

## Continuous Integration

### GitHub Actions Workflow

**Location**: `.github/workflows/tests.yml`

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Start Docker containers
        run: ./vendor/bin/sail up -d

      - name: Run backend tests
        run: ./vendor/bin/sail test --coverage

      - name: Run frontend tests
        run: npm test -- --coverage

      - name: Run web3 tests
        run: cd web3 && npm run test:show
```

## Debugging Tests

### PHPUnit Debugging

```bash
# Enable verbose output
sail test --verbose

# Print test output (dd(), dump())
sail test --testdox

# Debug specific test
sail test --filter test_name --debug
```

### Vitest Debugging (Frontend)

```bash
# Run in watch mode
npm run test:watch

# Debug specific test
npm test -- --reporter=verbose StripeCheckout.test.jsx

# Run with UI
npm test -- --ui
```

### Vitest Debugging (Web3)

```bash
# Run in watch mode
cd web3 && npm run test:watch

# Show output in terminal (default writes to log file)
cd web3 && npm run test:show

# Debug specific test
cd web3 && npm run test:show utils.spec.mjs
```

### Common Issues

**Issue**: Database transactions not rolling back

**Solution**: The base `TestCase` already applies `DatabaseTransactions`. Do not add it again in individual test classes. If transactions are still leaking, check that you are not overriding `tearDown()` incorrectly (see next issue).

---

**Issue**: Web3 tests fail with "Cannot find module"

**Solution**:
```bash
cd web3
rm -rf node_modules
npm install
```

---

**Issue**: Frontend tests fail with "Cannot find module" or React import errors

**Solution**:
```bash
# Install dependencies from project root
npm install

# Clear Vite cache
rm -rf node_modules/.vite
```

---

**Issue**: Web3 test output not visible

**Solution**: Use `npm run test:show` instead of `npm test` (default writes to log file)

---

**Issue**: Tests pass locally but fail in CI

**Solution**: Check environment variables in CI config, ensure test database is created

---

**Issue**: Tests hang with lock timeouts after overriding `tearDown()`

**Root cause**: Calling `Mockery::close()` before `parent::tearDown()` leaves the DB transaction open when a mock expectation fails. The base `TestCase::tearDown()` already calls `Mockery::close()` after rolling back the transaction. See [gotchas.md #18](./gotchas.md).

**Solution**: Do not override `tearDown()` for Mockery cleanup. If you must override `tearDown()`, always call `parent::tearDown()` **before** `Mockery::close()`.

---

**Issue**: Tests hang for 30+ seconds per test, or new test runs block on `INSERT INTO roles`

**Root cause**: Mockery partial mocks of services with **protected** methods (like `runCommand()`)
require `->shouldAllowMockingProtectedMethods()`. Without it, `shouldReceive('runCommand')` is
silently ignored — the real method executes `exec('timeout 30 ...')`, which blocks while
`DatabaseTransactions` holds row locks. A second test run then deadlocks waiting for those locks.

**Solution**:
1. Always chain `->shouldAllowMockingProtectedMethods()` after `->makePartial()` when mocking
   protected methods:
   ```php
   $service = Mockery::mock(MyService::class, [$dep1, $dep2])
       ->makePartial()
       ->shouldAllowMockingProtectedMethods(); // REQUIRED for protected methods
   ```
2. Services that call `exec()` should have a testing guard that throws immediately instead of
   hanging (see `CoursePurchaseService::runCommand()` for the pattern).
3. If tests are already stuck, kill zombie processes and their DB connections:
   ```bash
   sail exec -T app bash -c "kill -9 \$(pgrep -f 'phpunit|artisan test')"
   sail exec -T mysql mysqladmin processlist -uroot -ppassword  # find stuck IDs
   sail exec -T mysql mysql -uroot -ppassword -e "KILL <id>;"
   ```

---

**Issue**: `number_format()` in Eloquent accessor breaks `(float)` cast

**Root cause**: `Course::getPriceAttribute()` returns `number_format(1000, 2)` → `"1,000.00"`.
PHP's `(float)` stops at the comma: `(float) "1,000.00"` = `1.0`, not `1000.0`.

**Solution**: Use `$model->getRawOriginal('price')` to bypass the accessor when you need the
raw numeric value for calculations.

## Best Practices

### DO

✅ **Rely on base TestCase** — it applies `DatabaseTransactions` and `Mockery::close()` for all tests
✅ **Use `$this->createTestUser()`** to create users without triggering model events (web3 calls)
✅ **Mock external dependencies** (APIs, exec calls, email, Stripe)
✅ **Test both success and failure paths**
✅ **Use factories** for test data creation
✅ **Keep tests fast** (< 5 seconds per test)
✅ **Name tests descriptively** (`test_method_does_what_when_condition`)
✅ **Test at the right layer** (unit for logic, feature for HTTP, component for UI)
✅ **Test accessibility** in React components (keyboard nav, screen readers)
✅ **Use `.spec.mjs` extension** for web3 tests (project convention)

### DON'T

❌ **Don't add `use DatabaseTransactions`** to test classes — base TestCase already applies it
❌ **Don't override `tearDown()` for Mockery** — base TestCase handles it; wrong ordering causes zombie locks ([gotchas.md #18](./gotchas.md))
❌ **Don't test framework code** (e.g., Eloquent relationships, React internals)
❌ **Don't use real API calls** in Unit/Feature tests (mock Stripe, Blockfrost, etc.) — use `tests/Integration/` for real-API tests with the `InteractsWithRealServices` trait
❌ **Don't share state between tests** (use setUp/tearDown, beforeEach)
❌ **Don't test implementation details** (test behavior, not internal state)
❌ **Don't mix test file extensions** (use `.spec.mjs` for web3, `.test.jsx` for React)

## Cross-References

- **Architecture**: See [docs/architecture.md](./architecture.md) for testable patterns
- **Data Flows**: See [docs/data-flows.md](./data-flows.md) for integration test scenarios
- **Patterns**: See [docs/patterns.md](./patterns.md) for testable code structure
