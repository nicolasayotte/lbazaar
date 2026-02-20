#!/usr/bin/env bash
# stripe-listen.sh — Forward Stripe webhook events to local dev server
# Auto-detects APP_URL from .env and updates STRIPE_WEBHOOK_SECRET on connect
set -euo pipefail

# Check stripe CLI is available
if ! command -v stripe &>/dev/null; then
    echo "Error: stripe CLI not found."
    echo "Install: https://docs.stripe.com/stripe-cli"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_ROOT/.env"

# Extract APP_URL from .env, fallback to localhost:8080
APP_URL="http://localhost:8080"
if [[ -f "$ENV_FILE" ]]; then
    _url=$(grep -oP '^APP_URL=\K.*' "$ENV_FILE" | tr -d '"' | tr -d "'" 2>/dev/null || true)
    [[ -n "$_url" ]] && APP_URL="$_url"
fi

WEBHOOK_URL="${APP_URL}/api/stripe/webhook"

echo "Stripe webhook forwarder"
echo "→ Forwarding to: $WEBHOOK_URL"
echo ""
echo "Trigger test events (in a separate terminal):"
echo "  stripe trigger payment_intent.succeeded"
echo "  stripe trigger payment_intent.payment_failed"
echo "  stripe trigger payment_intent.canceled"
echo "  stripe trigger checkout.session.completed"
echo ""
echo "Press Ctrl+C to stop."
echo "---"

SECRET_UPDATED=0

# Pipe stripe output through; detect the whsec_ signing secret and patch .env
stripe listen --forward-to "$WEBHOOK_URL" 2>&1 | while IFS= read -r line; do
    echo "$line"

    if [[ $SECRET_UPDATED -eq 0 && "$line" == *"whsec_"* ]]; then
        SECRET=$(printf '%s' "$line" | grep -oP 'whsec_\S+' | head -1 || true)
        if [[ -n "$SECRET" && -f "$ENV_FILE" ]]; then
            if grep -q "^STRIPE_WEBHOOK_SECRET=" "$ENV_FILE"; then
                sed -i "s|^STRIPE_WEBHOOK_SECRET=.*|STRIPE_WEBHOOK_SECRET=$SECRET|" "$ENV_FILE"
            else
                echo "" >> "$ENV_FILE"
                echo "STRIPE_WEBHOOK_SECRET=$SECRET" >> "$ENV_FILE"
            fi
            SECRET_UPDATED=1
            echo ""
            echo "→ .env updated: STRIPE_WEBHOOK_SECRET=$SECRET"
            echo "→ Running 'sail artisan config:clear'…"
            ( cd "$PROJECT_ROOT" && ./vendor/bin/sail artisan config:clear )
        fi
    fi
done
