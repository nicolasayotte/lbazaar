# Deployment

> **AI Context Summary**: Deployment order: (1) DB migrations, (2) Web3 env verification (ROOT_KEY, BLOCKFROST_API_KEY), (3) PHP code + cache clear, (4) npm build, (5) health check. Test production build locally with `./test-prod.sh full-test` before deploying. Rollback: git checkout + rebuild. Never push --force to main.

## Overview

Le Bazaar deployment follows a **strict sequential order** to prevent data corruption and service interruptions. Always test with the production Docker image locally before deploying to staging/production.

## Pre-Deployment Checklist

### 1. Local Production Testing

**Critical**: Test production build locally before deploying.

```bash
./test-prod.sh full-test
```

This runs:
- Production Docker image build
- Database migrations (dry-run)
- Full test suite
- Health check verification

**Why**: Catches environment differences (Nginx vs Apache, Alpine vs Ubuntu, missing PHP extensions).

**Documentation**: See `docs/LOCAL_PROD_TESTING.md` for detailed guide.

### 2. Code Quality

```bash
# Run formatters
sail composer pint
cd web3 && npm run format

# Run tests
sail test
cd web3 && npm test

# Check for uncommitted changes
git status
```

### 3. Environment Variables

Verify all required environment variables are set in production `.env`:

```env
# Application
APP_ENV=production
APP_DEBUG=false
APP_URL=https://lebazaar.com

# Cardano (CRITICAL)
NETWORK=mainnet  # or preprod for staging
BLOCKFROST_API_KEY=mainnet_xyz...
ROOT_KEY=xprv...  # NEVER commit to git
OWNER_PKH=abc123...

# Database (production credentials)
DB_CONNECTION=mysql
DB_HOST=production-db-host
DB_DATABASE=lbazaar_prod
DB_USERNAME=lbazaar_user
DB_PASSWORD=secure_password

# AWS S3
AWS_BUCKET=production-lebazaar
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...

# Mail
MAIL_HOST=email-smtp.us-east-1.amazonaws.com
MAIL_USERNAME=...
MAIL_PASSWORD=...
```

## Deployment Procedure

### Critical Deployment Order

**ALWAYS follow this order**:

```
1. Database Migrations (FIRST)
2. Web3 Environment Verification (SECOND)
3. Backend Code Deploy (THIRD)
4. Frontend Build (FOURTH)
5. Health Check (FIFTH)
6. Smoke Tests (SIXTH)
```

### Step 1: Database Migrations

**Run migrations BEFORE deploying code** to ensure schema is ready.

```bash
# Dry-run (preview changes without applying)
sail artisan migrate --pretend

# Run migrations on production
sail artisan migrate --force

# Verify migrations applied
sail mysql -e "SELECT migration, batch FROM migrations ORDER BY id DESC LIMIT 10;"
```

**⚠️ WARNING**:
- Migrations cannot be rolled back automatically
- Test migrations on staging first
- Backup database before running migrations

### Step 2: Web3 Environment Verification

**Verify blockchain credentials are set** before deploying.

```bash
# Test Blockfrost connection
cd web3
node run/blockfrost-verify.mjs

# Expected output:
# {"status": 200, "message": "Blockfrost API connection successful"}

# Verify wallet info
node run/wallet-info.mjs

# Expected output:
# {
#   "status": 200,
#   "data": {
#     "address": "addr1...",
#     "balanceAda": 1000.0
#   }
# }
```

**If verification fails**: DO NOT PROCEED. Fix environment variables.

### Step 3: Backend Code Deploy

```bash
# Pull latest code
git pull origin main

# Install/update PHP dependencies
sail composer install --no-dev --optimize-autoloader

# Clear all caches
sail artisan cache:clear
sail artisan config:clear
sail artisan route:clear
sail artisan view:clear

# Reload autoloader
sail composer dump-autoload

# Restart PHP-FPM (if using separate process)
sail artisan queue:restart  # If using queues
```

### Step 4: Frontend Build

