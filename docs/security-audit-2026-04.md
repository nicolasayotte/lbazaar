# Security Audit — Le Bazaar (April 2026)

**Date**: 2026-04-02  
**Scope**: Full codebase audit against Japan Credit Transaction Security Measures Council checklist  
**Auditor**: Internal (security agent)

---

## Payment Integration Method

- **Method**: Stripe Checkout / Payment Element (custom Stripe PaymentIntent via API, not Payment Links/Invoicing)
- **Sells goods/services online**: Yes (e-learning courses + NFT certificates)

---

## 1. Admin Access Controls & Credential Management

| Requirement | Status | Evidence |
|---|---|---|
| IP restriction OR Basic Auth on admin panel | **Not implemented** | `AdminMiddleware` checks role only; no IP allowlist, no HTTP Basic Auth layer |
| 2-step / 2-factor authentication for admin | **Not implemented** | No TOTP, SMS, or any MFA in auth flow |
| Account lockout after ≤10 failed logins | **Not implemented** | No rate limiting or lockout counter on `POST /admin/authenticate` |

---

## 2. Sensitive Files in Public Directory

| Requirement | Status | Evidence |
|---|---|---|
| No sensitive files in public/ | **Partial** | `public/` is the document root; `.env` is above it; but `public/uploads/` receives user-uploaded files with no execution blocking confirmed |
| Restrict uploadable file types/extensions | **Partial** | Course thumbnails validate `mimes:jpg,jpeg,png` — but **profile image uploads have no MIME validation** (`ProfileRequest` has no `mimes` rule; `Asset::upload()` uses client-supplied extension directly) |

---

## 3. Web Application Vulnerability Countermeasures

| Requirement | Status | Evidence |
|---|---|---|
| Regular vulnerability assessments / penetration tests | **None found** | Internal dependency audit doc exists (`docs/dependency-audit-2026-02.md`) but no pentest records |
| SQL injection protection | **Mostly implemented, one gap** | Repositories use parameterised bindings throughout; **one raw SQL injection** found: `CourseApplicationController.php:37` concatenates `$request->all()['type']` directly into `whereRaw()` |
| XSS protection | **Mostly implemented** | Inertia.js + React escape by default; CSRF protection active via Laravel middleware |
| Secure coding / source code review | **Partial** | No formal review process documented; Laravel conventions mostly followed |
| Input validation | **Partial** | Form Requests used for most endpoints; profile image upload lacks validation |

---

## 4. Malware / Antivirus

| Requirement | Status | Evidence |
|---|---|---|
| Antivirus deployed, signatures updated, regular full scans | **Not implemented** | No ClamAV, VirusTotal, or any AV integration in Docker build, CI/CD pipeline, or upload path |

---

## 5. Card Testing / Credential Stuffing Countermeasures

| Requirement | Status | Evidence |
|---|---|---|
| IP-based access restriction for suspicious IPs | **Partial** | `TrustProxies = '*'` means IP-keyed rate limiting can be bypassed via spoofed `X-Forwarded-For`; no active IP block list |
| Input attempt limits + non-revealing error messages | **Partial** | Payment errors return generic messages; **no attempt count limiting on login or payment forms** |
| EMV 3D Secure | **Not explicitly configured** | Stripe `automatic_payment_methods` used; no `request_three_d_secure: 'any'` set — left to Stripe Radar heuristics |
| Validity check attempt limits | **Not implemented** | No explicit card attempt throttling beyond Stripe's automatic limits |

> Note: Stripe's automatic fraud controls (Radar) provide baseline card testing protection, which partially satisfies the "at least one measure" requirement under this category.

---

## 6. Unauthorized Login Countermeasures

At least one measure is required. Current status per measure:

| Measure | Status |
|---|---|
| Suspicious IP blocking | Not implemented |
| 2-step / MFA authentication | Not implemented |
| Personal info confirmation on registration | Partial — email only |
| Login attempt throttling / rate limiting | **Not implemented** — `POST /admin/authenticate` and `POST /portal/authenticate` have no `throttle` middleware |
| Email/SMS notification on login or account change | **Not implemented** — no login notifications dispatched anywhere |
| Behavioral analysis | Not implemented |
| Device fingerprinting | Not implemented |
| User login functionality exists | Yes — both admin panel and portal |

**Current status: No countermeasures are implemented for unauthorized login.** This must be addressed before production use.

---

## 7. Who Implements Security

**In-house** — all security controls are implemented by the development team. No external MSSP, WAF (Cloudflare/AWS WAF), penetration testing firm, or managed security tooling is currently in use.

---

## Findings by Severity

### Critical

**C-1: SQL injection — `CourseApplicationController.php:37`**  
`$request->all()['type']` concatenated directly into `whereRaw()` on an unauthenticated endpoint.  
Fix: `whereRaw("UPPER(name) LIKE ?", ['%' . strtoupper($inputs['type']) . '%'])`

**C-2: `APP_DEBUG=true` in production**  
Files: `.env.production:4`, `.env.staging:4`  
Exposes full stack traces, SQL queries, and environment variable values on any unhandled error.  
Fix: Set `APP_DEBUG=false` in both environments.

**C-3: Production credentials committed to repository**  
File: `.env.production`  
Live RDS password, AWS IAM key pair, SES SMTP credentials, Cardano mainnet mnemonic (24 words), ROOT_KEY, APP_KEY, and webhook URLs are all committed in plaintext.  
Fix: Rotate all credentials immediately. Remove file from git history (`git filter-repo`). Move secrets exclusively to AWS Secrets Manager injected at container start.

### High

**H-1: No rate limiting on login endpoints**  
`POST /admin/authenticate` and `POST /portal/authenticate` have no `throttle` middleware and no account lockout logic. Unlimited credential guessing is possible.  
Fix: Apply `throttle:5,1` middleware; implement 15-minute lockout after 10 cumulative failures per email address using `RateLimiter`.

**H-2: Admin API routes lack defence-in-depth role check**  
`/api/admin/*` routes use `auth:sanctum` only at the route level; role enforcement is pushed into Form Request `authorize()` methods. A future admin route added without the correct Form Request would have no role check.  
Fix: Add a dedicated `admin` middleware group at the route level.

**H-3: Profile image upload accepts any file type**  
`ProfileRequest` has no `mimes` rule; `Asset::upload()` uses `getClientOriginalExtension()` (client-controlled). An authenticated user can upload a `.php` file.  
Fix: Add `'image' => 'nullable|file|mimes:jpg,jpeg,png,gif|max:2048'` to `ProfileRequest`; validate MIME via `finfo` in `Asset::upload()`; block PHP execution in `public/uploads/` via nginx config.

**H-4: Unauthenticated `/api/votes/register` endpoint**  
`authorize()` returns `true` unconditionally. Any caller who knows a valid `vote_id` can register fabricated vote results, triggering teacher/course approval workflows and sending approval emails.  
Fix: Add `auth:sanctum` middleware or a shared secret verification.

**H-5: `composer-setup.php` present in application root**  
Included in Docker image build. Should not be in the repository.

### Medium

**M-1: No IP restriction or MFA on admin panel** — see Section 1 above.

**M-2: Session cookie `Secure` flag not set**  
`SESSION_SECURE_COOKIE` not present in `.env.production`. Session cookies transmitted over HTTP before HTTPS redirect fires.  
Fix: Set `SESSION_SECURE_COOKIE=true` in production `.env`.

**M-3: No account lockout after repeated failed logins** — see H-1.

**M-4: `TrustProxies = '*'`**  
File: `app/Http/Middleware/TrustProxies.php:15`  
Any `X-Forwarded-For` header is trusted, allowing IP-keyed rate limits to be bypassed by spoofing.  
Fix: Restrict to actual ELB/load balancer IP range.

