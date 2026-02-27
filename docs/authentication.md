# Authentication & Authorization

> **AI Context Summary**: Two parallel auth systems — (1) session-based for web routes (`/admin/*` uses `['auth','admin']` middleware, portal uses `['auth']`), (2) Sanctum bearer tokens for API routes (`auth:sanctum`). API login (`POST /api/auth/login`) only works for admin-role users; portal users authenticate via session only. RBAC via Laratrust 7.1: roles are `admin`, `teacher`, `student`. Check roles with `$user->hasRole('teacher')` or `$user->hasAnyRole([...])`. In PHPUnit tests: `Sanctum::actingAs($user)` for API auth, `$this->actingAs($user)` for session auth.

## Auth System Overview

| System | Routes | Mechanism | Storage |
|--------|--------|-----------|---------|
| Admin session | `/admin/*` | `auth` + `admin` middleware | PHP session |
| Portal session | `/portal/*` | `auth` middleware | PHP session |
| API tokens | `/api/*` | `auth:sanctum` middleware | `personal_access_tokens` table |

## 1. Session Authentication (Web Routes)

Standard Laravel session auth using the `auth` guard. Sessions stored in the database.

### Admin Login

```
POST /admin/authenticate
→ Auth::attempt([email, password, whereRoleIs('admin')])
→ Session created
→ Redirect to /admin/profile
```

Controller: `app/Http/Controllers/Admin/AuthController.php`

Route protection — all admin routes:
```php
// routes/web.php:81
Route::middleware(['auth', 'admin'])->group(function () {
    // All admin dashboard routes
});
```

The `admin` middleware (in `app/Http/Middleware/`) verifies the user has the `admin` role, in addition to the standard `auth` session check.

### Portal Login

```
POST /portal/login
→ Auth::attempt([email, password])
→ Session created
→ Redirect to dashboard
```

Controller: `app/Http/Controllers/Portal/AuthPortalController.php`

### Password Reset

```
GET  /portal/forgot-password   → ForgotPasswordController@index
POST /portal/forgot-password   → ForgotPasswordController@send (emails token)
GET  /portal/reset-password/{token}
POST /portal/reset-password/{token} → ForgotPasswordController@reset
```

## 2. API Token Authentication (Sanctum)

Token-based auth for external API consumers. Tokens stored in `personal_access_tokens` table and sent as `Authorization: Bearer {token}` header.

### Obtaining a Token

```
POST /api/auth/login
Body: { "email": "admin@example.com", "password": "..." }
→ Returns { "status": true, "token": "1|plaintext..." }
```

**Note**: Only users with `admin` role can obtain API tokens via this endpoint. Portal users (students/teachers) use session auth only.

### Token Creation (Service Layer)

```php
// app/Http/Controllers/API/AuthController.php:48-54
$user = User::where('email', $request->email)->first();
return response()->json([
    'status' => true,
    'token'  => $user->createToken("API TOKEN")->plainTextToken,
]);
```

### Protected API Route Groups

```php
// routes/api.php
Route::middleware('auth:sanctum')->get('/user', ...);

Route::prefix('/certificates')
    ->middleware(['auth:sanctum'])
    ->group(function () { ... });

Route::prefix('/stripe')
    ->middleware(['auth:sanctum'])
    ->group(function () { ... });
```

## 3. Authorization — RBAC (Laratrust 7.1)

### Roles

| Role | Access Level |
|------|-------------|
| `admin` | Full system: admin dashboard, user management, settings |
| `teacher` | Course management, certificate minting (own courses only) |
| `student` | Course enrollment, certificate/badge viewing |

### Checking Roles in Code

```php
// Single role check
if (!Auth::user()->hasRole('teacher')) {
    abort(403, 'Unauthorized');
}

// Any of multiple roles
if (!Auth::user()->hasAnyRole(['teacher', 'admin'])) {
    abort(403);
}

// All roles
if (!Auth::user()->hasAllRoles(['teacher', 'admin'])) {
    abort(403);
}
```

### Ownership Check Pattern

Certificate endpoints additionally verify the authenticated teacher owns the course:

```php
// app/Http/Controllers/API/CertificateController.php
$course = Course::where('id', $request->course_id)
                ->where('professor_id', Auth::id())  // ownership check
                ->firstOrFail();                      // 404 if not owned
```

### Assigning Roles (Tests & Seeders)

```php
$user->attachRole('student');
$user->attachRole('teacher');
$user->syncRoles(['admin']);          // replaces all existing roles
```

## 4. Cardano Wallet Verification (Optional)

Beyond standard auth, students/teachers optionally link a Cardano wallet for NFT receipt.

**Flow**:
```
Client: signs nonce with CIP-30 wallet extension
→ POST /api/wallets/verify (auth:sanctum)
→ PHP: exec() → web3/run/wallet-verify.mjs (verifies signature)
→ UserWallet record created with { wallet_address, stake_key_hash }
```

This does not replace session/token auth — it's an additional linking step.

Key files: `app/Http/Controllers/API/UserWalletController.php`, `web3/run/wallet-verify.mjs`

## Testing Authentication

```php
use Laravel\Sanctum\Sanctum;

// API token auth (for /api/* routes)
Sanctum::actingAs($this->teacher);
$response = $this->postJson('/api/certificates/mint-and-airdrop', [...]);

// Session auth (for web routes)
$this->actingAs($this->admin);
$response = $this->get('/admin/users');

// No auth (testing 401 responses)
$response = $this->postJson('/api/certificates/mint-and-airdrop', [...]);
$response->assertStatus(401);
```

## Cross-References

- API endpoint list: `docs/api.md`
- Route structure: `routes/api.php`, `routes/web.php`
- Architecture: `docs/architecture.md`
- Testing patterns: `docs/testing.md`
