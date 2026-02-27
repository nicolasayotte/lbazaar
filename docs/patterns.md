# Code Patterns & Anti-Patterns

> **AI Context Summary**: Follow thin controller pattern (delegate to services). Services return `['success' => bool, 'message' => string, 'data' => array]`. Always use `escapeshellarg()` for exec() calls. Validation in Form Request classes only. Inertia.js: use `Inertia.post()` not HTML forms. Never put business logic in controllers or repositories.

## Core Patterns

### 1. Thin Controller Pattern

**Rule**: Controllers MUST NOT contain business logic. Delegate to services.

✅ **GOOD**:
```php
// app/Http/Controllers/API/CertificateController.php
public function mintAndAirdropCertificates(MintCertificatesRequest $request)
{
    $course = Course::where('id', $request->course_id)
                    ->where('professor_id', Auth::id())
                    ->firstOrFail();

    $result = $this->certificateService->mintAndAirdropCertificate(
        $course,
        $student
    );

    return response()->json($result, $result['success'] ? 200 : 400);
}
```

❌ **BAD**:
```php
public function mintAndAirdropCertificates(Request $request)
{
    // Business logic in controller (BAD!)
    $course = Course::find($request->course_id);
    if (!$course) {
        return response()->json(['error' => 'Course not found'], 404);
    }

    if ($course->professor_id !== Auth::id()) {
        return response()->json(['error' => 'Unauthorized'], 403);
    }

    $walletAddress = $student->userWallet->address ?? $this->deriveCustodialWallet($student);
    $metadata = [
        'student' => $student->name,
        'course' => $course->title,
        // ... more logic
    ];

    // 50+ more lines of business logic...
}
```

**Why**: Business logic in controllers is hard to test, reuse, and maintain.

### 2. Service Layer Response Structure

**Rule**: All service methods MUST return structured arrays.

✅ **GOOD**:
```php
// app/Services/API/CertificateService.php
public function mintAndAirdropCertificate(Course $course, User $student): array
{
    try {
        // Business logic here
        $walletAddress = $this->getStudentWalletAddress($student);
        $certificateData = $this->createCertificateMetadata($course, $student);
        $mintResult = $this->mintCertificateNFT($certificateData, $walletAddress);

        if (!$mintResult['success']) {
            return [
                'success' => false,
                'message' => 'Failed to mint certificate: ' . $mintResult['message']
            ];
        }

        $this->recordNftTransaction($student->id, $mintResult, $certificateData);

        return [
            'success' => true,
            'message' => 'Certificate minted successfully',
            'data' => [
                'transaction_id' => $mintResult['transaction_id'],
                'wallet_address' => $walletAddress
            ]
        ];

    } catch (Exception $e) {
        Log::error('Certificate minting failed', [
            'course_id' => $course->id,
            'student_id' => $student->id,
            'error' => $e->getMessage()
        ]);

        return [
            'success' => false,
            'message' => 'Certificate minting failed: ' . $e->getMessage()
        ];
    }
}
```

❌ **BAD**:
```php
public function mintCertificate(Course $course, User $student)
{
    // Returning inconsistent structures (BAD!)
    if ($condition1) {
        return ['status' => 'ok', 'data' => []];
    }
    if ($condition2) {
        return ['success' => true];
    }
    throw new Exception('Failed');  // Uncaught exception (BAD!)
}
```

**Response Contract**:
```php
[
    'success' => true|false,  // REQUIRED
    'message' => string,      // REQUIRED
    'data' => array           // OPTIONAL
]
```

### 3. Form Request Validation

**Rule**: All validation MUST be in dedicated Form Request classes.

✅ **GOOD**:
```php
// app/Http/Requests/MintCertificatesRequest.php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class MintCertificatesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasRole('teacher');
    }

    public function rules(): array
    {
        return [
            'course_id' => 'required|integer|exists:courses,id',
            'schedule_id' => 'nullable|integer|exists:course_schedules,id'
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(response()->json([
            'success' => false,
            'message' => 'Validation failed',
            'errors' => $validator->errors()
        ], 422));
    }
}

// In controller
public function mintCertificates(MintCertificatesRequest $request)
{
    // Request is already validated
    $courseId = $request->course_id;
}
```

