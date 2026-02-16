# NFT Certificate Feature - Manual Testing Checklist

## Document Information

**Feature:** NFT Certificate Minting and Management
**Version:** 1.0
**Last Updated:** 2026-02-16
**Purpose:** Comprehensive manual testing checklist for final acceptance testing of NFT certificate feature

## Prerequisites

### Environment Setup

- [ ] Application running via `sail up -d`
- [ ] Database seeded with test data
- [ ] Web3 environment configured (BLOCKFROST_API_KEY, ROOT_KEY, OWNER_PKH)
- [ ] Preprod Cardano testnet access
- [ ] At least 3 test accounts: 1 teacher, 2 students

### Database Verification Queries

```sql
-- Verify certificate_enabled fields exist
DESCRIBE course_applications;
DESCRIBE courses;

-- Verify certificate status fields exist
DESCRIBE course_histories;

-- Check for test data
SELECT COUNT(*) FROM users WHERE role = 'teacher';
SELECT COUNT(*) FROM users WHERE role = 'student';
SELECT COUNT(*) FROM courses;
```

### Test Data Requirements

- [ ] Teacher account with valid credentials
- [ ] At least 2 student accounts with completed courses
- [ ] Course with certificate_enabled = true
- [ ] At least one student with completed_at NOT NULL
- [ ] Platform wallet has sufficient ADA (minimum 10 ADA)

### Environment Variables to Verify

```bash
# Check .env file contains:
BLOCKFROST_API_KEY=preprod_xxx
NETWORK=preprod
ROOT_KEY=xxx
OWNER_PKH=xxx
CERTIFICATE_MPH=xxx
MIN_ADA=2000000
```

## Test Cases

---

### TC-001: Course Application with Certificate Toggle

**Category:** Teacher UI - Course Creation
**Priority:** Critical
**Prerequisites:** Logged in as teacher

**Test Steps:**

1. Navigate to "My Page" → "Class Applications"
2. Click "Create New Application" button
3. Fill in required course information:
   - Title: "Test Course for Certificates"
   - Category: Any
   - Description: "Testing certificate functionality"
   - Price: 50 ADA
   - Seats: 10
4. Locate "Enable completion certificate (NFT)" toggle
5. Verify toggle is OFF by default
6. Click toggle to enable certificates
7. Verify helper text appears: "Students will receive an NFT certificate when they complete this course"
8. Submit the form

**Expected Results:**

- [ ] Toggle control renders correctly with label
- [ ] Toggle defaults to OFF (unchecked)
- [ ] Helper text displays only when toggle is ON
- [ ] Form submission succeeds with certificate_enabled = true
- [ ] No console errors

**Database Verification:**

```sql
SELECT id, title, certificate_enabled
FROM course_applications
WHERE title = 'Test Course for Certificates'
ORDER BY created_at DESC
LIMIT 1;
```

Expected: `certificate_enabled = 1`

**Notes:**

---

### TC-002: Course Approval with Certificate Flag

**Category:** Admin/System - Course Approval Flow
**Priority:** Critical
**Prerequisites:** TC-001 completed

**Test Steps:**

1. Admin approves the course application (may be automatic or manual based on workflow)
2. Wait for course approval process to complete
3. Verify course record created in `courses` table

**Expected Results:**

- [ ] Course created successfully in courses table
- [ ] certificate_enabled field copied from application
- [ ] Course visible to students for enrollment

**Database Verification:**

```sql
SELECT id, title, certificate_enabled, professor_id
FROM courses
WHERE title = 'Test Course for Certificates'
ORDER BY created_at DESC
LIMIT 1;
```

Expected: `certificate_enabled = 1`

**Notes:**

---

### TC-003: Student Course Completion

**Category:** Student Journey
**Priority:** Critical
**Prerequisites:** TC-002 completed, student enrolled in course

**Test Steps:**

1. Enroll student in the certificate-enabled course
2. Complete all course requirements:
   - Attend all required schedules
   - Pass all required exams (if any)
3. Trigger course completion (may be automatic or manual)
4. Verify course_histories record updated

**Expected Results:**

