# Migrating Secrets to AWS Secrets Manager

## Overview

This guide covers migrating Le Bazaar's sensitive credentials from flat `.env` files on EC2 to AWS Secrets Manager. The most critical secret is `ROOT_KEY` — the BIP32 extended private key that controls the platform's Cardano wallet and all custodial addresses.

## Current State

### How secrets are stored today

Secrets live in `/var/.secrets/.env.production` on the EC2 instance. Docker mounts this file read-only into the container:

```yaml
# docker-build/docker-compose.production.yml, line 8
volumes:
  - /var/.secrets/.env.production:/app/.env:ro
```

The file is protected with `chmod 600` but it's a plain-text file sitting on disk. Anyone with SSH access to the instance (or any RCE vulnerability in the app) can read it.

### How secrets flow to the application

**PHP (Laravel):** Reads `.env` via `env()` helper at boot time. Accesses `DB_PASSWORD`, `STRIPE_SECRET`, `APP_KEY`, `BLOCKFROST_API_KEY`, etc. through `config/services.php`, `config/database.php`, and other config files.

**Node.js (Web3):** PHP calls Node.js scripts via `exec()` using `Web3CommandTrait`:

```php
// app/Traits/Web3CommandTrait.php, line 22-23
sprintf('(cd %s && node --env-file=%s %s%s) 2>> %s',
    escapeshellarg($web3Directory),
    escapeshellarg($envFile),  // base_path('.env')
    ...
);
```

Node.js reads `ROOT_KEY`, `BLOCKFROST_API_KEY`, `OWNER_PKH`, and `OWNER_WALLET_ADDR` from `process.env`. PHP itself **never reads `ROOT_KEY` directly** — it only exists in the Node.js process space.

### Staging uses the same pattern

```yaml
# docker-build/docker-compose.staging.yml
volumes:
  - /var/.secrets/.env.staging:/app/.env:ro
```

## Why Migrate

| Concern | .env file | AWS Secrets Manager |
|---------|-----------|-------------------|
| **Encryption at rest** | No (plain text) | Yes (KMS) |
| **Access audit trail** | None | CloudTrail logs every read |
| **Access control** | Unix file permissions (coarse) | IAM policies (fine-grained) |
| **Rotation** | Manual: edit file, restart container | API-driven, can be automated |
| **Blast radius of EC2 compromise** | All secrets exposed immediately | Requires IAM role assumption |
| **Credential sprawl** | File may be copied, backed up, left in old snapshots | Single source of truth |

**ROOT_KEY is the highest-value target.** It derives every custodial wallet address (`web3/run/get-custodial-address.mjs`). Compromising it means an attacker can sign transactions from any user's custodial wallet, transfer all ADA, and mint/burn NFTs. Unlike a database password (which can be rotated quickly), a compromised ROOT_KEY requires migrating all custodial wallets on-chain — a multi-day, expensive operation.

## Secrets Inventory

All secrets that should be migrated, grouped by criticality:

### Critical (wallet/payment keys)

| Variable | Purpose | Used By |
|----------|---------|---------|
| `ROOT_KEY` | BIP32 HD wallet root private key | Node.js: `sign-tx.mjs`, `generate-private-key.mjs` |
| `OWNER_PKH` | Wallet payment key hash | Node.js: 13+ scripts (minting policy, tx building) |
| `STRIPE_SECRET` | Stripe API secret key | PHP: `config/services.php` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signature verification | PHP: `StripeController.php` |

### High (infrastructure access)

| Variable | Purpose | Used By |
|----------|---------|---------|
| `DB_PASSWORD` | MySQL database password | PHP: `config/database.php` |
| `APP_KEY` | Laravel encryption/signing key | PHP: `config/app.php` |
| `BLOCKFROST_API_KEY` | Cardano blockchain API access | Node.js: 10+ scripts |
| `AWS_ACCESS_KEY_ID` | AWS IAM access key (S3, etc.) | PHP: `config/services.php` |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM secret key | PHP: `config/services.php` |

### Medium (service credentials)

| Variable | Purpose | Used By |
|----------|---------|---------|
| `FEED_WEBHOOK_AUTH_TOKEN` | Blockfrost feed webhook auth | Node.js: `blockfrost-verify.mjs` |
| `EXCHANGE_WEBHOOK_AUTH_TOKEN` | Blockfrost exchange webhook auth | Node.js: `blockfrost-verify.mjs` |
| `MAIL_PASSWORD` | SMTP email credentials | PHP: `config/mail.php` |
| `REDIS_PASSWORD` | Redis connection password | PHP: `config/database.php` |

