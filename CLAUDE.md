# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Le Bazaar is an e-learning platform built with Laravel 9 (PHP 8.2) backend and React 18 frontend via Inertia.js. It integrates with Cardano blockchain for certificate minting and NFT transactions through a Node.js web3 module.

## Development Commands

### Nix Development Environment
```bash
nix develop                       # Enter Nix shell (provides PHP 8.2, Composer, Docker)
```

Run this first if executing PHP/Composer commands outside of Docker containers.

### Docker Environment (Laravel Sail)
```bash
sail up -d                        # Start containers (MySQL, PHP 8.2, Node 22)
sail bash                         # Enter Docker shell
sail artisan migrate --seed       # Run migrations and seeders
sail composer dump-autoload       # Reload environment after .env changes
```

### Frontend
```bash
npm install                       # Install dependencies (run inside sail bash)
npm run dev                       # Start Vite dev server
npm run build                     # Build production assets
```

### Backend Tests
```bash
sail test                         # Run all PHPUnit tests
sail test --filter TestName       # Run specific test
```

### Web3 Module Tests
```bash
cd web3 && npm install            # Install web3 dependencies
npm run test                      # Run Vitest suite
npm run test:watch                # Run tests in watch mode
npm run format                    # Format with Prettier
```

Test reports are saved to `docs/test-reports/`.

### Local Production Testing
Before deploying to staging/production, test with the production Docker image locally:

```bash
./test-prod.sh full-test      # Complete pre-deployment test suite
```

**Why:** Catches environment differences (Nginx vs Apache, Alpine vs Ubuntu, missing PHP extensions). See `docs/LOCAL_PROD_TESTING.md` for full documentation.

## Architecture

### Backend (Laravel)
- **Controllers**: `app/Http/Controllers/` with Admin, API, and Portal subdirectories
- **Services**: `app/Services/API/` for business logic (WalletService, CertificateService, etc.)
- **Repositories**: `app/Repositories/` for data access
- **Auth**: Laravel Sanctum (token-based) + Laratrust (RBAC)

### Frontend (React)
- **Pages**: `resources/js/pages/`
- **Components**: `resources/js/components/`
- **State**: Redux Toolkit in `resources/js/store/`
- **Routing**: Inertia.js handles client-server routing

### Web3 Module (Cardano Integration)
- **Entry Points**: `web3/run/` - CLI runners invoked via exec from Laravel
- **Shared Utilities**: `web3/common/` - reusable helpers
- **Initialization**: `web3/init/` - wallet/key generation scripts
- Uses Blockfrost API and Helios for PlutusScript smart contracts

### Data Flow
PHP services in `app/Services/API/` orchestrate calls to Node scripts in `web3/run/`. Scripts return structured JSON; errors bubble up with exit codes and stderr.

## Key Conventions

- Business logic in service classes, keep controllers thin
- Form Requests for validation, Policies for authorization
- Migrations required for all schema changes; update model `$fillable` and factories
- Translations must be added to both `lang/en` and `lang/ja`
- Never commit secrets; document new env vars in `.env.example` and `config/services.php`

## Web3 Specifics

- Environment values from `web3/config/*.json` or `.env` via `node --env-file`
- Generate keys: `cd web3/init && ENTROPY="24 word seed" node ./generate-private-key.mjs`
- Key env vars: `BLOCKFROST_API_KEY`, `NETWORK` (preprod/mainnet), `ROOT_KEY`, `OWNER_PKH`, `NMKR_API_KEY`
- Document new scripts in `/docs` with usage and JSON contract specs

## Custom Agents

This repo has custom agents in `.claude/agents/` for optimized context handling:

- **Planner** (`.claude/agents/planner.md`): Explores codebase and creates detailed task files in `tasks/XXX-task-name.md`
- **Builder** (`.claude/agents/builder.md`): Executes task files without exploration, knows full tech stack

Usage:
```bash
claude --agent planner "Add certificate download feature"
claude --agent builder "tasks/001-certificate-download.md"
```

Multiple builders can run in parallel on different task files.

## Local Access

- App: http://localhost:8080
- Admin: http://localhost:8080/admin/login (admin@lebazaar.com / test1234)
- Database: `sail mysql`
