# Task 005: NFT Certificate UI (Student Side)

## Overview

Create UI for students to view their earned completion certificates. This includes updating the existing Badges page to show real certificate data and enhancing the course completion flow to indicate certificate status.

## Acceptance Criteria

- [ ] Students can view all their earned certificates in profile/badges page
- [ ] Each certificate shows: course name, completion date, image, mint status
- [ ] Minted certificates have "View on Cardano Explorer" link
- [ ] Course completion page shows certificate status if enabled
- [ ] Students see notification when certificate is minted
- [ ] Pending certificates show estimated time or status
- [ ] Certificate images display correctly (IPFS or stored URL)

## Files to Modify

### Backend

| File | Changes |
|------|---------|
| `app/Http/Controllers/Portal/BadgeController.php` | Return real certificate data (or create if missing) |
| `app/Models/CourseHistory.php` | Add certificate relationship/accessors |
| `routes/web.php` | Add certificate routes if missing |

### Frontend

| File | Changes |
|------|---------|
| `resources/js/pages/Portal/MyPage/Badges/Index.jsx` | Connect to real API data, remove mock data |
| `resources/js/pages/Portal/MyPage/Badges/components/BadgesTable.jsx` | Display certificate details properly |
| `resources/js/pages/Portal/MyPage/Badges/components/CertificateCard.jsx` | NEW: Individual certificate display card |
| `resources/js/pages/Portal/CourseCompleteConfirmation.jsx` | Add certificate status section |

## Context Files (Read These First)

```
resources/js/pages/Portal/MyPage/Badges/Index.jsx           # Current badges page (has mock data)
resources/js/pages/Portal/MyPage/Badges/components/BadgesTable.jsx  # Current table component
resources/js/pages/Portal/CourseCompleteConfirmation.jsx    # Course completion page
app/Models/CourseHistory.php                                 # Student enrollment records
app/Models/Course.php                                        # Course with certificate_enabled
```

## Implementation Notes

### API Endpoint for Student Certificates

```php
// app/Http/Controllers/Portal/CertificateController.php (or BadgeController)

public function index(Request $request)
{
    $certificates = CourseHistory::where('user_id', auth()->id())
        ->where('completed', true)
        ->whereHas('course', fn($q) => $q->where('certificate_enabled', true))
        ->with(['course', 'course.professor'])
        ->get()
        ->map(fn($history) => [
            'id' => $history->id,
            'courseName' => $history->course->title,
            'professorName' => $history->course->professor->name,
            'completedAt' => $history->completed_at,
            'certificateStatus' => $history->certificate_status,
            'txHash' => $history->certificate_tx_hash,
            'imageUrl' => $history->certificate_image_url,
            'explorerUrl' => $history->certificate_tx_hash
                ? config('services.cardano.explorer_url') . '/tx/' . $history->certificate_tx_hash
                : null,
        ]);

    return Inertia::render('Portal/MyPage/Badges/Index', [
        'certificates' => $certificates
    ]);
}
```

### Badges Page Update

```jsx
// resources/js/pages/Portal/MyPage/Badges/Index.jsx
import { usePage } from '@inertiajs/react';
import CertificateCard from './components/CertificateCard';

const BadgesIndex = () => {
  const { certificates } = usePage().props;

  if (certificates.length === 0) {
    return (
      <Box textAlign="center" py={8}>
        <Typography variant="h6">No certificates yet</Typography>
        <Typography color="textSecondary">
          Complete courses with certificates enabled to earn NFT certificates
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      {certificates.map((cert) => (
        <Grid item xs={12} sm={6} md={4} key={cert.id}>
          <CertificateCard certificate={cert} />
        </Grid>
      ))}
    </Grid>
  );
};
```

### Certificate Card Component

