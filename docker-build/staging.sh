#!/usr/bin/env bash
set -e

git checkout staging && git pull

COMMIT_SHA=$(git rev-parse --short HEAD)

# Build new image — tagged with :latest and :<commit-sha> for rollback
docker build --rm \
  -t lebazaar-app \
  -t lebazaar-app-staging:latest \
  -t lebazaar-app-staging:"$COMMIT_SHA" \
  -f Dockerfile.staging ../

wait_healthy() {
  local timeout=150
  local interval=5
  local elapsed=0
  local container_id
  container_id=$(docker compose -f docker-compose.staging.yml -p lebazaar-app ps -q app)

  echo "Waiting for container to become healthy..."
  while [ $elapsed -lt $timeout ]; do
    STATUS=$(docker inspect --format='{{.State.Health.Status}}' "$container_id" 2>/dev/null || echo "unknown")
    if [ "$STATUS" = "healthy" ]; then
      echo "Container is healthy."
      return 0
    fi
    sleep $interval
    elapsed=$((elapsed + interval))
    echo "  ... ${elapsed}s elapsed, status: ${STATUS}"
  done

  echo "ERROR: Container did not become healthy within ${timeout}s"
  return 1
}

docker compose -f docker-compose.staging.yml rm -sf app
docker compose -f docker-compose.staging.yml -p lebazaar-app up -d

wait_healthy

# docker compose -f docker-compose.staging.yml -p lebazaar-app exec app php artisan optimize:clear
docker compose -f docker-compose.staging.yml -p lebazaar-app exec app php artisan migrate --force
docker compose -f docker-compose.staging.yml -p lebazaar-app exec app php artisan db:seed --class=ExchangeRateSettingSeeder
docker compose -f docker-compose.staging.yml -p lebazaar-app exec app php artisan route:cache
docker compose -f docker-compose.staging.yml -p lebazaar-app exec app php artisan view:cache
docker compose -f docker-compose.staging.yml -p lebazaar-app exec app php artisan storage:link

# Post-deploy smoke test — abort if app is not responding correctly
echo "Running post-deploy smoke test..."
curl --fail --silent --show-error http://localhost/health
echo "Deploy complete: lebazaar-app-staging:${COMMIT_SHA}"

docker image prune -f
