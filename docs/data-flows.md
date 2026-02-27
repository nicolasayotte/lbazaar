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

## Flow 6: Credit Card Course Purchase (Stripe)

**Trigger**: Student clicks "Pay with Credit Card" on course details page.

### Step-by-Step Flow

```
1. Student clicks "Pay with Credit Card" button
        ↓
2. POST /api/stripe/payment-intent/{course} via axios
        ↓
3. StripeController::createPaymentIntent()
   ├─ Validates via StripeCheckoutRequest
   │  ├─ User is not professor
   │  ├─ User not already enrolled
   │  └─ Course exists and is available
   │
   └─ Calls StripeService::createPaymentIntent($course, $user)
      ├─ Calculates amount (¥1000 = 1000, no multiplication for JPY)
      ├─ Creates Stripe PaymentIntent
      │
      └─ Stripe API: PaymentIntent::create([
            'amount' => $course->price_jpy,
            'currency' => 'jpy',
            'metadata' => ['course_id' => ..., 'user_id' => ...]
         ])
         │
      ├─ Records pending payment in stripe_payments table
      │  ├─ payment_intent_id
      │  ├─ amount, currency
      │  ├─ status: 'pending'
      │
      └─ Returns: {
            "success": true,
            "data": {
              "client_secret": "pi_xxx_secret_xxx",
              "amount": 1000,
              "currency": "jpy"
            }
         }
         │
         ▼
4. Frontend receives client_secret
   ├─ Opens Dialog with StripeCheckout component
   └─ Renders Stripe Elements (CardElement)
        │
        ▼
5. Student enters card details
   ├─ Card number: 4242 4242 4242 4242
   ├─ Expiry: 12/34
   └─ CVC: 123
        │
        ▼
6. Student clicks "Pay" button
        ↓
7. Stripe.js: stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `/checkout/success?course_id=${courseId}`
      }
   })
   ├─ Stripe handles 3D Secure if required
   ├─ Processes payment
   └─ Redirects to return_url with payment_intent param
        │
        ▼
8. Stripe webhook: POST /api/stripe/webhook
   Event: payment_intent.succeeded
        ↓
9. StripeService::handleWebhook()
   ├─ Verifies signature: Webhook::constructEvent()
   │
   └─ Calls handlePaymentSuccess($paymentIntent)
      │
      └─ DB::transaction(function() {
            ├─ Finds stripe_payments record (lockForUpdate)
            ├─ Checks if already processed (idempotency)
            │
            ├─ Creates CourseHistory enrollment
            │  ├─ user_id, course_id
            │  └─ enrolled_at: now()
            │
            ├─ Updates stripe_payments
            │  ├─ status: 'succeeded'
            │  └─ processed_at: now()
            │
            └─ Commits transaction
         })
         │
         ▼
10. Stripe redirects to /checkout/success?course_id=123&payment_intent=pi_xxx
        ↓
11. CheckoutController::success()
    ├─ Finds course and payment details
    │
    └─ Inertia::render('Checkout/Success', [
          'course' => $course,
          'payment' => $payment,
          'enrollment' => $enrollment
       ])
       │
       ▼
12. React renders success page with enrollment confirmation
```

### Code Locations

| Step | File | Method/Line Range |
|------|------|------------------|
| Create PaymentIntent | `app/Http/Controllers/API/StripeController.php` | createPaymentIntent() |
| Payment service | `app/Services/API/StripeService.php` | createPaymentIntent() |
| Webhook handler | `app/Services/API/StripeService.php` | handleWebhook() |
| Payment success | `app/Services/API/StripeService.php` | handlePaymentSuccess() |
| Frontend component | `resources/js/components/payments/StripeCheckout.jsx` | Full file |
| Success page | `app/Http/Controllers/CheckoutController.php` | success() |

### Request Format

**Create PaymentIntent**:
```http
POST /api/stripe/payment-intent/123
Authorization: Bearer {sanctum_token}
Content-Type: application/json
```

**Webhook**:
```http
POST /api/stripe/webhook
Stripe-Signature: t=1234,v1=abc...
Content-Type: application/json

{
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_xxx",
      "amount": 1000,
      "currency": "jpy",
      "status": "succeeded",
      "metadata": {
        "course_id": "123",
        "user_id": "456"
      }
    }
  }
}
```

### Response Format

**Create PaymentIntent Success**:
```json
{
  "success": true,
  "data": {
    "client_secret": "pi_xxx_secret_xxx",
    "amount": 1000,
    "currency": "jpy"
  }
}
```

**Webhook Acknowledgement**:
```json
{
  "received": true
}
```

### Error Flow

**Payment Failure**:
```
1. Card declined or error occurs
        ↓
2. Stripe sends payment_intent.payment_failed webhook
        ↓
3. StripeService::handlePaymentFailed($paymentIntent)
   ├─ Updates stripe_payments.status = 'failed'
   ├─ Records failure reason
   └─ No enrollment created
        │
        ▼
4. Frontend shows error in Stripe Elements form
   └─ User can retry with different card
```

**Validation Errors**:
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "course_id": ["You are already enrolled in this course"]
  }
}
```

### Critical Points

1. **Idempotency**:
   - `lockForUpdate()` prevents duplicate enrollments from duplicate webhooks
   - Checks `stripe_payments.status` before processing
   - Same webhook can be received multiple times (Stripe retries)

2. **Zero-Decimal Currency**:
   - JPY ¥1000 = amount 1000 (no multiplication)
   - USD $10.00 = amount 1000 (multiply by 100)
   - See [docs/integrations.md](./integrations.md) for currency handling

3. **Raw Payload Verification**:
   - Webhook signature requires raw request body
   - Uses `$request->getContent()` not `$request->all()`
   - Prevents tampering with webhook data

4. **Async Nature**:
   - Payment confirmation happens via webhook, not frontend redirect
   - Webhook may arrive before redirect completes
   - Success page queries database for enrollment status

5. **3D Secure**:
   - Handled entirely by Stripe.js
   - Additional authentication modal shown if required
   - No additional backend logic needed

## Flow 7: ADA Course Purchase (Build → Sign → Submit)

**Trigger**: Student clicks "Pay with ADA" on the course details page.

### Step-by-Step Flow

```
1. Page load
   Portal\CourseController::details() renders course page.
   Tries to add price_in_ada via ExchangeRateService.
   On failure: passes ada_available=false to Inertia (no 500).
        ↓
