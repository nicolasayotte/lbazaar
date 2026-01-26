# Local Production Testing Guide

**Purpose:** Test your code with the production Docker image **before** deploying to staging/production.

**Why:** Catch environment-specific bugs (Nginx vs Apache, Alpine vs Ubuntu, missing PHP extensions) on your local machine instead of discovering them in production.

---

## Quick Start

```bash
# 1. Build and start production-like environment
docker-compose -f docker-compose.local-prod.yml up --build -d

# 2. Wait for health check to pass (40 seconds)
docker-compose -f docker-compose.local-prod.yml ps

# 3. Run migrations
docker-compose -f docker-compose.local-prod.yml exec app php artisan migrate --seed

# 4. Run tests
docker-compose -f docker-compose.local-prod.yml exec app php artisan test

# 5. Test web3 module
docker-compose -f docker-compose.local-prod.yml exec app sh -c "cd web3 && npm run test"

# 6. Access application
# Open browser: http://localhost:8080

# 7. Stop when done
docker-compose -f docker-compose.local-prod.yml down
```

---

## When to Use This

### ✅ **Always Use Before:**
1. Deploying to staging/production
2. Merging to main/release branches
3. Creating a pull request for production-critical features

### 🟡 **Optional (But Recommended):**
1. After adding new dependencies
2. After modifying Nginx configuration
3. After changing web3 module code
4. When debugging production-specific issues