❌ **BAD**:
```php
// Validation in controller (BAD!)
public function mintCertificates(Request $request)
{
    $validator = Validator::make($request->all(), [
        'course_id' => 'required|integer|exists:courses,id'
    ]);

    if ($validator->fails()) {
        return response()->json(['errors' => $validator->errors()], 422);
    }
}
```

### 4. Web3 Command Execution Pattern

**Rule**: PHP services MUST use `buildWeb3Command()` for security.

✅ **GOOD**:
```php
// app/Services/API/CertificateService.php
protected function buildWeb3Command(string $scriptRelativePath, array $arguments = []): string
{
    $web3Directory = base_path('web3');
    $scriptPath = './' . ltrim($scriptRelativePath, '/');
    $logPath = storage_path('logs/web3.log');

    $argumentString = '';
    if (!empty($arguments)) {
        // CRITICAL: escapeshellarg() prevents command injection
        $argumentString = ' ' . implode(' ', array_map('escapeshellarg', $arguments));
    }

    return sprintf(
        '(cd %s && node %s%s) 2>> %s',
        escapeshellarg($web3Directory),
        escapeshellarg($scriptPath),
        $argumentString,
        escapeshellarg($logPath)
    );
}

// Usage
$command = $this->buildWeb3Command('run/build-certificate-tx.mjs', [
    $recipientAddress,
    $nftName,
    $serialNum,
    $mph,
    $imageUrl,
    json_encode($metadata)
]);

$output = shell_exec($command);
```

❌ **BAD**:
```php
// Direct exec without escaping (SECURITY RISK!)
$command = "cd web3 && node run/script.mjs $userInput";
exec($command, $output);  // Command injection vulnerability!
```

**Why**: User input in `exec()` without escaping allows command injection attacks.

### 5. React + Inertia Props Pattern

**Rule**: Use Inertia props for server data, avoid unnecessary XHR.

✅ **GOOD**:
```jsx
// resources/js/pages/Portal/Courses/Index.jsx
import React from 'react';

const CoursesIndex = ({ auth, courses, translatables }) => {
    // All data from server, no loading state needed
    return (
        <div>
            <h1>{translatables.courses_title}</h1>
            {courses.map(course => (
                <CourseCard key={course.id} course={course} />
            ))}
        </div>
    );
};

export default CoursesIndex;

// In Laravel controller
public function index()
{
    return Inertia::render('Portal/Courses/Index', [
        'courses' => Course::all(),
        'translatables' => $this->getTranslatables()
    ]);
}
```

❌ **BAD**:
```jsx
// Unnecessary API call for server-rendered data (BAD!)
const CoursesIndex = () => {
    const [courses, setCourses] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get('/api/courses')
            .then(res => {
                setCourses(res.data);
                setLoading(false);
            });
    }, []);

    if (loading) return <div>Loading...</div>;

    return <div>{courses.map(...)}</div>;
};
```

**Why**: Inertia already provides server data as props. Extra XHR is redundant.

### 6. Inertia Form Submissions

**Rule**: Use `Inertia.post()`, not HTML form submissions.

✅ **GOOD**:
```jsx
import { Inertia } from '@inertiajs/inertia';
import { useState } from 'react';

const CreateCourse = () => {
    const [formData, setFormData] = useState({ title: '', description: '' });

    const handleSubmit = (e) => {
        e.preventDefault();
        Inertia.post('/portal/courses', formData, {
            onSuccess: () => console.log('Created!'),
            onError: (errors) => console.error(errors)
        });
    };

    return (
        <form onSubmit={handleSubmit}>
            <input
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
            />
            <button type="submit">Create</button>
        </form>
    );
};
```

