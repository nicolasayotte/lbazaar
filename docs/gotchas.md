# Common Gotchas

> **AI Context Summary**: Top gotchas: (1) Inertia forms need `Inertia.post()` not HTML submit, (2) Cardano MIN_ADA=2M lovelace required per UTXO, (3) Always `sail up -d` before commands, (4) Web3 script errors go to stdout as JSON, (5) DB transactions prevent race conditions with `lockForUpdate()`, (6) Vite dev server must run for React assets.

## 1. Inertia.js Form Submissions

### Symptom

Form submission causes full page reload, breaking SPA behavior.

### Cause

Using regular HTML form `<form action="..." method="POST">` instead of Inertia's form helpers.

### Solution

❌ **BAD**:
```jsx
<form action="/portal/courses" method="POST">
    <input name="title" />
    <button type="submit">Create</button>
</form>
```

✅ **GOOD**:
```jsx
import { Inertia } from '@inertiajs/inertia';

const [formData, setFormData] = useState({ title: '' });

const handleSubmit = (e) => {
    e.preventDefault();
    Inertia.post('/portal/courses', formData, {
        onSuccess: () => console.log('Created!'),
        onError: (errors) => console.error(errors)
    });
};

<form onSubmit={handleSubmit}>
    <input value={formData.title} onChange={...} />
    <button type="submit">Create</button>
</form>
```

**Key Point**: Always use `Inertia.post()`, `Inertia.put()`, etc. for form submissions.

## 2. Cardano Minimum ADA Requirement

### Symptom

Transaction fails with error: `"MinUTxONotMet"` or `"OutputTooSmallUTxO"`.

### Cause

Cardano requires minimum 2 ADA (2,000,000 lovelace) per UTXO containing native tokens.

### Solution

Always include `MIN_ADA` when sending NFTs:

✅ **GOOD**:
```javascript
// web3/run/build-certificate-tx.mjs
const minAda = BigInt(process.env.MIN_ADA);  // 2000000

tx.addOutput(
    new TxOutput(
        recipientAddr,
        new Value(
            minAda,  // REQUIRED: 2 ADA minimum
            new Assets([[nftTokenMPH, new Map([[tokenName, BigInt(1)]])]])
        )
    )
);
```

**Environment Variable**:
```env
MIN_ADA=2000000  # 2 ADA in lovelace
```

**Reference**: See Cardano documentation on minimum UTXO value.

## 3. Docker Containers Not Running

### Symptom

- `SQLSTATE[HY000] [2002] Connection refused` (database)
- `curl: (7) Failed to connect to localhost port 8080`
- Commands fail with "service not found"

### Cause

Docker containers stopped or not started after system reboot.

### Solution

Always check and start containers:

```bash
# Check if containers are running
docker ps

# Start containers if not running
sail up -d

# Wait for MySQL to be ready (~30 seconds)
sail mysql -e "SELECT 1"
```

**Tip**: Add to startup script or run `sail up -d` at the beginning of each session.

## 4. Web3 Script Errors Not Bubbling Up

### Symptom

PHP service returns generic "Web3 script failed" but doesn't show actual error.

### Cause

Node script errors written to stderr, not stdout. PHP only reads stdout.

### Solution

✅ **GOOD**: Write errors to stdout as JSON:
```javascript
// web3/run/build-certificate-tx.mjs
try {
    // Build transaction logic
    const result = buildTransaction();

    console.error('build-certificate-tx: success');  // Debug to stderr
    process.stdout.write(JSON.stringify({
        status: 200,
        data: result
    }));

} catch (err) {
    console.error('build-certificate-tx: error', err);  // Debug to stderr
    process.stdout.write(JSON.stringify({
        status: 500,
        error: err.message  // Error to stdout as JSON
    }));
}
```

**Check Logs**:
```bash
tail -f storage/logs/web3.log
```

## 5. Database Transaction Deadlocks

### Symptom

```
SQLSTATE[40001]: Serialization failure: 1213 Deadlock found
```

### Cause

Concurrent operations on same table without proper locking.

### Solution

Use `lockForUpdate()` to prevent race conditions:

✅ **GOOD**:
```php
DB::transaction(function () use ($student, $course) {
    // Lock row to prevent concurrent modifications
    $wallet = $student->userWallet()->lockForUpdate()->first();

    if ($wallet->points < $course->cost_points) {
        throw new InsufficientPointsException();
    }

    $wallet->points -= $course->cost_points;
    $wallet->save();

    $course->enrollments()->create(['user_id' => $student->id]);
});
```

**Key Point**: Always wrap multi-step operations in `DB::transaction()` and lock critical rows.

## 6. Vite Dev Server Not Loading Assets

### Symptom

- Browser shows 404 errors for `/resources/js/app.jsx`
- React components don't render
- Console error: `Failed to load module script`

### Cause

Vite dev server not running.

### Solution

```bash
# Terminal 1: Start Docker
sail up -d

# Terminal 2: Start Vite dev server
sail bash
npm run dev
```

**Check**: Visit http://localhost:5173 - should show Vite dev server.

**Production Build**: If not developing, run `npm run build` and Vite not needed.

## 7. Missing npm Packages in Web3 Scripts

### Symptom

```
Error: Cannot find module '@hyperionbt/helios'
```

### Cause

Web3 dependencies not installed after pulling changes or fresh clone.

### Solution

```bash
cd web3
rm -rf node_modules package-lock.json
npm install
npm test  # Verify installation
```

**Tip**: Always run `cd web3 && npm install` after pulling changes that modify `web3/package.json`.

## 8. Blockfrost Rate Limiting

### Symptom

```
Error: 429 Too Many Requests
```

### Cause

Blockfrost free tier has 50 requests/second limit. Bulk operations exceed limit.

### Solution

Implement retry with exponential backoff:

✅ **GOOD**:
```javascript
async function fetchWithRetry(url, options, retries = 3, backoff = 1000) {
    try {
        const response = await fetch(url, options);

        if (response.status === 429) {  // Rate limited
            if (retries === 0) throw new Error('Rate limit exceeded');
            await new Promise(resolve => setTimeout(resolve, backoff));
            return fetchWithRetry(url, options, retries - 1, backoff * 2);
        }

        return response;

    } catch (err) {
        if (retries === 0) throw err;
        await new Promise(resolve => setTimeout(resolve, backoff));
        return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
}
```

**Alternative**: Upgrade to paid Blockfrost tier for higher limits.

## 9. Eloquent N+1 Query Problem

### Symptom

Slow page loads, hundreds of database queries for single request.

### Cause

Loading relationships in loops without eager loading.

### Example

❌ **BAD** (N+1 queries):
```php
$courses = Course::all();  // 1 query

foreach ($courses as $course) {
    echo $course->professor->name;  // N queries (1 per course)
}
```

✅ **GOOD** (2 queries):
```php
$courses = Course::with('professor')->get();  // 2 queries total

foreach ($courses as $course) {
    echo $course->professor->name;  // No extra queries
}
```

**Debug**: Enable query logging:
```php
DB::enableQueryLog();
// ... perform operations
dd(DB::getQueryLog());
```

## 10. Session Expired After Long Blockchain Operations

### Symptom

User logged out after certificate minting operation (30-60 seconds).

### Cause

Default session lifetime too short for long-running operations.

### Solution

**Option 1**: Increase session lifetime:
```env
SESSION_LIFETIME=120  # 2 hours (in minutes)
```

**Option 2**: Use Laravel queues for long operations:
```php
// Dispatch to queue instead of synchronous execution
MintCertificateJob::dispatch($course, $student);

return response()->json([
    'success' => true,
    'message' => 'Certificate minting queued. You will receive an email when complete.'
]);
```

## 11. Laravel Sail MySQL Connection Refused

### Symptom

```
SQLSTATE[HY000] [2002] Connection refused
```

### Cause

MySQL container not ready yet (takes ~30 seconds on first start).

### Solution

Wait for MySQL healthcheck:

```bash
sail up -d

# Wait for MySQL to be ready
sail mysql -e "SELECT 1"

# If still failing after 1 minute, restart containers
sail down && sail up -d
```

**Check Container Status**:
```bash
docker ps
# Look for "healthy" status in health column
```

## 12. Migrations Fail Due to Foreign Key Constraints

### Symptom

```
SQLSTATE[23000]: Integrity constraint violation: 1452 Cannot add or update a child row
```

### Cause

Migrations running out of order or missing parent table.

### Solution

Ensure migrations run in correct order:

