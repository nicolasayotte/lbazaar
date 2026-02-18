# External Integrations

> **AI Context Summary**: Key integrations: (1) Blockfrost API for Cardano blockchain (preprod/mainnet), (2) AWS S3 for file storage, (3) Laravel Sanctum for API auth, (4) Laratrust for RBAC. All require .env configuration. Blockfrost rate limit: 50 req/sec free tier.

## Overview

Le Bazaar integrates with several external services for blockchain operations, storage, and authentication.

## 1. Blockfrost API (Cardano Blockchain)

### Purpose

Query Cardano blockchain state and submit transactions.

### Configuration

```env
# .env
NETWORK=preprod  # or mainnet
BLOCKFROST_API_KEY=preprod_abc123...
BLOCKFROST_URL=https://cardano-preprod.blockfrost.io/api/v0
```

### Base URLs

| Environment | URL |
|------------|-----|
| Preprod | `https://cardano-preprod.blockfrost.io/api/v0` |
| Mainnet | `https://cardano-mainnet.blockfrost.io/api/v0` |

### Authentication

All requests require `project_id` header:

```javascript
const response = await fetch(`${BLOCKFROST_URL}/addresses/${address}/utxos`, {
    headers: {
        'project_id': process.env.BLOCKFROST_API_KEY
    }
});
```

### Key Endpoints Used

| Endpoint | Purpose | Usage |
|----------|---------|-------|
| `GET /addresses/{address}/utxos` | Fetch wallet UTXOs | Transaction building |
| `POST /tx/submit` | Submit signed transaction | Certificate minting |
| `GET /assets/{policy_id}{asset_name}` | Query NFT details | Verification |
| `GET /accounts/{stake_address}` | Get stake account info | Wallet validation |
| `GET /epochs/latest` | Get current epoch | Transaction timing |

### Example: Fetch UTXOs

```javascript
// web3/common/blockfrost.mjs
import fetch from 'node-fetch';

export async function fetchUtxos(address) {
    const url = `${process.env.BLOCKFROST_URL}/addresses/${address}/utxos`;

    const response = await fetch(url, {
        headers: {
            'project_id': process.env.BLOCKFROST_API_KEY
        }
    });

    if (!response.ok) {
        throw new Error(`Blockfrost API error: ${response.status}`);
    }

    return await response.json();
}

// Returns:
// [
//   {
//     "tx_hash": "abc123...",
//     "output_index": 0,
//     "amount": [
//       { "unit": "lovelace", "quantity": "5000000" },
//       { "unit": "policy_id.asset_name", "quantity": "1" }
//     ],
//     "block": "block_hash...",
//     "data_hash": null
//   }
// ]
```

### Example: Submit Transaction

