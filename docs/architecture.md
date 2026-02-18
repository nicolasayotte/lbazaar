# Architecture

> **AI Context Summary**: Le Bazaar uses three-tier layered architecture (Client → Application → Blockchain). Controllers are thin and delegate to Services for business logic. Services return `['success' => bool, 'message' => string, 'data' => array]`. PHP exec() calls Node.js scripts in `web3/` for Cardano blockchain operations. Critical: Never put business logic in controllers or exec() without `escapeshellarg()`.

## System Overview

Le Bazaar is a Cardano-integrated e-learning platform with three distinct architectural layers:

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                            │
│  React 18 + Inertia.js + MUI 5 + Redux Toolkit             │
│  resources/js/pages/ (Admin, Portal)                       │
└────────────────┬────────────────────────────────────────────┘
                 │ HTTP/JSON (Inertia props + XHR)
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                  APPLICATION LAYER                          │
│  Laravel 9 (PHP 8.2) + MySQL 8                             │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Controllers  │→ │  Services    │→ │ Repositories │     │
│  │ (thin)       │  │ (business    │  │ (data        │     │
│  │              │  │  logic)      │  │  access)     │     │
│  └──────────────┘  └──────┬───────┘  └──────────────┘     │
│                           │ exec() Node scripts           │
└───────────────────────────┼───────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  BLOCKCHAIN LAYER                           │
│  Node.js ES Modules (web3/)                                 │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ CLI Runners  │→ │ Helios TX    │→ │ Blockfrost   │     │
│  │ (web3/run/)  │  │ Builder      │  │ API          │     │
│  └──────────────┘  └──────────────┘  └──────┬───────┘     │
└────────────────────────────────────────────┼───────────────┘
                                             ▼
                                  Cardano Blockchain
                                  (Preprod/Mainnet)
```

## Component Breakdown

### Client Layer (React + Inertia.js)

| Component | Responsibility | Location |
|-----------|---------------|----------|
| **Pages** | Full-page components rendered by Inertia | `resources/js/pages/Admin/`, `resources/js/pages/Portal/` |
| **Components** | Reusable UI elements | `resources/js/components/` |
| **State Management** | Redux Toolkit slices for global state | `resources/js/store/` |
| **Routing** | Server-driven (Inertia), no client-side router | Routes defined in Laravel |

**Key Pattern**: Inertia.js eliminates the API layer for page navigation. Controllers return `Inertia::render('Page', ['props'])` and React receives props directly. Use `Inertia.post()` for form submissions, not HTML forms.

**Example**: `resources/js/pages/Portal/Courses/Index.jsx`
```jsx
// Receives props from Laravel controller
const CoursesIndex = ({ auth, courses, translatables }) => {
    return <CourseList courses={courses} />;
};
```

### Application Layer (Laravel)

#### Controllers (Thin Layer)

| Type | Purpose | Location |
|------|---------|----------|
| **API Controllers** | RESTful endpoints for external clients | `app/Http/Controllers/API/` |
| **Admin Controllers** | Administrative interface | `app/Http/Controllers/Admin/` |
| **Portal Controllers** | User-facing portal | `app/Http/Controllers/Portal/` |

**Critical Rule**: Controllers MUST NOT contain business logic. Delegate to services.

**Example**: `app/Http/Controllers/API/CertificateController.php:36-153`
```php
public function mintAndAirdropCertificates(MintCertificatesRequest $request)
{
    $course = Course::where('id', $request->course_id)
                    ->where('professor_id', Auth::id())
                    ->firstOrFail();

    $result = $this->certificateService->mintAndAirdropCertificate(
        $course,
        $student
    );

    return response()->json($result, $result['success'] ? 200 : 400);
}
```

#### Services (Business Logic Layer)

| Service | Responsibility | Location |
|---------|---------------|----------|
| **CertificateService** | NFT certificate minting, airdrop orchestration | `app/Services/API/CertificateService.php` |
| **WalletService** | Point management, blockchain wallet integration | `app/Services/API/WalletService.php` |
| **UserService** | User management, profile operations | `app/Services/API/UserService.php` |
| **EmailService** | Email notifications | `app/Services/API/EmailService.php` |

**Response Contract**: All service methods return:
```php
[
    'success' => bool,
    'message' => string,
    'data' => array  // Optional
]
```

**Example**: `app/Services/API/CertificateService.php:25-221`

#### Repositories (Data Access Layer)

| Repository | Responsibility | Location |
|-----------|---------------|----------|
| **Data Access** | Database queries, model interactions | `app/Repositories/` |

**Note**: Many models use Eloquent directly without explicit repositories. Complex queries are abstracted into repository classes.

#### Models (Data Representation)

**Key Models**:
- `User` - Users with roles (admin, teacher, student)
- `Course` - Course definitions
- `CourseSchedule` - Course sessions
- `CourseHistory` - Student enrollments
- `UserWallet` - Cardano wallet addresses and stake keys
- `NftTransactions` - Certificate/badge minting records
- `Nft` - NFT definitions

**Location**: `app/Models/`

### Blockchain Layer (Node.js + Cardano)

#### CLI Runners (Entry Points)

| Script | Purpose | Called By |
|--------|---------|-----------|
| `build-certificate-tx.mjs` | Build certificate minting transaction | CertificateService |
| `submit-certificate-tx.mjs` | Submit signed transaction | CertificateService |
| `wallet-verify.mjs` | Verify wallet signature | UserWalletController |
| `nft-check.mjs` | Check NFT ownership | WalletService |
| `build-exchange-tx.mjs` | Build point-to-NFT exchange | WalletService |

**Output Contract**: All scripts output JSON to stdout:
```javascript
// Success
{ "status": 200, "data": {...} }