2. Frontend: 60-second ADA price polling
   useEffect polls GET /api/courses/{course}/ada-price every 60 seconds.
   ├─ ExchangeRateService::isAvailable() → checks cache, then tries live fetch
   ├─ available=true  → update currentAdaPrice, check drift vs page-load price
   │  └─ drift >5%   → show "ADA price has shifted >5%" caption
   └─ available=false → disable ADA button, show "ADA price temporarily unavailable"
        ↓
3. Student clicks "Pay with ADA"
   handleBuyWithAda() begins (purchaseStep: 'building')
        ↓
4. POST /portal/courses/{schedule}/purchase-transaction (build step)
   CoursePurchaseService::buildPurchaseTransaction($schedule, $user)
   ├─ Converts JPY → ADA via ExchangeRateService
   ├─ Calls web3/run/build-purchase-tx.mjs via exec()
   │  └─ Node builds unsigned CBOR transaction, returns {cborTx, teacherAmount, adminAmount}
   ├─ Caches quote: Cache::put("purchase_quote_{userId}_{scheduleId}",
   │    {adaAmount, expiresAt}, quoteWindowSeconds())   ← Gap 1
   └─ Returns {success, cborTx, adaAmount, quoteExpiresAt}
        ↓
5. Frontend receives cborTx + quoteExpiresAt
   ├─ Starts 1-second countdown timer (quoteSecondsLeft)
   │  └─ Color shifts to red below 30 seconds
   └─ If quote expires at 0: reset flow to 'idle', no action needed
        ↓
6. purchaseStep: 'signing' — wallet signs the transaction
   walletAPI.signTx(cborTx) via CIP-30
   └─ User approves in wallet extension → returns cborSig
        ↓
7. purchaseStep: 'submitting'
   POST /portal/courses/{schedule}/submit-transaction {cborSig, cborTx}
   CoursePurchaseService::submitPurchaseTransaction($schedule, $user, $cborSig, $cborTx)
   │
   ├─ Gap 1: validate quote cache
   │  └─ Cache miss → return {success:false, quoteExpired:true}
   │
   ├─ Gap 2: fast pre-check for duplicate
   │  CourseHistory::where(user+schedule, status IN [pending,confirmed])->exists()
   │  └─ exists → return {success:false, duplicate:true}
   │
   ├─ Calls web3/run/submit-purchase-tx.mjs {cborSig, cborTx}
   │  └─ Node signs + submits to Blockfrost, returns {txId}
   │
   └─ DB::transaction:
      ├─ CourseHistory::lockForUpdate() → re-check duplicate under lock   ← Gap 3
      ├─ CourseHistory::create({payment_tx_hash, payment_ada_amount, ...})
      └─ WalletTransactionHistory::create(...)
      Cache::forget("purchase_quote_{userId}_{scheduleId}")
      return {success:true, txId}
        ↓
8. Frontend shows success; timer cleared
   Redirects to purchase confirmation page
```

### Error Responses

| Flag | Meaning | Frontend action |
|------|---------|-----------------|
| `insufficientFunds: true` | Not enough ADA | Scroll to credit card button |
| `quoteExpired: true` | Cache miss — 5-min window lapsed | Toast + reset to idle |
| `duplicate: true` | Payment already pending/confirmed | Toast + no retry |

### Code Locations

| Step | File |
|------|------|
| Page render + ada_available | `app/Http/Controllers/Portal/CourseController.php` |
| ADA price polling endpoint | `app/Http/Controllers/API/CourseController.php` |
| Rate availability check | `app/Services/API/ExchangeRateService::isAvailable()` |
| Build + submit service | `app/Services/API/CoursePurchaseService.php` |
| Frontend flow | `resources/js/pages/Portal/Course/Details.jsx` |
| Wallet connector + network check | `resources/js/components/cards/WalletConnector.jsx` |

### Critical Points

1. **Network ID guard** (WalletConnector): `getNetworkId()` is checked against
   `cardano_network_id` from Inertia shared props before `enable()` returns. Mismatched
   network = rejected connection. See [gotchas.md #21](./gotchas.md).

2. **Quote window** (default 5 min, `PAYMENT_QUOTE_WINDOW_MINUTES`): The ADA amount
   is locked at build time. If the student takes longer than the window to sign, they
   must restart checkout to get a fresh rate.

3. **Three-layer duplicate guard**: pre-check `exists()` → web3 call → `lockForUpdate()`
   inside transaction. The pre-check avoids wasting a blockchain round-trip; the lock
   catches true concurrent races.

4. **Graceful ADA rate degradation**: If `ExchangeRateService` throws at page load,
   `ada_available=false` is passed to the view and the ADA button is disabled. The
   frontend polls every 60s and re-enables it if the rate recovers.

## Cross-References

- **Architecture**: See [docs/architecture.md](./architecture.md) for layer definitions
- **API Endpoints**: See [docs/api.md](./api.md) for full endpoint list
- **Patterns**: See [docs/patterns.md](./patterns.md) for code conventions
- **Testing**: See [docs/testing.md](./testing.md) for testing these flows