```jsx
// resources/js/pages/Portal/MyPage/Badges/components/CertificateCard.jsx
const CertificateCard = ({ certificate }) => {
  const statusColors = {
    eligible: 'info',
    minting: 'warning',
    minted: 'success',
    failed: 'error'
  };

  return (
    <Card>
      {certificate.imageUrl && (
        <CardMedia
          component="img"
          height="200"
          image={certificate.imageUrl}
          alt={`${certificate.courseName} Certificate`}
        />
      )}
      <CardContent>
        <Typography variant="h6">{certificate.courseName}</Typography>
        <Typography variant="body2" color="textSecondary">
          Instructor: {certificate.professorName}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Completed: {formatDate(certificate.completedAt)}
        </Typography>

        <Box mt={2}>
          <Chip
            label={certificate.certificateStatus}
            color={statusColors[certificate.certificateStatus]}
            size="small"
          />
        </Box>
      </CardContent>

      {certificate.certificateStatus === 'minted' && (
        <CardActions>
          <Button
            size="small"
            href={certificate.explorerUrl}
            target="_blank"
            startIcon={<OpenInNewIcon />}
          >
            View on Cardano Explorer
          </Button>
        </CardActions>
      )}

      {certificate.certificateStatus === 'minting' && (
        <CardContent>
          <Box display="flex" alignItems="center" gap={1}>
            <CircularProgress size={16} />
            <Typography variant="caption">Minting in progress...</Typography>
          </Box>
        </CardContent>
      )}
    </Card>
  );
};
```

### Course Completion Page Update

```jsx
// resources/js/pages/Portal/CourseCompleteConfirmation.jsx
// Add section after existing completion message

{course.certificate_enabled && (
  <Box mt={4} p={3} bgcolor="background.paper" borderRadius={2}>
    <Typography variant="h6" gutterBottom>
      🎓 Completion Certificate
    </Typography>

    {certificateStatus === 'eligible' && (
      <Alert severity="info">
        Your NFT certificate will be minted by the instructor soon!
      </Alert>
    )}

    {certificateStatus === 'minting' && (
      <Alert severity="warning" icon={<CircularProgress size={20} />}>
        Your certificate is being minted on the Cardano blockchain...
      </Alert>
    )}

    {certificateStatus === 'minted' && (
      <Alert severity="success">
        Your certificate has been minted!
        <Button href={explorerUrl} target="_blank" size="small">
          View on Explorer
        </Button>
      </Alert>
    )}
  </Box>
)}
```

### Polling for Status Updates (Optional)

If you want real-time updates without page refresh:

```jsx
// Hook for polling certificate status
const useCertificateStatus = (courseHistoryId) => {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (!courseHistoryId) return;

    const poll = async () => {
      const { data } = await axios.get(`/api/certificates/${courseHistoryId}/status`);
      setStatus(data.status);

      if (data.status === 'minted' || data.status === 'failed') {
        clearInterval(interval);
      }
    };

    const interval = setInterval(poll, 10000); // Poll every 10 seconds
    poll(); // Initial fetch

    return () => clearInterval(interval);
  }, [courseHistoryId]);

  return status;
};
```

## Expected Tests

### Unit Tests (PHPUnit)

```php
// tests/Feature/StudentCertificateTest.php
- test_student_can_view_their_certificates()
- test_student_only_sees_own_certificates()
- test_certificates_include_correct_status()
- test_minted_certificates_include_explorer_url()
- test_course_completion_page_shows_certificate_status()
```

### Frontend Tests

```javascript
// CertificateCard.test.jsx
- renders certificate details correctly
- shows minted status with explorer link
- shows minting status with spinner
- shows eligible status without action

// BadgesIndex.test.jsx
- renders empty state when no certificates
- renders certificate cards for each certificate
- fetches data from correct API endpoint
```

### Manual Testing Checklist

- [ ] Navigate to Badges/Certificates page as student
- [ ] Verify real certificate data displayed (not mock)
- [ ] Complete a course with certificate enabled
- [ ] Navigate to completion confirmation page
- [ ] Verify certificate status section shows
- [ ] Have teacher mint certificate
- [ ] Refresh badges page, verify status updated to "minted"
- [ ] Click explorer link, verify transaction page opens
- [ ] Verify certificate image displays correctly

## Dependencies

- **Task 004** (NFT Certificate Teacher UI) - Teacher must be able to mint certificates first
- Database migrations from Task 004 for certificate status fields

## Environment Variables

For Cardano explorer URLs:

```
# .env
CARDANO_EXPLORER_URL=https://preprod.cardanoscan.io
# or for mainnet: https://cardanoscan.io
```

## Estimated Scope

- Backend: ~2 files
- Frontend: ~4 files (update 2, create 2)
- Tests: ~2 test files
