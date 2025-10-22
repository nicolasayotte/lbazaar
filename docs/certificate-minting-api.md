# Certificate Minting API

This API allows teachers to mint and airdrop completion certificates to students who have successfully completed their courses.

## Overview

The Certificate Minting API provides endpoints for:
1. Minting NFT certificates for students who completed courses
2. Airdropping certificates to student wallets (linked or custodial)
3. Getting course completion summaries

## Authentication

All endpoints require authentication with a teacher account. Use Sanctum token authentication:

```
Authorization: Bearer {your-api-token}
```

## Endpoints

### 1. Mint and Airdrop Certificates

**Endpoint:** `POST /api/certificates/mint-and-airdrop`

**Description:** Mints NFT certificates and airdrops them to all eligible students for a specific course.

**Parameters:**
- `course_id` (required, integer): The ID of the course
- `schedule_id` (optional, integer): Specific schedule ID (if not provided, all schedules for the course will be processed)

**Request Example:**
```json
{
    "course_id": 123,
    "schedule_id": 456
}
```

**Response Example:**
```json
{
    "success": true,
    "message": "Certificate minting completed. Success: 5, Failed: 1",
    "data": {
        "course_id": 123,
        "course_title": "Introduction to Blockchain",
        "total_eligible_students": 6,
        "success_count": 5,
        "failure_count": 1,
        "results": [
            {
                "student_id": 1,
                "student_name": "John Doe",
                "student_email": "john@example.com",
                "success": true,
                "transaction_id": "abc123...",
                "wallet_address": "addr1...",
                "message": null
            },
            {
                "student_id": 2,
                "student_name": "Jane Smith",
                "student_email": "jane@example.com",
                "success": false,
                "transaction_id": null,
                "wallet_address": "addr1...",
                "message": "Failed to mint certificate: Insufficient funds"
            }
        ]
    }
}
```

### 2. Get Course Completion Summary

**Endpoint:** `GET /api/certificates/completion-summary`

**Description:** Gets a summary of all courses taught by the authenticated teacher with eligible student counts.

**Response Example:**
```json
{
    "success": true,
    "data": [
        {
            "course_id": 123,
            "course_title": "Introduction to Blockchain",
            "schedules": [
                {
                    "schedule_id": 456,
                    "start_datetime": "2024-01-15 10:00:00",
                    "eligible_students_count": 5,
                    "eligible_students": [
                        {
                            "id": 1,
                            "name": "John Doe",
                            "email": "john@example.com"
                        }
                    ]
                }
            ]
        }
    ]
}
```

## Student Eligibility Criteria

A student is eligible for a certificate if they meet ALL of the following criteria:

1. **Course Completion**: The student has completed the course (`completed_at` is not null)
2. **Not Cancelled**: The course enrollment was not cancelled (`is_cancelled` != true)
3. **Exam Success**: The student has passed ALL required exams for the course
   - If no exams exist for the course, this requirement is automatically satisfied
   - All exams must have `is_passed` = 1

## Wallet Address Resolution

The API automatically determines where to airdrop certificates based on the student's wallet setup:

### Linked Wallet
If the student has a linked wallet (verified `stake_key_hash` in their `user_wallet` record):
- The certificate is sent to an address derived from their stake key
- This allows students to receive certificates in their personal wallets

### Custodial Wallet
If the student doesn't have a linked wallet:
- A custodial wallet address is derived using their integer user ID
- Uses the address derivation function from `web3/common/get-custodial-address.mjs`
- Address is derived from the root key using the user ID as account index

## Certificate NFT Structure

Each certificate NFT includes:

### Token Names
- **User Token**: `(222){course_title}-{student_id}|{timestamp}` - sent to student
- **Reference Token**: `(100){course_title}-{student_id}|{timestamp}` - kept by platform

### Metadata (CIP-25)
```json
{
    "name": "Certificate of Completion",
    "image": "ipfs://...",
    "course_title": "Introduction to Blockchain",
    "student_name": "John Doe",
    "teacher_name": "Prof. Smith",
    "completion_date": "2024-01-15",
    "serial_number": "1705320000"
}
```

### Additional Metadata (674)
```json
{
    "msg": [
        "Certificate of Completion",
        "Course: Introduction to Blockchain",
        "Student: John Doe", 
        "Teacher: Prof. Smith",
        "Date: 2024-01-15"
    ]
}
```

## Setup Requirements

### 1. Environment Variables
Add to your `.env` file:
```
CERTIFICATE_MPH=your_certificate_minting_policy_hash
```

### 2. Database Seeder
Run the certificate NFT seeder:
```bash
php artisan db:seed --class=CertificateNftSeeder
```

### 3. Database Migration
Run the metadata migration:
```bash
php artisan migrate
```

### 4. Web3 Scripts
Ensure the following web3 scripts are in place:
- `web3/run/build-certificate-tx.mjs`
- `web3/run/submit-certificate-tx.mjs`
- `web3/common/get-custodial-address.mjs`
- `web3/common/get-owner-utxos.mjs`

## Error Handling

The API includes comprehensive error handling:

### Common Error Responses

**403 Forbidden** - Teacher doesn't own the course:
```json
{
    "success": false,
    "message": "You do not have permission to mint certificates for this course."
}
```

**404 Not Found** - No eligible students:
```json
{
    "success": false,
    "message": "No eligible students found for certificate minting.",
    "data": {
        "course_id": 123,
        "eligible_students_count": 0
    }
}
```

**500 Internal Server Error** - Processing error:
```json
{
    "success": false,
    "message": "An error occurred while processing certificate minting: {error_details}"
}
```

## Usage Examples

### Mint certificates for all students in a course:
```bash
curl -X POST /api/certificates/mint-and-airdrop \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{"course_id": 123}'
```

### Mint certificates for a specific schedule:
```bash
curl -X POST /api/certificates/mint-and-airdrop \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{"course_id": 123, "schedule_id": 456}'
```

### Get completion summary:
```bash
curl -X GET /api/certificates/completion-summary \
  -H "Authorization: Bearer your-token"
```

## Monitoring and Logging

All certificate minting activities are logged for monitoring:
- Success/failure transactions are logged
- Web3 script outputs are logged to `storage/logs/web3.log`
- NFT transactions are recorded in the `nft_transactions` table

## Security Considerations

1. **Teacher Authorization**: Only authenticated teachers can mint certificates for their own courses
2. **Student Eligibility**: Strict validation ensures only deserving students receive certificates
3. **Transaction Verification**: All blockchain transactions are verified before marking as successful
4. **Error Logging**: Failed transactions are logged for investigation