- [ ] Student marked as completed in course_histories
- [ ] completed_at timestamp populated
- [ ] certificate_status initially NULL or 'pending'
- [ ] Student eligible for certificate

**Database Verification:**

```sql
SELECT ch.id, ch.user_id, ch.course_id, ch.completed_at,
       ch.certificate_status, ch.is_cancelled,
       u.first_name, u.last_name, c.title
FROM course_histories ch
JOIN users u ON ch.user_id = u.id
JOIN courses c ON ch.course_id = c.id
WHERE c.title = 'Test Course for Certificates'
  AND ch.completed_at IS NOT NULL
  AND ch.is_cancelled = 0;
```

Expected: At least one row with completed_at populated

**Notes:**

---

### TC-004: Navigate to Certificate Management Page

**Category:** Teacher UI - Navigation
**Priority:** High
**Prerequisites:** TC-003 completed, logged in as teacher

**Test Steps:**

1. Navigate to "My Page" → "Manage Classes"
2. Select the test course created in TC-001
3. Verify tabs displayed: Schedules, Exams, Feedbacks, Certificates
4. Click "Certificates" tab
5. Verify page loads without errors

**Expected Results:**

- [ ] "Certificates" tab visible in navigation
- [ ] Tab click navigates to certificates route
- [ ] Page loads without errors
- [ ] Certificate management UI renders
- [ ] No console errors

**Browser Console Check:**

- No 404 errors for routes
- No missing component errors
- Network tab shows successful API calls

**Notes:**

---

### TC-005: View Certificate-Eligible Students List

**Category:** Teacher UI - Certificate Management
**Priority:** Critical
**Prerequisites:** TC-004 completed

**Test Steps:**

1. On Certificates tab, verify student list displayed
2. Check table columns:
   - Student name
   - Completed date
   - Certificate status
   - Transaction hash
   - Actions
3. Verify completed student from TC-003 appears
4. Verify student status shows "Eligible" or "Pending"
5. Verify "Mint" button is present and enabled

**Expected Results:**

- [ ] Table renders with correct columns
- [ ] All eligible students displayed
- [ ] Student names correct
- [ ] Completed dates formatted correctly
- [ ] Status badge shows "Eligible" in blue/info color
- [ ] Transaction hash column shows "-" (empty)
- [ ] "Mint" button visible and enabled

**Database Verification:**

```sql
SELECT u.first_name, u.last_name, ch.completed_at,
       ch.certificate_status, ch.certificate_tx_hash
FROM course_histories ch
JOIN users u ON ch.user_id = u.id
WHERE ch.course_id = (
    SELECT id FROM courses WHERE title = 'Test Course for Certificates'
)
AND ch.completed_at IS NOT NULL
AND ch.is_cancelled = 0;
```

**Notes:**

---

### TC-006: Single Certificate Minting - Success Case

**Category:** Certificate Minting - Individual
**Priority:** Critical
**Prerequisites:** TC-005 completed, platform wallet has sufficient ADA

**Test Steps:**

1. Locate student with "Eligible" status
2. Click "Mint" button for that student
3. Observe UI changes:
   - Button shows loading spinner
   - Button text changes to "Minting"
   - Button disabled during process
4. Wait for minting to complete (may take 30-60 seconds)
5. Observe final state after completion

**Expected Results:**

- [ ] Mint button changes to loading state immediately
- [ ] Button disabled during minting
- [ ] No page reload occurs
- [ ] Status badge updates to "Minted" (green)
- [ ] Transaction hash appears (truncated, 8 chars + "...")
- [ ] Explorer link icon appears in Actions column
- [ ] Success message/toast displayed
- [ ] Button no longer visible (replaced with explorer link)

**Database Verification:**

```sql
SELECT user_id, certificate_status, certificate_tx_hash,
       certificate_minted_at
FROM course_histories
WHERE course_id = (SELECT id FROM courses WHERE title = 'Test Course for Certificates')
  AND certificate_status = 'minted'
ORDER BY certificate_minted_at DESC
LIMIT 1;
```

Expected:
- `certificate_status = 'minted'`
- `certificate_tx_hash` is 64-character hex string
- `certificate_minted_at` is recent timestamp

