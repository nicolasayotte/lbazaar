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
- `tests/` - PHPUnit tests + Playwright browser tests (`tests/Browser/`)
- `database/` - Migrations, seeders
- `docs/` - Architecture, testing, deployment, patterns, integrations, gotchas
- `docker-build/` - Production Docker builds

## Commands

```bash
sail up -d                    # Start Docker environment (required first)
sail artisan migrate          # Run migrations
sail composer test            # PHP tests (parallel, 8 workers — full suite)
sail test --filter=TestClass  # PHP tests (serial — single test/class)
cd web3 && npm test           # Web3 tests
./test-prod.sh full-test      # Local production testing (REQUIRED before deploy)
```

## Standards

- **Thin controllers**: Delegate all logic to services (Controller → Service → Repository → Model)
- **Inertia forms**: Use `Inertia.post(url, data)` NOT HTML form submit (causes page reload)
- **Web3 calls**: PHP services call Node.js scripts via `exec()` — errors returned as JSON to stdout
- **Cardano MIN_ADA**: All UTXOs require minimum 2M lovelace (`MIN_ADA=2000000` in .env)
- **Tests first**: Write tests before code, run full suite before commits
- **Git workflow**: Feature branches from `dev`, PRs to `dev`, releases to `main`

## Notes

- **Docker required**: Sail must be running for all commands
- **Vite dev server**: Run `npm run dev` in Sail for React hot reload
- **Debugging logs**: `storage/logs/laravel.log` and `storage/logs/web3.log` — accessible on host directly
- **DB transactions**: Use `lockForUpdate()` for race conditions (see `docs/patterns.md`)
- **.env required**: Copy `.env.example` to `.env` and configure `BLOCKFROST_API_KEY`, `ROOT_KEY`, `OWNER_PKH`
- **Production testing**: ALWAYS run `./test-prod.sh full-test` before deploying

## Workflow

When implementing multi-part features:
1. Decompose into independent subproblems with shared architectural constraints
2. Spawn parallel **planner agents** (one per subproblem) via Task tool
3. Collect plans, resolve file-overlap conflicts, produce unified task list
4. Spawn parallel **builder agents** for independent tasks via Task tool
5. Sequence tasks that touch shared files; parallelize the rest

Agents: `.claude/agents/planner.md`, `.claude/agents/builder.md`, `.claude/agents/devops.md`

## Documentation

Read `docs/index.md` for full navigation. Before any task, read the relevant doc:
- `docs/architecture.md` · `docs/patterns.md` · `docs/testing.md` · `docs/gotchas.md`
- `docs/getting-started.md` · `docs/deployment.md` · `docs/integrations.md` · `docs/data-flows.md`

Only read what's relevant to your current task.
