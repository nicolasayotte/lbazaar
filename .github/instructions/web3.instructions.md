---
applyTo: "web3/**/*"
---

# Copilot Instructions for `/web3` Cardano Tooling

## Scope & Responsibilities

- Manage code inside `/web3` that builds CLI runners for Cardano operations invoked via `exec` from the Laravel backend.
- Respect the separation between PHP orchestrators and Node-based scripts; keep shell-facing logic in `/web3/run` and reusable helpers in `/web3/common`.
- Document every new executable entry point in `/docs` with usage, required environment variables, and expected JSON contract inputs/outputs.
- Use `/docs/nkmr-api-docs.md` and `/docs/blockfrost-api-docs.md` as the source of truth for NMKR and Blockfrost API references when implementing or updating integrations.

## Command Execution Safety

- Never call `exec` directly from Node scripts; expose explicit functions that validate, sanitize, and assemble command arguments before handing them to the shell wrappers used by PHP.
- Whitelist binaries and script entry points. Reject unexpected arguments, ensure numeric inputs are cast, and escape filesystem paths with `path.resolve`.
- Impose sensible defaults for timeouts and propagate them back to Laravel so queued jobs cannot hang indefinitely.
- Capture stdout/stderr separately, return structured JSON responses, and avoid leaking sensitive CLI flags or mnemonics in logs.

## Configuration & Secrets

- All environment-dependent values must be read from `/web3/config/*.json` or `.env` files consumed through `dotenv`. Never hardcode network IDs, payment keys, or API tokens.
- Update `.env.example` and `docs/` when adding new variables (e.g., `CARDANO_NODE_SOCKET_PATH`, `NMKR_API_KEY`).
- For certificate or token minting flows, reference the authoritative schemas in `/templates/*.json` and ensure new fields stay backward compatible.

## Development Workflow

- Install dependencies with `npm install` inside `/web3`. Use the existing `package.json` scripts—prefer `npm run build` for TypeScript compilation and `npm run lint` for static checks.
- Keep TypeScript strictness enabled; define reusable types for command payloads under `/web3/common/types.ts`.
- When introducing new Cardano command wrappers, add unit coverage under `/web3/common/__tests__/` and verify with `npm run test`.
- Regenerate compiled artifacts in `/web3/run` only through build scripts; do not edit generated files by hand.

## Laravel Integration

- PHP services using these scripts should live under `app/Services/Web3` (or equivalent) and call a dedicated runner class that centralizes `exec` usage.
- Always bubble up command exit codes, stderr, and parsed stdout to the Laravel caller. Provide actionable error messages and surface retry hints for transient failures.
- When adding job dispatchers or queue workers, specify retry counts, backoff, and failure logging consistent with broader queue configuration.

## Operational Checks

- Provide smoke tests or scripts that can be executed inside Sail/CI to verify wallet connectivity and network parameters.
- Before merging contract changes, run integration smoke scripts against the Cardano testnet and capture output snippets in PR notes.
- Coordinate with DevOps before adjusting Docker or Nix build files that package the `/web3` utilities.