**Logs to Monitor:**

```bash
# Laravel logs
tail -f storage/logs/laravel.log

# Web3 logs
tail -f storage/logs/web3.log
```

Look for:
- Certificate minting initiated
- Transaction built successfully
- Transaction submitted
- Transaction confirmed

**Blockchain Verification:**

1. Copy transaction hash from UI
2. Visit: https://preprod.cardanoscan.io/transaction/{txHash}
3. Verify:
   - Transaction exists and confirmed
   - NFT token minted
   - Token sent to student wallet address
   - Metadata includes student name, course title

**Notes:**

---

### TC-007: View Minted Certificate on Cardano Explorer

**Category:** Certificate Verification
**Priority:** High
**Prerequisites:** TC-006 completed

**Test Steps:**

1. Locate student with "Minted" status in table
2. Click transaction hash link in Transaction column
3. Verify new browser tab opens
4. Alternatively, click explorer icon in Actions column

**Expected Results:**

- [ ] Link opens Cardano preprod explorer
- [ ] Transaction page loads successfully
- [ ] Transaction shows as confirmed
- [ ] NFT metadata visible
- [ ] Student name matches in metadata
- [ ] Course title matches in metadata
- [ ] Completion date present in metadata

**Explorer Details to Verify:**

```
Transaction Status: Confirmed
NFT Policy ID: Matches CERTIFICATE_MPH from .env
Token Name Pattern: (222){course_title}-{student_id}|{timestamp}
Metadata Fields:
  - name: "Certificate of Completion"
  - course_title: "Test Course for Certificates"
  - student_name: {student first + last name}
  - teacher_name: {teacher first + last name}
  - completion_date: {YYYY-MM-DD}
```

**Notes:**

---

### TC-008: Batch Certificate Minting

**Category:** Certificate Minting - Batch
**Priority:** High
**Prerequisites:** Multiple students completed (TC-003 done for 2+ students)

**Test Steps:**

1. Ensure at least 2 students have "Eligible" status
2. Locate "Mint All Eligible" or batch mint button
3. Click batch mint button
4. Observe batch minting process:
   - Progress indicator shows
   - Each student status updates sequentially
5. Wait for all students to complete

**Expected Results:**

- [ ] Batch mint button visible when 2+ eligible students
- [ ] Confirmation dialog appears (if implemented)
- [ ] Progress indicator shows during batch operation
- [ ] Each student's status updates independently
- [ ] All students transition from "Eligible" to "Minted"
- [ ] Transaction hashes populated for all
- [ ] Summary message shows: "X successful, Y failed"
- [ ] No full page reload

**Database Verification:**

```sql
SELECT COUNT(*) as minted_count
FROM course_histories
WHERE course_id = (SELECT id FROM courses WHERE title = 'Test Course for Certificates')
  AND certificate_status = 'minted'
  AND certificate_minted_at > NOW() - INTERVAL 5 MINUTE;
```

Expected: `minted_count >= 2`

**API Call Verification:**

Check Network tab in browser DevTools:
- POST request to `/api/certificates/mint-and-airdrop`
- Request body contains `course_id`
- Response shows success_count and failure_count

**Notes:**

---

### TC-009: Certificate Minting Failure - Insufficient Funds

**Category:** Error Handling
**Priority:** High
**Prerequisites:** Platform wallet ADA balance < 3 ADA

**Test Steps:**

1. Ensure platform wallet has insufficient ADA (< 3 ADA)
2. Attempt to mint certificate for eligible student
3. Observe error handling

**Expected Results:**

- [ ] Minting process starts normally
- [ ] After timeout/failure, status changes to "Failed" (red badge)
- [ ] Error message displayed to user
- [ ] Retry button appears in Actions column
- [ ] No partial transaction created
- [ ] Student status remains "eligible" or marked "failed"

**Database Verification:**

```sql
SELECT user_id, certificate_status, certificate_tx_hash
FROM course_histories
WHERE course_id = (SELECT id FROM courses WHERE title = 'Test Course for Certificates')
  AND user_id = {failed_student_id};
```

Expected: `certificate_status = 'failed'` OR remains unchanged