```javascript
// web3/run/submit-certificate-tx.mjs
const submitTransaction = async (cborTx) => {
    const url = `${process.env.BLOCKFROST_URL}/tx/submit`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'project_id': process.env.BLOCKFROST_API_KEY,
            'Content-Type': 'application/cbor'
        },
        body: Buffer.from(cborTx, 'hex')
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Transaction submission failed: ${error}`);
    }

    const txHash = await response.text();
    return txHash;  // Returns transaction hash
};
```

### Rate Limits

| Tier | Requests/Second | Requests/Day |
|------|----------------|--------------|
| Free | 50 | 50,000 |
| Paid | Higher | Higher |

**Handling Rate Limits**:

```javascript
// Retry with exponential backoff
async function fetchWithRetry(url, options, retries = 3, backoff = 1000) {
    try {
        const response = await fetch(url, options);

        if (response.status === 429) {  // Rate limited
            if (retries === 0) throw new Error('Rate limit exceeded');
            await new Promise(resolve => setTimeout(resolve, backoff));
            return fetchWithRetry(url, options, retries - 1, backoff * 2);
        }

        return response;
    } catch (err) {
        if (retries === 0) throw err;
        await new Promise(resolve => setTimeout(resolve, backoff));
        return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
}
```

### Error Handling

**Common Errors**:

| Status | Error | Cause |
|--------|-------|-------|
| 400 | Bad Request | Invalid address format |
| 403 | Forbidden | Invalid API key |
| 404 | Not Found | Address has no UTXOs |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Blockfrost API issue |

**Pattern**:
```javascript
try {
    const utxos = await fetchUtxos(address);
} catch (err) {
    console.error('Blockfrost error:', err.message);
    process.stdout.write(JSON.stringify({
        status: 500,
        error: 'Failed to fetch UTXOs from blockchain'
    }));
}
```

### Verification Script

```bash
# Test Blockfrost connection
cd web3
node run/blockfrost-verify.mjs
```

**Expected output**:
```json
{
  "status": 200,
  "message": "Blockfrost API connection successful",
  "network": "preprod"
}
```

## 2. AWS S3 (File Storage)

### Purpose

Store course materials, user uploads, and NFT images.

### Configuration

```env
# .env
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=production-lebazaar
AWS_STAGING_BUCKET=staging-lebazaar
```

### Laravel Configuration

**Location**: `config/filesystems.php`

```php
'disks' => [
    's3' => [
        'driver' => 's3',
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
        'bucket' => env('AWS_BUCKET'),
    ],
],
```

### Usage Patterns

**Upload File**:
```php
use Illuminate\Support\Facades\Storage;

// Upload to S3
Storage::disk('s3')->put('certificates/cert123.png', $fileContents);

// Get public URL
$url = Storage::disk('s3')->url('certificates/cert123.png');
```

**Download File**:
```php
$contents = Storage::disk('s3')->get('certificates/cert123.png');
```

**Delete File**:
```php
Storage::disk('s3')->delete('certificates/cert123.png');
```

**Check Existence**:
```php
if (Storage::disk('s3')->exists('certificates/cert123.png')) {
    // File exists
}
```

### Bucket Structure

```
production-lebazaar/
├── certificates/
│   ├── course-123/
│   │   ├── student-456.png
│   │   └── student-789.png
├── badges/
│   └── achievement-1.png
├── course-materials/
│   └── course-123/
│       ├── syllabus.pdf
│       └── lecture-1.mp4
└── user-uploads/
    └── avatars/
        └── user-456.jpg
```

### CORS Configuration (if needed)

**S3 Bucket CORS Policy**:
```json
[
    {
        "AllowedOrigins": ["https://lebazaar.com"],
        "AllowedMethods": ["GET", "PUT", "POST"],
        "AllowedHeaders": ["*"],
        "MaxAgeSeconds": 3000
    }
]
```

## 4. Laravel Sanctum (API Authentication)

### Purpose

Token-based authentication for API endpoints.

### Configuration

**Location**: `config/sanctum.php`

```php
'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', 'localhost,127.0.0.1')),
'expiration' => null,  // Tokens don't expire
'middleware' => [
    'verify_csrf_token' => App\Http\Middleware\VerifyCsrfToken::class,
    'encrypt_cookies' => App\Http\Middleware\EncryptCookies::class,
],
```

### Usage Pattern

**Obtain Token**:
```php
// app/Http/Controllers/API/AuthController.php
public function login(Request $request)
{
    if (!Auth::attempt($request->only('email', 'password'))) {
        return response()->json(['message' => 'Invalid credentials'], 401);
    }

    $user = Auth::user();
    $token = $user->createToken('api-token')->plainTextToken;

    return response()->json([
        'token' => $token,
        'user' => $user
    ]);
}
```

**Authenticated Request**:
```javascript
// Client-side
const response = await fetch('/api/courses', {
    headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
    }
});
```

**Protect Routes**:
```php
// routes/api.php
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/courses', [CourseController::class, 'index']);
    Route::post('/certificates/mint', [CertificateController::class, 'mint']);
});
```

### Token Storage

**Database**: `personal_access_tokens` table

```sql
id | tokenable_type | tokenable_id | name | token | abilities | last_used_at | created_at
1  | App\Models\User | 123 | api-token | abc... | ["*"] | 2024-01-01 | 2024-01-01
```

### Revoke Token

```php
// Revoke specific token
$user->tokens()->where('id', $tokenId)->delete();