**M-5: `SESSION_DRIVER=file` in production**  
Sessions stored as plaintext files on container filesystem; lost on container restart.  
Fix: Switch to `database` or `redis` with `SESSION_ENCRYPT=true`.

**M-6: No login notification or device fingerprinting**  
No email/SMS sent on new login or account change. No session IP/UA logging.

**M-7: `Authenticate` middleware logic error**  
File: `app/Http/Middleware/Authenticate.php:18`  
`strpos(...) >= -1` is always `true` (since `false >= -1` in PHP). All unauthenticated requests redirect to admin login instead of portal login.  
Fix: Change `>= -1` to `!== false`.

### Low / Informational

**L-1: No antivirus in pipeline or upload path** — see Section 4 above.

**L-2: Stripe keys are test keys in committed env files**  
Live keys are injected at runtime via `inject-secrets.sh`; committed files use `pk_test_*` / `sk_test_*` placeholders. Verify `inject-secrets.sh` also sets `STRIPE_WEBHOOK_SECRET`.

**L-3: No explicit EMV 3DS enforcement** — see Section 5 above.

**L-4: Laravel 9 is end-of-life** (since February 2024). No security patches for 2+ years. Document: `docs/dependency-audit-2026-02.md:13`.

**L-5: `axios` and `lodash` have pending security fixes**  
Per `docs/dependency-audit-2026-02.md:77,84,98`. Apply available patch versions within semver range.

**L-6: `google51a63c87eca9bb7e.html` exposes Search Console ownership token**  
Low-severity information disclosure.

---

---

## セキュリティ対策措置状況（日本語回答）

### 1. 管理者画面のアクセス制限と管理者の ID / PW 管理

- **アクセス可能な IP アドレスの制限またはベーシック認証**: 未実施。管理画面（`/admin`）はいかなる IP アドレスからもアクセス可能であり、HTTP ベーシック認証も設けていない。
- **二段階認証または二要素認証**: 未実施。管理者ログインに TOTP・SMS 等の多要素認証は導入していない。
- **ログイン失敗時のアカウントロック（10 回以下）**: 未実施。`POST /admin/authenticate` にはログイン試行回数の制限もアカウントロック機能も実装されていない。

### 2. データディレクトリ露出による設定不備対策

- **公開ディレクトリへの重要ファイルの非配置**: 概ね対応済み。ドキュメントルートは `public/` であり、`.env` 等の設定ファイルはその外に配置されている。ただし `public/uploads/` にユーザーアップロードファイルが保存されており、PHP 実行ブロックの設定が確認できていない。
- **アップロード可能な拡張子・ファイルの制限**: 一部対応。コース画像は `mimes:jpg,jpeg,png` で制限しているが、プロフィール画像のアップロードには拡張子・MIME タイプの検証が実装されていない（`ProfileRequest` にバリデーションルールなし）。

### 3. Web アプリケーションの脆弱性対策

- **脆弱性診断・ペネトレーションテストの定期実施**: 未実施。内部での依存関係監査ドキュメント（`docs/dependency-audit-2026-02.md`）は存在するが、外部機関によるペネトレーションテストの記録はない。
- **SQL インジェクション対策**: 概ね対応済みだが、1 件の脆弱箇所あり。`CourseApplicationController.php:37` にて `$request->all()['type']` を `whereRaw()` に直接文字列結合しており、認証なしのエンドポイントで SQL インジェクションが可能な状態。その他のリポジトリクラスはパラメータバインディングを使用している。
- **クロスサイト・スクリプティング（XSS）対策**: 概ね対応済み。React（Inertia.js）によるデフォルトのエスケープ処理と、Laravel の CSRF 保護が有効。
- **セキュアコーディング・ソースコードレビュー**: 一部対応。Laravel の規約に概ね従っているが、正式なコードレビュープロセスや入力値チェックの徹底は不十分。

### 4. マルウェア対策としてのウイルス対策ソフトの導入、運用

