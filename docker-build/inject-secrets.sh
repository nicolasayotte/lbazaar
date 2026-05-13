#!/usr/bin/env bash
set -euo pipefail

# Build /app/.env from one or more AWS Secrets Manager IDs. Each ID's JSON
# is flattened to KEY=VALUE lines and appended in order — later IDs override
# earlier ones if the same key appears twice. Default: a single secret name
# from SECRETS_MANAGER_NAME. To split a credential out for rotation later,
# set SECRET_IDS to a colon-separated list (e.g. "lebazaar/staging/db:lebazaar/staging").
#
# /app/.env.base is optional and no longer mounted in staging or production —
# the whole .env now lives in Secrets Manager. The check is retained so a
# future environment that wants a non-secret floor can opt in.

SECRET_IDS="${SECRET_IDS:-${SECRETS_MANAGER_NAME:-lebazaar/staging}}"
REGION="${AWS_REGION:-ap-northeast-1}"

if [[ -f /app/.env.base ]]; then
    echo "[secrets] Seeding from /app/.env.base"
    cp /app/.env.base /app/.env
else
    : > /app/.env
fi

IFS=':' read -ra IDS <<< "$SECRET_IDS"
for id in "${IDS[@]}"; do
    echo "[secrets] Fetching from AWS Secrets Manager: $id"
    aws secretsmanager get-secret-value \
        --secret-id "$id" \
        --region "$REGION" \
        --query SecretString \
        --output text \
        | jq -r 'to_entries[] | "\(.key)=\(.value | @json)"' >> /app/.env
done

chown application:application /app/.env
chmod 640 /app/.env
echo "[secrets] Done"