// Revoke all tokens
$user->tokens()->delete();
```

## 5. Laratrust (Role-Based Access Control)

### Purpose

Manage user roles and permissions.

### Configuration

**Location**: `config/laratrust.php`

### Roles

| Role | ID | Description |
|------|-----|-------------|
| admin | 1 | Full system access |
| teacher | 2 | Course management, certificate minting |
| student | 3 | Course enrollment, certificate viewing |

### Usage Patterns

**Assign Role**:
```php
$user = User::find(1);
$user->attachRole('teacher');
```

**Check Role**:
```php
if ($user->hasRole('teacher')) {
    // User is a teacher
}
```

**In Blade/Views**:
```blade
@role('admin')
    <a href="/admin/dashboard">Admin Panel</a>
@endrole
```

**Middleware**:
```php
// routes/api.php
Route::middleware(['auth:sanctum', 'role:teacher'])->group(function () {
    Route::post('/certificates/mint', [CertificateController::class, 'mint']);
});
```

### Permissions (Optional)

Le Bazaar currently uses roles only, but Laratrust supports permissions:

```php
// Create permission
$permission = Permission::create(['name' => 'mint-certificates']);

// Attach to role
$teacherRole = Role::where('name', 'teacher')->first();
$teacherRole->attachPermission($permission);

// Check permission
if ($user->can('mint-certificates')) {
    // User has permission
}
```

## 6. Email Service (SMTP)

### Purpose

Send notifications (enrollment, certificate minting, password reset).

### Configuration

```env
# .env
MAIL_MAILER=smtp
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USERNAME=noreply@lebazaar.com
MAIL_PASSWORD=...
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@lebazaar.com
MAIL_FROM_NAME="Le Bazaar"
```

### Development (Mailtrap)

```env
MAIL_HOST=sandbox.smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=your_mailtrap_username
MAIL_PASSWORD=your_mailtrap_password
```

### Production (AWS SES)

```env
MAIL_HOST=email-smtp.us-east-1.amazonaws.com
MAIL_PORT=587
MAIL_USERNAME=AKIA...
MAIL_PASSWORD=...
```

### Usage Pattern

```php
// app/Services/API/EmailService.php
use Illuminate\Support\Facades\Mail;

public function sendEnrollmentConfirmation(User $user, Course $course)
{
    Mail::to($user->email)->send(new EnrollmentConfirmation($user, $course));
}
```

**Mailable Example**:
```php
// app/Mail/EnrollmentConfirmation.php
class EnrollmentConfirmation extends Mailable
{
    public function __construct(
        public User $user,
        public Course $course
    ) {}

    public function build()
    {
        return $this->subject('Course Enrollment Confirmation')
                    ->view('emails.enrollment-confirmation');
    }
}
```

## 7. Discord Webhooks (Optional Monitoring)

### Purpose

Send alerts to Discord channel for errors or important events.

### Configuration

```env
# .env
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

### Usage Pattern

```php
use Illuminate\Support\Facades\Http;

public function notifyError(Exception $e)
{
    if (config('services.discord.webhook_url')) {
        Http::post(config('services.discord.webhook_url'), [
            'content' => sprintf(
                '🚨 **Production Error** 🚨\n```\n%s\n```',
                $e->getMessage()
            )
        ]);
    }
}
```

## Integration Health Checks

### Verify All Integrations

```bash
# Blockfrost
cd web3 && node run/blockfrost-verify.mjs

# AWS S3
sail artisan tinker
>>> Storage::disk('s3')->exists('test.txt')

# Email (send test)
sail artisan tinker
>>> Mail::raw('Test', function($msg) { $msg->to('test@example.com'); })

# Database
sail mysql -e "SELECT 1"
```

## 8. Stripe Payment Integration

### Purpose

