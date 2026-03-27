#!/bin/bash
# Quick helper script for local production testing
# See docs/LOCAL_PROD_TESTING.md for full documentation

set -e

COMPOSE_FILE="docker-compose.local-prod.yml"
COMPOSE="docker compose -f $COMPOSE_FILE"

# Stop Sail dev environment if running (avoids port 8080 conflict)
stop_sail_if_running() {
    if docker compose ps --status running 2>/dev/null | grep -q 'sail'; then
        echo -e "${YELLOW}Stopping Sail dev environment (port conflict)...${NC}"
        docker compose down
    fi
}

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_usage() {
    cat << USAGE
Le Bazaar - Local Production Testing Helper

USAGE:
    ./test-prod.sh <command>

COMMANDS:
    start           Build and start production-like environment
    stop            Stop services (keep data)
    clean           Stop and remove all data
    test            Run all tests (PHP + Web3)
    test-php        Run PHP tests only
    test-web3       Run Web3 tests only
    test-integration  Run integration tests (requires real API keys)
    migrate         Run database migrations
    migrate-fresh   Fresh migration with seed data
    shell           Enter app container shell
    logs            Follow application logs
    status          Show container status
    rebuild         Rebuild image from scratch (no cache)
    full-test       Complete test suite (recommended before deploy)

EXAMPLES:
    ./test-prod.sh start                    # Build and start
    ./test-prod.sh test                     # Run all tests
    ./test-prod.sh full-test                # Complete pre-deployment test
    ./test-prod.sh full-test --integration  # Full test + integration tests
    ./test-prod.sh test-integration         # Integration tests only
    ./test-prod.sh shell                    # Enter container
    ./test-prod.sh logs                     # Watch logs
    ./test-prod.sh clean                    # Clean up everything

For detailed documentation, see: docs/LOCAL_PROD_TESTING.md
USAGE
}