## Migration Approach: Startup Script Injection

This approach requires **zero code changes** to PHP or Node.js. The `.env` file mechanism stays the same — only the *source* of the file changes from a static file on disk to a dynamically fetched secret.

### Architecture

```
┌──────────────────────────────────────────────┐
│ EC2 Instance                                 │
│                                              │
│  ┌─────────────┐     ┌───────────────────┐   │
│  │ Docker       │     │ AWS Secrets       │   │
│  │ Entrypoint   │────>│ Manager           │   │
│  │              │     │ (via IAM role)    │   │
│  │ inject-      │     └───────────────────┘   │
│  │ secrets.sh   │                             │
│  │     │        │                             │
│  │     ▼        │                             │
│  │ /app/.env    │  (ephemeral, in-container)  │
│  │     │        │                             │
│  │     ▼        │                             │
│  │ PHP + Node   │                             │
│  │ (reads .env) │                             │
│  └─────────────┘                              │
└──────────────────────────────────────────────┘
```

### Step 1: Create the Secret in AWS

```bash
# Create the secret with all env vars as a JSON object
aws secretsmanager create-secret \
  --name "lebazaar/production" \
  --description "Le Bazaar production environment variables" \
  --secret-string "$(cat /var/.secrets/.env.production | \
    grep -v '^#' | grep -v '^$' | \
    jq -R -s 'split("\n") | map(select(length > 0)) |
    map(split("=") | {(.[0]): (.[1:] | join("="))}) |
    add')"

# For staging
aws secretsmanager create-secret \
  --name "lebazaar/staging" \
  --description "Le Bazaar staging environment variables" \
  --secret-string "$(cat /var/.secrets/.env.staging | \
    grep -v '^#' | grep -v '^$' | \
    jq -R -s 'split("\n") | map(select(length > 0)) |
    map(split("=") | {(.[0]): (.[1:] | join("="))}) |
    add')"
```

**Alternative: Separate secrets per sensitivity tier.** Store `ROOT_KEY` in its own secret (`lebazaar/production/root-key`) with a stricter IAM policy and a separate KMS key with CloudTrail alarm on decrypt. This way, a compromised web process that can read `DB_PASSWORD` cannot automatically read `ROOT_KEY`.

```bash
# Tier 1: Wallet keys (separate KMS key, stricter policy)
aws secretsmanager create-secret \
  --name "lebazaar/production/wallet" \
  --kms-key-id "alias/lebazaar-wallet-key" \
  --secret-string '{"ROOT_KEY":"xprv...","OWNER_PKH":"abc123..."}'

# Tier 2: All other secrets (default KMS)
aws secretsmanager create-secret \
  --name "lebazaar/production/app" \
  --secret-string '{"DB_PASSWORD":"...","STRIPE_SECRET":"...","APP_KEY":"..."}'
```

### Step 2: Create IAM Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ReadAppSecrets",
      "Effect": "Allow",
      "Action": "secretsmanager:GetSecretValue",
      "Resource": [
        "arn:aws:secretsmanager:ap-northeast-1:ACCOUNT_ID:secret:lebazaar/production/*"
      ]
    },
    {
      "Sid": "DecryptWithKMS",
      "Effect": "Allow",
      "Action": "kms:Decrypt",
      "Resource": [
        "arn:aws:kms:ap-northeast-1:ACCOUNT_ID:key/KEY_ID"
      ]
    }
  ]
}
```

Attach this policy to the EC2 instance's IAM role. No static AWS credentials needed — the instance role provides temporary credentials automatically.

**For the tiered approach**, create a separate policy for `lebazaar/production/wallet` and attach it only to the task/container that runs web3 scripts, not the entire app.

### Step 3: Create the Injection Script

Create `docker-build/inject-secrets.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="/app/.env"
SECRET_NAME="${SECRETS_MANAGER_NAME:-lebazaar/production}"
REGION="${AWS_REGION:-ap-northeast-1}"
FALLBACK_ENV="${FALLBACK_ENV_FILE:-}"

echo "[secrets] Fetching secrets from AWS Secrets Manager: $SECRET_NAME"