```bash
# Install/update Node dependencies
sail bash
npm ci  # Use ci for reproducible builds

# Build production assets
npm run build

# Verify build output
ls -lh public/build/
```

**Expected output**:
- `public/build/manifest.json` exists
- `public/build/assets/` contains hashed JS/CSS files

### Step 5: Health Check

```bash
# Test HTTP endpoint
curl http://localhost:8080/health

# Expected response:
# {"status": "ok", "database": "connected", "timestamp": "2024-01-01T00:00:00Z"}

# Test database connection
sail artisan tinker
>>> DB::connection()->getPdo();
>>> exit

# Test web3 integration
cd web3
node run/wallet-info.mjs
```

### Step 6: Smoke Tests

**Test critical user flows**:

1. **Login**:
   ```bash
   curl -X POST http://localhost:8080/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email": "admin@lebazaar.com", "password": "production_password"}'
   ```

2. **Course List**:
   ```bash
   curl http://localhost:8080/api/courses \
     -H "Authorization: Bearer {token}"
   ```

3. **Certificate Minting** (on preprod/staging only):
   ```bash
   curl -X POST http://localhost:8080/api/certificates/mint \
     -H "Authorization: Bearer {token}" \
     -H "Content-Type: application/json" \
     -d '{"course_id": 1}'
   ```

## Rollback Procedure

**If deployment fails**, rollback immediately:

### 1. Database Rollback (RISKY)

**Only if safe** (no data corruption risk):

```bash
# Rollback last migration batch
sail artisan migrate:rollback --step=1

# Verify rollback
sail mysql -e "SELECT migration FROM migrations ORDER BY id DESC LIMIT 5;"
```

**⚠️ WARNING**: Rollback can cause data loss. Prefer fixing forward.

### 2. Code Rollback

```bash
# Revert to previous commit
git log --oneline -5  # Find previous commit hash
git checkout {previous-commit-hash}

# Reload autoloader
sail composer dump-autoload

# Rebuild frontend
npm run build

# Clear caches
sail artisan cache:clear
sail artisan config:clear
```

### 3. Verify Rollback

```bash
# Run smoke tests again
curl http://localhost:8080/health

# Check logs for errors
tail -f storage/logs/laravel.log
tail -f storage/logs/web3.log
```

## Environment-Specific Concerns

### Development

| Aspect | Configuration |
|--------|---------------|
| Network | Cardano Preprod |
| Debug | Enabled (`APP_DEBUG=true`) |
| Database | Local Docker (MySQL 8) |
| Storage | Local filesystem |
| Email | Mailtrap (testing) |

### Staging

| Aspect | Configuration |
|--------|---------------|
| Network | Cardano Preprod |
| Debug | Disabled (`APP_DEBUG=false`) |
| Database | AWS RDS (MySQL 8) |
| Storage | AWS S3 (staging bucket) |
| Email | AWS SES (sandbox) |
| URL | https://staging.lebazaar.com |

**Staging-specific checks**:
```bash
# Verify S3 access
sail artisan tinker
>>> Storage::disk('s3')->exists('test.txt')

# Verify email sending (AWS SES sandbox)
sail artisan tinker
>>> Mail::raw('Test', function($msg) { $msg->to('verified@email.com'); })
```

### Production

| Aspect | Configuration |
|--------|---------------|
| Network | Cardano Mainnet |
| Debug | Disabled (`APP_DEBUG=false`) |
| Database | AWS RDS (MySQL 8) with read replicas |
| Storage | AWS S3 (production bucket) |
| Email | AWS SES (production) |
| URL | https://lebazaar.com |

**Production-specific checks**:
```bash
# Verify mainnet connection
cd web3
NETWORK=mainnet node run/blockfrost-verify.mjs

# Check production database
sail mysql -h production-db-host -u lbazaar_user -p
```

## Database Migration Timing

### Safe to Run Immediately

- Adding new columns (nullable or with defaults)
- Adding new tables
- Adding indexes (use `ALGORITHM=INPLACE` for large tables)

### Requires Coordination