**Error Logs to Check:**

```bash
tail -f storage/logs/laravel.log | grep -i "certificate"
tail -f storage/logs/web3.log | grep -i "error"
```

Look for: "Insufficient funds" or similar error message

**Notes:**

---

### TC-010: Certificate Retry After Failure

**Category:** Error Handling - Recovery
**Priority:** High
**Prerequisites:** TC-009 completed (student in "Failed" state)

**Test Steps:**

1. Ensure platform wallet funded with sufficient ADA (> 5 ADA)
2. Locate student with "Failed" status
3. Click "Retry" button (circular arrow icon)
4. Observe retry process
5. Verify successful completion

**Expected Results:**

- [ ] Retry button visible for failed certificates
- [ ] Retry button triggers new minting attempt
- [ ] Status transitions: Failed → Minting → Minted
- [ ] Transaction hash populated after success
- [ ] Retry button replaced with explorer link
- [ ] Success message displayed

**Database Verification:**

```sql
SELECT user_id, certificate_status, certificate_tx_hash,
       certificate_minted_at
FROM course_histories
WHERE user_id = {failed_student_id}
  AND certificate_status = 'minted';
```

Expected: Status updated to 'minted' with valid tx_hash

**Notes:**

---

### TC-011: Authorization - Non-Owner Teacher Cannot Mint

**Category:** Security - Authorization
**Priority:** Critical
**Prerequisites:** 2 teacher accounts, course owned by Teacher A

**Test Steps:**

1. Login as Teacher B (not course owner)
2. Attempt to access Certificate management page for Teacher A's course:
   - Direct URL navigation
   - API call interception (DevTools Network tab)
3. Verify access denied

**Expected Results:**

- [ ] 403 Forbidden response from API
- [ ] Error message: "You do not have permission to mint certificates for this course"
- [ ] No certificate data displayed
- [ ] Redirect to authorized page or error page
- [ ] No console errors exposing sensitive data

**API Test:**

```bash
# Using curl with Teacher B's token
curl -X POST https://lbazaar.test/api/certificates/mint-and-airdrop \
  -H "Authorization: Bearer {teacher_b_token}" \
  -H "Content-Type: application/json" \
  -d '{"course_id": {teacher_a_course_id}}'
```

Expected Response:
```json
{
  "success": false,
  "message": "You do not have permission to mint certificates for this course."
}
```

**Notes:**

---

### TC-012: Authorization - Student Cannot Access Certificate Management

**Category:** Security - Authorization
**Priority:** Critical
**Prerequisites:** Student account logged in

**Test Steps:**

1. Login as student
2. Navigate to course page
3. Attempt to access certificate management URL directly:
   - `/mypage/manage-class/{course_id}/certificates`
4. Attempt API call via DevTools console

**Expected Results:**

- [ ] Certificate management page not accessible
- [ ] 403 Forbidden or redirect to unauthorized page
- [ ] No "Certificates" tab visible for students
- [ ] API returns authorization error
- [ ] No sensitive certificate data exposed

**Browser Console Test:**

```javascript
// Try to call API as student
fetch('/api/certificates/mint-and-airdrop', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
  },
  body: JSON.stringify({ course_id: 1 })
})
.then(r => r.json())
.then(console.log);
```

Expected: 403 error or authentication failure

**Notes:**

---

### TC-013: Certificate Toggle - Disabled Courses Show No Certificates Tab

**Category:** Conditional UI Display
**Priority:** Medium
**Prerequisites:** Course with certificate_enabled = false

**Test Steps:**

1. Create or use existing course WITHOUT certificate enabled
2. Ensure students have completed this course
3. Login as teacher (course owner)
4. Navigate to "Manage Class" for this course
5. Check available tabs

**Expected Results:**

- [ ] "Certificates" tab NOT visible in navigation
- [ ] Only Schedules, Exams, Feedbacks tabs shown
- [ ] No error when navigating between tabs
- [ ] Direct URL access to certificates page shows error/redirect

**Database Setup:**

```sql
UPDATE courses
SET certificate_enabled = 0
WHERE id = {test_course_id};
```

**Expected Tab List:**

