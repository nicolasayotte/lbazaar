# Task 004: NFT Certificate UI (Teacher Side)

## Overview

Create UI for teachers to configure NFT completion certificates for their courses and mint certificates for students who complete the course. The backend minting logic already exists - this task focuses on the frontend interface.

## Acceptance Criteria

- [ ] Teachers can enable/disable completion certificates when creating course applications
- [ ] Teachers can view list of students who completed their course
- [ ] Teachers can see certificate status per student (eligible/minting/minted/failed)
- [ ] Teachers can mint certificates individually or in batch
- [ ] Minting progress and status shown in real-time
- [ ] Error handling for failed mints with retry option
- [ ] Teachers can view minted certificate details (txHash, explorer link)

## Files to Modify

### Backend (Verify/Extend)

| File | Changes |
|------|---------|
| `app/Http/Controllers/API/CertificateController.php` | Verify endpoints, add status endpoint |
| `app/Services/API/CertificateService.php` | Verify minting logic works |
| `app/Http/Controllers/Portal/CourseApplicationController.php` | Add certificate_enabled field handling |
| `app/Models/CourseApplication.php` | Add certificate_enabled field if missing |
| `database/migrations/xxxx_add_certificate_enabled.php` | NEW: Migration for certificate toggle |

### Frontend (Create/Modify)

| File | Changes |
|------|---------|
| `resources/js/pages/Portal/MyPage/ClassApplications/Create.jsx` | Add "Enable completion certificate" toggle |
| `resources/js/pages/Portal/MyPage/ManageClass/Index.jsx` | Add "Certificates" tab/link |
| `resources/js/pages/Portal/MyPage/ManageClass/Certificates.jsx` | NEW: Certificate management page |
| `resources/js/pages/Portal/MyPage/ManageClass/components/CertificateTable.jsx` | NEW: Student certificate status table |
| `resources/js/pages/Portal/Course/Create.jsx` | Show certificate status for existing courses |

## Context Files (Read These First)

```
app/Services/API/CertificateService.php              # Existing minting service
app/Http/Controllers/API/CertificateController.php   # Existing API endpoints
web3/run/build-certificate-tx.mjs                    # Certificate tx builder
web3/run/submit-certificate-tx.mjs                   # Certificate tx submitter
resources/js/pages/Portal/MyPage/ManageClass/        # Existing class management pages
resources/js/pages/Portal/MyPage/ClassApplications/Create.jsx  # Course application form
```

## Implementation Notes

### Database Schema Addition

```php
// Migration: add_certificate_enabled_to_course_applications
Schema::table('course_applications', function (Blueprint $table) {
    $table->boolean('certificate_enabled')->default(false)->after('nft_id');
});

Schema::table('courses', function (Blueprint $table) {
    $table->boolean('certificate_enabled')->default(false)->after('nft_id');
});
```

### Certificate Status Tracking

May need a new table or use existing fields:

```php
// Option A: Add to course_histories table
Schema::table('course_histories', function (Blueprint $table) {
    $table->enum('certificate_status', ['none', 'eligible', 'minting', 'minted', 'failed'])->default('none');
    $table->string('certificate_tx_hash')->nullable();
    $table->timestamp('certificate_minted_at')->nullable();
});

// Option B: Use existing certificates table if exists
```

### API Endpoints Needed

```php
// routes/api.php or routes/web.php

// Get students eligible for certificates
GET /api/courses/{course}/certificates
Response: { students: [{ id, name, status, txHash?, mintedAt? }] }

// Mint certificate for single student
POST /api/courses/{course}/certificates/{student}/mint
Response: { status, txHash }

// Batch mint certificates
POST /api/courses/{course}/certificates/batch-mint
Body: { studentIds: [1, 2, 3] }
Response: { results: [{ studentId, status, txHash }] }

// Get certificate status
GET /api/courses/{course}/certificates/{student}/status
Response: { status, txHash, explorerUrl }
```

### Frontend Components

