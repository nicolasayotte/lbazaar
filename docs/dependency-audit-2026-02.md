# Dependency Audit -- February 2026

Audit of all dependencies across `composer.json`, `package.json`, and `web3/package.json`.

---

## Critical -- Act Now (Security/EOL Risk)

| Package | Location | Current | Latest | Gap | Effort | Payoff |
|---|---|---|---|---|---|---|
| **laravel/framework** | composer | 9.x | 12.x | 3 majors | Very High | **Essential** -- unsupported since Feb 2024, no security patches for 2 years on a payment-processing app |
| **Inertia.js (all 3 npm packages)** | npm | 0.x | 2.x | Deprecated | High | **Essential** -- packages marked "no longer supported" on npm. Migrate to `@inertiajs/react` |
| **vite** | npm | 3.x | 7.x | 4 majors | Medium | **Essential** -- EOL, no security patches. `@vitejs/plugin-react` and `laravel-vite-plugin` must follow |
| **@hyperionbt/helios** | web3 | 0.16.7 | abandoned | Abandoned | High | **Essential long-term** -- repo moved to `@helios-lang/*`, old package will break with Cardano protocol upgrades |

Laravel 9 is the biggest risk. Stripe payments and NFT certificates are running on a framework with zero security patches for 2 years. Everything else in the PHP ecosystem (PHPUnit 9->13, Sanctum 3->4, Collision 6->8, Laratrust 7->8, Inertia server-side 0.6->2.0) upgrades as a cascade from the Laravel upgrade.

---

## High -- Plan Soon (Major versions behind)

| Package | Location | Current | Latest | Gap | Effort | Payoff |
|---|---|---|---|---|---|---|
| **phpunit/phpunit** | composer | 9.x | 13.x | 4 majors | Tied to Laravel | Cascades with Laravel upgrade |
| **@mui/material** (+ icons, lab, x-date-pickers) | npm | 5.x | 7.x | 2 majors | Medium-High | Theme API changes, but codemods available |
| **react** / **react-dom** | npm | 18.x | 19.x | 1 major | Medium | Blocked by `react-quill` (uses deprecated `findDOMNode`) |
| **vitest** (root) | npm | 0.34 | 4.x | 4 majors | Low-Medium | Upgrade alongside Vite |
| **react-quill** | npm | 2.0.0 | unmaintained | Dead | Medium | Replace with `react-quill-new` or direct Quill.js -- unblocks React 19 |
| **moment** | npm | 2.29 | deprecated | Dead | Low | Already have `dayjs` -- consolidate and remove moment |

---

## Medium -- Upgrade When Convenient

| Package | Location | Current | Latest | Gap | Notes |
|---|---|---|---|---|---|
| @reduxjs/toolkit | npm | 1.x | 2.x | 1 major | ESM-first build, React 19 compat |
| react-redux | npm | 8.x | 9.x | 1 major | Updated for React 19 / RSC support |
| redux | npm | 4.x | 5.x | 1 major | Core update required by RTK 2.x |
| vitest (web3) | web3 | 3.x | 4.x | 1 major | Mocking API changes in v4 |
| santigarcor/laratrust | composer | 7.x | 8.x | 1 major | Tied to Laravel upgrade |
| laravel-lang/common | composer | 3.x | 6.x | 3 majors | Tied to Laravel upgrade |
| laravel/sanctum | composer | 3.x | 4.x | 1 major | Tied to Laravel upgrade |
| doctrine/dbal | composer | 3.x | 4.x | 1 major | Laravel 10+ may not need it at all |
| nunomaduro/collision | composer | 6.x | 8.x | 2 majors | Tied to Laravel upgrade |
| spatie/laravel-ignition | composer | 1.x | 2.x | 1 major | Tied to Laravel upgrade |
| brianium/paratest | composer | 6.x | 7.x | 1 major | Tied to PHPUnit upgrade |
| @fontsource/roboto | npm | 4.x | 5.x | 1 major | Trivial packaging change |

---

## Low / Quick Wins (Same major -- just run update)

These are all within their semver ranges. A simple `composer update` / `npm update` picks them up.

### composer.json

| Package | Current | Latest | Notes |
|---|---|---|---|
| guzzlehttp/guzzle | ^7.2 | 7.10.0 | |
| laravel/tinker | ^2.7 | 2.10.1 | |
| laravel/sail | ^1.0.1 | 1.53.0 | |
| laravel/pint | ^1.0 | 1.27.0 | |
| fakerphp/faker | ^1.9.1 | 1.24.1 | |
| mockery/mockery | ^1.4.4 | 1.6.12 | |
| league/flysystem-aws-s3-v3 | ^3.0 | 3.30.1 | |
| maatwebsite/excel | ^3.1 | 3.1.67 | |
| monarobase/country-list | ^3.3 | 3.6.0 | |
| stripe/stripe-php | ^19.3 | 19.3.0 | Current |

### package.json