Credit card payment processing for course purchases (alternative to ADA cryptocurrency).

### Configuration

**Location**: `config/services.php`
- `services.stripe.key` - Publishable key (frontend)
- `services.stripe.secret` - Secret key (backend)
- `services.stripe.webhook_secret` - Webhook signing secret

**Environment Variables**:
```env
# .env
STRIPE_KEY=pk_test_xxx  # or pk_live_xxx
STRIPE_SECRET=sk_test_xxx  # or sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
VITE_STRIPE_PUBLIC_KEY="${STRIPE_KEY}"  # Frontend key
```

### API Endpoints

| Endpoint | Purpose | Auth |
|----------|---------|------|
| `POST /api/stripe/payment-intent/{course}` | Create PaymentIntent | Required |
| `POST /api/stripe/webhook` | Receive Stripe webhooks | Signature verified |

### Key Files

| File | Purpose |
|------|---------|
| `app/Services/API/StripeService.php` | Payment processing logic |
| `app/Http/Controllers/API/StripeController.php` | API endpoints |
| `app/Models/StripePayment.php` | Payment records |
| `resources/js/components/payments/StripeCheckout.jsx` | Frontend payment form |

### JPY Zero-Decimal Currency

JPY amounts are whole numbers (¥1000 = amount 1000, not 100000).

**Example**:
```php
// Course costs ¥1000
$course->price_jpy = 1000;

// Stripe amount (NO multiplication for JPY)
$stripeAmount = $course->price_jpy;  // 1000

// Other currencies require multiplication
$stripeAmount = $course->price_usd * 100;  // $10.00 = 1000 cents
```

### Webhook Setup

**Local Development**:
```bash
# Terminal 1: Start Sail
sail up -d

# Terminal 2: Forward webhooks
stripe listen --forward-to localhost:8000/api/stripe/webhook
```

**Production**:
1. Configure in Stripe Dashboard → Webhooks
2. Add endpoint: `https://lebazaar.com/api/stripe/webhook`
3. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
4. Copy signing secret to `STRIPE_WEBHOOK_SECRET`

**Events Handled**:
- `payment_intent.succeeded` - Payment completed, enroll student
- `payment_intent.payment_failed` - Payment failed, update status

### Security

- **CSRF Exempt**: Webhook endpoint uses Stripe signature verification instead
- **No Card Storage**: Card data handled entirely by Stripe (PCI compliant)
- **3D Secure**: Handled automatically by Stripe Elements
- **Signature Verification**: All webhooks verified using `constructEvent()`

**Verification Pattern**:
```php
// StripeService::handleWebhook()
$event = \Stripe\Webhook::constructEvent(
    $payload,
    $signature,
    config('services.stripe.webhook_secret')
);
```

### Test Cards

| Card Type | Number | Use Case |
|-----------|--------|----------|
| Success | 4242 4242 4242 4242 | Standard test payment |
| JCB | 3566 0020 2036 0505 | Japan-specific card |
| Decline | 4000 0000 0000 0002 | Test payment failure |
| 3D Secure | 4000 0025 0000 3155 | Test authentication flow |

**Using Test Cards**:
- Use any future expiry date (e.g., 12/34)
- Use any 3-digit CVC
- Use any billing postal code

### Japan Compliance

**JCB Card Support**: Enabled in Stripe Dashboard (payment methods → JCB)

**Tokutei Sho-torihiki Ho** (Specified Commercial Transactions Act):
- Legal disclosure page required for Japanese e-commerce
- Must include: business name, address, contact info, return policy, payment terms
- Implementation: `/legal/disclosure` page

### Error Handling

**Payment Failures**:
```php
// StripeService::createPaymentIntent()
try {
    $paymentIntent = \Stripe\PaymentIntent::create([...]);
} catch (\Stripe\Exception\CardException $e) {
    // Card declined
    return ['success' => false, 'message' => $e->getMessage()];
} catch (\Stripe\Exception\ApiErrorException $e) {
    // Stripe API error
    return ['success' => false, 'message' => 'Payment processing error'];
}
```

