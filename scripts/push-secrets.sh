#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
    echo "Usage: $0 <environment>" >&2
    exit 1
fi

KEYS=(
    APP_KEY
    DB_PASSWORD
    BLOCKFROST_API_KEY
    ENTROPY
    OWNER_PKH
    OWNER_WALLET_ADDR
    MAIL_PASSWORD
    REDIS_PASSWORD
    STRIPE_KEY
    STRIPE_SECRET
    STRIPE_WEBHOOK_SECRET
)

ENV_FILE=".env.$1"

if [[ ! -f "$ENV_FILE" ]]; then
    echo "Error: $ENV_FILE not found" >&2
    exit 1
fi

echo "Building secrets JSON..."
json="{}"
for key in "${KEYS[@]}"; do
    raw=$(grep -E "^${key}=" "$ENV_FILE" | head -1 | cut -d'=' -f2- || true)
    if [[ -z "$raw" ]]; then
        echo "Warning: $key not found in $ENV_FILE" >&2
        continue
    fi
    # Strip surrounding quotes if present
    raw="${raw#\"}" ; raw="${raw%\"}"
    raw="${raw#\'}" ; raw="${raw%\'}"
    # Use jq to safely set the value (handles all escaping)
    json=$(echo "$json" | jq --arg k "$key" --arg v "$raw" '. + {($k): $v}')
done

echo "Secrets JSON ready."

SECRET_NAME="lebazaar/$1"

# Check if the secret already exists
if aws --profile lb --region ap-northeast-1 secretsmanager describe-secret \
    --secret-id "$SECRET_NAME" &>/dev/null; then
    echo "Updating existing secret: $SECRET_NAME"
    aws --profile lb --region ap-northeast-1 secretsmanager put-secret-value \
        --secret-id "$SECRET_NAME" \
        --secret-string "$json"
else
    echo "Creating new secret: $SECRET_NAME"
    aws --profile lb --region ap-northeast-1 secretsmanager create-secret \
        --name "$SECRET_NAME" \
        --description "Le Bazaar $1 environment secrets" \
        --secret-string "$json"
fi

echo "Done."
