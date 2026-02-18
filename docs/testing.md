# Testing Strategy

> **AI Context Summary**: Dual pipeline — Fast (mocked, every commit): `sail test`, `npm test`, `cd web3 && npm test`, `npm run test:browser`. Live Integration (real APIs, on-demand): `sail composer test:integration` (PHP), `cd web3 && npm run test:integration` (Node.js), `npm run test:postman:staging` (Postman against staging). Integration tests skip automatically when API keys are missing/placeholder. The `InteractsWithRealServices` trait (tests/Traits/) handles safety/skip logic. Web3 tests use `.spec.mjs`; browser tests `.spec.js` in `tests/Browser/`. Coverage target: 80% services, 70% controllers/components.

## Overview

Le Bazaar follows a **dual-pipeline test strategy**:

```
FAST PIPELINE (every commit)          LIVE PIPELINE (staging / on-demand)
─────────────────────────             ─────────────────────────────────────
PHPUnit Unit + Feature (mocked)       PHPUnit Integration (real APIs)
Vitest frontend (jsdom, mocked)       Web3 Vitest integration (real Blockfrost)
Web3 Vitest (mocked fetch)            Postman staging collection (real endpoints)
Postman local (seeded data)           Playwright E2E (real Stripe test card)
Playwright smoke (page loads)
```

The fast pipeline runs in parallel (8 workers), takes ~2 minutes, and mocks every external service. The live pipeline hits real testnet/test-mode APIs and self-skips when credentials are missing — safe to include in `phpunit.xml` without breaking CI.

```
      /\
     /BRW\           Playwright browser tests (smoke, user flows)
    /------\
   / E2E    \        Postman API tests (local seeded + staging real)
  /----------\
 / LIVE INT   \      PHPUnit Integration + Web3 integration (real APIs)
/--------------\
 /   FEAT INT  \     PHPUnit Feature tests + Vitest integration
/---------------\
/    UNIT        \   PHPUnit Unit tests + Vitest unit tests
/-----------------\
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
    └── top-page.spec.js        (smoke test: top page + login)
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
        ├── build-certificate-tx-nmkr.integration.spec.mjs   (mocked — runs in fast pipeline)
        ├── blockfrost-connectivity.integration.spec.mjs      (real Blockfrost — live pipeline)
        ├── build-purchase-tx.spec.mjs
        ├── certificate-tx-utils.spec.mjs
        └── submit-purchase-tx.spec.mjs
```

The `blockfrost-connectivity.integration.spec.mjs` file uses `describe.skipIf()` to skip the entire suite when `BLOCKFROST_API_KEY` is a placeholder (< 10 chars or matches known dummy patterns from `vitest.setup.mjs`).

## Running Tests

### Backend Tests

```bash
# All tests (parallel, 8 workers) — fast pipeline only
sail composer test

# Recreate parallel databases (after Ctrl+C or stuck locks)
sail composer test:recreate

# Specific test class (parallel)
sail artisan test --parallel --filter CertificateServiceTest

# Specific test method (serial, faster for single test)
sail test --filter test_mint_and_airdrop_certificate_success

# With coverage report
sail test --coverage

# Stop on first failure
sail test --stop-on-failure

# Integration tests (real APIs — requires valid keys in .env)
sail composer test:integration
```