**Webhook Failures**:
- Stripe retries failed webhooks automatically
- Idempotency handled by `lockForUpdate()` on stripe_payments table
- See [docs/gotchas.md](./gotchas.md) for webhook debugging

## 9. CoinGecko Exchange Rate API

### Purpose

Fetch real-time ADA to JPY exchange rates for course pricing and payment calculations.

### Configuration

**Location**: `config/services.php`
- `services.coingecko.api_url` - CoinGecko API base URL
- `services.coingecko.cache_ttl` - Cache duration for successful API responses (default: 600 seconds)
- `services.coingecko.fallback_cache_ttl` - Cache duration for fallback rates (default: 60 seconds)
- `services.coingecko.fallback_rate` - Initial fallback rate for seeder (default: 50)

**Environment Variables**:
```env
# .env
COINGECKO_API_URL=https://api.coingecko.com/api/v3
EXCHANGE_RATE_CACHE_TTL=600
EXCHANGE_RATE_FALLBACK_CACHE_TTL=60
EXCHANGE_RATE_FALLBACK=50
```

### Fallback System

**CRITICAL**: Exchange rate fallback must be configured in the settings table before production use.

**Setup**:
```bash
# Run seeder to create fallback setting
sail artisan db:seed --class=ExchangeRateSettingSeeder

# Verify setting exists
sail artisan tinker
>>> \App\Models\Setting::where('slug', 'ada-to-jpy')->first()
```

**Fallback Behavior**:
1. Primary: Fetch rate from CoinGecko API (cached 600 seconds)
2. Fallback: Use rate from settings table (cached 60 seconds)
3. No Fallback: Throws exception if setting not configured

**Update Fallback Rate**:
```bash
# Via admin dashboard (recommended)
# Navigate to: /admin/settings → Exchange Rate

# Via database
sail mysql
UPDATE settings SET value = '65.5' WHERE slug = 'ada-to-jpy';

# Via tinker
sail artisan tinker
>>> $setting = \App\Models\Setting::where('slug', 'ada-to-jpy')->first();
>>> $setting->value = '65.5';
>>> $setting->save();
```

**Important Notes**:
- Fallback rate should be updated regularly to match current market rates
- Production deployments MUST verify fallback setting exists
- AppServiceProvider logs warnings if fallback rate is suspicious (< 10 or > 1000 JPY per ADA)

### API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /simple/price?ids=cardano&vs_currencies=jpy` | Fetch ADA to JPY rate |

### Usage Pattern

```php
// app/Services/API/ExchangeRateService.php
use App\Services\API\ExchangeRateService;

$service = new ExchangeRateService();

// Get current exchange rate
$rate = $service->getAdaJpyRate();  // e.g., 65.5 (JPY per ADA)

// Convert JPY to ADA
$ada = $service->jpyToAda(1000);  // e.g., 15.27 ADA
```

### Error Handling

**API Failure**:
- CoinGecko API unreachable → Falls back to database setting
- Invalid response → Falls back to database setting
- Network timeout → Falls back to database setting

**Fallback Missing**:
```php
// If setting not configured, throws exception:
try {
    $rate = $service->getAdaJpyRate();
} catch (\Exception $e) {
    // "Exchange rate fallback not configured. Run: php artisan db:seed --class=ExchangeRateSettingSeeder"
}
```

### Rate Limits

CoinGecko free tier:
- 50 requests/minute
- 10,000 requests/month

**Mitigation**:
- Successful rates cached for 10 minutes
- Fallback rates cached for 60 seconds
- Use caching to minimize API calls

## Cross-References

- **Architecture**: See [docs/architecture.md](./architecture.md) for integration layer
- **Data Flows**: See [docs/data-flows.md](./data-flows.md) for integration usage
- **Deployment**: See [docs/deployment.md](./deployment.md) for production configuration
- **Gotchas**: See [docs/gotchas.md](./gotchas.md) for integration issues
