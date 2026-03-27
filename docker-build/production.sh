#!/usr/bin/env bash
set -e

git checkout staging && git pull && git checkout release && git merge --no-ff develop

VERSION=""

#get parameters
while getopts v: flag
do
  case "${flag}" in
    v) VERSION=${OPTARG};;
  esac
done

#get highest tag number, and add 1.0.0 if doesn't exist
CURRENT_VERSION=`git describe --abbrev=0 --tags 2>/dev/null`

if [[ $CURRENT_VERSION == '' ]]
then
  CURRENT_VERSION='1.0.0'
fi
echo "Current Version: $CURRENT_VERSION"


#replace . with space so can split into an array
CURRENT_VERSION_PARTS=(${CURRENT_VERSION//./ })

#get number parts
VNUM1=${CURRENT_VERSION_PARTS[0]}
VNUM2=${CURRENT_VERSION_PARTS[1]}
VNUM3=${CURRENT_VERSION_PARTS[2]}

if [[ $VERSION == 'major' ]]
then
  VNUM1=$((VNUM1+1))
elif [[ $VERSION == 'minor' ]]
then
  VNUM2=$((VNUM2+1))
elif [[ $VERSION == 'patch' ]]
then
  VNUM3=$((VNUM3+1))
else
  echo "No version type (https://semver.org/) or incorrect type specified, try: -v [major, minor, patch]"
  exit 1
fi


#create new tag
NEW_TAG="$VNUM1.$VNUM2.$VNUM3"
echo "($VERSION) updating $CURRENT_VERSION to $NEW_TAG"

#get current hash and see if it already has a tag
GIT_COMMIT=`git rev-parse HEAD`
NEEDS_TAG=`git describe --contains $GIT_COMMIT 2>/dev/null`

#only tag if no tag already
if [ -z "$NEEDS_TAG" ]; then
  git tag -a $NEW_TAG -m "Version $NEW_TAG release"
  echo "Tagged with $NEW_TAG"
  git push --tags
  git push
else
  echo "Already a tag on this commit"
fi

COMMIT_SHA=$(git rev-parse --short HEAD)

# Build new image — tagged with :latest and :<commit-sha> for rollback
docker build --rm \
  -t lebazaar-app \
  -t lebazaar-app-production:latest \
  -t lebazaar-app-production:"$COMMIT_SHA" \
  -f Dockerfile.production ../

wait_healthy() {
  local timeout=150
  local interval=5
  local elapsed=0
  local container_id
  container_id=$(docker compose -f docker-compose.production.yml -p lebazaar-app ps -q app)

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

docker compose -f docker-compose.production.yml rm -sf app
docker compose -f docker-compose.production.yml -p lebazaar-app up -d

wait_healthy

# docker compose -f docker-compose.production.yml -p lebazaar-app exec app php artisan optimize:clear
docker compose -f docker-compose.production.yml -p lebazaar-app exec app php artisan migrate --force
docker compose -f docker-compose.production.yml -p lebazaar-app exec app php artisan db:seed --class=ExchangeRateSettingSeeder
docker compose -f docker-compose.production.yml -p lebazaar-app exec app php artisan route:cache
docker compose -f docker-compose.production.yml -p lebazaar-app exec app php artisan view:cache
docker compose -f docker-compose.production.yml -p lebazaar-app exec app php artisan storage:link

# Post-deploy smoke test — abort if app is not responding correctly
echo "Running post-deploy smoke test..."
curl --fail --silent --show-error http://localhost/health
echo "Deploy complete: lebazaar-app-production:${COMMIT_SHA}"

docker image prune -f
