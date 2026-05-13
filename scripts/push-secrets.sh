#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
    echo "Usage: $0 <environment> [--diff|--dry-run]" >&2
    echo "  --diff     Show which keys would be added / changed / removed and exit." >&2
    echo "  --dry-run  Build the JSON payload but skip the AWS write." >&2
    exit 1
fi

ENV=$1
MODE="${2:-}"
ENV_FILE=".env.$ENV"
SECRET_NAME="lebazaar/$ENV"
AWS_ARGS=(--profile lb --region ap-northeast-1)

if [[ ! -f "$ENV_FILE" ]]; then
    echo "Error: $ENV_FILE not found" >&2
    exit 1
fi

echo "Building secrets JSON from $ENV_FILE..."

# Parse $ENV_FILE into a JSON object: every KEY=VALUE line becomes a field.
# Skips blanks and comments. Strips surrounding quotes. Multi-line values are
# not supported (.env convention).
json='{}'
while IFS= read -r line || [[ -n "$line" ]]; do
    [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
    if [[ "$line" =~ ^[[:space:]]*([A-Za-z_][A-Za-z0-9_]*)[[:space:]]*=(.*)$ ]]; then
        key="${BASH_REMATCH[1]}"
        raw="${BASH_REMATCH[2]}"
        raw="${raw#\"}" ; raw="${raw%\"}"
        raw="${raw#\'}" ; raw="${raw%\'}"
        json=$(jq --arg k "$key" --arg v "$raw" '. + {($k): $v}' <<<"$json")
    fi
done < "$ENV_FILE"

key_count=$(jq 'length' <<<"$json")
echo "Secrets JSON ready ($key_count keys)."

if [[ "$MODE" == "--diff" || "$MODE" == "--dry-run" ]]; then
    if aws "${AWS_ARGS[@]}" secretsmanager describe-secret --secret-id "$SECRET_NAME" &>/dev/null; then
        existing=$(aws "${AWS_ARGS[@]}" secretsmanager get-secret-value \
            --secret-id "$SECRET_NAME" --query SecretString --output text)
        echo
        echo "── Diff against $SECRET_NAME ──────────────────────────────"
        # Emit key-level adds / removes / changes (values are not shown).
        jq -n --argjson a "$existing" --argjson b "$json" '
            ($a | keys) as $ak | ($b | keys) as $bk |
            {
                added:   ($bk - $ak),
                removed: ($ak - $bk),
                changed: [ $ak[] | select(. as $k | ($a[$k] != $b[$k]) and ($ak | index($k)) and ($bk | index($k))) ]
            }'
    else
        echo "(secret $SECRET_NAME does not exist yet — full payload will be created)"
        jq 'keys' <<<"$json"
    fi
    [[ "$MODE" == "--diff" ]] && exit 0
fi

if aws "${AWS_ARGS[@]}" secretsmanager describe-secret --secret-id "$SECRET_NAME" &>/dev/null; then
    echo "Updating existing secret: $SECRET_NAME"
    aws "${AWS_ARGS[@]}" secretsmanager put-secret-value \
        --secret-id "$SECRET_NAME" \
        --secret-string "$json"
else
    echo "Creating new secret: $SECRET_NAME"
    aws "${AWS_ARGS[@]}" secretsmanager create-secret \
        --name "$SECRET_NAME" \
        --description "Le Bazaar $ENV environment env (full .env contents)" \
        --secret-string "$json"
fi

echo "Done."