❌ **BAD**:
```jsx
// Regular HTML form (causes full page reload - BAD!)
<form action="/portal/courses" method="POST">
    <input name="title" />
    <button type="submit">Create</button>
</form>
```

### 7. Transaction Management

**Rule**: Use `DB::transaction()` for multi-step operations.

✅ **GOOD**:
```php
use Illuminate\Support\Facades\DB;

public function enrollStudent(Course $course, User $student): array
{
    try {
        DB::transaction(function () use ($course, $student) {
            // Lock row to prevent race condition
            $wallet = $student->userWallet()->lockForUpdate()->first();

            if ($wallet->points < $course->cost_points) {
                throw new InsufficientPointsException();
            }

            $wallet->points -= $course->cost_points;
            $wallet->save();

            $course->enrollments()->create([
                'user_id' => $student->id,
                'enrolled_at' => now()
            ]);
        });

        return ['success' => true, 'message' => 'Enrolled successfully'];

    } catch (Exception $e) {
        return ['success' => false, 'message' => 'Enrollment failed'];
    }
}
```

❌ **BAD**:
```php
// No transaction (race condition risk - BAD!)
public function enrollStudent(Course $course, User $student): array
{
    $wallet = $student->userWallet;
    $wallet->points -= $course->cost_points;
    $wallet->save();  // If this succeeds but next fails, points lost!

    $course->enrollments()->create([
        'user_id' => $student->id
    ]);  // If this fails, points already deducted!
}
```

### 8. Web3 Script Output Contract

**Rule**: All Node.js scripts MUST output JSON to stdout.

✅ **GOOD**:
```javascript
// web3/run/build-certificate-tx.mjs
const main = async () => {
    try {
        // Build transaction logic
        const cborTx = buildTransaction();

        // CRITICAL: Output JSON to stdout
        console.error('build-certificate-tx: success');  // Debug to stderr
        process.stdout.write(JSON.stringify({
            status: 200,
            data: {
                cborTx: cborTx,
                txHash: txHash
            }
        }));

    } catch (err) {
        // CRITICAL: Errors also to stdout as JSON
        console.error('build-certificate-tx: error', err);  // Debug to stderr
        process.stdout.write(JSON.stringify({
            status: 500,
            error: err.message
        }));
    }
};

main();
```

❌ **BAD**:
```javascript
// Error only in stderr (PHP won't see it - BAD!)
try {
    const tx = buildTransaction();
    console.log(tx);  // Not JSON (BAD!)
} catch (err) {
    console.error('Error:', err.message);  // Only stderr (BAD!)
    process.exit(1);
}
```

**Output Contract**:
```javascript
// Success
{ "status": 200, "data": {...} }

// Error
{ "status": 500, "error": "Error message" }
```

### 9. Graceful Degradation for Optional External APIs

**Rule**: Wrap optional external API calls in try/catch and pass an availability flag to the view — never let a third-party outage cause a 500.

✅ **GOOD**:
```php
// app/Http/Controllers/Portal/CourseController.php
$adaAvailable = true;
try {
    $this->exchangeRateService->addPriceInAdaToCourses([$course]);
} catch (\Throwable $e) {
    $adaAvailable = false;
    Log::warning('ADA rate unavailable', ['course' => $id, 'error' => $e->getMessage()]);
}

return Inertia::render('Portal/Course/Details', [
    'course'        => $course,
    'ada_available' => $adaAvailable,
    // ...
]);
```

```jsx
// Frontend: respect the flag — degrade, don't crash
const [adaAvailable, setAdaAvailable] = useState(ada_available)
<Button disabled={!walletAPI || !adaAvailable}>Pay with ADA</Button>
{!adaAvailable && <Typography>ADA price temporarily unavailable.</Typography>}
```

❌ **BAD**:
```php
// Unguarded external call — CoinGecko outage = 500 for every student (BAD!)
$this->exchangeRateService->addPriceInAdaToCourses([$course]);
return Inertia::render('Portal/Course/Details', ['course' => $course]);
```

