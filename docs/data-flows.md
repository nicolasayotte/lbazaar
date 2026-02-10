# Data Flows

> **AI Context Summary**: Critical data flows: (1) Certificate minting: Controller → CertificateService → PHP exec() → Node build-tx → submit-tx → Blockfrost → record DB. (2) Wallet connection: React CIP-30 → POST /api/user-wallet → wallet-verify.mjs → save to user_wallets. (3) Auth: Inertia form → AuthController → Auth::attempt() → session + Inertia render. All service responses: `['success' => bool, 'message' => string, 'data' => array]`.

## Overview

This document traces complete request-response flows through Le Bazaar's three-tier architecture for critical user journeys.

## Flow 1: Certificate Minting (Multi-Layer)

**Trigger**: Teacher clicks "Mint Certificates" button after course completion.

### Step-by-Step Flow

```
1. Student completes course
        ↓
2. Teacher clicks "Mint Certificates" (React UI)
        ↓
3. POST /api/certificates/mint
        ↓
4. CertificateController::mintAndAirdropCertificates()
   ├─ Validates: teacher owns course, student completed
   ├─ Gets eligible students (completed + passed exams)
   │
   └─ Calls CertificateService::mintAndAirdropCertificate()
      ├─ Determines wallet: linked wallet OR custodial
      ├─ Creates metadata: student name, course, date, serial
      │
      └─ Calls mintCertificateNFT()
         ├─ Builds command: web3/run/build-certificate-tx.mjs
         ├─ exec() Node script with escaped args
         │
         └─ Node Script (build-certificate-tx.mjs):
            ├─ Compiles Helios minting policy
            ├─ Fetches owner UTXOs (Blockfrost)
            ├─ Builds transaction with Helios
            ├─ Returns: {"status": 200, "cborTx": "..."}
            │
         ├─ PHP receives cborTx
         ├─ Calls web3/run/submit-certificate-tx.mjs
         │
         └─ Node Script (submit-certificate-tx.mjs):
            ├─ Signs transaction with ROOT_KEY
            ├─ Submits to Blockfrost
            ├─ Returns: {"status": 200, "txId": "..."}
            │
         ├─ PHP receives txId
         ├─ Records in nft_transactions table
         ├─ Sends email notification (optional)
         │
         └─ Returns: {
               "success": true,
               "transaction_id": "...",
               "wallet_address": "..."
            }
            │
            ▼
5. Controller returns JSON response to frontend
            │
            ▼
6. React UI shows success message + Cardano Explorer link
```

### Code Locations

| Step | File | Line Range |
|------|------|-----------|
| Controller entry | `app/Http/Controllers/API/CertificateController.php` | 36-153 |
| Service orchestration | `app/Services/API/CertificateService.php` | 25-221 |
| Build transaction | `web3/run/build-certificate-tx.mjs` | 29-187 |
| Submit transaction | `web3/run/submit-certificate-tx.mjs` | 1-50 |

### Request Format

```http
POST /api/certificates/mint
Authorization: Bearer {sanctum_token}
Content-Type: application/json

{
  "course_id": 123,
  "schedule_id": 456  // Optional
}
```

### Response Format

**Success**:
```json
{
  "success": true,
  "message": "Certificates minted successfully",
  "data": {
    "minted_count": 15,
    "failed_count": 0,
    "transactions": [
      {
        "student_id": 789,
        "student_name": "John Doe",
        "transaction_id": "a1b2c3...",
        "wallet_address": "addr1..."
      }
    ]
  }
}
```

**Error**:
```json
{
  "success": false,
  "message": "Insufficient ADA in owner wallet",
  "data": {
    "required_ada": 100000000,
    "available_ada": 50000000
  }
}
```

### Critical Points

1. **Wallet Determination** (CertificateService:28-30):
   - If student has linked wallet (user_wallets.address), use it
   - Otherwise, derive custodial wallet from student ID

2. **Transaction Signing** (submit-certificate-tx.mjs):
   - Uses ROOT_KEY from environment
   - Signs locally, never sends key to Blockfrost
   - Submits only CBOR-encoded transaction

3. **Database Recording** (CertificateService:46):
   - Transaction saved to `nft_transactions` table
   - Status: 'pending' → 'confirmed' (after blockchain confirmation)

4. **Error Handling**:
   - Web3 script errors bubble up as JSON: `{status: 500, error: "..."}`
   - Service catches and converts to standard response format
   - Frontend displays user-friendly error message

## Flow 2: User Authentication (Inertia SSR)

**Trigger**: User visits login page and submits credentials.

### Step-by-Step Flow