```bash
# Check migration order
ls -1 database/migrations/

# Re-run migrations fresh (DESTRUCTIVE - dev only)
sail artisan migrate:fresh --seed

# Production: Run migrations in order
sail artisan migrate --force
```

**Key Dependencies**:
1. `users` MUST exist before `user_wallets`
2. `courses` MUST exist before `course_schedules`
3. `course_schedules` MUST exist before `course_histories`

## 13. Permission Denied on storage/logs

### Symptom

```
file_put_contents(storage/logs/laravel.log): failed to open stream: Permission denied
```

### Cause

Web server doesn't have write permissions on storage directory.

### Solution

```bash
# Fix permissions
sudo chmod -R 775 storage bootstrap/cache
sudo chown -R $USER:$USER storage bootstrap/cache

# Inside Docker (Sail)
sail bash
chmod -R 775 storage bootstrap/cache
```

## 14. React Component Not Re-rendering

### Symptom

State changes but UI doesn't update.

### Cause

Mutating state directly instead of using setter.

### Solution

❌ **BAD**:
```jsx
const [items, setItems] = useState([]);

// Direct mutation (BAD!)
items.push(newItem);
```

✅ **GOOD**:
```jsx
const [items, setItems] = useState([]);

// Create new array
setItems([...items, newItem]);

// Or
setItems(prevItems => [...prevItems, newItem]);
```

## 15. Environment Variables Not Loading

### Symptom

`config('app.name')` returns `null`, environment variables missing.

### Cause

Config cache needs to be cleared after `.env` changes.

### Solution

```bash
# Clear config cache
sail artisan config:clear

# Or restart containers
sail down && sail up -d
```

**Important**: Always run `config:clear` after modifying `.env`.

## Quick Reference: Common Commands

| Issue | Command |
|-------|---------|
| Containers not running | `sail up -d` |
| Database connection refused | `sail mysql -e "SELECT 1"` (wait for ready) |
| Assets not loading | `sail bash` → `npm run dev` |
| Config changes not applied | `sail artisan config:clear` |
| Routes not working | `sail artisan route:clear` |
| Views cached | `sail artisan view:clear` |
| All caches | `sail artisan cache:clear && sail artisan config:clear && sail artisan route:clear` |
| Web3 errors | `tail -f storage/logs/web3.log` |
| Laravel errors | `tail -f storage/logs/laravel.log` |
| Missing web3 dependencies | `cd web3 && npm install` |
| Database issues | `sail artisan migrate:fresh --seed` (dev only!) |
| Migrations slow on fresh install | `sail artisan schema:dump` (then commit the file) |

## Debugging Checklist

When something breaks, check in this order:

1. ✅ Docker containers running? (`docker ps`)
2. ✅ MySQL ready? (`sail mysql -e "SELECT 1"`)
3. ✅ Vite dev server running? (check http://localhost:5173)
4. ✅ Config cache cleared? (`sail artisan config:clear`)
5. ✅ Check Laravel logs (`tail -f storage/logs/laravel.log`)
6. ✅ Check Web3 logs (`tail -f storage/logs/web3.log`)
7. ✅ Browser console errors? (F12 → Console tab)
8. ✅ Network tab shows 500 errors? (F12 → Network tab)

## 16. Eloquent Accessors Ignore `setAttribute()` — Always Recompute

### Symptom

A method catches an exception and sets `$model->some_attribute = null`, but a
test assertion on `$model->some_attribute` still throws the original exception.

### Cause

Eloquent accessors (`getSomeAttributeAttribute()`) **always recompute on read**
— they ignore any value previously stored via `setAttribute()` or direct
assignment. So this pattern silently breaks:

❌ **BAD** — catch block is bypassed on next read:
```php
try {
    $course->price_in_ada = $service->compute();
} catch (\Throwable $e) {
    $course->price_in_ada = null; // stored in $attributes...
}

$course->price_in_ada; // ...but accessor fires AGAIN here and re-throws
```

### Solution

Put the error handling **inside the accessor itself**:

✅ **GOOD**:
```php
public function getPriceInAdaAttribute()
{
    try {
        return app(ExchangeRateService::class)->jpyToAda($this->attributes['price']);
    } catch (\Throwable $e) {
        return null; // degrade gracefully
    }
}
```

### Debugging Tip

If a test assertion (not the method under test) throws an unexpected exception,
suspect an accessor firing during the assertion read. Add a breakpoint or
`dd()` inside the accessor to confirm.

## 17. Zombie MySQL Connections Block Test Runs

### Symptom

Tests hang for 50+ seconds per test, then fail with:
```
SQLSTATE[HY000]: General error: 1205 Lock wait timeout exceeded
```

This happens most often after killing a test run mid-flight (Ctrl+C, timeout, crash).

### Cause

When a PHP process is killed mid-transaction, the MySQL connection stays alive with an
uncommitted transaction holding row locks. MySQL's default `wait_timeout=28800` (8 hours)
keeps these zombie connections alive indefinitely, blocking all subsequent test runs that
touch locked rows.

A common trigger: `Setting::updateOrCreate(...)` in test `setUp()` takes an exclusive lock
on the existing seeded row. If the previous test process was killed before the transaction
committed, that lock persists and blocks every subsequent test.

### Solution — Multi-Layer Defense

**Layer 1 — MySQL server-level timeout** (`docker-compose.yml`):
```yaml
mysql:
    image: 'mysql/mysql-server:8.0'
    command: --wait-timeout=300 --interactive-timeout=300
```
Any connection idle for 5 minutes gets killed by MySQL itself — regardless of whether
Laravel set a session variable. This is the **primary defense**.

**Layer 2 — Pre-test bootstrap cleanup** (`tests/bootstrap.php`):
```php
// Kills sleeping connections and stuck queries (>10s) on the testing DB
// before the suite runs. See tests/bootstrap.php for full implementation.
```
PHPUnit runs this before every suite, actively killing stale connections so tests don't
have to wait for the server-level timeout.

**Layer 3 — Per-connection session timeout** (`phpunit.xml` + `config/database.php`):
```xml
<env name="DB_WAIT_TIMEOUT" value="10"/>
```
Each new test connection sets its own `wait_timeout=10` via a session variable. If a test
connection becomes a zombie, it dies after 10 seconds of inactivity.

**Layer 4 — Fast lock-wait failure** (`phpunit.xml`):
```xml
<env name="DB_LOCK_WAIT_TIMEOUT" value="3"/>
```
If a lock conflict does occur, tests fail in 3 seconds instead of 50, preventing
cascading hangs across the suite.

**Layer 5 — Avoid lock-prone patterns in tests**:

❌ **BAD** — locks the existing committed row:
```php
Setting::updateOrCreate(
    ['slug' => 'ada-to-jpy'],
    ['name' => 'ADA to JPY', 'value' => '50', ...]
);
```

✅ **GOOD** — no contention on existing rows:
```php
Setting::where('slug', 'ada-to-jpy')->delete();
Setting::create([
    'slug' => 'ada-to-jpy',
    'name' => 'ADA to JPY',
    'value' => '50',
    ...
]);
```

**Layer 6 — PHP-side socket timeout** (`phpunit.xml`):
```xml
<ini name="mysqlnd.net_read_timeout" value="15"/>
```
MySQL's `wait_timeout` only kills *idle* connections. A connection stuck mid-query
(`Execute` state) never becomes idle and bypasses all MySQL-side timeouts. This INI
setting makes PHP itself give up after 15 seconds, preventing the test runner from
hanging on a zombie that MySQL won't kill.

### Recovery

If tests are currently hung, kill the zombie connections manually:
```bash
sail exec -T mysql mysql -usail -ppassword testing -e "SHOW PROCESSLIST;"
# Then restart MySQL with the new timeout config:
sail down && sail up -d
```

## 18. Mockery::close() Before parent::tearDown() Causes Zombie Locks

### Symptom

Tests hang with lock timeouts even though no test process was killed. The very
first test in a class passes, but subsequent tests in the same class block on
inserts to the same table.

### Cause

When `Mockery::close()` runs **before** `parent::tearDown()` in a test that uses
`DatabaseTransactions`, an unmet mock expectation throws an exception that
prevents the transaction rollback. The connection stays alive with an open
transaction holding exclusive locks on any rows inserted during `setUp()`.

❌ **BAD** — exception skips rollback:
```php
protected function tearDown(): void
{
    Mockery::close();     // throws → parent never runs → transaction never rolled back
    parent::tearDown();
}
```

### Solution

`Mockery::close()` is called centrally in `tests/TestCase::tearDown()` **after**
`parent::tearDown()`. Individual test classes should **not** override `tearDown()`
just for Mockery cleanup.

✅ **GOOD** — already handled by base TestCase:
```php
// tests/TestCase.php
protected function tearDown(): void
{
    try {
        while (DB::transactionLevel() > 0) { DB::rollBack(); }
    } catch (\Illuminate\Database\QueryException $e) {
        DB::purge(); // connection dead — purge so next test gets a fresh one
    }
    parent::tearDown();
    Mockery::close();   // safe: DB already cleaned up
}
```

**Rule**: Never add `Mockery::close()` to individual test `tearDown()` methods.

## 19. Running 50+ Migrations on a Fresh Install Is Slow

### Symptom

`sail artisan migrate` (or `migrate:fresh`) replays every migration file in
`database/migrations/` sequentially — which gets noticeable once the project
has 50+ files.

### Solution

Dump the current schema to a single SQL file and commit it:

```bash
sail artisan schema:dump
```

This writes `database/schema/mysql-schema.sql`.  On the next fresh install
Laravel loads that one file first, then runs only the **newer** migrations on
top of it — turning a 50-step replay into a single SQL import.

**When to re-dump**: after any batch of new migrations lands on `dev`/`main`.
There is no harm in dumping more often; the file is overwritten in place.

**Check in the dump**:

```bash
git add database/schema/mysql-schema.sql
git commit -m "chore(db): refresh schema dump"
```

> **Note**: `database/schema/` is already present in this repo — the dump has
> been taken.  If you ever need to reset (e.g. after a destructive
> `migrate:fresh --seed` that changed the baseline), just re-run
> `sail artisan schema:dump` and commit.

## 20. Parallel Tests: `2006 MySQL server has gone away` Under 8 Workers

### Symptom

Intermittent `SQLSTATE[HY000]: General error: 2006 MySQL server has gone away` on plain
SQL (INSERT or SELECT) during 8-worker ParaTest. Failing tests vary per run. When one test
hits `2006`, the next test in the same worker may fail with a stale Mockery expectation.

### Cause

Docker's bridge network sporadically resets TCP connections to the MySQL container under
rapid parallel connect/disconnect load. Laravel's `handleQueryException` refuses to
auto-retry inside an open transaction (`$this->transactions >= 1`), so the error propagates.
If the `2006` hits during `tearDown`'s `DB::rollBack()`, `Mockery::close()` never runs,
leaking mock state into subsequent tests (cascading failures).

### Solution — Three Layers

**Layer 1 — MySQL Docker flags** (`docker-compose.yml`):
```yaml
command: >-
  --wait-timeout=3600 --interactive-timeout=3600
  --max_connections=500 --max-connect-errors=1000000
  --skip-name-resolve
```
`--max-connect-errors=1000000` prevents MySQL from blocking the host after accumulated
connection errors. `--skip-name-resolve` eliminates reverse-DNS lookups in Docker.

**Layer 2 — Resilient tearDown** (`tests/TestCase.php`):
```php
try {
    while (DB::transactionLevel() > 0) { DB::rollBack(); }
} catch (\Illuminate\Database\QueryException $e) {
    DB::purge();
}
parent::tearDown();
Mockery::close();
```
If the connection is dead, `DB::rollBack()` would throw, skipping `Mockery::close()`.
The try/catch purges the dead connection and lets cleanup continue — preventing cascading
failures to subsequent tests.

**Layer 3 — `retryOnDisconnect()` for heavy setUp** (`tests/TestCase.php`):
```php
protected function retryOnDisconnect(callable $fn): void
{
    try {
        $fn();
    } catch (\Illuminate\Database\QueryException $e) {
        if (!str_contains($e->getMessage(), 'server has gone away')) throw $e;
        DB::purge();
        DB::reconnect();
        DB::beginTransaction();
        $fn();
    }
}

// Usage in test setUp:
$this->retryOnDisconnect(fn () => $this->setupTestData());
```
When `2006` occurs during setUp data creation, the dead connection's transaction is
auto-rolled back by MySQL. We purge it, start a fresh transaction, and retry from scratch.

**Additional — Atomic upserts in setUp**:
Replace `Model::delete()` + `Model::create()` with `DB::table()->updateOrInsert()` to
reduce the number of statements that can fail mid-sequence.

### Which tests need `retryOnDisconnect`?

Any test with a heavy setUp creating multiple DB records (users, courses, settings).
Currently applied to: `CoursePurchaseServiceTest`, `CertificateServiceTest`,
`ExchangeRateServiceTest`.

## 21. Wrong Cardano Network ID Silently Breaks Wallet Connect

### Symptom

The "Connect Wallet" button appears to work (no JS error) but wallet API calls fail
immediately after `enable()`, or the user sees an error toast like "Wrong network.
Please switch your wallet to Cardano Testnet/Preprod."

### Cause

`WalletConnector` calls `walletAPI.getNetworkId()` after enabling the wallet and
compares against `cardano_network_id` from Inertia shared props. If the server is
configured for preprod (`CARDANO_NETWORK_ID=0`) but the user's wallet is on mainnet
(ID=1), or vice versa, the connection is rejected.

The most common trigger is a misconfigured deployment where `CARDANO_NETWORK_ID` does
not match `NETWORK`:

```env
# BAD — mismatch between network and ID
NETWORK=mainnet
CARDANO_NETWORK_ID=0  # Should be 1 for mainnet
```

### Solution

`CARDANO_NETWORK_ID` must always match `NETWORK`:

```env
# Development / Staging (Preprod)
NETWORK=preprod
CARDANO_NETWORK_ID=0

# Production (Mainnet)
NETWORK=mainnet
CARDANO_NETWORK_ID=1
```

`CARDANO_NETWORK_ID` is broadcast globally to every Inertia page via
`HandleInertiaRequests::share()` as `cardano_network_id`, so any page using
`WalletConnector` picks it up without extra controller code.

### Debugging

```bash
# Confirm the value reaching the frontend
sail artisan tinker
>>> config('services.cardano.network_id')  # should be 0 or 1

# Browser: open any portal page, DevTools → Network → XHR/fetch
# Look for the Inertia page response and check:
# "props": { "cardano_network_id": 0 }
```

Then in the browser console:
```javascript
const wallet = await window.cardano.eternl.enable()
console.log(await wallet.getNetworkId())  // 0=testnet, 1=mainnet
```

If the two values differ, fix `CARDANO_NETWORK_ID` in `.env` and run
`sail artisan config:clear`.

## 22. Laravel `required_if` Does Not Match Boolean `true` — Use `1,true`

### Symptom

A validation rule like `required_if:certificate_enabled,true` never triggers even
when `certificate_enabled` is checked. The field passes as empty/null without error.

### Cause

`required_if` uses **strict string comparison**. HTML checkboxes and JSON booleans
send `"1"` (the string) or `1` (integer), not the string `"true"`. Strict comparison
`"1" === "true"` is false, so the rule never fires.

### Solution

Always list both values you expect from a boolean field:

❌ **BAD**:
```php
'certificate_name' => 'required_if:certificate_enabled,true',
```

✅ **GOOD** — matches both checkbox `"1"` and JSON `true`:
```php
'certificate_name' => 'required_if:certificate_enabled,1,true',
'token_reward_amount' => 'required_if:token_reward_enabled,1,true',
```

**Rule of thumb**: For any boolean toggle field, the `required_if` value list should
always be `1,true` — never just `true`.

## 23. `.mjs` Web3 Scripts Cannot Use `require()` — Must Use ES `import`

### Symptom

PHP service returns `"Web3 script failed"` with an error like:
```
ReferenceError: require is not defined in ES module scope
```

The error only surfaces at runtime (when the script is actually executed via `exec()`),
not during development until the code path is hit.

### Cause

All web3 scripts use the `.mjs` extension which marks them as **ES modules**. Node.js
ES modules do not have a `require()` function — it is CommonJS-only. Copying code from
a CommonJS snippet (e.g. `require('child_process').execSync(...)`) into a `.mjs` file
compiles silently but crashes at runtime.

### Solution

Use ES module `import` syntax throughout all `.mjs` files:

❌ **BAD** (CommonJS — crashes in .mjs):
```javascript
const { execSync } = require('child_process');
const fs = require('fs');
```

✅ **GOOD** (ES module):
```javascript
import { execSync } from 'child_process';
import { readFileSync } from 'fs';
```

**Check**: All `web3/run/*.mjs` files should have zero `require(` occurrences:
```bash
grep -n 'require(' web3/run/*.mjs
```

## 24. Playwright `fullyParallel` + Shared `storageState` + State-Mutating Tests → 419 CSRF Error

### Symptom

A "419 | PAGE EXPIRED" modal appears in the Playwright failure screenshot. The test fails on a URL assertion or `waitForApp` timeout — not on finding the target button — because the POST navigation never completes.

### Cause

All tests in a project inherit the same `storageState` file (e.g. `fixtures/student.json`). Every browser context loads the **same session cookie**. With `fullyParallel: true`, two tests that both log out run concurrently. Whichever context completes its logout first destroys the server-side session. The other context still holds the same (now-invalidated) session cookie, so its subsequent POST carries a CSRF token that no longer matches any live session — Laravel returns 419.

### Solution

Any test file that **mutates session state** (logout, password change, account deletion) must opt out of the shared fixture and do a fresh login instead:

```javascript
// ❌ BAD — shared fixture; first concurrent logout breaks the second test
test.use({ storageState: STORAGE_STATE.student });

// ✅ GOOD — each test creates its own independent server-side session
test.use({ storageState: { cookies: [], origins: [] } });

test('can log out', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAndWaitForRedirect(TEST_USERS.student.email, TEST_USERS.student.password);
    // ... rest of test
});
```

**Rule**: If a test destroys authentication state, it must not share a `storageState` fixture with other concurrent tests.

---

## 25. React Blank-Page Crash from Null Eloquent Relationship in JSX

### Symptom

A page renders as a blank grey screen. `waitForApp` times out with `app.children.length > 0` never becoming true. The browser console (F12) shows a `TypeError: Cannot read properties of null`.

### Cause

Eloquent eager-loads a relationship (e.g. `->with(['professor', ...])`) but a row has a null foreign key (`professor_id IS NULL`), so the relationship is `null`. In JSX, accessing a property on it directly crashes React's entire render tree — no error boundary catches it, so `#app` is left childless.

```jsx
// ❌ BAD — crashes React if professor is null
`By ${course.professor.fullname}`
```

### Solution

Always use optional chaining when accessing eager-loaded relationships in JSX:

```jsx
// ✅ GOOD — degrades gracefully
`By ${course.professor?.fullname ?? 'Unknown'}`
```

**Diagnostic signal**: Blank grey page (MUI background) + `waitForApp` timeout = React render crash. Check browser console for a `TypeError` on a relationship property.

**Note**: The home page (`/`) is particularly exposed because `getFeaturedClass()` fetches the most-recently-created courses ordered by `id DESC`, which may include seeded or imported rows with null relationships. Any component rendering those rows must null-guard all relationship accesses.

---

## 26. Three Teacher Routes Return 500 in Development

**Symptom**: Playwright teacher smoke tests discover three routes that return HTTP 500.

**Affected routes and root causes**:

| Route | Error | Location |
|---|---|---|
| `/mypage/class-history` | `Unknown column 'courses.course_category_id'` | `CourseHistoryRepository:69` |
| `/mypage/wallet-history` | `userWalletTransactions() on null` | `WalletTransactionHistoryController:13` |
| `/mypage/class-application` | `Assign property "price_in_ada" on array` | `ExchangeRateService:121` |

**Root causes**:
1. **class-history**: `course_category_id` column referenced in the repository JOIN does not exist in the `courses` table.
2. **wallet-history**: Teacher test user has no `userWallet` relation, so `->first()->userWalletTransactions()` crashes on null.
3. **class-application index**: `ExchangeRateService::addPriceInAdaToCourses()` tries to assign `$course->price_in_ada` on array elements. Also crashes when CoinGecko exchange rate is unavailable.

**Workaround**: Teacher Playwright tests skip these routes with comments documenting the bugs. The tests will start asserting once the backend bugs are fixed.

---

## Cross-References

- **Architecture**: See [docs/architecture.md](./architecture.md) for system structure
- **Patterns**: See [docs/patterns.md](./patterns.md) for correct patterns
- **Testing**: See [docs/testing.md](./testing.md) for testing gotchas
- **Deployment**: See [docs/deployment.md](./deployment.md) for deployment issues
