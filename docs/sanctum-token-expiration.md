# Sanctum Token Expiration & Rotation

## Overview

Le Bazaar uses Laravel Sanctum v3.3.3 for API token authentication. Only `admin`-role users can obtain API tokens via `POST /api/auth/login`. These tokens protect 8 route groups covering purchases, certificates, Stripe payments, token rewards, and admin operations.

This document explains how token expiration works, why it matters for a payment-processing application, and how to implement clean token rotation.

## How Sanctum Expiration Works

Sanctum offers **two independent** expiration mechanisms. Both can be active simultaneously — the token expires at whichever deadline comes first.

### 1. Sliding Window (Config-Based)

Set in `config/sanctum.php`:

```php
'expiration' => env('SANCTUM_EXPIRATION_MINUTES', 480), // 8 hours
```

**How it works:** On every authenticated request, Sanctum checks:

```
last_used_at + expiration_minutes < now()  →  401 Unauthenticated
```

Every successful request updates `last_used_at`, resetting the clock. A token with `expiration => 480` that is used every 4 hours will never expire from this check alone.

**Key behavior:**
- This is an *inactivity timeout*, not an absolute lifetime
- A token that sits unused for 8 hours is rejected on the next request
- Freshly created tokens have `last_used_at = null` — Sanctum treats `null` as "never used" and allows the first request, which then sets `last_used_at`

### 2. Hard Deadline (Per-Token)

Set at token creation time via the `expires_at` parameter:

```php
$user->createToken(
    'admin-api-20260325-143000',  // unique name for audit trail
    ['*'],                         // abilities
    now()->addDay()                // hard deadline: 24 hours from now
)->plainTextToken;
```

**How it works:** The `expires_at` column in `personal_access_tokens` stores an absolute timestamp. Sanctum rejects the token after this time regardless of activity.

**Key behavior:**
- This is an *absolute lifetime* — the token dies at the set time even if actively used
- If `expires_at` is `null`, this check is skipped (no hard deadline)
- The `expires_at` column exists in the standard Sanctum migration (`database/migrations/2019_12_14_000001_create_personal_access_tokens_table.php`)

### Combined Behavior

| Scenario | Sliding (8h inactivity) | Hard (24h absolute) | Result |
|----------|------------------------|---------------------|--------|
| Token used every 2h for 25h | Still alive (always active) | **Expired** at 24h | Dead at 24h |
| Token unused for 9h at hour 5 | **Expired** at hour 5+8=13 | Still alive | Dead at hour 13 |
| Token used once then abandoned | **Expired** at 8h after last use | Still alive | Dead at 8h |
| Token created and never used | Allowed on first use (sets `last_used_at`) | **Expired** at 24h | Dead at 24h |

## Why This Matters

With `expiration => null` (the previous default) and no `expires_at`, admin tokens live **forever**. A stolen token — from a log file, compromised client, network intercept, or any breach — grants permanent access to:

- Certificate minting (irreversible on-chain NFT operations)
- Stripe payment operations (refunds, payment intents)
- User management
- Course administration

For an application handling real money (Stripe + Cardano ADA), token expiration is a critical security control.

## Recommended Configuration

### Config: 8-Hour Sliding Window

```php
// config/sanctum.php
'expiration' => env('SANCTUM_EXPIRATION_MINUTES', 480),
```

```env
# .env
SANCTUM_EXPIRATION_MINUTES=480
```

**Why 8 hours:** Matches a working day. An admin who logs in at 9 AM and works continuously won't be interrupted. An admin who leaves at 5 PM will have their token expire by 1 AM — well before the next business day.

### Token Creation: 24-Hour Hard Ceiling

```php
// app/Http/Controllers/API/AuthController.php
$user->createToken(
    'admin-api-' . now()->format('Ymd-His'),
    ['*'],
    now()->addDay()
)->plainTextToken;
```

**Why 24 hours:** Forces daily re-authentication even for continuously active sessions. Limits the blast radius of a stolen token to one day maximum.

