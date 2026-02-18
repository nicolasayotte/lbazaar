# Le Bazaar

Cardano-integrated e-learning platform where students earn NFT certificates upon course completion. Built with a three-tier architecture separating the web client, application server, and blockchain layer.

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 18, Inertia.js, Material-UI 5, Redux Toolkit, Vite |
| **Backend** | Laravel 9, PHP 8.2, MySQL 8 |
| **Blockchain** | Node.js 22, Helios, Blockfrost API, Cardano |
| **Auth** | Laravel Sanctum, Laratrust RBAC |
| **Payments** | Stripe |
| **DevOps** | Docker (Laravel Sail), Nix, GitHub Actions |

## Quick Start

**Requirements**: Docker, Docker Compose, Node.js 22+, and optionally [Nix](https://nixos.org/). See [docs/getting-started.md](docs/getting-started.md) for detailed prerequisites and troubleshooting.

### 1. Clone and configure

```bash
git clone <repository-url>
cd lbazaar
cp .env.example .env
```

Edit `.env` — at minimum set `BLOCKFROST_API_KEY`, `ROOT_KEY`, and `OWNER_PKH`. See [docs/getting-started.md](docs/getting-started.md) for all required variables and how to obtain them.

### 2. Enter development environment

**Option A — Nix (recommended):**
```bash
nix develop
```

**Option B — Manual:** ensure PHP 8.2 and Composer are installed on your system.

### 3. Install dependencies and start containers

```bash
composer install
sail up -d
sail bash -c "npm install"
```

### 4. Set up database and app key

```bash
sail artisan migrate --seed
sail artisan key:generate
```

### 5. Install Web3 dependencies

```bash
cd web3 && npm install && cd ..
```

### 6. Start Vite dev server

In a separate terminal:

```bash
sail bash
npm run dev
```

### 7. Open the app

http://localhost:8080

**Admin login**: http://localhost:8080/admin/login — `admin@lebazaar.com` / `test1234`

**Tip** — create a shell alias for convenience:
```bash
alias sail='./vendor/bin/sail'
```

## Running Tests

| Command | What it runs |
|---------|-------------|
| `sail test` | PHP unit + feature tests |
| `npm test` | Frontend Vitest |
| `cd web3 && npm test` | Web3 unit tests |
| `npm run test:browser` | Playwright browser tests |
| `npm run test:all` | All three above in sequence |
| `./test-prod.sh full-test` | Full local production build test |

See [docs/testing.md](docs/testing.md) for the full test strategy, Playwright setup, integration tests, and coverage targets.

## Deployment

Test against the **production Docker image** before deploying:

```bash
./test-prod.sh full-test
```

See [docs/deployment.md](docs/deployment.md) for the full procedure, and [docs/LOCAL_PROD_TESTING.md](docs/LOCAL_PROD_TESTING.md) for the step-by-step production test guide.

## Documentation

| Document | Description |
|----------|-------------|
| [Getting Started](docs/getting-started.md) | Installation, configuration, first run |
| [Architecture](docs/architecture.md) | Three-tier system structure |
| [Data Flows](docs/data-flows.md) | Request-response flows, user journeys |
| [Patterns](docs/patterns.md) | Thin controller pattern, service responses, anti-patterns |
| [Testing](docs/testing.md) | Dual-pipeline test strategy, Playwright setup |
| [Deployment](docs/deployment.md) | Production deployment, rollback, monitoring |
| [Integrations](docs/integrations.md) | Blockfrost, AWS S3, Stripe, Sanctum |
| [Gotchas](docs/gotchas.md) | Common issues and solutions |
| [Certificate Minting API](docs/certificate-minting-api.md) | NFT certificate minting via Helios |
| [Local Production Testing](docs/LOCAL_PROD_TESTING.md) | `./test-prod.sh` usage guide |

See [docs/index.md](docs/index.md) for the full index organized by developer role.

## Logs

- **Laravel**: `storage/logs/laravel.log`
- **Web3**: `storage/logs/web3.log`