### ❌ **Don't Use For:**
1. Daily development (use Sail instead - it's faster)
2. Quick iteration/debugging (use Sail)
3. Frontend-only changes (use Sail + `npm run dev`)

---

## Detailed Workflow

### Step 1: Stop Sail (If Running)

To avoid port conflicts:

```bash
sail down
```

**Note:** Local prod uses port 8080, Sail uses 80/8080. You can run both if you change ports, but it's cleaner to stop Sail first.

---

### Step 2: Build Production Image

```bash
docker-compose -f docker-compose.local-prod.yml build --no-cache
```

**When to use `--no-cache`:**
- First time setup: ✅ Yes
- After changing Dockerfile: ✅ Yes
- After changing dependencies: ✅ Yes
- Regular testing: ❌ No (slower)

**Normal build (with cache):**
```bash
docker-compose -f docker-compose.local-prod.yml build
```

**Build time:**
- First build: ~5-7 minutes
- Cached builds: ~1-2 minutes

---

### Step 3: Start Services

```bash
docker-compose -f docker-compose.local-prod.yml up -d
```

**What this does:**
- Starts MySQL container
- Waits for MySQL health check
- Starts app container (using production Dockerfile)
- Waits for app health check (40 seconds)

**Check status:**
```bash
docker-compose -f docker-compose.local-prod.yml ps
```

**Expected output:**
```
NAME                          STATUS              PORTS
lbazaar-app-1                 Up (healthy)        0.0.0.0:8080->80/tcp
lbazaar-mysql-1               Up (healthy)        0.0.0.0:3307->3306/tcp
```

---

### Step 4: Initialize Database

**First time or after dropping database:**

```bash
docker-compose -f docker-compose.local-prod.yml exec app php artisan migrate:fresh --seed
```

**Normal updates:**

```bash
docker-compose -f docker-compose.local-prod.yml exec app php artisan migrate
```

**Verify database:**

```bash
docker-compose -f docker-compose.local-prod.yml exec mysql mysql -usail -ppassword -e "SHOW TABLES FROM learning_bazaar;"
```

---

### Step 5: Run Tests

#### PHP Unit Tests

```bash
docker-compose -f docker-compose.local-prod.yml exec app php artisan test
```

**Run specific test:**
```bash
docker-compose -f docker-compose.local-prod.yml exec app php artisan test --filter CertificateControllerTest
```

**With coverage:**
```bash
docker-compose -f docker-compose.local-prod.yml exec app php artisan test --coverage
```

#### Web3 Tests

```bash
docker-compose -f docker-compose.local-prod.yml exec app sh -c "cd web3 && npm run test"
```

**Watch mode:**
```bash
docker-compose -f docker-compose.local-prod.yml exec app sh -c "cd web3 && npm run test:watch"
```

---

### Step 6: Manual Testing

#### Access Application

**Main site:**
```
http://localhost:8080
```

**Admin panel:**
```
http://localhost:8080/admin/login
Email: admin@lebazaar.com
Password: test1234
```

#### Test Critical Flows

**Checklist:**
- [ ] Homepage loads
- [ ] User login works
- [ ] Admin login works
- [ ] Course creation works
- [ ] Certificate minting works
- [ ] File uploads work (S3 or local)
- [ ] Web3 wallet connection works
- [ ] Cardano transactions work (preprod)

#### Check Logs

**Laravel logs:**
```bash
docker-compose -f docker-compose.local-prod.yml exec app tail -f storage/logs/laravel.log
```

**Web3 logs:**
```bash
docker-compose -f docker-compose.local-prod.yml exec app tail -f storage/logs/web3.log
```

**Nginx access logs:**
```bash
docker-compose -f docker-compose.local-prod.yml logs -f app | grep "GET\|POST"
```

---

### Step 7: Debug Issues

#### Enter Container Shell

```bash
docker-compose -f docker-compose.local-prod.yml exec app sh
```

**Inside container:**
```sh
# Check PHP version
php -v

# Check PHP extensions
php -m | grep -i bcmath

# Check Node version
node --version

# Check web3 dependencies
ls -la /app/web3/node_modules

# Test web3 script manually
cd /app/web3
node run/check-balance.mjs

# Check permissions
ls -la /app/storage
```

#### Check Build Logs

```bash
docker-compose -f docker-compose.local-prod.yml logs app
```

#### Rebuild Completely

```bash
docker-compose -f docker-compose.local-prod.yml down -v  # Delete volumes too
docker-compose -f docker-compose.local-prod.yml build --no-cache
docker-compose -f docker-compose.local-prod.yml up -d
```

---

### Step 8: Stop Services

**Keep data (recommended):**
```bash
docker-compose -f docker-compose.local-prod.yml down
```

**Delete everything (clean slate):**
```bash
docker-compose -f docker-compose.local-prod.yml down -v
```

---

## Differences from Sail

| Aspect | Sail (Development) | Local Prod |
|--------|-------------------|------------|
| **Web Server** | Apache | **Nginx** ⚠️ |
| **Base OS** | Ubuntu | **Alpine Linux** ⚠️ |
| **PHP Extensions** | Many (gd, redis, etc.) | **Only bcmath, pdo_mysql** ⚠️ |
| **Node Version** | 22 | **LTS from Alpine** ⚠️ |
| **Code Changes** | Live reload | **Requires rebuild** ⚠️ |
| **Build Time** | Instant (pre-built) | **5-7 min first, 1-2 min cached** |
| **Port** | 80 or 8080 | **8080** |
| **MySQL Port** | 3306 | **3307** (avoid conflict) |

**Key Takeaway:** Local prod is slower but **matches staging/production exactly**.

---

## Common Issues & Solutions

### Issue 1: Port Already in Use

**Error:**
```
Error: bind: address already in use
```

**Solution:**
```bash
# Stop Sail first
sail down

# Or change port in docker-compose.local-prod.yml
ports:
  - '8081:80'  # Use 8081 instead
```

---

### Issue 2: Health Check Failing

**Symptom:** Container shows "unhealthy" status

**Check:**
```bash
docker-compose -f docker-compose.local-prod.yml logs app | grep -i error
```

**Common causes:**
- Laravel app crashed (check logs)
- Database not connected (check DB_HOST in .env)
- Missing .env file
- Permissions issue

**Test health check manually:**
```bash
docker-compose -f docker-compose.local-prod.yml exec app wget --spider http://localhost/
```

---

### Issue 3: Code Changes Not Reflected

**Symptom:** Changed code, but app still shows old version

**Cause:** Unlike Sail, local prod **copies code into image** at build time.

**Solution:**
```bash
# Rebuild image
docker-compose -f docker-compose.local-prod.yml build app

# Restart container
docker-compose -f docker-compose.local-prod.yml up -d
```

**For iterative testing:** Use Sail for development, local prod only for final validation.

---

### Issue 4: Web3 Tests Failing

**Error:**
```
Error: Cannot find module '@blockfrost/blockfrost-js'
```

**Cause:** web3 node_modules not installed or corrupted

**Solution:**
```bash
# Rebuild with fresh npm install
docker-compose -f docker-compose.local-prod.yml build --no-cache app
docker-compose -f docker-compose.local-prod.yml up -d

# Or manually install
docker-compose -f docker-compose.local-prod.yml exec app sh -c "cd web3 && npm ci"
```

---

### Issue 5: Database Connection Refused

**Error:**
```
SQLSTATE[HY000] [2002] Connection refused
```

**Cause:** DB_HOST is wrong (should be `mysql` not `127.0.0.1`)

**Check:**
```bash
docker-compose -f docker-compose.local-prod.yml exec app env | grep DB_HOST
```

**Should be:**
```
DB_HOST=mysql
```

**If wrong, update .env and restart:**
```bash
docker-compose -f docker-compose.local-prod.yml restart app
```

---

## Recommended Workflow

### Daily Development

```bash
# Use Sail for fast iteration
sail up -d
sail artisan migrate
sail test
# ... develop normally ...
sail down
```

### Before Committing to Staging

```bash
# Stop Sail
sail down

# Test with production image
docker-compose -f docker-compose.local-prod.yml up --build -d
docker-compose -f docker-compose.local-prod.yml exec app php artisan migrate
docker-compose -f docker-compose.local-prod.yml exec app php artisan test
docker-compose -f docker-compose.local-prod.yml exec app sh -c "cd web3 && npm run test"

# Manual testing
open http://localhost:8080

# If all passes, commit and push
docker-compose -f docker-compose.local-prod.yml down
git add .
git commit -m "Feature: XYZ"
git push origin staging
```

### Before Deploying to Production

```bash
# Same as above, but more thorough testing:

docker-compose -f docker-compose.local-prod.yml up --build -d

# Run full test suite
docker-compose -f docker-compose.local-prod.yml exec app php artisan test --coverage

# Test web3 thoroughly
docker-compose -f docker-compose.local-prod.yml exec app sh -c "cd web3 && npm run test"

# Manual QA checklist
# - Test all critical user flows
# - Test certificate minting
# - Test file uploads
# - Test payment flows
# - Check error handling

# Load testing (optional)
ab -n 1000 -c 10 http://localhost:8080/

# If all passes, deploy
docker-compose -f docker-compose.local-prod.yml down
# ... deploy to production ...
```

---

## Helper Script

For convenience, create an alias:

**Add to `~/.bashrc` or `~/.zshrc`:**

```bash
alias prod-test='docker-compose -f docker-compose.local-prod.yml'
```

**Then use:**
```bash
prod-test up --build -d
prod-test exec app php artisan test
prod-test down
```

---

## Performance Tips

### 1. Use BuildKit for Faster Builds

```bash
DOCKER_BUILDKIT=1 docker-compose -f docker-compose.local-prod.yml build
```

### 2. Pre-build Image

Build once, test multiple times:

```bash
# Morning: Build image
docker-compose -f docker-compose.local-prod.yml build

# Throughout day: Quick starts
docker-compose -f docker-compose.local-prod.yml up -d
# ... test ...
docker-compose -f docker-compose.local-prod.yml down

# Only rebuild when dependencies change
```

### 3. Don't Use `--no-cache` Unless Needed

```bash
# Normal: ~1-2 minutes (cached)
docker-compose -f docker-compose.local-prod.yml build

# Only when needed: ~5-7 minutes
docker-compose -f docker-compose.local-prod.yml build --no-cache
```

---

## CI/CD Integration (Future)

You can add this to GitHub Actions:

```yaml
# .github/workflows/test-prod-image.yml
name: Test Production Image

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build production image
        run: docker-compose -f docker-compose.local-prod.yml build
      
      - name: Start services
        run: docker-compose -f docker-compose.local-prod.yml up -d
      
      - name: Wait for health check
        run: sleep 45
      
      - name: Run migrations
        run: docker-compose -f docker-compose.local-prod.yml exec -T app php artisan migrate --seed
      
      - name: Run PHP tests
        run: docker-compose -f docker-compose.local-prod.yml exec -T app php artisan test
      
      - name: Run web3 tests
        run: docker-compose -f docker-compose.local-prod.yml exec -T app sh -c "cd web3 && npm run test"
      
      - name: Cleanup
        run: docker-compose -f docker-compose.local-prod.yml down -v
```

---

## FAQ

**Q: Can I use this for daily development?**
A: You *can*, but it's slower. Use Sail for daily dev, local prod for pre-deployment validation.

**Q: Will this catch 100% of production issues?**
A: No, but ~95%. External services (AWS, Blockfrost) behave differently. Network conditions differ. But environment issues (OS, web server, extensions) are caught.

**Q: Can I run Sail and local prod at the same time?**
A: Yes, but they use different MySQL ports (3306 vs 3307) and app ports (80 vs 8080). Just make sure .env points to the right DB_HOST.

**Q: How do I update the production image?**
A: Changes to `docker-build/Dockerfile.production` are automatically picked up. Just rebuild: `docker-compose -f docker-compose.local-prod.yml build`

**Q: Can I mount code for live reload?**
A: Not recommended - defeats the purpose of testing the production image. If you need iteration, use Sail.

**Q: What about Redis/Memcached?**
A: Add them to `docker-compose.local-prod.yml` if needed. Keep it matching production topology.

---

## Summary Checklist

Before deploying to staging/production, verify:

- [ ] Build succeeds: `docker-compose -f docker-compose.local-prod.yml build`
- [ ] Containers start: `docker-compose -f docker-compose.local-prod.yml up -d`
- [ ] Health checks pass: `docker-compose -f docker-compose.local-prod.yml ps`
- [ ] Migrations run: `php artisan migrate`
- [ ] PHP tests pass: `php artisan test`
- [ ] Web3 tests pass: `cd web3 && npm run test`
- [ ] Application loads: http://localhost:8080
- [ ] Critical flows work (login, course creation, certificate minting)
- [ ] No errors in logs: `docker-compose -f docker-compose.local-prod.yml logs app`
- [ ] Stop cleanly: `docker-compose -f docker-compose.local-prod.yml down`

**If all ✅ → Deploy with confidence!**

---

## Support

- **Documentation:** This file
- **Environment comparison:** `/tmp/environment_comparison.md`
- **Build details:** `docker-build/README.md`
- **DevOps questions:** See `.claude/agents/devops.md`
