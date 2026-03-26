# Le Bazaar Documentation

> **AI Context Summary**: Le Bazaar is a Cardano-integrated e-learning platform (Laravel 9 + React 18 + Cardano blockchain). Three-tier architecture: Client (Inertia.js) → Application (Laravel services) → Blockchain (Node.js/Helios). Start with [getting-started.md](./getting-started.md) for setup, [architecture.md](./architecture.md) for system overview. 16 core docs plus reference files covering architecture, testing, deployment, patterns, integrations, authentication, API reference, tech stack, agent workflow, and data flows.

## Quick Start

New to Le Bazaar? Start here:

1. **[Getting Started](./getting-started.md)** - Setup development environment
2. **[Architecture](./architecture.md)** - Understand system structure
3. **[Data Flows](./data-flows.md)** - See how data moves through the system

## All Documentation

| Document | Description | When to Read |
|----------|-------------|--------------|
| **[Getting Started](./getting-started.md)** | Installation, configuration, first run | Setting up development environment |
| **[Architecture](./architecture.md)** | System structure, layers, components | Understanding codebase organization |
| **[Tech Stack](./tech-stack.md)** | Languages, frameworks, versions, tooling | Knowing what's installed and why |
| **[Authentication](./authentication.md)** | Session auth, Sanctum tokens, RBAC roles | Implementing auth or protected routes |
| **[API Reference](./api.md)** | All `/api/*` endpoints, auth tiers, responses | Building or testing API features |
| **[Data Flows](./data-flows.md)** | Request-response flows, key user journeys | Implementing features that span layers |
| **[Patterns](./patterns.md)** | Code conventions, anti-patterns | Writing new code or reviewing PRs |
| **[Testing](./testing.md)** | Test strategy, writing tests, running tests | Adding tests or debugging test failures |
| **[Deployment](./deployment.md)** | Production deployment, rollback, monitoring | Deploying to staging or production |
| **[Integrations](./integrations.md)** | Blockfrost, AWS S3, Stripe, Sanctum | Working with external services |
| **[Gotchas](./gotchas.md)** | Common issues and solutions | Debugging or avoiding common mistakes |
| **[Workflow](./workflow.md)** | Planner/builder agent orchestration pattern | Multi-part feature implementation |
| **[Certificate Minting API](./certificate-minting-api.md)** | NFT certificate minting via Helios | Implementing certificate features |
| **[Local Production Testing](./LOCAL_PROD_TESTING.md)** | Test prod build locally with `./test-prod.sh` | Before deploying to production |
| **[E2E Test Status](./e2e-test-status.md)** | Playwright test coverage map (115 scenarios) | Checking E2E test coverage or adding new tests |
| **[Dependency Audit](./dependency-audit-2026-02.md)** | Feb 2026 audit: critical/high/medium upgrade risks | Planning dependency upgrades |
| **[Sanctum Token Expiration](./sanctum-token-expiration.md)** | Token lifecycle, rotation, pruning | Configuring API token security |
| **[Secrets Manager Migration](./secrets-manager-migration.md)** | ROOT_KEY & secrets in AWS Secrets Manager | Moving secrets off .env files |

## Documentation by Role

### For New Developers

Read in this order:
1. [Getting Started](./getting-started.md) - Setup your environment
2. [Architecture](./architecture.md) - Understand the system
3. [Tech Stack](./tech-stack.md) - Know what's installed
4. [Patterns](./patterns.md) - Learn coding conventions
5. [Gotchas](./gotchas.md) - Avoid common mistakes

### For Backend Developers (PHP/Laravel)

Focus on:
- [Architecture](./architecture.md) - Service layer, controllers, repositories
- [Patterns](./patterns.md) - Thin controller pattern, service responses
- [Authentication](./authentication.md) - Sanctum tokens, RBAC
- [API Reference](./api.md) - Endpoint contracts and auth tiers
- [Testing](./testing.md) - PHPUnit tests
- [Data Flows](./data-flows.md) - See service layer in action

**Key Files to Review**:
- `app/Services/API/CertificateService.php` - Example service
- `app/Http/Controllers/API/CertificateController.php` - Example controller
- `tests/Unit/Services/API/CertificateServiceTest.php` - Example test

### For Frontend Developers (React/Inertia.js)

Focus on:
- [Architecture](./architecture.md) - Client layer, Inertia.js patterns
- [Patterns](./patterns.md) - Inertia form submissions
- [Gotchas](./gotchas.md) - Inertia-specific issues

**Key Files to Review**:
- `resources/js/pages/Portal/Courses/Index.jsx` - Example page
- `resources/js/components/CourseCard.jsx` - Example component
- `resources/js/store/coursesSlice.js` - Redux example

### For Blockchain Developers (Web3/Cardano)

Focus on:
- [Architecture](./architecture.md) - Blockchain layer
- [Certificate Minting API](./certificate-minting-api.md) - Helios integration
- [Integrations](./integrations.md) - Blockfrost API
- [Patterns](./patterns.md) - Web3 script output contract

**Key Files to Review**:
- `web3/run/build-certificate-tx.mjs` - Transaction building
- `web3/run/submit-certificate-tx.mjs` - Transaction submission
- `web3/common/utils.mjs` - Utility functions
- `web3/contracts/nft-minting-policy.hl` - Helios smart contract

