# Certificate Form Requests Usage Guide

This document provides examples of how to use the newly created Form Request classes for certificate minting.

## Overview

Two Form Request classes have been created:
- `MintSingleCertificateRequest` - For minting a certificate to a single student
- `BatchMintCertificatesRequest` - For batch minting certificates to multiple students

Both classes:
- ✅ Validate input data (course_id, student_id(s), optional schedule_id)
- ✅ Authorize teacher role and course ownership
- ✅ Return JSON responses (not redirects)
- ✅ Follow Laravel Form Request patterns

## MintSingleCertificateRequest

### Usage in Controller

```php
<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\API\MintSingleCertificateRequest;
use App\Services\API\CertificateService;
use App\Models\Course;
use App\Models\User;

class CertificateController extends Controller
{
    protected $certificateService;

    public function __construct(CertificateService $certificateService)
    {
        $this->middleware('auth');
        $this->certificateService = $certificateService;
    }

    /**
     * Mint and airdrop a certificate to a single student
     */
    public function mintSingleCertificate(MintSingleCertificateRequest $request)
    {
        // Request is already validated and authorized
        $course = Course::findOrFail($request->course_id);
        $student = User::findOrFail($request->student_id);

        $result = $this->certificateService->mintAndAirdropCertificate(
            $course,
            $student,
            $request->schedule_id
        );

        return response()->json($result, $result['success'] ? 200 : 400);
    }
}
```

### Request Payload

```json
{
    "course_id": 123,
    "student_id": 456,
    "schedule_id": 789  // Optional
}
```

### Validation Rules

- `course_id`: required, integer, must exist in courses table
- `student_id`: required, integer, must exist in users table
- `schedule_id`: optional, integer, must exist in course_schedules table

### Authorization

- User must be authenticated
- User must have 'teacher' role
- User must own the course (course.professor_id === user.id)

### Response Examples

**Validation Error (422)**
```json
{
    "success": false,
    "message": "Validation failed",
    "errors": {
        "course_id": ["The course id field is required."],
        "student_id": ["The student id field is required."]
    }
}
```

**Authorization Error (403)**
```json
{
    "success": false,
    "message": "You do not have permission to mint certificates for this course."
}
```

## BatchMintCertificatesRequest

### Usage in Controller

```php
<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\API\BatchMintCertificatesRequest;
use App\Services\API\CertificateService;
use App\Models\Course;
use App\Models\User;

class CertificateController extends Controller
{
    protected $certificateService;

    public function __construct(CertificateService $certificateService)
    {
        $this->middleware('auth');
        $this->certificateService = $certificateService;
    }

    /**
     * Mint and airdrop certificates to multiple students
     */
    public function batchMintCertificates(BatchMintCertificatesRequest $request)
    {
        // Request is already validated and authorized
        $course = Course::findOrFail($request->course_id);
        $students = User::whereIn('id', $request->student_ids)->get();

        $results = [];
        $successCount = 0;
        $failureCount = 0;

        foreach ($students as $student) {
            $result = $this->certificateService->mintAndAirdropCertificate(
                $course,
                $student,
                $request->schedule_id
            );

            $results[] = [
                'student_id' => $student->id,
                'success' => $result['success'],
                'message' => $result['message'] ?? null
            ];

            $result['success'] ? $successCount++ : $failureCount++;
        }

        return response()->json([
            'success' => true,
            'message' => "Batch minting completed. Success: {$successCount}, Failed: {$failureCount}",
            'data' => [
                'success_count' => $successCount,
                'failure_count' => $failureCount,
                'results' => $results
            ]
        ], 200);
    }
}
```

### Request Payload

```json
{
    "course_id": 123,
    "student_ids": [456, 789, 101],
    "schedule_id": 999  // Optional
}
```

### Validation Rules

- `course_id`: required, integer, must exist in courses table
- `student_ids`: required, array, must have at least 1 element
- `student_ids.*`: required, integer, each must exist in users table
- `schedule_id`: optional, integer, must exist in course_schedules table

### Custom Error Messages

The request includes custom error messages for better UX:

- `student_ids.required`: "At least one student must be selected for certificate minting."
- `student_ids.min`: "At least one student must be selected for certificate minting."
- `student_ids.array`: "The student IDs must be provided as an array."
- `student_ids.*.exists`: "One or more selected students do not exist in the system."

### Authorization

- User must be authenticated
- User must have 'teacher' role
- User must own the course (course.professor_id === user.id)

### Response Examples

**Validation Error (422)**
```json
{
    "success": false,
    "message": "Validation failed",
    "errors": {
        "student_ids": ["At least one student must be selected for certificate minting."]
    }
}
```

**Authorization Error (403)**
```json
{
    "success": false,
    "message": "You do not have permission to mint certificates for this course."
}
```

## Route Definitions

Add these routes to `routes/api.php`:

```php
use App\Http\Controllers\API\CertificateController;

Route::middleware(['auth:sanctum'])->group(function () {
    // Single certificate minting
    Route::post('/certificates/mint-single', [CertificateController::class, 'mintSingleCertificate']);

    // Batch certificate minting
    Route::post('/certificates/mint-batch', [CertificateController::class, 'batchMintCertificates']);
});
```

## Testing

Comprehensive PHPUnit tests have been created:

### Unit Tests
- `tests/Unit/Http/Requests/API/MintSingleCertificateRequestTest.php` (16 tests)
- `tests/Unit/Http/Requests/API/BatchMintCertificatesRequestTest.php` (24 tests)

### Feature Tests
- `tests/Feature/Http/Requests/API/CertificateFormRequestsIntegrationTest.php` (8 tests)

Run tests:
```bash
sail test --filter MintSingleCertificateRequestTest
sail test --filter BatchMintCertificatesRequestTest
sail test --filter CertificateFormRequestsIntegrationTest
```

## Benefits

✅ **Separation of Concerns**: Validation and authorization logic separated from controller
✅ **Reusability**: Form Requests can be reused across multiple controllers
✅ **Testability**: Easy to unit test validation and authorization logic
✅ **JSON Responses**: Proper JSON error responses for API consumers
✅ **Type Safety**: Type-hinted methods ensure proper usage
✅ **Documentation**: Self-documenting validation rules

## Integration with Existing Code

To integrate with the existing `CertificateController::mintAndAirdropCertificates()` method:

1. **Option A**: Keep existing method and add new methods
   - Existing: `/api/certificates/mint-and-airdrop` (gets eligible students automatically)
   - New: `/api/certificates/mint-single` (mint to specific student)
   - New: `/api/certificates/mint-batch` (mint to specific students)

2. **Option B**: Refactor existing method to use Form Request
   ```php
   public function mintAndAirdropCertificates(BatchMintCertificatesRequest $request)
   {
       // Remove inline validation, use Form Request validation
       // Authorization is already handled by Form Request

       $courseId = $request->course_id;
       $scheduleId = $request->schedule_id;
       // ... rest of implementation
   }
   ```

## Notes

- Form Requests follow the project's pattern of returning JSON responses (not redirects)
- Authorization checks course ownership in addition to teacher role
- All validation errors return 422 status code
- All authorization errors return 403 status code
- Tests use `DatabaseTransactions` trait for automatic rollback
- Tests use unique email addresses to avoid database deadlock issues
