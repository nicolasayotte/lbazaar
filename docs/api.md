# API Reference

> **AI Context Summary**: REST API at `/api/*` defined in `routes/api.php`. Two auth tiers: public endpoints (login, categories, votes, webhook) and Sanctum-protected (`auth:sanctum` header required). Standard service response: `{ "success": bool, "message": string, "data": {} }` — controllers map to HTTP 200/400. Key groups: teacher certificate endpoints (enforce `professor_id` ownership), admin certificate/refund routes (`admin/*`), token reward routes (`courses/{course}/token-reward`), and student CIP-30 self-mint (web routes under `/portal/`). Stripe and Blockfrost webhooks are CSRF-exempt. Rate limit on payment-intent: `throttle:payment-intent`.

## Base URL

```
https://{domain}/api
```

All routes defined in `routes/api.php`.

## Authentication

Send `Authorization: Bearer {token}` header. Obtain token via `POST /api/auth/login` (admin only).

See `docs/authentication.md` for full auth details.

## Endpoint Summary

| Method | Path | Auth | Controller |
|--------|------|------|-----------|
| POST | `/auth/login` | Public | `API\AuthController@authenticate` |
| GET | `/user` | `auth:sanctum` | Closure |
| POST | `/applications/teachers/create` | Public | `API\UserController@create` |
| POST | `/applications/class/create` | Public | `API\CourseApplicationController@create` |
| GET | `/certificates/completion-summary` | `auth:sanctum` | `API\CertificateController@getCourseCompletionSummary` |
| GET | `/certificates/courses/{course}/eligible-students` | `auth:sanctum` | `API\CertificateController@getEligibleStudents` |
| POST | `/certificates/courses/{course}/students/{student}/mint` | `auth:sanctum` | `API\CertificateController@mintSingleCertificate` |
| POST | `/certificates/courses/{course}/batch-mint` | `auth:sanctum` | `API\CertificateController@batchMintCertificates` |
| GET | `/certificates/courses/{course}/students/{student}/status` | `auth:sanctum` | `API\CertificateController@getCertificateStatus` |
| POST | `/certificates/mint-and-airdrop` | `auth:sanctum` | `API\CertificateController@mintAndAirdropCertificates` |
| POST | `/stripe/payment-intent/{course}` | `auth:sanctum` | `API\StripeController@createPaymentIntent` |
| POST | `/stripe/webhook` | Public (sig verified) | `API\StripeController@webhook` |
| POST | `/webhook/blockfrost/purchase` | Public (internal) | `API\CoursePaymentController@handlePurchaseWebhook` |
| GET | `/categories` | Public | Closure |
| GET | `/countries` | Public | Closure |
| POST | `/votes/register` | Public | `API\VoteController@register` |
| GET | `/courses/{course}/ada-price` | Public | `API\CourseController@getAdaPrice` |
| GET | `/cardano/network-status` | Public | `API\CardanoController@networkStatus` |
| GET | `/purchases/{txHash}/status` | `auth:sanctum` | `API\PurchaseStatusController@show` |
| POST | `/certificates/courses/{course}/estimate-fee` | `auth:sanctum` | `API\CertificateController@estimateAirdropFee` |
| PUT | `/courses/{course}/token-reward` | `auth:sanctum` | `API\TokenRewardController@updateConfig` |
| POST | `/courses/{course}/token-reward/mint` | `auth:sanctum` | `API\TokenRewardController@mintAndAirdrop` |
| POST | `/admin/refunds/stripe/{stripePaymentId}` | `auth:sanctum` | `API\AdminRefundController@refundStripe` |
| POST | `/admin/refunds/ada/{courseHistoryId}` | `auth:sanctum` | `API\AdminRefundController@refundAda` |
| POST | `/admin/certificates/courses/{course}/estimate-fee` | `auth:sanctum` | `Admin\CertificateController@estimateAirdropFee` |
| GET | `/admin/certificates/courses/{course}/eligible-students` | `auth:sanctum` | `Admin\CertificateController@getEligibleStudents` |
| POST | `/admin/certificates/courses/{course}/students/{student}/mint` | `auth:sanctum` | `Admin\CertificateController@mintSingleCertificate` |
| POST | `/admin/certificates/courses/{course}/batch-mint` | `auth:sanctum` | `Admin\CertificateController@batchMintCertificates` |
| GET | `/admin/certificates/courses/{course}/students/{student}/status` | `auth:sanctum` | `Admin\CertificateController@getCertificateStatus` |