# Attempt to fetch from Secrets Manager
if SECRET_JSON=$(aws secretsmanager get-secret-value \
  --secret-id "$SECRET_NAME" \
  --region "$REGION" \
  --query SecretString \
  --output text 2>/dev/null); then

  # Convert JSON to .env format
  echo "$SECRET_JSON" | jq -r 'to_entries | .[] | "\(.key)=\(.value)"' > "$ENV_FILE"
  chmod 600 "$ENV_FILE"
  echo "[secrets] Successfully wrote $(wc -l < "$ENV_FILE") variables to $ENV_FILE"

else
  echo "[secrets] WARNING: Failed to fetch from Secrets Manager"

  if [ -n "$FALLBACK_ENV" ] && [ -f "$FALLBACK_ENV" ]; then
    echo "[secrets] Falling back to $FALLBACK_ENV"
    cp "$FALLBACK_ENV" "$ENV_FILE"
    chmod 600 "$ENV_FILE"
  else
    echo "[secrets] ERROR: No fallback .env file available"
    exit 1
  fi
fi
```

**For the tiered approach**, fetch both secrets and merge:

```bash
# Fetch app secrets
APP_JSON=$(aws secretsmanager get-secret-value \
  --secret-id "lebazaar/production/app" --query SecretString --output text)

# Fetch wallet secrets
WALLET_JSON=$(aws secretsmanager get-secret-value \
  --secret-id "lebazaar/production/wallet" --query SecretString --output text)

# Merge and write
echo "$APP_JSON" "$WALLET_JSON" | jq -s 'add | to_entries | .[] | "\(.key)=\(.value)"' > "$ENV_FILE"
```

### Step 4: Update Docker Image

Add AWS CLI and jq to the Dockerfile (if not already present):

```dockerfile
# In Dockerfile.production, add to the runtime stage:
RUN apt-get update && apt-get install -y --no-install-recommends \
    jq \
    && curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "/tmp/awscliv2.zip" \
    && unzip /tmp/awscliv2.zip -d /tmp \
    && /tmp/aws/install \
    && rm -rf /tmp/aws /tmp/awscliv2.zip \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy the injection script
COPY docker-build/inject-secrets.sh /opt/inject-secrets.sh
RUN chmod +x /opt/inject-secrets.sh
```

Update the entrypoint to call the script before starting the app:

```dockerfile
# Replace the existing ENTRYPOINT/CMD with:
COPY docker-build/docker-entrypoint.sh /opt/docker-entrypoint.sh
RUN chmod +x /opt/docker-entrypoint.sh
ENTRYPOINT ["/opt/docker-entrypoint.sh"]
```

Create `docker-build/docker-entrypoint.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

# Inject secrets from AWS Secrets Manager (if configured)
if [ "${USE_SECRETS_MANAGER:-false}" = "true" ]; then
  /opt/inject-secrets.sh
fi

# Execute the original entrypoint/command
exec "$@"
```

### Step 5: Update Docker Compose

```yaml
# docker-build/docker-compose.production.yml
services:
  app:
    image: lebazaar-app-production:latest
    ports:
      - 80:80
      - 443:443
    volumes:
      # REMOVED: /var/.secrets/.env.production:/app/.env:ro
      - ./nginx/vhost.conf:/opt/docker/etc/nginx/vhost.conf:ro
      - /var/log/app:/app/storage/logs
      - /var/log/nginx/:/var/log/nginx
    environment:
      USE_SECRETS_MANAGER: "true"
      SECRETS_MANAGER_NAME: "lebazaar/production"
      AWS_REGION: "ap-northeast-1"
      # Fallback during transition period:
      FALLBACK_ENV_FILE: "/var/.secrets/.env.production"
      LOG_STDOUT: '/var/log/nginx/access.log'
      LOG_STDERR: '/var/log/nginx/error.log'
```

During the transition period, keep the volume mount as fallback:

```yaml
    volumes:
      - /var/.secrets/.env.production:/var/.secrets/.env.production:ro  # fallback only
```

Once verified, remove the fallback volume mount entirely.

### Step 6: Update Deploy Scripts

In `docker-build/production.sh`, the Blockfrost pre-flight check currently uses `--env-file`:

```bash
# Before (line 81):
docker run --env-file /var/.secrets/.env.production ...

# After:
docker run \
  -e USE_SECRETS_MANAGER=true \
  -e SECRETS_MANAGER_NAME=lebazaar/production \
  -e AWS_REGION=ap-northeast-1 \
  ...
```

The deploy script no longer needs to reference `/var/.secrets/` at all once the transition is complete.

## Verification

### Test the injection script locally

```bash
# Set up a test secret
aws secretsmanager create-secret \
  --name "lebazaar/test" \
  --secret-string '{"APP_KEY":"base64:test","DB_PASSWORD":"testpass"}'

