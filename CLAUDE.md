# Le Bazaar Project Context

Work methodically: read relevant docs before tasks, validate assumptions, test thoroughly.

## About This Project

**Le Bazaar**: Cardano-integrated e-learning platform where students earn NFT certificates.

**Stack**: Laravel 9 (PHP 8.2) + React 18 + Inertia.js + MySQL + Node.js + Helios (Cardano).

**Architecture**: Three-tier separation: Client (React/Inertia) → Application (Laravel services) → Blockchain (Node.js scripts).

## Key Directories

- `app/` - Laravel backend (Controllers → Services → Models)
- `resources/js/` - React frontend (pages/, components/, store/)
- `web3/` - Cardano blockchain (run/ scripts, contracts/ Helios, common/ utils)
- `tests/` - PHPUnit tests
- `database/` - Migrations, seeders
- `docs/` - Comprehensive documentation (architecture, testing, deployment, patterns, integrations, gotchas)
- `docker-build/` - Production Docker builds

## Commands

```bash
sail up -d                    # Start Docker environment
sail artisan migrate          # Run migrations
sail composer test            # PHP tests (parallel, 8 workers — full suite)
sail test --filter=TestClass  # PHP tests (serial — single test/class)
cd web3 && npm test           # Web3 tests
./test-prod.sh full-test      # Local production testing (REQUIRED before deploy)
sail bash                     # Enter container shell
```

**Always run `sail up -d` before other commands.**

## Standards

- **Thin controllers**: Delegate all logic to services (Controller → Service → Repository → Model)
- **Inertia forms**: Use `Inertia.post(url, data)` NOT HTML form submit (causes page reload)
- **Web3 calls**: PHP services call Node.js scripts via `exec()` - errors returned as JSON to stdout
- **Cardano MIN_ADA**: All UTXOs require minimum 2M lovelace (set in .env: `MIN_ADA=2000000`)
- **Tests first**: Write tests before code, run full suite before commits
- **Git workflow**: Feature branches from `dev`, PRs to `dev`, releases to `main`

## Playwright Browser Tests

Multi-project setup in `playwright.config.js`:
- **Setup projects** (`auth/student.setup.js`, `auth/teacher.setup.js`, `auth/admin.setup.js`) — log in and save `storageState` to `tests/Browser/fixtures/{role}.json`
- **Test projects** — load saved session, start pre-authenticated
- **Seeder required**: `sail artisan db:seed --class=PlaywrightTestSeeder` (creates `pw-{role}@example.com` / `Test1234!`)
- **Helpers**: `tests/Browser/helpers/wait-for-app.js` (`waitForApp`, `waitForInertiaNavigation`), `tests/Browser/helpers/test-users.js` (`TEST_USERS`, `STORAGE_STATE`)
- **Page Objects**: `tests/Browser/pages/LoginPage.js`
- Unauthenticated tests live in `tests/Browser/*.spec.js`; authenticated tests in `tests/Browser/auth/` (student) or `tests/Browser/admin/` (admin)

## Notes

- **Docker required**: Sail must be running for all commands
- **Vite dev server**: Run `npm run dev` in Sail for React hot reload
- **Web3 setup**: Run `cd web3 && npm install` after composer install
- **Production testing**: ALWAYS run `./test-prod.sh full-test` before deploying (catches Alpine/Nginx issues)
- **Debugging logs**: When diagnosing failures, read `storage/logs/laravel.log` and `storage/logs/web3.log` — Sail bind-mounts these to the host so they're directly accessible without `sail bash`
- **DB transactions**: Use `lockForUpdate()` for race conditions (see patterns.md)
- **.env required**: Copy `.env.example` to `.env` and configure BLOCKFROST_API_KEY, ROOT_KEY, OWNER_PKH

## Documentation

**Before any task, read relevant documentation from `docs/`:**

- **Setup**: [getting-started.md](docs/getting-started.md) - Environment setup, installation
- **Architecture**: [architecture.md](docs/architecture.md) - System structure, three-tier design
- **Patterns**: [patterns.md](docs/patterns.md) - Thin controller pattern, service responses, anti-patterns
- **Testing**: [testing.md](docs/testing.md) - Test strategy, PHPUnit, Vitest, Playwright
- **Deployment**: [deployment.md](docs/deployment.md) - Production deployment procedure, rollback
- **Integrations**: [integrations.md](docs/integrations.md) - Blockfrost, AWS S3, Stripe, Sanctum
- **Data Flows**: [data-flows.md](docs/data-flows.md) - Request-response flows, user journeys
- **Gotchas**: [gotchas.md](docs/gotchas.md) - Common issues and solutions (READ THIS OFTEN)

**Read docs/index.md for comprehensive navigation by role.**

Only read what's relevant to your current task. Documentation is organized for progressive disclosure.