## Endpoints

### Authentication

#### POST /api/auth/login

Login as admin and receive a Sanctum bearer token. Only admin-role users can obtain tokens — portal users (students/teachers) authenticate via session.

```json
// Request
{ "email": "admin@example.com", "password": "password" }

// Response 200
{ "status": true, "message": "Success", "token": "1|abc123..." }

// Response 401 — invalid credentials or non-admin user
{ "status": false, "message": "Validation error", "errors": { "email": [...] } }
```

---

### User

#### GET /api/user

Returns the authenticated user with their linked Cardano wallet.

```json
// Response 200
{
  "id": 1,
  "name": "Admin User",
  "email": "admin@example.com",
  "user_wallet": { "wallet_address": "addr1...", "stake_key_hash": "..." }
}
```

---

### Certificates

All certificate endpoints require `auth:sanctum`. The authenticated user must be a `teacher` and must own the course (`professor_id = auth()->id()`). Returns 404 (not 403) if the course is not found for that teacher.

#### GET /api/certificates/completion-summary

Returns completion summary for courses owned by the authenticated teacher.

#### GET /api/certificates/courses/{course}/eligible-students

List students eligible for certificate minting (completed the course, no existing certificate).

```json
// Response 200
{
  "success": true,
  "data": {
    "students": [
      { "id": 42, "name": "Alice", "email": "alice@example.com", "wallet_address": "addr1..." }
    ]
  }
}
```

#### POST /api/certificates/courses/{course}/students/{student}/mint

Mint a single NFT certificate for one student. Triggers `web3/run/build-certificate-tx.mjs` and `web3/run/submit-certificate-tx.mjs` via `exec()`.

```json
// Response 200
{ "success": true, "message": "Certificate minted successfully", "transaction_id": "abc123..." }

// Response 400 — blockchain failure
{ "success": false, "message": "Insufficient ADA in custodial wallet" }
```

#### POST /api/certificates/courses/{course}/batch-mint

Mint certificates for all eligible students in a course. Long-running — may time out for large courses.

#### GET /api/certificates/courses/{course}/students/{student}/status

Check whether a certificate has been minted for a student.

#### POST /api/certificates/mint-and-airdrop *(legacy)*

Original endpoint. Prefer the per-course endpoints above for new work.

---

### Payments (Stripe)

#### POST /api/stripe/payment-intent/{course}

Creates a Stripe PaymentIntent for course purchase. Rate-limited.

```json
// Response 200
{ "client_secret": "pi_xxx_secret_yyy" }
```

**Rate limit**: `throttle:payment-intent` — configured in `app/Providers/RouteServiceProvider.php`.

#### POST /api/stripe/webhook

Stripe webhook — CSRF-exempt, signature verified via `STRIPE_WEBHOOK_SECRET`. Called by Stripe when payment is confirmed.

---

### Webhooks

#### POST /api/webhook/blockfrost/purchase

Blockfrost webhook — called when a monitored Cardano transaction confirms on-chain. Processes course purchases made via ADA. No auth, but validated internally.

---

### Applications (Public)

#### POST /api/applications/teachers/create

Submit a teacher registration application. No auth required.

#### POST /api/applications/class/create

Submit a class/course creation application. No auth required.

---

### Course Pricing (Public)

#### GET /api/courses/{course}/ada-price

Returns the current ADA price for a course. No authentication required. Used by the frontend to poll for live prices every 60 seconds without a full page reload.

Degrades gracefully: if neither the CoinGecko API nor the DB fallback rate is available, returns `available: false` instead of erroring.

```json
// Response 200 — rate available
{ "available": true, "data": { "price_in_ada": 15.27 } }

// Response 200 — rate unavailable (CoinGecko down + no fallback)
{ "available": false, "data": { "price_in_ada": null } }

// Response 404 — course does not exist
```

**Controller**: `app/Http/Controllers/API/CourseController.php`
**Service**: `ExchangeRateService::isAvailable()` + `jpyToAda()`

---

### Public Data

#### GET /api/categories

All course categories (no auth).

```json
[{ "id": 1, "name": "Programming" }, ...]
```

#### GET /api/countries

All country entries (no auth).

#### POST /api/votes/register

Register a vote. No auth.

---

## Standard Response Contract

Services return structured arrays; controllers map to HTTP responses:

```php
// Service layer (app/Services/API/)
return [
    'success' => true,
    'message' => 'Certificate minted',
    'data'    => ['transaction_id' => 'abc123'],
];

// Controller layer (app/Http/Controllers/API/)
return response()->json($result, $result['success'] ? 200 : 400);
```

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Business logic failure (blockchain error, invalid state) |
| 401 | Unauthenticated |
| 403 | Unauthorized (wrong role) |
| 404 | Resource not found or not owned by requester |
| 422 | Validation error (Form Request failed) |
| 429 | Rate limited |
| 500 | Server or blockchain error |

## Testing API Endpoints

```php
use Laravel\Sanctum\Sanctum;

// Authenticate as a specific role
$this->teacher = $this->createTestUser();
$this->teacher->attachRole('teacher');
Sanctum::actingAs($this->teacher);

// Make request
$response = $this->postJson('/api/certificates/mint-and-airdrop', [
    'course_id' => $this->course->id,
]);

// Assert structure
$response->assertStatus(200)
         ->assertJsonStructure(['success', 'message', 'transaction_id']);

// Test unauthenticated
$response = $this->postJson('/api/certificates/mint-and-airdrop', [...]);
$response->assertStatus(401);

// Test wrong role (student accessing teacher endpoint)
Sanctum::actingAs($this->student);
$response = $this->postJson('/api/certificates/mint-and-airdrop', [...]);
$response->assertStatus(403);
```

---

### Token Rewards

Teacher-only endpoints for managing fungible token rewards attached to courses.

#### PUT /api/courses/{course}/token-reward

Update token reward configuration for a course. Teacher must own the course.

```json
// Request
{ "token_reward_enabled": true, "token_reward_amount": 10 }

// Response 200
{ "success": true, "message": "Token reward configuration updated." }
```

#### POST /api/courses/{course}/token-reward/mint

Mint and airdrop token rewards to all eligible students (completed, not yet rewarded).

```json
// Response 200
{ "success": true, "data": { "minted_count": 5, "failed_count": 0 } }
```

**Controller**: `app/Http/Controllers/API/TokenRewardController.php`

---

### Admin Refunds

#### POST /api/admin/refunds/stripe/{stripePaymentId}

Initiate a Stripe refund for a course purchase. Admin only.

#### POST /api/admin/refunds/ada/{courseHistoryId}

Initiate an ADA refund for a course purchase. Admin only.

**Controller**: `app/Http/Controllers/API/AdminRefundController.php`

---

### Admin Certificates

Mirror of teacher certificate endpoints but usable for any course, with fees paid from the platform wallet (`OWNER_WALLET_ADDR`). Admin only.

Routes: `POST /api/admin/certificates/courses/{course}/...` — same structure as teacher routes under `/api/certificates/courses/{course}/...`.

**Controller**: `app/Http/Controllers/Admin/CertificateController.php`

---

### Purchase Status

#### GET /api/purchases/{txHash}/status

Poll the status of an ADA course purchase by transaction hash. Returns confirmation state.

```json
// Response 200
{ "success": true, "data": { "status": "confirmed", "course_id": 42 } }
```

**Controller**: `app/Http/Controllers/API/PurchaseStatusController.php`

---

### Cardano Network

#### GET /api/cardano/network-status

Public endpoint returning current Cardano network connectivity and epoch info from Blockfrost. Used by frontend to display wallet connection health.

**Controller**: `app/Http/Controllers/API/CardanoController.php`

---

### Student Self-Mint (Web Routes)

These are **portal web routes** (not `/api/*`), authenticated via session (`auth` middleware):

| Method | Path | Controller |
|--------|------|-----------|
| POST | `/classes/{course_id}/attend/{schedule_id}/self-mint` | `Portal\StudentMintController@selfMint` |
| POST | `/classes/{course_id}/attend/{schedule_id}/cip30/build-mint-tx` | `Portal\StudentMintController@buildMintTx` |
| POST | `/classes/{course_id}/attend/{schedule_id}/cip30/submit-mint-tx` | `Portal\StudentMintController@submitMintTx` |

`selfMint` handles server-side mint (custodial). `buildMintTx` / `submitMintTx` support CIP-30 wallet signing — returns an unsigned CBOR TX, student signs in-browser, then submits. See `docs/data-flows.md` for the CIP-30 flow.

---

## Cross-References

- Authentication: `docs/authentication.md`
- Service response patterns: `docs/patterns.md`
- Certificate blockchain flow: `docs/certificate-minting-api.md`
- Student CIP-30 self-mint flow: `docs/data-flows.md`
- Data flows: `docs/data-flows.md`