# Run the injection script in a test container
docker run --rm \
  -e USE_SECRETS_MANAGER=true \
  -e SECRETS_MANAGER_NAME=lebazaar/test \
  -e AWS_REGION=ap-northeast-1 \
  lebazaar-app-production:latest \
  bash -c '/opt/inject-secrets.sh && cat /app/.env'

# Should output:
# APP_KEY=base64:test
# DB_PASSWORD=testpass

# Clean up
aws secretsmanager delete-secret --secret-id "lebazaar/test" --force-delete-without-recovery
```

### Verify in production

```bash
# After deploying with Secrets Manager:

# 1. Confirm .env is populated inside the container
docker exec lebazaar-app cat /app/.env | wc -l
# Should match the number of env vars

# 2. Confirm ROOT_KEY is accessible to Node.js
docker exec lebazaar-app bash -c 'cd /app/web3 && node --env-file=/app/.env -e "console.log(process.env.ROOT_KEY ? \"ROOT_KEY present\" : \"ROOT_KEY MISSING\")"'
# Should print: ROOT_KEY present

# 3. Confirm no .env file exists on the HOST (outside Docker)
ls -la /var/.secrets/.env.production
# After transition: this file should be removed

# 4. Check CloudTrail for the GetSecretValue event
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=EventName,AttributeValue=GetSecretValue \
  --max-items 5
```

## Rollback Plan

If Secrets Manager causes issues during deployment:

1. **Immediate:** Set `USE_SECRETS_MANAGER=false` in docker-compose environment and ensure the fallback volume mount is still present. Restart the container — it will use the file-based `.env`.

2. **Keep `/var/.secrets/.env.production` on disk** during the transition period (at least 2 weeks of successful deploys).

3. **Only remove the fallback** after:
   - 3+ successful production deploys using Secrets Manager
   - CloudTrail shows consistent GetSecretValue events
   - No failed secret fetches in container logs

## Monitoring

### CloudWatch Alarm for Secret Access

```bash
# Alert on failed secret reads (indicates permission issues or outage)
aws cloudwatch put-metric-alarm \
  --alarm-name "lebazaar-secret-access-failure" \
  --metric-name "SecretAccessFailure" \
  --namespace "LeBazaar" \
  --statistic Sum \
  --period 300 \
  --threshold 1 \
  --comparison-operator GreaterThanOrEqualToThreshold \
  --evaluation-periods 1 \
  --alarm-actions "arn:aws:sns:ap-northeast-1:ACCOUNT_ID:ops-alerts"
```

### CloudTrail Alert for ROOT_KEY Access

Set up a CloudTrail alert specifically for when the wallet secret is accessed. Any unexpected access pattern (wrong source IP, wrong time of day, wrong IAM principal) should trigger an immediate alert:

```bash
# CloudWatch Logs metric filter for wallet secret access
aws logs put-metric-filter \
  --log-group-name "CloudTrail/DefaultLogGroup" \
  --filter-name "WalletSecretAccess" \
  --filter-pattern '{ $.eventName = "GetSecretValue" && $.requestParameters.secretId = "*wallet*" }' \
  --metric-transformations \
    metricName=WalletSecretAccess,metricNamespace=LeBazaar,metricValue=1
```

## Secret Rotation

AWS Secrets Manager supports automatic rotation via Lambda functions. For Le Bazaar:

- **`DB_PASSWORD`**: Can use the built-in RDS rotation Lambda. Rotate every 90 days.
- **`STRIPE_SECRET`**: Rotate manually in Stripe Dashboard, then update the secret. Stripe supports rolling two API keys simultaneously.
- **`BLOCKFROST_API_KEY`**: Rotate manually in Blockfrost Dashboard.
- **`ROOT_KEY`**: **Do NOT rotate automatically.** Changing ROOT_KEY changes all derived custodial addresses, requiring on-chain migration of all user wallets. ROOT_KEY rotation is a major operational event, not a routine rotation.
- **`APP_KEY`**: Rotation invalidates all encrypted data (sessions, encrypted model fields). Rotate only with a planned re-encryption migration.

## Cross-References

- [Deployment](./deployment.md) — Deployment procedures and environment setup
- [Sanctum Token Expiration](./sanctum-token-expiration.md) — API token security
- [Architecture](./architecture.md) — System component overview