**Key Points**:
- Catch at the controller boundary, not deep in the service
- Log with context (course ID, error message) — not silently
- Always pass a boolean availability flag so the frontend can render a degraded UI
- For polling use `ExchangeRateService::isAvailable()` which checks cache first

### 10. Quote Window + Duplicate Payment Prevention

**Rule**: For two-phase blockchain checkouts (build → sign → submit), cache a price quote on build and validate it on submit. Use `lockForUpdate()` inside a DB transaction to prevent concurrent duplicates.

✅ **GOOD**:
```php
// Phase 1 — build: cache quote with expiry
public function buildPurchaseTransaction(...): array
{
    // ... build CBOR tx ...
    $quoteExpiresAt = now()->addSeconds($this->quoteWindowSeconds())->toIso8601String();
    Cache::put(
        "purchase_quote_{$user->id}_{$schedule->id}",
        ['adaAmount' => $adaTotalAmount, 'expiresAt' => $quoteExpiresAt],
        $this->quoteWindowSeconds()
    );
    return ['success' => true, 'data' => ['cborTx' => ..., 'quoteExpiresAt' => $quoteExpiresAt]];
}

// Phase 2 — submit: validate quote, then lock against duplicates
public function submitPurchaseTransaction(...): array
{
    // Gap 1: quote expired?
    $quote = Cache::get("purchase_quote_{$user->id}_{$schedule->id}");
    if (!$quote) {
        return ['success' => false, 'message' => '...', 'quoteExpired' => true];
    }

    // Gap 2: fast pre-check before the expensive web3 call
    if (CourseHistory::where(...)->whereIn('payment_status', ['pending','confirmed'])->exists()) {
        return ['success' => false, 'message' => '...', 'duplicate' => true];
    }

    // ... call web3 submit script ...

    // Gap 3: lock inside transaction to catch true races
    DB::transaction(function () use (...) {
        $existing = CourseHistory::where(...)->lockForUpdate()->first();
        if ($existing) throw new \RuntimeException('Duplicate payment detected under lock.');
        CourseHistory::create([...]);
    });

    Cache::forget("purchase_quote_{$user->id}_{$schedule->id}");
    return ['success' => true, ...];
}
```

**Key Points**:
- Quote key: `purchase_quote_{userId}_{scheduleId}` — scoped, auto-expires via Cache TTL
- Quote window configurable via `PAYMENT_QUOTE_WINDOW_MINUTES` (default 5 min)
- Return `quoteExpired: true` and `duplicate: true` as distinct flags so the frontend can show the right message
- Three layers of duplicate protection: pre-check `exists()`, DB lock, catch RuntimeException
- Clear the cache on success; leave it to expire naturally on failure (user may retry)

### 11. Internationalization (i18n)

**Rule**: All user-facing strings MUST be in both English and Japanese.

✅ **GOOD**:
```php
// lang/en/messages.php
return [
    'enrollment_success' => 'Enrollment successful',
    'enrollment_failed' => 'Enrollment failed'
];

// lang/ja/messages.php
return [
    'enrollment_success' => '登録に成功しました',
    'enrollment_failed' => '登録に失敗しました'
];

// In controller
public function enroll()
{
    return Inertia::render('Courses/Enroll', [
        'translatables' => [
            'enrollment_success' => __('messages.enrollment_success'),
            'enrollment_failed' => __('messages.enrollment_failed')
        ]
    ]);
}
```

❌ **BAD**:
```php
// Hardcoded English strings (BAD!)
return response()->json(['message' => 'Enrollment successful']);
```

## Anti-Patterns Reference Table