#### Certificate Toggle (Course Application Form)

```jsx
// In ClassApplications/Create.jsx
<FormControlLabel
  control={
    <Switch
      checked={data.certificate_enabled}
      onChange={(e) => setData('certificate_enabled', e.target.checked)}
    />
  }
  label="Enable completion certificate (NFT)"
/>
{data.certificate_enabled && (
  <Typography variant="caption" color="textSecondary">
    Students will receive an NFT certificate when they complete this course
  </Typography>
)}
```

#### Certificate Management Page

```jsx
// ManageClass/Certificates.jsx
const CertificatesPage = ({ course, students }) => {
  const [minting, setMinting] = useState({});

  const handleMint = async (studentId) => {
    setMinting(prev => ({ ...prev, [studentId]: true }));
    try {
      await axios.post(`/api/courses/${course.id}/certificates/${studentId}/mint`);
      // Refresh student list
    } catch (error) {
      // Show error
    } finally {
      setMinting(prev => ({ ...prev, [studentId]: false }));
    }
  };

  const handleBatchMint = async () => {
    const eligibleIds = students.filter(s => s.status === 'eligible').map(s => s.id);
    // ... batch mint logic
  };

  return (
    <Box>
      <Typography variant="h5">Completion Certificates</Typography>
      {!course.certificate_enabled ? (
        <Alert severity="info">Certificates not enabled for this course</Alert>
      ) : (
        <>
          <Button onClick={handleBatchMint}>Mint All Eligible</Button>
          <CertificateTable students={students} onMint={handleMint} minting={minting} />
        </>
      )}
    </Box>
  );
};
```

#### Certificate Status Table

```jsx
// ManageClass/components/CertificateTable.jsx
const columns = [
  { field: 'name', header: 'Student' },
  { field: 'completedAt', header: 'Completed' },
  { field: 'status', header: 'Certificate Status' },
  { field: 'actions', header: 'Actions' }
];

// Status badge component
const StatusBadge = ({ status }) => {
  const colors = {
    eligible: 'info',
    minting: 'warning',
    minted: 'success',
    failed: 'error'
  };
  return <Chip label={status} color={colors[status]} size="small" />;
};
```

## Expected Tests

### Unit Tests (PHPUnit)

```php
// tests/Feature/CertificateControllerTest.php
- test_teacher_can_get_certificate_eligible_students()
- test_teacher_can_mint_certificate_for_student()
- test_batch_mint_creates_certificates_for_all_students()
- test_non_teacher_cannot_mint_certificates()
- test_cannot_mint_for_non_completed_student()

// tests/Unit/CertificateServiceTest.php
- test_mints_certificate_with_correct_metadata()
- test_updates_student_certificate_status()
```

### Frontend Tests

```javascript
// CertificateTable.test.jsx
- renders student list with correct statuses
- mint button calls API with correct student ID
- batch mint selects all eligible students
- shows loading state during minting
- displays error on mint failure
```

### Manual Testing Checklist

- [ ] Create course application with certificate enabled
- [ ] Verify certificate toggle saved correctly
- [ ] Navigate to ManageClass > Certificates tab
- [ ] View list of completed students
- [ ] Click "Mint" for individual student
- [ ] Verify minting status updates
- [ ] Verify txHash displayed after successful mint
- [ ] Click explorer link, verify transaction exists
- [ ] Test batch mint with multiple students
- [ ] Test error handling (simulate failure)

## Dependencies

None - can be developed independently, but testing requires:
- A course with completed students
- Valid web3 configuration (Blockfrost API key, wallet keys)

## Environment Variables

Verify these exist:

```
BLOCKFROST_API_KEY=preprod_xxx
NETWORK=preprod
ROOT_KEY=xxx
OWNER_PKH=xxx
```

## Estimated Scope

- Backend: ~3 files (verify existing, add endpoints)
- Frontend: ~4 files (2 new pages, 1 new component)
- Database: 1-2 migrations
- Tests: ~3 test files