- Schedules
- Exams
- Feedbacks
- ~~Certificates~~ (should be hidden)

**Notes:**

---

### TC-014: Empty State - No Eligible Students

**Category:** UI - Empty State
**Priority:** Low
**Prerequisites:** Course with certificate enabled but no completed students

**Test Steps:**

1. Create new course with certificates enabled
2. Do NOT enroll or complete any students
3. Navigate to Certificates tab as teacher
4. Observe UI display

**Expected Results:**

- [ ] Empty state component displays
- [ ] Message: "No eligible students yet" or similar
- [ ] No "Mint All" button visible
- [ ] No table headers shown
- [ ] Helpful text suggesting students need to complete course
- [ ] No errors or loading spinners

**Database Verification:**

```sql
SELECT COUNT(*)
FROM course_histories ch
WHERE ch.course_id = {new_course_id}
  AND ch.completed_at IS NOT NULL
  AND ch.is_cancelled = 0;
```

Expected: `COUNT(*) = 0`

**Notes:**

---

### TC-015: Performance - Concurrent Minting Requests

**Category:** Performance - Concurrency
**Priority:** Medium
**Prerequisites:** Multiple eligible students

**Test Steps:**

1. Have 5+ students eligible for certificates
2. Rapidly click "Mint" buttons for 3 students simultaneously
3. Observe how system handles concurrent requests
4. Verify all complete successfully

**Expected Results:**

- [ ] All minting processes start independently
- [ ] No race conditions or database locks
- [ ] Each student gets unique transaction
- [ ] All transactions complete successfully
- [ ] No duplicate certificates minted
- [ ] Status updates correctly for each student
- [ ] No server errors or timeouts

**Database Verification:**

```sql
-- Check for duplicate transaction hashes (should be 0)
SELECT certificate_tx_hash, COUNT(*) as count
FROM course_histories
WHERE certificate_tx_hash IS NOT NULL
GROUP BY certificate_tx_hash
HAVING COUNT(*) > 1;
```

Expected: No rows (each tx_hash unique)

**Server Logs:**

Monitor for:
- No database deadlock errors
- No transaction timeout errors
- Each request processed independently

**Notes:**

---

### TC-016: UI Responsiveness - Mobile View

**Category:** UI - Responsive Design
**Priority:** Medium
**Prerequisites:** Any test case completed on desktop

**Test Steps:**

1. Open browser DevTools
2. Enable device emulation (iPhone 12, Android, iPad)
3. Navigate through certificate flow:
   - Create course with toggle
   - View certificate management page
   - View certificate table
   - Click action buttons
4. Test in portrait and landscape orientations

**Expected Results:**

- [ ] Toggle switch accessible on mobile
- [ ] Helper text readable without horizontal scroll
- [ ] Certificate table scrollable horizontally (if needed)
- [ ] Student names don't overflow
- [ ] Action buttons remain clickable
- [ ] Status badges visible and readable
- [ ] Tabs navigation works on mobile
- [ ] No layout breaks or overlapping elements

**Devices to Test:**

- iPhone 12 Pro (390x844)
- Samsung Galaxy S21 (360x800)
- iPad Air (820x1180)

**Notes:**

---

### TC-017: Full User Journey - End-to-End

**Category:** Integration - Full Flow
**Priority:** Critical
**Prerequisites:** Fresh test environment

**Test Steps:**

1. **Teacher Creates Course:**
   - Login as teacher
   - Create course application with certificate enabled
   - Wait for approval

2. **Student Enrolls and Completes:**
   - Login as student
   - Enroll in course
   - Complete all requirements
   - Verify completion confirmation

3. **Teacher Mints Certificate:**
   - Login as teacher
   - Navigate to certificate management
   - Mint certificate for student
   - Verify transaction

4. **Student Views Certificate:**
   - Login as student
   - Navigate to profile/badges (if implemented)
   - Verify certificate displayed
   - Check certificate details

5. **Verify on Blockchain:**
   - Copy transaction hash
   - Check on Cardano explorer
   - Verify NFT metadata

**Expected Results:**