- Renaming columns (deploy code first, then migrate)
- Dropping columns (ensure no code references it first)
- Changing column types (may cause data loss)

### Pattern for Risky Migrations

**Multi-step approach**:

1. **Step 1**: Add new column alongside old one
   ```php
   Schema::table('users', function (Blueprint $table) {
       $table->string('new_email')->nullable();
   });
   ```

2. **Deploy code** that writes to both columns

3. **Step 2**: Backfill data
   ```bash
   sail artisan backfill:user-emails
   ```

4. **Deploy code** that reads from new column

5. **Step 3**: Drop old column (in separate migration)
   ```php
   Schema::table('users', function (Blueprint $table) {
       $table->dropColumn('email');
   });
   ```

## Monitoring

### Health Check Endpoint

**Endpoint**: `GET /health`

**Response**:
```json
{
  "status": "ok",
  "database": "connected",
  "cache": "operational",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

**Monitor**: Set up uptime monitoring (e.g., Uptime Robot, Pingdom)

### Log Monitoring

**Laravel Logs**:
```bash
tail -f storage/logs/laravel.log
```

**Web3 Logs**:
```bash
tail -f storage/logs/web3.log
```

**Error Patterns to Watch**:
- `SQLSTATE[HY000]` - Database connection issues
- `cURL error` - External API failures
- `exec()` errors - Web3 script failures
- `MinUTxONotMet` - Insufficient ADA in transactions

### Discord Webhooks (Optional)

**Setup**: Add `DISCORD_WEBHOOK_URL` to `.env`

**Usage**:
```php
// In error handler
Http::post(config('services.discord.webhook_url'), [
    'content' => 'Production error: ' . $exception->getMessage()
]);
```

## CI/CD Integration

### GitHub Actions Example

**Location**: `.github/workflows/deploy.yml`

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v2

      - name: Run tests
        run: |
          ./vendor/bin/sail up -d
          ./vendor/bin/sail test

      - name: Test production build
        run: ./test-prod.sh full-test

      - name: Deploy to production
        run: |
          # SSH into production server
          ssh production-server << 'EOF'
            cd /var/www/lbazaar
            git pull origin main
            php artisan migrate --force
            composer install --no-dev
            npm run build
            php artisan cache:clear
            php artisan config:clear
          EOF
```

## Disaster Recovery

### Database Backups

**Automated Backups**:
```bash
# Daily backup via cron
0 2 * * * /usr/bin/mysqldump -u user -ppass lbazaar_prod > /backups/lbazaar_$(date +\%Y\%m\%d).sql
```

**Manual Backup**:
```bash
sail mysql -e "mysqldump lbazaar_prod > backup_$(date +%Y%m%d).sql"
```

**Restore**:
```bash
sail mysql lbazaar_prod < backup_20240101.sql
```

### Code Rollback

```bash
# Identify last known good commit
git log --oneline -10

# Rollback to specific commit
git checkout {commit-hash}

# Force deploy (only if necessary)
git push --force  # ⚠️ NEVER on main branch
```

## Security Considerations

### Secrets Management

**Never commit**:
- `ROOT_KEY` (Cardano wallet private key)
- `BLOCKFROST_API_KEY`
- `DB_PASSWORD`
- `AWS_SECRET_ACCESS_KEY`

**Use**:
- Environment variables
- AWS Secrets Manager (recommended for production)
- `.env` files (never committed)

### SSH Keys

**Production Server Access**:
```bash
# Generate deployment key
ssh-keygen -t ed25519 -C "deploy@lebazaar.com"

# Add to authorized_keys on server
ssh-copy-id -i ~/.ssh/deploy_key.pub production-server
```

## Cross-References

- **Local Production Testing**: See [docs/LOCAL_PROD_TESTING.md](./LOCAL_PROD_TESTING.md) for `./test-prod.sh` usage
- **Architecture**: See [docs/architecture.md](./architecture.md) for system components
- **Testing**: See [docs/testing.md](./testing.md) for test suite
- **Gotchas**: See [docs/gotchas.md](./gotchas.md) for common deployment issues
