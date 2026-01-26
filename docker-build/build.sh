#!/bin/bash
set -e

# Le Bazaar Docker Build Script
# Usage: ./build.sh [production|staging] [--push] [--scan]

ENVIRONMENT=${1:-production}
REGISTRY=${DOCKER_REGISTRY:-""}
TAG=${DOCKER_TAG:-latest}
PUSH=false
SCAN=false

# Parse arguments
for arg in "$@"; do
    case $arg in
        --push)
            PUSH=true
            shift
            ;;
        --scan)
            SCAN=true
            shift
            ;;
    esac
done

# Validate environment
if [[ "$ENVIRONMENT" != "production" && "$ENVIRONMENT" != "staging" ]]; then
    echo "Error: Environment must be 'production' or 'staging'"
    echo "Usage: ./build.sh [production|staging] [--push] [--scan]"
    exit 1
fi

IMAGE_NAME="lebazaar-app-${ENVIRONMENT}"
FULL_IMAGE_NAME="${REGISTRY}${IMAGE_NAME}:${TAG}"

echo "========================================"
echo "Building Le Bazaar - ${ENVIRONMENT^^}"
echo "========================================"
echo "Image: ${FULL_IMAGE_NAME}"
echo "Push: ${PUSH}"
echo "Scan: ${SCAN}"
echo "========================================"

# Build the image
echo ""
echo "🔨 Building Docker image..."
cd ..
DOCKER_BUILDKIT=1 docker build \
    -f docker-build/Dockerfile.${ENVIRONMENT} \
    -t ${IMAGE_NAME}:${TAG} \
    -t ${FULL_IMAGE_NAME} \
    --progress=plain \
    .

echo ""
echo "✓ Build completed successfully"

# Show image details
echo ""
echo "📊 Image Details:"
docker images ${IMAGE_NAME}:${TAG} --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"

# Security scan if requested
if [ "$SCAN" = true ]; then
    echo ""
    echo "🔍 Running security scan..."

    if command -v trivy &> /dev/null; then
        trivy image --severity HIGH,CRITICAL ${IMAGE_NAME}:${TAG}
    else
        echo "⚠️  Trivy not installed. Skipping security scan."
        echo "Install with: wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | sudo apt-key add -"
    fi
fi

# Push if requested
if [ "$PUSH" = true ]; then
    echo ""
    echo "📤 Pushing to registry..."

    if [ -z "$REGISTRY" ]; then
        echo "⚠️  Warning: DOCKER_REGISTRY not set. Skipping push."
    else
        docker push ${FULL_IMAGE_NAME}
        echo "✓ Push completed"
    fi
fi

echo ""
echo "========================================"
echo "✓ All done!"
echo "========================================"
echo ""
echo "To test locally:"
echo "  docker run -p 8080:80 --env-file .env ${IMAGE_NAME}:${TAG}"
echo ""
echo "To deploy:"
echo "  cd docker-build"
echo "  docker compose -f docker-compose.${ENVIRONMENT}.yml up -d"
echo ""