- [ ] All steps complete without errors
- [ ] Data consistent across all stages
- [ ] Certificate visible to both teacher and student
- [ ] Blockchain transaction confirmed
- [ ] No orphaned records in database
- [ ] All logs clean (no warnings/errors)

**Complete Data Flow Verification:**

```sql
-- Full journey query
SELECT
    u.id as student_id,
    u.first_name,
    u.last_name,
    c.id as course_id,
    c.title as course_title,
    c.certificate_enabled,
    ch.completed_at,
    ch.certificate_status,
    ch.certificate_tx_hash,
    ch.certificate_minted_at
FROM users u
JOIN course_histories ch ON u.id = ch.user_id
JOIN courses c ON ch.course_id = c.id
WHERE c.title = 'Test Course for Certificates'
ORDER BY ch.certificate_minted_at DESC;
```

**Complete Journey Timeline:**

1. T+0min: Course created (certificate_enabled = 1)
2. T+10min: Student completed course
3. T+15min: Teacher mints certificate
4. T+16min: Transaction confirmed on blockchain
5. T+17min: Student sees certificate in profile

**Notes:**

---

## Database Queries for Testing

### Check Certificate-Enabled Courses

```sql
SELECT id, title, professor_id, certificate_enabled, created_at
FROM courses
WHERE certificate_enabled = 1
ORDER BY created_at DESC;
```

### Check Eligible Students for Certificate

```sql
SELECT
    u.id,
    CONCAT(u.first_name, ' ', u.last_name) as student_name,
    c.title as course_title,
    ch.completed_at,
    ch.certificate_status,
    ch.certificate_tx_hash
FROM course_histories ch
JOIN users u ON ch.user_id = u.id
JOIN courses c ON ch.course_id = c.id
WHERE c.certificate_enabled = 1
  AND ch.completed_at IS NOT NULL
  AND ch.is_cancelled = 0
ORDER BY ch.completed_at DESC;
```

### Check Recent Certificate Minting Activity

```sql
SELECT
    ch.id,
    u.first_name,
    u.last_name,
    c.title,
    ch.certificate_status,
    ch.certificate_minted_at,
    SUBSTRING(ch.certificate_tx_hash, 1, 16) as tx_hash_preview
FROM course_histories ch
JOIN users u ON ch.user_id = u.id
JOIN courses c ON ch.course_id = c.id
WHERE ch.certificate_minted_at IS NOT NULL
ORDER BY ch.certificate_minted_at DESC
LIMIT 20;
```

### Check Failed Certificate Attempts

```sql
SELECT
    ch.id,
    u.first_name,
    u.last_name,
    c.title,
    ch.certificate_status,
    ch.updated_at
FROM course_histories ch
JOIN users u ON ch.user_id = u.id
JOIN courses c ON ch.course_id = c.id
WHERE ch.certificate_status = 'failed'
ORDER BY ch.updated_at DESC;
```

### Verify NFT Transaction Records

```sql
-- Check nft_transactions table if it exists
SELECT *
FROM nft_transactions
WHERE transaction_type = 'certificate'
ORDER BY created_at DESC
LIMIT 20;
```

## Logs to Monitor

### Laravel Application Logs

```bash
# Real-time monitoring
tail -f storage/logs/laravel.log

# Search for certificate-related entries
grep -i "certificate" storage/logs/laravel.log | tail -20

# Check for errors
grep -i "error" storage/logs/laravel.log | grep -i "certificate"
```

### Web3 Script Logs

```bash
# Real-time monitoring
tail -f storage/logs/web3.log

# Search for minting activity
grep -i "mint" storage/logs/web3.log | tail -20

# Check for transaction failures
grep -i "failed\|error" storage/logs/web3.log | tail -20
```

### Important Log Patterns to Look For

**Success Pattern:**

```
[timestamp] Certificate minting initiated for student_id: 123, course_id: 456
[timestamp] Transaction built successfully
[timestamp] Transaction submitted: tx_hash_here
[timestamp] Certificate status updated: minted
```

**Failure Pattern:**

```
[timestamp] Certificate minting failed for student_id: 123
[timestamp] Error: Insufficient funds in owner wallet
[timestamp] Certificate status updated: failed
```

## Test Summary Table

