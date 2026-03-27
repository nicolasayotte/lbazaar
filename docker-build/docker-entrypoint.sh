#!/usr/bin/env bash
set -e

if [ "${USE_SECRETS_MANAGER:-false}" = "true" ]; then
  /opt/inject-secrets.sh
fi

exec /entrypoint.sh "$@"
