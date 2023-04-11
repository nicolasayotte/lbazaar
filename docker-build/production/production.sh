#!/usr/bin/env bash
git checkout develop && git pull
docker build --rm -t lebazaar-app -t lebazaar-app-production:latest -f Dockerfile.production ../
docker compose -f docker-compose.production.yml rm -sf app # Stop only the app container
docker compose -f docker-compose.production.yml -p lebazaar-app --env-file /var/.secrets/.env.production up -d
sleep 10
# docker compose -f docker-compose.production.yml -p lebazaar-app exec app php artisan optimize:clear
docker compose -f docker-compose.production.yml -p lebazaar-app exec app php artisan migrate --force
docker compose -f docker-compose.production.yml -p lebazaar-app exec app php artisan route:cache
docker compose -f docker-compose.production.yml -p lebazaar-app exec app php artisan view:cache
docker compose -f docker-compose.production.yml -p lebazaar-app exec app php artisan storage:link
docker image prune -f