| Test Case | Category | Priority | Status | Notes |
|-----------|----------|----------|--------|-------|
| TC-001 | Teacher UI | Critical | [ ] | Certificate toggle in course creation |
| TC-002 | System | Critical | [ ] | Course approval flow |
| TC-003 | Student Journey | Critical | [ ] | Student course completion |
| TC-004 | Teacher UI | High | [ ] | Navigate to certificates page |
| TC-005 | Teacher UI | Critical | [ ] | View eligible students list |
| TC-006 | Minting | Critical | [ ] | Single certificate mint success |
| TC-007 | Verification | High | [ ] | View on blockchain explorer |
| TC-008 | Minting | High | [ ] | Batch certificate minting |
| TC-009 | Error Handling | High | [ ] | Minting failure handling |
| TC-010 | Error Recovery | High | [ ] | Retry after failure |
| TC-011 | Security | Critical | [ ] | Authorization - non-owner |
| TC-012 | Security | Critical | [ ] | Authorization - student |
| TC-013 | UI | Medium | [ ] | Disabled course - no tab |
| TC-014 | UI | Low | [ ] | Empty state display |
| TC-015 | Performance | Medium | [ ] | Concurrent minting |
| TC-016 | UI | Medium | [ ] | Mobile responsiveness |
| TC-017 | Integration | Critical | [ ] | Full end-to-end journey |

## Quality Gates

### Must Pass (Critical Priority)

All test cases marked "Critical" must pass before feature can be considered production-ready:

- [ ] TC-001: Certificate toggle works correctly
- [ ] TC-002: Course approval preserves certificate flag
- [ ] TC-003: Student completion tracked properly
- [ ] TC-005: Eligible students list displays correctly
- [ ] TC-006: Single certificate minting succeeds
- [ ] TC-011: Authorization prevents unauthorized minting
- [ ] TC-012: Students cannot access teacher functions
- [ ] TC-017: Full end-to-end journey completes

### Should Pass (High Priority)

These should pass but may have workarounds:

- [ ] TC-004: Navigation to certificates page
- [ ] TC-007: Explorer link verification
- [ ] TC-008: Batch minting functionality
- [ ] TC-009: Failure handling
- [ ] TC-010: Retry mechanism

### Nice to Have (Medium/Low Priority)

Enhancement features, can be addressed post-launch:

- [ ] TC-013: Conditional tab display
- [ ] TC-014: Empty state UX
- [ ] TC-015: Performance under load
- [ ] TC-016: Mobile responsive design

## Known Issues and Workarounds

### Issue: Transaction Confirmation Delay

**Description:** Blockchain transactions may take 30-90 seconds to confirm
**Workaround:** Implement polling or websocket for real-time status updates
**Tracking:** N/A

### Issue: Rate Limiting on Blockfrost API

**Description:** Rapid successive minting may hit API rate limits
**Workaround:** Implement exponential backoff, batch requests more efficiently
**Tracking:** N/A

## Testing Environment Details

**Recommended Test Environment:**

- **Backend:** Laravel 9, PHP 8.2
- **Frontend:** React 18, Inertia.js
- **Database:** MySQL 8.0
- **Blockchain:** Cardano Preprod Testnet
- **Browser:** Chrome 120+ or Firefox 120+

**Test Data Cleanup:**

After testing, clean up test data:

```sql
-- DO NOT RUN ON PRODUCTION
DELETE FROM course_histories WHERE certificate_tx_hash LIKE 'test%';
DELETE FROM courses WHERE title LIKE 'Test Course%';
DELETE FROM users WHERE email LIKE 'test%';
```

## Sign-Off

**Tester Name:** ___________________________
**Date:** ___________________________
**Environment:** ___________________________
**Overall Result:** [ ] Pass [ ] Fail [ ] Pass with Issues

**Critical Issues Found:**

1. ___________________________
2. ___________________________
3. ___________________________

**Recommendations:**

- ___________________________
- ___________________________
- ___________________________

**Approved for Production:** [ ] Yes [ ] No
**Approver Name:** ___________________________
**Approver Signature:** ___________________________
**Date:** ___________________________

---

**Document End**