### For DevOps/Infrastructure

Focus on:
- [Deployment](./deployment.md) - Deployment procedure, rollback
- [Local Production Testing](./LOCAL_PROD_TESTING.md) - Pre-deployment testing
- [Getting Started](./getting-started.md) - Environment setup
- [Integrations](./integrations.md) - AWS S3, email configuration

**Key Files to Review**:
- `docker-compose.yml` - Docker configuration
- `.env.example` - Environment variables
- `./test-prod.sh` - Production testing script

### For QA/Testers

Focus on:
- [Testing](./testing.md) - Test strategy, running tests
- [E2E Test Status](./e2e-test-status.md) - Playwright coverage map
- [Data Flows](./data-flows.md) - User journeys to test
- [Gotchas](./gotchas.md) - Known issues

**Test Commands**:
```bash
sail composer test           # Backend tests (parallel, 8 workers)
cd web3 && npm test         # Web3 tests
npm run test:browser        # Playwright E2E browser tests
./test-prod.sh full-test    # Production build test
```

## Project Structure

```
lbazaar/
├── app/                     # Laravel backend
│   ├── Http/Controllers/    # Controllers (thin)
│   ├── Services/API/        # Business logic
│   ├── Models/              # Eloquent models
│   └── ...
├── resources/js/            # React frontend
│   ├── pages/               # Inertia page components
│   ├── components/          # Reusable components
│   └── store/               # Redux state
├── web3/                    # Cardano blockchain
│   ├── run/                 # CLI entry points
│   ├── common/              # Utilities
│   └── contracts/           # Helios smart contracts
├── tests/                   # PHPUnit tests
├── database/                # Migrations, seeders
├── docs/                    # This documentation
└── CLAUDE.md                # Lean project guide for AI
```

## Technology Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 18, Inertia.js, Material-UI 5, Redux Toolkit, Vite |
| **Backend** | Laravel 9, PHP 8.2, MySQL 8 |
| **Blockchain** | Node.js 22, Helios, Blockfrost API, Cardano |
| **Auth** | Laravel Sanctum, Laratrust RBAC |
| **Storage** | AWS S3, Local filesystem (dev) |
| **DevOps** | Docker (Laravel Sail), Nix, GitHub Actions |

## Key Concepts

### Layered Architecture

Le Bazaar follows strict **three-tier separation**:

```
Client (React + Inertia) → Application (Laravel) → Blockchain (Node.js)
```

See [Architecture](./architecture.md) for details.

### Thin Controller Pattern

Controllers delegate all business logic to services:

```php
Controller → Service → Repository → Model
```

See [Patterns](./patterns.md) for examples.

### Cardano Integration

PHP services call Node.js scripts via `exec()` for blockchain operations:

```
PHP Service → exec() → Node.js script → Helios → Blockfrost → Cardano
```

See [Data Flows](./data-flows.md) for complete flows.

## Common Tasks

### Adding a New Feature

1. Read [Architecture](./architecture.md) to understand where it fits
2. Read [Patterns](./patterns.md) for coding conventions
3. Create service method (business logic)
4. Create controller method (thin, delegates to service)
5. Create Form Request for validation
6. Add tests (see [Testing](./testing.md))
7. Update documentation

### Debugging an Issue

1. Check [Gotchas](./gotchas.md) for common issues
2. Check logs: `storage/logs/laravel.log`, `storage/logs/web3.log`
3. Follow debugging checklist in [Gotchas](./gotchas.md)
4. Review [Data Flows](./data-flows.md) to understand expected behavior

### Deploying to Production

1. Test locally: `./test-prod.sh full-test`
2. Read [Deployment](./deployment.md) procedure
3. Follow deployment order (DB → Web3 → Backend → Frontend → Health Check)
4. Run smoke tests
5. Monitor logs

## External Resources

- **Laravel 9**: https://laravel.com/docs/9.x
- **Inertia.js**: https://inertiajs.com/
- **React 18**: https://react.dev/
- **Helios**: https://github.com/Hyperion-BT/Helios
- **Blockfrost**: https://docs.blockfrost.io/
- **Cardano CIP-25**: https://cips.cardano.org/cips/cip25/ (NFT Metadata Standard)

## Getting Help

- **Technical Questions**: Review relevant docs above
- **Code Examples**: See "Key Files to Review" sections by role
- **Common Issues**: Check [Gotchas](./gotchas.md)
- **System Overview**: Start with [Architecture](./architecture.md)

## Contributing to Documentation

When updating docs:

1. Keep **AI Context Summary** at the top of each doc (for LLM context)
2. Use tables for structured data
3. Include code examples with file paths
4. Add cross-references to related docs
5. Update this index if adding new documents

## Document Conventions

- **Code blocks**: Always include language (`php`, `javascript`, `bash`)
- **File paths**: Use absolute paths from project root
- **Line numbers**: Include when referencing specific code
- **Examples**: Show both ❌ BAD and ✅ GOOD patterns
- **Cross-references**: Link to related documentation

---

**Generated**: This documentation was generated by Claude Code's `/creating-project-docs` skill. Keep it updated as the codebase evolves.
