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
// Kills any sleeping connections to the testing DB before the suite runs.
// See tests/bootstrap.php for full implementation.
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

### Recovery

If tests are currently hung, kill the zombie connections manually:
```bash
sail exec -T mysql mysql -usail -ppassword testing -e "SHOW PROCESSLIST;"
# Then restart MySQL with the new timeout config:
sail down && sail up -d
```

## 18. Running 50+ Migrations on a Fresh Install Is Slow

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

## Cross-References

- **Architecture**: See [docs/architecture.md](./architecture.md) for system structure
- **Patterns**: See [docs/patterns.md](./patterns.md) for correct patterns
- **Testing**: See [docs/testing.md](./testing.md) for testing gotchas
- **Deployment**: See [docs/deployment.md](./deployment.md) for deployment issues
