# API Reference

> **AI Context Summary**: REST API at `/api/*` defined in `routes/api.php`. Two auth tiers: public endpoints (login, categories, votes, webhook) and Sanctum-protected (`auth:sanctum` header required). Standard service response: `{ "success": bool, "message": string, "data": {} }` — controllers map to HTTP 200/400. Certificate endpoints additionally enforce teacher `professor_id` ownership. Stripe and Blockfrost webhooks are CSRF-exempt. Rate limit on payment-intent: `throttle:payment-intent`.

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

## Cross-References

- Authentication: `docs/authentication.md`
- Service response patterns: `docs/patterns.md`
- Certificate blockchain flow: `docs/certificate-minting-api.md`
- Data flows: `docs/data-flows.md`