- **ウイルス対策ソフトの導入・シグネチャ更新・定期スキャン**: 未実施。Docker ビルド・CI/CD パイプライン・ファイルアップロード処理のいずれにも、ClamAV 等のウイルス対策ソフトは導入されていない。

### 5. 悪質な有効性確認、クレジットマスターへの対策

以下のうち 1 つ以上の対策を実施していること（Stripe 経由の決済の場合）。

- **不審な IP アドレスからのアクセス制限**: 一部対応。`TrustProxies` が `'*'`（全プロキシ信頼）に設定されているため、`X-Forwarded-For` ヘッダーの偽装により IP ベースのレート制限を回避できる状態。
- **同一アカウントからの入力制限・エラー内容の非表示**: 一部対応。決済エラーはユーザーに詳細を開示しない汎用メッセージを返しているが、試行回数制限は未実装。
- **EMV 3-D セキュア**: 未設定。`automatic_payment_methods` のみ使用しており、`request_three_d_secure: 'any'` は設定していない。3DS の適用は Stripe Radar の自動判定に委ねている。
- **有効性確認の回数制限**: 未実装。Stripe の自動制限機能（Radar）には依存しているが、アプリケーション側での明示的な制限はない。

> Stripe Radar による自動的なカードテスティング対策が基本的な防御として機能しており、上記「1 つ以上の対策」の要件を部分的に満たしている。

### 6. 不正ログイン対策

以下のうち 1 つ以上の対策を実施していること。現状はいずれも未実施。

| 対策項目 | 実施状況 |
|---|---|
| 不審な IP アドレスからのアクセス制限 | 未実施 |
| 二段階認証または多要素認証 | 未実施 |
| ユーザー登録時の個人情報確認（氏名・住所・電話番号・メールアドレス等） | 一部対応（メールアドレスのみ） |
| ログイン試行回数の制限とスロットリング | **未実施**（`POST /admin/authenticate`・`POST /portal/authenticate` にスロットルなし） |
| ログイン時またはアカウント情報変更時のメール / SMS 通知 | **未実施**（ログイン通知の実装なし） |
| 行動分析 | 未実施 |
| デバイスフィンガープリント | 未実施 |

**現状：不正ログイン対策は一切実施されていない。本番運用前に少なくとも 1 つ以上の対策を実装する必要がある。**

### 7. 委託先情報

**自社対応（従業員）**。セキュリティ対策はすべて開発チームが内製で実施している。外部の MSSP・WAF ベンダー（Cloudflare・AWS WAF 等）・ペネトレーションテスト会社・マネージドセキュリティツールは現時点で利用していない。Stripe の不正検知（Radar）は passive に機能しているが、明示的な設定は行っていない。

---

## Remediation Priority

| Priority | Item | Effort |
|---|---|---|
| P0 — Immediate | Rotate all committed credentials (C-3) | High |
| P0 — Immediate | Set `APP_DEBUG=false` (C-2) | Trivial |
| P0 — Immediate | Fix SQL injection in `CourseApplicationController.php:37` (C-1) | Low |
| P1 — Before launch | Add login throttling + account lockout (H-1, M-3) | Low |
| P1 — Before launch | Fix profile image MIME validation (H-3) | Low |
| P1 — Before launch | Restrict `TrustProxies` (M-4) | Trivial |
| P1 — Before launch | Set `SESSION_SECURE_COOKIE=true` (M-2) | Trivial |
| P1 — Before launch | Authenticate `/api/votes/register` (H-4) | Low |
| P2 — Near term | Add admin IP restriction or Basic Auth (M-1) | Medium |
| P2 — Near term | Fix `Authenticate` middleware logic (M-7) | Trivial |
| P2 — Near term | Add defence-in-depth admin role middleware (H-2) | Low |
| P3 — Planned | Upgrade from Laravel 9 EOL (L-4) | High |
| P3 — Planned | Switch session driver to database/redis (M-5) | Low |
| P3 — Planned | Add login notification emails (M-6) | Medium |
