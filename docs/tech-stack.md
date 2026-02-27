# Tech Stack

> **AI Context Summary**: Laravel 9 (PHP 8.2) + React 18 + Inertia.js (legacy adapter `@inertiajs/inertia` v0.11.1, NOT `@inertiajs/react` v2.x) + MySQL 8 + Node.js 22 (web3). Critical: use `Inertia.post()` from `@inertiajs/inertia` — the v2 `router` API is not installed. Test via PHPUnit 9.5 (`sail composer test`, parallel), Vitest 0.34.6 (`npm test`), Playwright 1.58.2 (`npm run test:browser`). Web3 dir has its own `package.json` — always run `cd web3 && npm install` separately.

## Backend

| Tool | Version | Purpose |
|------|---------|---------|
| PHP | 8.2 | Server language |
| Laravel | 9.19+ | Framework |
| MySQL | 8 | Primary database |
| Laravel Sanctum | 3.0 | API bearer token auth |
| Laratrust | 7.1 | RBAC (roles: admin, teacher, student) |
| Stripe PHP | 19.3 | Payment processing |
| Maatwebsite Excel | 3.1 | CSV export (`UserController`) |
| PHPUnit | 9.5 | Test framework |
| ParaTest | 6.11 | Parallel PHPUnit runner (8 workers) |
| Laravel Pint | 1.0 | PHP code style (PSR-12) |
| Guzzle | 7.2 | HTTP client (Blockfrost calls) |

**Directory conventions**:
- `app/Http/Requests/` — Form Request validation classes (all validation here, never in controllers)
- `app/Services/API/` — Business logic (single source of truth per domain)
- `app/Repositories/` — Complex database queries
- `app/Models/` — Eloquent models

## Frontend

| Tool | Version | Purpose |
|------|---------|---------|
| React | 18.2 | UI framework |
| `@inertiajs/inertia` | 0.11.1 | Inertia core (legacy adapter) |
| `@inertiajs/inertia-react` | 0.8.1 | Inertia React bindings (legacy) |
| Material-UI (MUI) | 5.10+ | Component library |
| Redux Toolkit | 1.9.1 | Global state management |
| Vite | 3 | Dev server and build tool |
| Axios | 1.6.2 | HTTP client (XHR requests) |
| Vitest | 0.34.6 | Unit/component test runner |
| Playwright | 1.58.2 | Browser (E2E) tests |

**IMPORTANT — Inertia legacy adapter**: This project uses `@inertiajs/inertia` v0.11.1, the pre-v1 legacy adapter. Do NOT use `@inertiajs/react` patterns (v2.x `router`, `useForm`, etc.).

```javascript
// ✅ CORRECT — legacy adapter (installed)
import { Inertia } from '@inertiajs/inertia';
Inertia.post('/route', data);
Inertia.patch('/route', data);
Inertia.delete('/route');

// ❌ WRONG — v2 API (not installed)
import { router } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
```

## Blockchain Layer

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 22 | Script runtime |
| Helios | latest | Cardano smart contract compiler |
| Blockfrost | via HTTP | Cardano data API (preprod/mainnet) |

- All scripts use **ES Modules** (`.mjs` extension, `import`/`export`, no CommonJS `require()`)
- `web3/package.json` and `web3/node_modules/` are completely separate from root
- Vitest config lives in `web3/vitest.config.mjs`
- Test files use `.spec.mjs` extension (not `.test.mjs`)

## DevOps & Infrastructure

| Tool | Purpose |
|------|---------|
| Laravel Sail (Docker) | Development environment |
| Nix Flakes | Host machine tooling (non-Docker tools) |
| AWS S3 + Flysystem | Certificate/file storage |
| GitHub Actions | CI/CD |

## Package Management

```bash
# PHP packages
composer install            # Install dependencies
./vendor/bin/pint           # Format PHP (PSR-12)

# Frontend (root — React/Vite/Playwright)
npm install                 # Install frontend dependencies
npm run dev                 # Vite dev server
npm run build               # Production build

# Blockchain (separate — always install separately)
cd web3 && npm install      # Install blockchain dependencies
```

**After cloning**: run both `npm install` (root) AND `cd web3 && npm install`.

## Key Configuration Files

| File | Purpose |
|------|---------|
| `composer.json` | PHP dependencies |
| `package.json` | Frontend + Playwright dependencies |
| `web3/package.json` | Blockchain script dependencies |
| `vite.config.js` | Vite/React build config |
| `vitest.config.js` | Frontend test config |
| `web3/vitest.config.mjs` | Web3 test config |
| `playwright.config.js` | Browser test config |
| `phpunit.xml` | PHP test config (8 parallel workers) |
| `.env` | Environment (BLOCKFROST_API_KEY, ROOT_KEY, STRIPE_SECRET, etc.) |

## Cross-References

- Testing setup: `docs/testing.md`
- Architecture overview: `docs/architecture.md`
- Getting started: `docs/getting-started.md`
- Blockchain integration: `docs/certificate-minting-api.md`