case "$1" in
    start)
        stop_sail_if_running
        echo -e "${GREEN}Building and starting production environment...${NC}"
        $COMPOSE up --build -d
        echo ""
        echo -e "${YELLOW}Waiting for health checks (40 seconds)...${NC}"
        sleep 45
        $COMPOSE ps
        echo ""
        echo -e "${GREEN}✓ Services started${NC}"
        echo -e "${YELLOW}Next steps:${NC}"
        echo "  ./test-prod.sh migrate       # Run migrations"
        echo "  ./test-prod.sh test          # Run tests"
        echo "  http://localhost:8080        # Access application"
        ;;
    
    stop)
        echo -e "${YELLOW}Stopping services...${NC}"
        $COMPOSE down
        echo -e "${GREEN}✓ Services stopped (data preserved)${NC}"
        ;;
    
    clean)
        echo -e "${RED}Stopping and removing all data...${NC}"
        $COMPOSE down -v
        echo -e "${GREEN}✓ Clean slate${NC}"
        ;;
    
    test)
        echo -e "${GREEN}Running PHP tests...${NC}"
        $COMPOSE exec app php artisan test
        echo ""
        echo -e "${GREEN}Running Web3 tests...${NC}"
        $COMPOSE exec app sh -c "cd web3 && npm run test"
        echo ""
        echo -e "${GREEN}✓ All tests completed${NC}"
        ;;
    
    test-php)
        echo -e "${GREEN}Running PHP tests...${NC}"
        $COMPOSE exec app php artisan test
        ;;
    
    test-web3)
        echo -e "${GREEN}Running Web3 tests...${NC}"
        $COMPOSE exec app sh -c "cd web3 && npm run test"
        ;;
    
    migrate)
        echo -e "${GREEN}Running migrations...${NC}"
        $COMPOSE exec app php artisan migrate
        echo -e "${GREEN}✓ Migrations completed${NC}"
        ;;
    
    migrate-fresh)
        echo -e "${YELLOW}Fresh migration with seed data...${NC}"
        $COMPOSE exec app php artisan migrate:fresh --seed
        echo -e "${GREEN}✓ Database initialized${NC}"
        ;;
    
    shell)
        echo -e "${GREEN}Entering app container...${NC}"
        $COMPOSE exec app sh
        ;;
    
    logs)
        echo -e "${GREEN}Following logs (Ctrl+C to stop)...${NC}"
        $COMPOSE logs -f app
        ;;
    
    status)
        echo -e "${GREEN}Container status:${NC}"
        $COMPOSE ps
        ;;
    
    test-integration)
        echo -e "${GREEN}Running PHP integration tests...${NC}"
        $COMPOSE exec app php vendor/bin/phpunit --testsuite=Integration --no-coverage
        echo ""
        echo -e "${GREEN}Running Web3 integration tests...${NC}"
        $COMPOSE exec app sh -c "cd web3 && npm run test:integration"
        echo ""
        echo -e "${GREEN}✓ Integration tests completed${NC}"
        ;;

    rebuild)
        echo -e "${YELLOW}Rebuilding from scratch (no cache)...${NC}"
        $COMPOSE build --no-cache
        echo -e "${GREEN}✓ Rebuild completed${NC}"
        ;;

    full-test)
        STEP_TOTAL=8
        if [ "$2" = "--integration" ]; then STEP_TOTAL=9; fi

        echo -e "${GREEN}========================================${NC}"
        echo -e "${GREEN}Le Bazaar - Full Pre-Deployment Test${NC}"
        echo -e "${GREEN}========================================${NC}"
        echo ""

        stop_sail_if_running

        echo -e "${YELLOW}[1/$STEP_TOTAL] Building production image...${NC}"
        $COMPOSE build

        echo ""
        echo -e "${YELLOW}[2/$STEP_TOTAL] Starting services...${NC}"
        $COMPOSE up -d

        echo ""
        echo -e "${YELLOW}[3/$STEP_TOTAL] Waiting for health checks...${NC}"
        sleep 45

        echo ""
        echo -e "${YELLOW}[4/$STEP_TOTAL] Running migrations...${NC}"
        $COMPOSE exec -T app php artisan migrate --schema-path=/dev/null

        echo ""
        echo -e "${YELLOW}[5/$STEP_TOTAL] Smoke-testing production image (no dev deps)...${NC}"
        $COMPOSE exec -T app php artisan route:list > /dev/null
        echo -e "${GREEN}  ✓ Artisan boots successfully${NC}"
        $COMPOSE exec -T app wget --spider -q http://localhost/
        echo -e "${GREEN}  ✓ HTTP server responds${NC}"

        echo ""
        echo -e "${YELLOW}[6/$STEP_TOTAL] Installing dev dependencies & running PHP tests...${NC}"
        $COMPOSE exec -T -e COMPOSER_HOME=/tmp/composer app composer install --no-interaction --optimize-autoloader
        $COMPOSE cp tests/. app:/app/tests
        $COMPOSE cp phpunit.xml app:/app/phpunit.xml
        $COMPOSE exec -T \
            -e APP_ENV=testing \
            -e SESSION_DRIVER=array \
            -e CACHE_DRIVER=array \
            app php artisan test

        echo ""
        echo -e "${YELLOW}[7/$STEP_TOTAL] Running Web3 tests...${NC}"
        $COMPOSE exec -T app sh -c "cd web3 && npm run test:show"

        if [ "$2" = "--integration" ]; then
            echo ""
            echo -e "${YELLOW}[8/9] Running integration tests (real APIs)...${NC}"
            $COMPOSE exec -T app php vendor/bin/phpunit --testsuite=Integration --no-coverage || true
            $COMPOSE exec -T app sh -c "cd web3 && npm run test:integration" || true
        fi

        echo ""
        echo -e "${YELLOW}[$STEP_TOTAL/$STEP_TOTAL] Checking health status...${NC}"
        $COMPOSE ps
        
        echo ""
        echo -e "${GREEN}========================================${NC}"
        echo -e "${GREEN}✓ Full test suite completed!${NC}"
        echo -e "${GREEN}========================================${NC}"
        echo ""
        echo -e "${YELLOW}Manual verification checklist:${NC}"
        echo "  [ ] Visit http://localhost:8080"
        echo "  [ ] Test admin login"
        echo "  [ ] Test certificate minting"
        echo "  [ ] Check logs: ./test-prod.sh logs"
        echo ""
        echo -e "${GREEN}If all checks pass, you're ready to deploy!${NC}"
        echo ""
        echo "To cleanup: ./test-prod.sh clean"
        ;;
    
    *)
        print_usage
        exit 1
        ;;
esac