**Parallel Testing**: Tests run via [ParaTest](https://github.com/paratestphp/paratest) with 8 worker processes. Each worker gets its own database (`testing_test_1` through `testing_test_8`). A schema dump (`database/schema/mysql-schema.sql`) is loaded instead of running migrations, keeping startup fast.

**If tests hang or lock**: Run `sail composer test:recreate` to drop and rebuild all worker databases. See [gotchas.md #17](./gotchas.md) for the `updateOrCreate` lock contention pattern.

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

Playwright runs on the **host machine** (not inside the Sail container), testing real user flows in a Chromium browser against the running app.

**Prerequisites**: Sail must be running at `localhost:8080` (`sail up -d`).

```bash
# Install Chromium browser (first time only)
npx playwright install --with-deps chromium

# Run all browser tests
npm run test:browser

# Run in headed mode (see the browser)
npm run test:browser:headed

# Run with interactive UI
npm run test:browser:ui

# Run a specific test file
npx playwright test tests/Browser/top-page.spec.js
```

**File location**: `tests/Browser/*.spec.js`

**Writing new tests**:
```javascript
import { test, expect } from '@playwright/test';

test('example test', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/LE BAZAAR/i);
});
```

**Configuration**: `playwright.config.js` at project root. Base URL defaults to `http://localhost:8080` (override with `APP_URL` env var).

### E2E Tests (Postman)

```bash
# Run against local seeded environment (fast pipeline)
npm run test:postman

# Run against staging environment (live pipeline — requires staging app running)
npm run test:postman:staging

# Or manually with Newman
npx newman run postman/lbazaar.postman_collection.json \
  -e postman/local.postman_environment.json

# All live integration tests in one command
npm run test:integration
```

**Environments**:
- `postman/local.postman_environment.json` — `localhost:8080`, seeded test users
- `postman/staging.postman_environment.json` — `https://staging.lebazaar.io`, requires `PostmanTestSeeder` run on staging DB

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
use Illuminate\Foundation\Testing\DatabaseTransactions;
use App\Services\API\CertificateService;
use App\Models\User;
use App\Models\Course;
use Mockery;

class CertificateServiceTest extends TestCase
{
    use DatabaseTransactions;

    protected CertificateService $service;
    protected User $student;
    protected Course $course;

    protected function setUp(): void
    {
        parent::setUp();

        // Create test data
        $this->student = User::factory()->create(['role' => 'student']);
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

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }
}
```

**Key Points**:
- Use `DatabaseTransactions` trait to rollback after each test
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
use Illuminate\Foundation\Testing\DatabaseTransactions;
use App\Models\User;
use App\Models\Course;
use Laravel\Sanctum\Sanctum;

class CertificateControllerTest extends TestCase
{
    use DatabaseTransactions;

    protected User $teacher;
    protected User $student;
    protected Course $course;

    protected function setUp(): void
    {
        parent::setUp();

        $this->teacher = User::factory()->create();
        $this->teacher->attachRole('teacher');

        $this->student = User::factory()->create();
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

**Configuration**: `phpunit.xml` sets `DB_DATABASE=testing` and `DB_LOCK_WAIT_TIMEOUT=3`.

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

**Solution**: Ensure `use DatabaseTransactions;` in test class

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

✅ **Use DatabaseTransactions** for tests that touch the database
✅ **Mock external dependencies** (APIs, exec calls, email, Stripe)
✅ **Test both success and failure paths**
✅ **Use factories** for test data creation
✅ **Keep tests fast** (< 5 seconds per test)
✅ **Name tests descriptively** (`test_method_does_what_when_condition`)
✅ **Test at the right layer** (unit for logic, feature for HTTP, component for UI)
✅ **Test accessibility** in React components (keyboard nav, screen readers)
✅ **Use `.spec.mjs` extension** for web3 tests (project convention)

### DON'T

❌ **Don't test framework code** (e.g., Eloquent relationships, React internals)
❌ **Don't use real API calls** in Unit/Feature tests (mock Stripe, Blockfrost, etc.) — use `tests/Integration/` for real-API tests with the `InteractsWithRealServices` trait
❌ **Don't share state between tests** (use setUp/tearDown, beforeEach)
❌ **Don't test implementation details** (test behavior, not internal state)
❌ **Don't skip cleanup** (always use DatabaseTransactions or manual cleanup)
❌ **Don't mix test file extensions** (use `.spec.mjs` for web3, `.test.jsx` for React)

## Cross-References

- **Architecture**: See [docs/architecture.md](./architecture.md) for testable patterns
- **Data Flows**: See [docs/data-flows.md](./data-flows.md) for integration test scenarios
- **Patterns**: See [docs/patterns.md](./patterns.md) for testable code structure
