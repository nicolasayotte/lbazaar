# Copilot Custom Instructions

## Repository Overview
- Laravel 10 backend with Sanctum auth, queues, and scheduled jobs. Frontend uses React (Vite + Inertia) compiled via `npm run dev` inside Sail.
- Postgres and Redis run through Laravel Sail. Storage for uploads lives in `public/uploads`; respect existing disk configuration when adding files.
- Keep the `/docs` knowledge base current with any new external integration (Cardano, NMKR, payments, etc.).

## Backend (Laravel) Guidelines
- Follow PSR-12 and Laravel conventions for controllers, services, repositories, and jobs. Prefer dependency injection over facades except where idiomatic (e.g., `Log`, `Storage`).
- Business logic belongs in service classes under `app/Services` or repositories under `app/Repositories`; keep controllers thin.
- Always create and run database migrations for schema changes. Mirror new attributes in the corresponding model `$fillable`, casts, and JSON resources.
- Update factories in `database/factories` when models change. Use factories (and states) in tests and seeders instead of hard-coded values.
- Queueable work should implement `ShouldQueue` and specify retry/timeout behavior. Use `dispatchSync` only when absolutely necessary.
- Validate all incoming data with Form Requests; ensure authorization policies live under `app/Policies` and link via `AuthServiceProvider`.
- When touching Cardano/NMKR logic in PHP, document the flow in `docs/` and ensure secrets are read from config (`config/services.php`) env keys.

## Frontend (React + Vite) Guidelines
- Components live under `resources/js`. Keep pages in `Pages/` and shared UI in `Components/`. Re-use hooks where possible; create them under `resources/js/hooks`.
- Type everything with TypeScript definitions located alongside components (`.d.ts`) or in shared `types.ts` files.
- Keep Tailwind utility usage consistent; prefer extracting shared styles into components over long utility chains.
- Handle API calls through Inertia actions or dedicated API helpers; centralize error handling and toast notifications.
- Whenever you add or rename routes, update both Laravel routes in `routes/` and matching frontend usages.

## Testing Strategy
- Spin up services with `./vendor/bin/sail up -d`. In another shell run `./vendor/bin/sail bash` then `npm install` (first run) and `npm run dev` for asset builds.
- Run backend tests with `./vendor/bin/sail test`. Use `--filter` for targeted suites and add new tests for every bug fix or feature.
- For feature tests hitting HTTP endpoints, seed data via factories and use `withoutExceptionHandling()` only inside the specific test block.
- Snapshot, browser, or Dusk tests require a maintainer sign-off before adding extra dependencies.

## Frontend & Build Checks
- Run `npm run lint` and `npm run test` (if configured) before pushing frontend changes. Keep Vite build (`npm run build`) clean of warnings.
- Ensure Inertia pages render both server-side props and client transitions without runtime errors.

## Documentation & Localization
- Update relevant entries in `docs/` any time you touch external APIs, blockchain interactions, or environment setup.
- Keep translations synchronized between `lang/en` and `lang/ja`. Missing keys must be added to both locales.

## Security & Compliance
- Never commit secrets. Use `.env.example` to document new environment variables and update `config/services.php` accordingly.
- Sanitize and validate all user-controlled input. For file uploads, enforce mime/size limits and store using Laravel Filesystem.
- When using `exec` or shell commands, encapsulate them in dedicated service classes, whitelist arguments, and log failures without leaking secrets.

## Contribution Workflow
- Branch naming: `feature/<slug>`, `fix/<slug>`, or `hotfix/<slug>` depending on scope. Reference Jira ticket IDs where applicable.
- Open PRs with: summary, testing evidence (commands + results), screenshots for UI changes, and checklist of touched docs/tests.
- Request at least one reviewer. Keep commits focused; rebase instead of merge when cleaning history.

## Web3 & Blockchain
- High-level practices for `/web3` live in `.github/copilot-web3-instructions.md`. Review that file before editing shell-executed Cardano logic.
- Ensure any backend glue code interacting with `/web3` command runners includes timeout handling and surfaces structured errors.

## Quick Test Commands
- Backend: `./vendor/bin/sail test`
- Specific test: `./vendor/bin/sail test --filter FeatureName`
- Frontend: `npm run lint`, `npm run test`
- Combined smoke: run backend tests, then `npm run build` inside Sail to ensure assets compile.