```
1. User visits /portal/login
        ↓
2. Laravel routes to Portal\AuthPortalController::index()
        ↓
3. Inertia::render('Portal/Login', ['errors' => ...])
        ↓
4. React renders Portal/Login.jsx with MUI components
        ↓
5. User submits form
        ↓
6. Inertia.post('/portal/login', {email, password})
        ↓
7. AuthPortalController::login(AuthPortalRequest $request)
   ├─ Validates credentials (Form Request)
   ├─ Checks Auth::attempt($credentials)
   ├─ Regenerates session
   │
   └─ Redirect to Portal\TopPageController::index()
      │
      └─ Inertia::render('Portal/TopPage', [
            'auth' => $user,
            'courses' => $userCourses,
            'translatables' => $translations
         ])
         │
         ▼
8. React renders Portal/TopPage.jsx with user data
```

### Code Locations

| Step | File | Line Range |
|------|------|-----------|
| Login page render | `app/Http/Controllers/Portal/AuthPortalController.php` | index() method |
| Login handler | `app/Http/Controllers/Portal/AuthPortalController.php` | login() method |
| Form validation | `app/Http/Requests/AuthPortalRequest.php` | rules() method |
| React login page | `resources/js/pages/Portal/Login.jsx` | Full file |

### Request Format

```javascript
// React component
Inertia.post('/portal/login', {
    email: 'student@example.com',
    password: 'password123',
    remember: true
});
```

### Response Format

**Success**: HTTP 302 redirect to `/portal/top` with session cookie

**Error**: HTTP 302 back to `/portal/login` with errors in session
```javascript
// Inertia automatically provides errors prop
const Login = ({ errors }) => {
    // errors.email or errors.password
};
```

### Critical Points

1. **No API Token** (for portal):
   - Portal uses Laravel sessions, not Sanctum tokens
   - API endpoints use Sanctum tokens

2. **Inertia Form Handling**:
   - Uses `Inertia.post()`, not axios or fetch
   - Maintains SPA behavior with server-side validation
   - Errors automatically available in props

3. **Session Regeneration**:
   - `Auth::attempt()` automatically regenerates session
   - Prevents session fixation attacks

## Flow 3: Wallet Connection (Web3 + Database)

**Trigger**: User clicks "Connect Wallet" button in portal.

### Step-by-Step Flow

```
1. User clicks "Connect Wallet" (React)
        ↓
2. WalletConnector component (CIP-30 API)
   ├─ Calls window.cardano.eternl.enable()
   ├─ Gets stake key hash from wallet
   │
   └─ POST /api/user-wallet
      {
        "stake_key_hash": "stake1...",
        "wallet_name": "eternl"
      }
      │
      ▼
3. UserWalletController::store()
   ├─ Validates stake key format (Form Request)
   │
   └─ Calls web3/run/wallet-verify.mjs
      ├─ Node script validates address format
      ├─ Queries Blockfrost for wallet UTXOs
      ├─ Returns: {"status": 200, "valid": true, "balance": 50000000}
      │
   ├─ Updates/creates user_wallets record
   │  ├─ stake_key_hash
   │  ├─ address (payment address)
   │  └─ wallet_name
   │
   └─ Returns: {
         "success": true,
         "wallet": {
           "address": "addr1...",
           "stake_key_hash": "stake1...",
           "balance_ada": 50.0
         }
       }
       │
       ▼
4. React updates Redux store with wallet data
        ↓
5. React queries /api/user-wallet/points for point balance
        ↓
6. UI displays connected wallet with ADA and point balance
```

### Code Locations

| Step | File | Line Range |
|------|------|-----------|
| Wallet connector | `resources/js/components/WalletConnector.jsx` | Full file |
| Store wallet | `app/Http/Controllers/API/UserWalletController.php` | store() method |
| Verify wallet | `web3/run/wallet-verify.mjs` | Full file |
| Redux slice | `resources/js/store/walletSlice.js` | Full file |

### Request Format

```http
POST /api/user-wallet
Authorization: Bearer {sanctum_token}
Content-Type: application/json

{
  "stake_key_hash": "stake1u...",
  "wallet_name": "eternl"
}
```

### Response Format

**Success**:
```json
{
  "success": true,
  "wallet": {
    "address": "addr1qx...",
    "stake_key_hash": "stake1u...",
    "wallet_name": "eternl",
    "balance_ada": 50.0,
    "points": 1000
  }
}
```

**Error**:
```json
{
  "success": false,
  "message": "Invalid stake key format",
  "errors": {
    "stake_key_hash": ["The stake key must start with 'stake1'"]
  }
}
```

### Critical Points

1. **CIP-30 Standard**:
   - Browser extension wallets expose `window.cardano.{walletName}`
   - Call `.enable()` to get wallet API
   - Extract stake key using `.getRewardAddresses()`