// Error
{ "status": 500, "error": "Error message" }
```

**Location**: `web3/run/`

**Example**: `web3/run/build-certificate-tx.mjs:29-187`

#### Utilities (Shared Helpers)

| Utility | Purpose | Location |
|---------|---------|----------|
| `utils.mjs` | Token extraction, address validation | `web3/common/utils.mjs` |
| `certificate-metadata.mjs` | CIP-25 metadata formatting | `web3/common/certificate-metadata.mjs` |
| `get-custodial-address.mjs` | Derive custodial wallets | `web3/common/get-custodial-address.mjs` |
| `sign-tx.mjs` | Transaction signing with root key | `web3/common/sign-tx.mjs` |

#### Smart Contracts (Helios)

| Contract | Purpose | Location |
|----------|---------|----------|
| `nft-minting-policy.hl` | Single-signature NFT minting | `web3/contracts/nft-minting-policy.hl` |

## Data Flow Between Layers

### Layer Communication Rules

| From → To | Mechanism | Example |
|-----------|-----------|---------|
| Client → Application | Inertia.js props or XHR | `Inertia.post('/api/certificates/mint', data)` |
| Controller → Service | Method call | `$this->certificateService->mintCertificate()` |
| Service → Repository | Method call | `$this->courseRepo->findEligibleStudents()` |
| Service → Blockchain | PHP `exec()` with escaped args | `exec($this->buildWeb3Command('run/script.mjs', [$arg]))` |
| Blockchain → Blockfrost | HTTP REST API | `fetch('https://cardano-preprod.blockfrost.io/api/v0/...')` |

### Critical Security Pattern: Web3 Command Execution

**Always use this pattern** when calling Node.js scripts:

```php
// app/Services/API/CertificateService.php
protected function buildWeb3Command(string $scriptRelativePath, array $arguments = []): string
{
    $web3Directory = base_path('web3');
    $scriptPath = './' . ltrim($scriptRelativePath, '/');
    $logPath = storage_path('logs/web3.log');

    $argumentString = '';
    if (!empty($arguments)) {
        $argumentString = ' ' . implode(' ', array_map('escapeshellarg', $arguments));
    }

    return sprintf(
        '(cd %s && node %s%s) 2>> %s',
        escapeshellarg($web3Directory),
        escapeshellarg($scriptPath),
        $argumentString,
        escapeshellarg($logPath)
    );
}
```

**Why**: Prevents command injection. User input MUST be escaped before exec().

## Directory Structure

```
lbazaar/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── API/              # API endpoints (Sanctum auth)
│   │   │   ├── Admin/            # Admin dashboard
│   │   │   └── Portal/           # User portal
│   │   └── Requests/             # Form validation
│   ├── Services/API/             # Business logic layer
│   ├── Repositories/             # Data access layer
│   └── Models/                   # Eloquent models
├── resources/
│   └── js/
│       ├── pages/                # Inertia page components
│       ├── components/           # Reusable React components
│       └── store/                # Redux state management
├── web3/
│   ├── run/                      # CLI entry points
│   ├── common/                   # Shared utilities
│   └── contracts/                # Helios smart contracts
├── tests/
│   ├── Unit/Services/API/        # Service unit tests
│   └── Feature/                  # Integration tests
├── database/
│   ├── migrations/               # Database schema
│   └── seeders/                  # Seed data
└── docs/                         # Documentation
```

## Technology Stack Summary

| Layer | Technologies |
|-------|-------------|
| **Client** | React 18, Inertia.js, Material-UI 5, Redux Toolkit, Vite |
| **Application** | Laravel 9, PHP 8.2, MySQL 8, Laravel Sanctum, Laratrust |
| **Blockchain** | Node.js 22, Helios, Blockfrost API, Cardano (Preprod/Mainnet) |
| **DevOps** | Docker (Laravel Sail), Nix, AWS S3 |

## Architectural Constraints

### 1. Layer Boundaries

**Enforced Rules**:
- Controllers MUST NOT query database directly (use repositories)
- Services MUST NOT return HTTP responses (return arrays)
- Web3 scripts MUST NOT access MySQL (stateless)
- React components MUST NOT call Laravel models (use props or API)

### 2. Transaction Management

**Critical**: Use `DB::transaction()` for multi-step operations to prevent race conditions.

Example:
```php
DB::transaction(function () use ($course, $student) {
    $wallet = $student->userWallet()->lockForUpdate()->first();
    $wallet->points -= $course->cost_points;
    $wallet->save();
    $course->enrollments()->create(['user_id' => $student->id]);
});
```

### 3. Cardano Transaction Constraints

**Business Rules**:
- `MIN_ADA=2000000` lovelace (2 ADA) per UTXO
- `MAX_TX_FEE=500000` lovelace (0.5 ADA)
- `MIN_CHANGE_AMT=1000000` lovelace (1 ADA)
- Transaction TTL: 30 minutes

These are enforced in `.env` and read by web3 scripts.

## Authentication & Authorization

### Authentication (Laravel Sanctum)

- **API Tokens**: Stored in `personal_access_tokens` table
- **Usage**: `Authorization: Bearer {token}` header
- **Middleware**: `auth:sanctum` on protected routes

### Authorization (Laratrust RBAC)

**Roles**:
- `admin` - Full system access
- `teacher` - Course management, certificate minting
- `student` - Course enrollment, certificate viewing

**Check Pattern**:
```php
if (!Auth::user()->hasRole('teacher')) {
    abort(403, 'Unauthorized');
}
```

## Cross-References

- **Data Flows**: See [docs/data-flows.md](./data-flows.md) for complete request-response flows
- **Patterns**: See [docs/patterns.md](./patterns.md) for code conventions and anti-patterns
- **Integrations**: See [docs/integrations.md](./integrations.md) for Blockfrost, AWS S3
- **Testing**: See [docs/testing.md](./testing.md) for test structure
- **Deployment**: See [docs/deployment.md](./deployment.md) for production deployment
