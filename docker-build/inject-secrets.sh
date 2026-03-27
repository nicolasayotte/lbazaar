#!/usr/bin/env bash
set -euo pipefail

SECRET_NAME="${SECRETS_MANAGER_NAME:-lebazaar/staging}"
REGION="${AWS_REGION:-ap-northeast-1}"

echo "[secrets] Fetching from AWS Secrets Manager: $SECRET_NAME"
cp /app/.env.base /app/.env
aws secretsmanager get-secret-value \
  --secret-id "$SECRET_NAME" \
  --region "$REGION" \
  --query SecretString \
  --output text \
  | jq -r 'to_entries[] | "\(.key)=\(.value)"' >> /app/.env
chown application:application /app/.env
chmod 640 /app/.env
echo "[secrets] Done"