2. **Blockfrost Verification**:
   - Validates stake key exists on blockchain
   - Fetches current ADA balance
   - Returns UTXOs for transaction building

3. **Database Storage**:
   - One-to-one relationship: `users.id` → `user_wallets.user_id`
   - Stores both payment address and stake key
   - Wallet name for UI display only

## Flow 4: Course Enrollment (Service Layer)

**Trigger**: Student clicks "Enroll" button on course page.

### Step-by-Step Flow

```
1. Student clicks "Enroll" button
        ↓
2. POST /api/courses/{id}/enroll
        ↓
3. CourseController::enroll(EnrollmentRequest $request)
   ├─ Validates course exists and has capacity
   │
   └─ Calls CourseService::enrollStudent($course, $student)
      ├─ Checks if already enrolled
      ├─ Checks if course is full
      │
      └─ DB::transaction(function() {
            ├─ Lock user wallet for update
            ├─ Verify sufficient points
            ├─ Deduct course cost from points
            ├─ Create course_histories record
            └─ Commit transaction
         })
         │
      ├─ EmailService::sendEnrollmentConfirmation()
      │
      └─ Returns: {
            "success": true,
            "message": "Enrollment successful",
            "data": {
              "enrollment_id": 123,
              "remaining_points": 500
            }
         }
         │
         ▼
4. Controller returns JSON response
        ↓
5. React updates UI: enrolled status + remaining points
```

### Code Locations

| Step | File | Notes |
|------|------|-------|
| Enrollment service | `app/Services/API/CourseService.php` | enrollStudent() method |
| Transaction lock | Service method | Uses `lockForUpdate()` to prevent race conditions |
| Email notification | `app/Services/API/EmailService.php` | sendEnrollmentConfirmation() |

### Critical Points

1. **Race Condition Prevention**:
   - `lockForUpdate()` on user_wallets row
   - Prevents concurrent enrollments from exceeding balance

2. **Atomicity**:
   - Entire enrollment wrapped in `DB::transaction()`
   - If any step fails, all changes rolled back

3. **Point Management**:
   - Points deducted immediately upon enrollment
   - No refund mechanism (business rule)

## Flow 5: API Authentication (Sanctum)

**Trigger**: External client makes API request.

### Step-by-Step Flow

```
1. Client obtains token:
   POST /api/auth/login
   {
     "email": "user@example.com",
     "password": "password"
   }
        ↓
2. AuthController::login()
   ├─ Validates credentials
   ├─ Creates Sanctum token
   └─ Returns: {"token": "1|abc123..."}
        │
        ▼
3. Client stores token securely

4. Client makes authenticated request:
   GET /api/courses
   Authorization: Bearer 1|abc123...
        ↓
5. Sanctum middleware validates token
   ├─ Queries personal_access_tokens table
   ├─ Checks expiration
   ├─ Loads associated user
   └─ Sets Auth::user()
        │
        ▼
6. Controller executes with authenticated user
        ↓
7. Response returned to client
```

### Request Format

```http
GET /api/courses
Authorization: Bearer 1|abc123...
Accept: application/json
```

### Response Format

**Success**:
```json
{
  "success": true,
  "data": {
    "courses": [...]
  }
}
```

**Unauthorized** (401):
```json
{
  "message": "Unauthenticated."
}
```

### Critical Points

1. **Token Storage**:
   - Stored in `personal_access_tokens` table
   - Tied to user via `tokenable_id`
   - Can be revoked: `$user->tokens()->delete()`

2. **Middleware**:
   - `auth:sanctum` on API routes
   - Automatically validates and loads user

3. **Token Abilities** (not used in Le Bazaar):
   - Sanctum supports scoped abilities
   - Current implementation uses roles instead

## Common Response Patterns

### Service Layer Response

All service methods return this structure:

```php
[
    'success' => true,  // or false
    'message' => 'Human-readable message',
    'data' => [
        // Optional additional data
    ]
]
```

### Controller JSON Response

Controllers convert service responses to JSON:

```php
$result = $this->service->someMethod();
return response()->json($result, $result['success'] ? 200 : 400);
```

### Web3 Script Output

All Node.js scripts output JSON to stdout:

```javascript
// Success
process.stdout.write(JSON.stringify({
    status: 200,
    data: { txId: '...', cborTx: '...' }
}));

// Error
process.stdout.write(JSON.stringify({
    status: 500,
    error: 'Error message'
}));
```

## Cross-References

- **Architecture**: See [docs/architecture.md](./architecture.md) for layer definitions
- **API Endpoints**: See [docs/api.md](./api.md) for full endpoint list
- **Patterns**: See [docs/patterns.md](./patterns.md) for code conventions
- **Testing**: See [docs/testing.md](./testing.md) for testing these flows