**Why unique names:** The format `admin-api-20260325-143000` allows:
- Identifying which token was used for a given action
- Selectively revoking a specific session without revoking all tokens
- Audit trail of when tokens were issued

## Token Rotation Pattern

### Endpoints

| Method | Path | Auth Required | Purpose |
|--------|------|--------------|---------|
| `POST` | `/api/auth/login` | No (email + password) | Issue new token |
| `POST` | `/api/auth/refresh` | Yes (Bearer token) | Revoke current, issue new |
| `DELETE` | `/api/auth/logout` | Yes (Bearer token) | Revoke current token |

### Rotation Flow

```
1. Client calls POST /api/auth/login → receives token (24h lifetime)
2. Client stores token securely
3. Before token expires (or on 401), client calls POST /api/auth/refresh
   → Server revokes old token, issues new one (fresh 24h lifetime)
   → Client replaces stored token
4. On explicit logout, client calls DELETE /api/auth/logout
   → Server revokes token
```

### Client-Side Implementation

```javascript
// Refresh proactively (e.g., every 20 hours)
async function refreshToken() {
    const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${currentToken}` }
    });
    if (response.ok) {
        const data = await response.json();
        currentToken = data.token;  // store new token
    } else {
        // Token expired or invalid — redirect to login
        redirectToLogin();
    }
}

// Handle 401 responses globally
axios.interceptors.response.use(null, async (error) => {
    if (error.response?.status === 401) {
        // Try refresh once, then redirect to login
        try {
            await refreshToken();
            return axios.request(error.config);  // retry original request
        } catch {
            redirectToLogin();
        }
    }
    return Promise.reject(error);
});
```

## Token Pruning

Sanctum v3.3.3 ships the `sanctum:prune-expired` Artisan command. Schedule it daily to clean up expired tokens from the `personal_access_tokens` table:

```php
// app/Console/Kernel.php
protected function schedule(Schedule $schedule)
{
    $schedule->command('sanctum:prune-expired')->daily();
}
```

Run manually:
```bash
sail artisan sanctum:prune-expired
# Output: "X tokens deleted."
```

**Why prune:** Without pruning, the `personal_access_tokens` table grows unbounded. Each admin login creates a new row. With daily pruning, only active (non-expired) tokens remain.

## Impact on Existing Routes

All 8 `auth:sanctum` route groups in `routes/api.php` benefit automatically from token expiration — **no code changes needed** in the protected routes. The `auth:sanctum` middleware handles expiration checks transparently:

```php
// These all work the same — middleware rejects expired tokens with 401
Route::middleware('auth:sanctum')->get('/user', ...);
Route::prefix('/purchases')->middleware('auth:sanctum')->group(...);
Route::prefix('/certificates')->middleware(['auth:sanctum'])->group(...);
Route::prefix('/stripe')->middleware(['auth:sanctum'])->group(...);
Route::prefix('/token-rewards')->middleware(['auth:sanctum'])->group(...);
Route::prefix('/admin/refunds')->middleware(['auth:sanctum'])->group(...);
Route::prefix('/admin/certificates')->middleware(['auth:sanctum'])->group(...);
```

## Revoking All Tokens for a User

In case of a compromised admin account, revoke all tokens immediately:

```bash
sail artisan tinker
>>> $user = \App\Models\User::where('email', 'admin@example.com')->first();
>>> $user->tokens()->delete();
# All tokens for this user are now invalid
```

Or programmatically:

```php
// Revoke all tokens except current
$user->tokens()->where('id', '!=', $user->currentAccessToken()->id)->delete();

// Revoke all tokens (nuclear option)
$user->tokens()->delete();
```

## Cross-References

- [Authentication](./authentication.md) — Full auth system overview (session + Sanctum)
- [API Reference](./api.md) — API endpoint documentation
- [Deployment](./deployment.md) — Environment variable configuration