| Package | Current | Latest | Notes |
|---|---|---|---|
| axios | ^1.6.2 | 1.13.5 | **Has security fix -- update now** |
| bootstrap | ^5.2.2 | 5.3.8 | CSS variables improvements in 5.3 |
| dayjs | ^1.11.7 | 1.11.19 | |
| sass | ^1.55.0 | 1.97.3 | |
| @emotion/react | ^11.10.5 | 11.14.0 | |
| @emotion/styled | ^11.10.5 | 11.14.1 | |
| postcss | ^8.1.14 | 8.5.6 | |
| lodash | ^4.17.19 | 4.17.23 | **Has prototype pollution security fix -- update now** |
| @stripe/react-stripe-js | ^5.6.0 | 5.6.0 | Current |
| @stripe/stripe-js | ^8.7.0 | 8.7.0 | Current |
| @playwright/test | ^1.58.2 | 1.58.2 | Current |
| @testing-library/* | various | various | All current |
| happy-dom | ^20.6.1 | 20.6.1 | Current |
| jsdom | ^28.1.0 | 28.1.0 | Current |
| newman | ^6.2.1 | 6.2.2 | |

### web3/package.json

| Package | Current | Latest | Notes |
|---|---|---|---|
| @blockfrost/blockfrost-js | ^6.0.0 | 6.1.0 | |
| @stricahq/bip32ed25519 | ^1.0.4 | 1.1.2 | |
| axios | ^1.6.2 | 1.13.5 | **Has security fix -- update now** |
| prettier | ^3.3.3 | 3.8.1 | |
| @cardano-foundation/cardano-verify-datasignature | ^1.0.11 | 1.0.11 | Current (stable/complete) |
| bip39 | ^3.1.0 | 3.1.0 | Current (consider `@scure/bip39` long-term) |
| blakejs | ^1.2.1 | 1.2.1 | Current (consider `@noble/hashes` long-term) |

---

## Anomaly: Remove `npm` from web3/package.json

The `npm` CLI itself (`^11.6.2`) is listed as a production dependency in `web3/package.json`. This was almost certainly added by accident and bloats `node_modules` massively. Remove it:

```bash
cd web3 && npm uninstall npm
```

---

## Recommended Upgrade Strategy

### Phase 1 -- Quick wins (1 day)

- Run `composer update` and `npm update` in all three locations to pick up patches within semver ranges
- Remove `npm` from web3 dependencies
- Remove `moment` / `@date-io/moment`, consolidate on `dayjs`
- Verify `lodash` and `axios` security patches are picked up

### Phase 2 -- Laravel upgrade (1-2 weeks)

- Laravel 9 -> 11 (skip 10, it loses support March 2026)
- This cascades: PHPUnit 10+, Sanctum 4, Collision 8, Ignition 2, Laratrust 8, Inertia server-side 2.0
- Simultaneously upgrade Inertia client-side: replace 3 deprecated packages with `@inertiajs/react` v2
- Reference: [Laravel Upgrade Guide](https://laravel.com/docs/11.x/upgrade), [Inertia v2 Upgrade Guide](https://inertiajs.com/docs/v2/getting-started/upgrade-guide)

### Phase 3 -- Build tooling (2-3 days)

- Vite 3 -> 6/7 + `@vitejs/plugin-react` + `laravel-vite-plugin`
- Vitest 0.34 -> 3.x/4.x (root) and 3.x -> 4.x (web3)

### Phase 4 -- Frontend modernization (1 week)

- Replace `react-quill` with maintained alternative (unblocks React 19)
- React 18 -> 19
- MUI 5 -> 7 (use codemods)
- Redux ecosystem: RTK 1 -> 2, react-redux 8 -> 9, redux 4 -> 5

### Phase 5 -- Blockchain (variable, when needed)

- Plan `@hyperionbt/helios` -> `@helios-lang/*` migration before next Cardano hard fork
- Consider `bip39` -> `@scure/bip39` and `blakejs` -> `@noble/hashes` for audited, maintained alternatives

---

## Key Dependencies Between Upgrades

```
Laravel 9 -> 11
├── PHPUnit 9 -> 10/11
│   └── ParaTest 6 -> 7
├── Sanctum 3 -> 4
├── Collision 6 -> 8
├── Ignition 1 -> 2
├── Laratrust 7 -> 8
├── laravel-lang/common 3 -> 6
├── Inertia server-side 0.6 -> 2.0
│   └── Inertia client-side -> @inertiajs/react 2.x
│       └── Remove @inertiajs/inertia, @inertiajs/inertia-react, @inertiajs/progress
└── doctrine/dbal 3 -> possibly removable

Vite 3 -> 7
├── @vitejs/plugin-react 2 -> 5
├── laravel-vite-plugin 0.6 -> 2.0
└── Vitest 0.34 -> 4.x

Replace react-quill
└── React 18 -> 19
    ├── react-redux 8 -> 9
    └── MUI 5 -> 7
        └── mui-file-input 1 -> 7
```