| ❌ Anti-Pattern | Why Bad | ✅ Correct Pattern |
|----------------|---------|-------------------|
| Business logic in controllers | Hard to test, violates SRP | Move to service class |
| Direct `exec()` without escaping | Command injection vulnerability | Use `escapeshellarg()` in `buildWeb3Command()` |
| Validation in controller methods | Repetitive, inconsistent | Use Form Request classes |
| Raw SQL queries | SQL injection risk, harder to maintain | Use Eloquent query builder |
| Global state in React | Props drilling, hard to debug | Use Redux Toolkit slices or Inertia props |
| Hardcoded strings in UI | Not translatable | Use `translatables` prop |
| Empty catch blocks | Silent failures, debugging nightmare | Log errors with context |
| Inconsistent JSON responses | Frontend can't handle errors reliably | Always use `{success, message, data}` |
| Missing database transactions | Race conditions, inconsistent state | Wrap multi-step operations in `DB::transaction()` |
| Unguarded optional API calls | Third-party outage causes 500 | Catch + pass `available` flag to view (Pattern #9) |
| No quote validation on submit | Stale prices, replay risk | Cache quote on build, validate on submit (Pattern #10) |
| Storing secrets in code | Security breach risk | Use `.env` and `config()` |
| HTML form submissions in Inertia | Full page reload, breaks SPA | Use `Inertia.post()` |
| Business logic in repositories | Violates layer boundaries | Keep repositories for data access only |
| N+1 queries | Performance degradation | Use eager loading (`with()`) |
| Not using factories in tests | Hard to maintain test data | Use `Model::factory()->create()` |

## Layered Architecture Rules

### Layer Responsibilities

| Layer | Responsibilities | MUST NOT |
|-------|-----------------|----------|
| **Controllers** | Request validation, call services, format responses | Contain business logic, query database directly |
| **Services** | Business logic, orchestration, transaction management | Handle HTTP concerns, return responses |
| **Repositories** | Database queries, model interactions | Contain business logic |
| **Models** | Data representation, relationships | Contain business logic beyond accessors/mutators |

### Example: Correct Layer Separation

```php
// ✅ GOOD: Clear layer separation

// Controller (thin)
class CourseController extends Controller
{
    public function enroll(EnrollmentRequest $request)
    {
        $result = $this->courseService->enrollStudent(
            Course::findOrFail($request->course_id),
            Auth::user()
        );
        return response()->json($result, $result['success'] ? 200 : 400);
    }
}

// Service (business logic)
class CourseService
{
    public function enrollStudent(Course $course, User $student): array
    {
        if ($this->courseRepository->isEnrolled($course, $student)) {
            return ['success' => false, 'message' => 'Already enrolled'];
        }

        DB::transaction(function () use ($course, $student) {
            $this->walletService->deductPoints($student, $course->cost_points);
            $this->courseRepository->createEnrollment($course, $student);
        });

        return ['success' => true, 'message' => 'Enrolled successfully'];
    }
}

// Repository (data access)
class CourseRepository
{
    public function isEnrolled(Course $course, User $student): bool
    {
        return $course->enrollments()
            ->where('user_id', $student->id)
            ->exists();
    }

    public function createEnrollment(Course $course, User $student): void
    {
        $course->enrollments()->create([
            'user_id' => $student->id,
            'enrolled_at' => now()
        ]);
    }
}
```

## Code Style

### PHP (Laravel Pint)

```bash
# Run formatter
sail composer pint

# Check without fixing
sail composer pint -- --test
```

**Style**: Laravel's default (PSR-12)

### JavaScript (Prettier)

```bash
# Format web3 code
cd web3 && npm run format

# Check without fixing
cd web3 && npm run format -- --check
```

**Configuration**: `web3/.prettierrc`

## Testing Patterns

See [docs/testing.md](./testing.md) for comprehensive testing patterns.

**Key Testing Pattern**:
- **Unit tests**: Test services in isolation (mock dependencies)
- **Feature tests**: Test HTTP request/response (authentication, authorization)
- **Integration tests**: Test layer interactions (controller → service → database)

## Cross-References

- **Architecture**: See [docs/architecture.md](./architecture.md) for layer definitions
- **Data Flows**: See [docs/data-flows.md](./data-flows.md) for pattern examples in context
- **Testing**: See [docs/testing.md](./testing.md) for testing patterns
- **Gotchas**: See [docs/gotchas.md](./gotchas.md) for common mistakes
