# External Integrations

> **AI Context Summary**: Key integrations: (1) Blockfrost API for Cardano blockchain (preprod/mainnet), (2) NMKR Studio API for alternative NFT minting, (3) AWS S3 for file storage, (4) Laravel Sanctum for API auth, (5) Laratrust for RBAC. All require .env configuration. Blockfrost rate limit: 50 req/sec free tier.

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

## 2. NMKR Studio API (Alternative NFT Minting)

### Purpose

Alternative NFT minting service for specific use cases (badges, special certificates).

### Configuration

```env
# .env
NMKR_API_KEY=nmkr_abc123...
NMKR_PROJECT_ID=12345
NMKR_PKH=abc123...
```

### Base URL

```
https://studio-api.nmkr.io/v2
```

### Authentication

All requests require `api-key` header:

```php
$response = Http::withHeaders([
    'api-key' => config('services.nmkr.api_key')
])->post('https://studio-api.nmkr.io/v2/CreateNft', $payload);
```

### Key Endpoints Used

| Endpoint | Purpose |
|----------|---------|
| `POST /CreateNft` | Mint NFT with metadata |
| `GET /GetProjectInfo/{projectId}` | Fetch project details |
| `GET /GetNft/{nftId}` | Query NFT status |

### Example: Mint NFT

```php
// app/Services/API/CertificateService.php (NMKR variant)
protected function mintCertificateWithNMKR($metadata, $recipientAddress)
{
    $payload = [
        'assetName' => $metadata['name'],
        'displayName' => $metadata['display_name'],
        'previewImageNft' => [
            'mimetype' => 'image/png',
            'fileFromUrl' => $metadata['image_url']
        ],
        'metadata' => $metadata,
        'receiverAddress' => $recipientAddress
    ];

    $response = Http::withHeaders([
        'api-key' => config('services.nmkr.api_key')
    ])->post('https://studio-api.nmkr.io/v2/CreateNft', $payload);

    if (!$response->successful()) {
        throw new Exception('NMKR API error: ' . $response->body());
    }

    return $response->json();
}
```

### When to Use NMKR vs Helios

| Use Case | Method |
|----------|--------|
| Course certificates (primary) | Helios (in-house) |
| Achievement badges | NMKR Studio |
| Promotional NFTs | NMKR Studio |
| Test minting | Helios (preprod) |

**Reason**: NMKR simplifies some NFT operations but has transaction fees. Helios gives full control.

## 3. AWS S3 (File Storage)

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

## Cross-References

- **Architecture**: See [docs/architecture.md](./architecture.md) for integration layer
- **Data Flows**: See [docs/data-flows.md](./data-flows.md) for integration usage
- **Deployment**: See [docs/deployment.md](./deployment.md) for production configuration
- **Gotchas**: See [docs/gotchas.md](./gotchas.md) for integration issues
