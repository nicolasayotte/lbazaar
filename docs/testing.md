# Testing Strategy

> **AI Context Summary**: Test pyramid: Unit (PHPUnit for services, Vitest for web3) → Integration (PHPUnit Feature for controllers) → E2E (Postman). Run `sail test` for PHP, `cd web3 && npm test` for Node. Tests use DatabaseTransactions trait. Mock web3 exec() calls in service tests. Coverage target: 80% services, 70% controllers.

## Overview

Le Bazaar follows a **test pyramid strategy** with three layers:

```
       /\
      /E2E\          Postman API tests (limited)
     /------\
    /  INT   \       PHPUnit Feature tests + Vitest integration
   /----------\
  /   UNIT     \     PHPUnit Unit tests + Vitest unit tests
 /--------------\
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
└── TestCase.php (base class)
```

### Web3 Tests (Vitest)

```
web3/
├── common/
│   └── __tests__/
│       ├── utils.test.mjs
│       └── certificate-metadata.test.mjs
└── run/
    └── __tests__/
        └── build-certificate-tx.test.mjs
```

## Running Tests

### Backend Tests

```bash
# All tests
sail test

# Specific test class
sail test --filter CertificateServiceTest

# Specific test method
sail test --filter test_mint_and_airdrop_certificate_success

# With coverage report
sail test --coverage

# Stop on first failure
sail test --stop-on-failure
```

### Web3 Tests

```bash
# All web3 tests
cd web3 && npm test

# Watch mode (re-run on file changes)
cd web3 && npm run test:watch

# Specific test file
cd web3 && npm test utils.test.mjs

# Coverage report
cd web3 && npm test -- --coverage
```

### E2E Tests (Postman)

```bash
# Run Postman collection
npm run postman:test

# Or manually with Newman
npx newman run postman/lbazaar.postman_collection.json \
  -e postman/local.postman_environment.json
```

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

## Writing Web3 Tests

### Unit Test Pattern (Utilities)

**Location**: `web3/common/__tests__/`

**Purpose**: Test pure functions in isolation.

**Template**:
```javascript
import { describe, it, expect, vi } from 'vitest';
import { validateAddress, getTokenNamesAddrs } from '../utils.mjs';

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

    describe('getTokenNamesAddrs', () => {
        it('should extract token names from UTXOs', async () => {
            // Arrange: Mock UTXO
            const mockUtxo = {
                value: {
                    assets: {
                        mintingPolicies: [{ hex: 'abc123' }],
                        getTokenNames: vi.fn().mockReturnValue([
                            { bytes: new TextEncoder().encode('Token1') },
                            { bytes: new TextEncoder().encode('Token2') }
                        ])
                    }
                },
                origOutput: {
                    address: {
                        toBech32: vi.fn().mockReturnValue('addr_test1...')
                    }
                }
            };

            // Act
            const result = await getTokenNamesAddrs(
                { hex: 'abc123' },
                [mockUtxo]
            );

            // Assert
            expect(result.tokenNames).toContain('Token1');
            expect(result.tokenNames).toContain('Token2');
            expect(result.addresses).toHaveLength(1);
            expect(result.addresses[0]).toBe('addr_test1...');
        });

        it('should return empty arrays when no tokens found', async () => {
            const result = await getTokenNamesAddrs({ hex: 'abc123' }, []);
            expect(result.tokenNames).toEqual([]);
            expect(result.addresses).toEqual([]);
        });
    });
});
```

**Key Points**:
- Use `vi.fn()` for mocking
- Test edge cases (null, empty, invalid input)
- Test both success and error paths

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

**Configuration**: `.env.testing`

```env
DB_CONNECTION=mysql
DB_DATABASE=lbazaar_test
APP_ENV=testing
```

**Setup**:
```bash
# Create test database
sail mysql -e "CREATE DATABASE lbazaar_test;"

# Run migrations for test DB
sail artisan migrate --env=testing
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

      - name: Run web3 tests
        run: cd web3 && npm test -- --coverage
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

### Vitest Debugging

```bash
# Run in watch mode
cd web3 && npm run test:watch

# Debug specific test
cd web3 && npm test -- --reporter=verbose utils.test.mjs
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

**Issue**: Tests pass locally but fail in CI

**Solution**: Check environment variables in CI config, ensure test database is created

## Best Practices

### DO

✅ **Use DatabaseTransactions** for tests that touch the database
✅ **Mock external dependencies** (APIs, exec calls, email)
✅ **Test both success and failure paths**
✅ **Use factories** for test data creation
✅ **Keep tests fast** (< 5 seconds per test)
✅ **Name tests descriptively** (`test_method_does_what_when_condition`)
✅ **Test at the right layer** (unit for logic, feature for HTTP)

### DON'T

❌ **Don't test framework code** (e.g., Eloquent relationships)
❌ **Don't use real API calls** in tests (mock them)
❌ **Don't share state between tests** (use setUp/tearDown)
❌ **Don't test implementation details** (test behavior)
❌ **Don't skip cleanup** (always use DatabaseTransactions or manual cleanup)

## Cross-References

- **Architecture**: See [docs/architecture.md](./architecture.md) for testable patterns
- **Data Flows**: See [docs/data-flows.md](./data-flows.md) for integration test scenarios
- **Patterns**: See [docs/patterns.md](./patterns.md) for testable code structure
