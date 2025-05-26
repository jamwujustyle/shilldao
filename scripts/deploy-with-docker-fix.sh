#!/bin/bash

# Enhanced Deployment Script with Docker Storage Management
# This script handles Docker storage issues and ensures reliable deployment

set -e

echo "=========================================="
echo "🚀 ENHANCED DEPLOYMENT SCRIPT"
echo "=========================================="
echo "Timestamp: $(date)"
echo "=========================================="

# Configuration
DOCKER_HUB_USERNAME="${DOCKER_HUB_USERNAME:-codebuddha}"
BACKEND_IMAGE="${DOCKER_HUB_USERNAME}/shillers-backend:development"
FRONTEND_IMAGE="${DOCKER_HUB_USERNAME}/shillers-frontend:development"
MAX_RETRIES=3
RETRY_DELAY=10

# Function to log messages with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to check Docker daemon health
check_docker_health() {
    log "🔍 Checking Docker daemon health..."

    if ! docker info >/dev/null 2>&1; then
        log "❌ Docker daemon is not running or accessible"
        return 1
    fi

    # Check for storage driver issues
    storage_driver=$(docker info --format '{{.Driver}}' 2>/dev/null || echo "unknown")
    log "Docker storage driver: $storage_driver"

    # Check available space
    docker_root=$(docker info --format '{{.DockerRootDir}}' 2>/dev/null || echo "/var/lib/docker")
    available_space=$(df "$docker_root" 2>/dev/null | tail -1 | awk '{print $4}' || echo "0")
    available_gb=$((available_space / 1024 / 1024))

    log "Available Docker storage space: ${available_gb}GB"

    if [ $available_gb -lt 5 ]; then
        log "⚠️ WARNING: Low disk space detected (${available_gb}GB available)"
        log "Running Docker cleanup..."
        docker system prune -af || true
    fi

    log "✅ Docker daemon health check passed"
    return 0
}

# Function to fix Docker storage issues
fix_docker_storage() {
    log "🔧 Fixing Docker storage issues..."

    # Stop all containers
    if [ "$(docker ps -q)" ]; then
        log "Stopping running containers..."
        docker stop $(docker ps -q) || true
    fi

    # Remove all containers
    if [ "$(docker ps -aq)" ]; then
        log "Removing all containers..."
        docker rm -f $(docker ps -aq) || true
    fi

    # Clean up Docker system
    log "Running comprehensive Docker cleanup..."
    docker system prune -af --volumes || true

    # Remove problematic temporary files
    log "Cleaning Docker temporary files..."
    sudo find /var/lib/docker/tmp -type f -name "GetImageBlob*" -delete 2>/dev/null || true
    sudo rm -rf /var/lib/docker/tmp/* 2>/dev/null || true

    # Restart Docker daemon
    log "Restarting Docker daemon..."
    sudo systemctl restart docker

    # Wait for Docker to be ready
    timeout=60
    while ! docker info >/dev/null 2>&1; do
        if [ $timeout -le 0 ]; then
            log "❌ Docker daemon failed to restart within 60 seconds"
            return 1
        fi
        log "Waiting for Docker daemon... ($timeout seconds remaining)"
        sleep 2
        timeout=$((timeout - 2))
    done

    log "✅ Docker storage issues fixed"
    return 0
}

# Function to pull Docker image with retry logic
pull_image_with_retry() {
    local image=$1
    local attempt=1

    log "📥 Pulling image: $image"

    while [ $attempt -le $MAX_RETRIES ]; do
        log "Attempt $attempt/$MAX_RETRIES to pull $image..."

        if docker pull "$image"; then
            log "✅ Successfully pulled $image on attempt $attempt"

            # Verify the image
            if docker images "$image" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}" | grep -v REPOSITORY; then
                log "✅ Image verification successful"
                return 0
            else
                log "❌ Image verification failed"
            fi
        else
            log "❌ Attempt $attempt failed to pull $image"

            if [ $attempt -lt $MAX_RETRIES ]; then
                log "🔄 Retrying in $RETRY_DELAY seconds..."
                sleep $RETRY_DELAY

                # Clean up any partial downloads and fix storage issues
                docker system prune -af || true

                # If this is the second attempt, try fixing Docker storage
                if [ $attempt -eq 2 ]; then
                    log "🔧 Attempting Docker storage fix..."
                    fix_docker_storage || log "⚠️ Docker storage fix failed, continuing anyway"
                fi
            fi
        fi

        attempt=$((attempt + 1))
    done

    log "❌ FAILED: Could not pull $image after $MAX_RETRIES attempts"
    return 1
}

# Function to check if image exists on Docker Hub
check_image_exists() {
    local image=$1
    log "🔍 Checking if $image exists on Docker Hub..."

    if docker manifest inspect "$image" >/dev/null 2>&1; then
        log "✅ Image $image exists on Docker Hub"
        return 0
    else
        log "❌ Image $image not found on Docker Hub"
        return 1
    fi
}

# Function to deploy with Docker Compose
deploy_application() {
    log "🚀 Starting application deployment..."

    # Check if required files exist
    if [ ! -f docker-compose.yml ]; then
        log "❌ docker-compose.yml not found"
        return 1
    fi

    if [ ! -f docker-compose.prod.yml ]; then
        log "❌ docker-compose.prod.yml not found"
        return 1
    fi

    # Stop existing containers
    log "🛑 Stopping existing containers..."
    docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.production down || {
        log "⚠️ Could not stop existing containers (they might not be running)"
    }

    # Start new deployment
    log "🚀 Starting new deployment..."
    if docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.production up -d; then
        log "✅ Docker Compose deployment started successfully"

        # Wait for containers to initialize
        log "⏳ Waiting 15 seconds for containers to initialize..."
        sleep 15

        # Check container status
        log "📊 Container Status:"
        docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.production ps

        # Verify all containers are running
        failed_containers=$(docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.production ps --format json 2>/dev/null | jq -r 'select(.State != "running") | .Name' 2>/dev/null || echo "")

        if [ -n "$failed_containers" ]; then
            log "❌ Some containers are not running:"
            echo "$failed_containers"
            log "Container logs for debugging:"
            docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.production logs --tail=50
            return 1
        else
            log "✅ All containers are running successfully"
            return 0
        fi
    else
        log "❌ Docker Compose deployment failed"
        log "Deployment logs:"
        docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.production logs --tail=100
        return 1
    fi
}

# Function to create environment file
create_env_file() {
    log "📝 Creating production environment file..."

    # Set default values for variables that might be empty
    STATE_VIEW_ADDRESS=${STATE_VIEW_ADDRESS:-"PLACEHOLDER"}
    POOL_ID=${POOL_ID:-"PLACEHOLDER"}
    SHILL_TOKEN_ADDRESS=${SHILL_TOKEN_ADDRESS:-"PLACEHOLDER"}
    DAO_CONTRACT_ADDRESS=${DAO_CONTRACT_ADDRESS:-"0xE5FE82ec6482d0291f22B5269eDBC4a046eEA763"}
    TRANSFER_EVENT_SIGNATURE=${TRANSFER_EVENT_SIGNATURE:-"PLACEHOLDER"}

    cat > .env.production << EOF
NODE_ENV=production
DEBUG=false
BUILD_TARGET=production

# Docker Images
BACKEND_IMAGE=${BACKEND_IMAGE}
FRONTEND_IMAGE=${FRONTEND_IMAGE}

# Ports
FRONTEND_PORT=3000
BACKEND_PORT=8000
DB_PORT=5432
REDIS_PORT=6379

# Database
DB_NAME=${DB_NAME}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DB_HOST=db

# Redis
REDIS_HOST=redis

# URLs
ALLOWED_HOSTS=shilldao.xyz,134.209.95.65
CORS_ALLOWED_ORIGINS=${CORS_ALLOWED_ORIGINS}
NEXT_PUBLIC_API_BASE_URL=https://shilldao.xyz/api/v1/

# API Keys
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=${WALLETCONNECT_PROJECT_ID}

# Django
SECRET_KEY=${DJANGO_SECRET_KEY}

# Web3
INFURA_PROJECT_ID=${INFURA_PROJECT_ID}
STATE_VIEW_ADDRESS=${STATE_VIEW_ADDRESS}
POOL_ID=${POOL_ID}
SHILL_TOKEN_ADDRESS=${SHILL_TOKEN_ADDRESS}
DAO_CONTRACT_ADDRESS=${DAO_CONTRACT_ADDRESS}
TRANSFER_EVENT_SIGNATURE=${TRANSFER_EVENT_SIGNATURE}
EOF

    if [ -f .env.production ]; then
        log "✅ Environment file created successfully"
        return 0
    else
        log "❌ Failed to create environment file"
        return 1
    fi
}

# Function to cleanup
cleanup() {
    log "🧹 Performing cleanup..."

    # Clean up Docker system
    docker system prune -af || log "⚠️ Docker cleanup failed"

    # Remove environment file for security
    rm -f .env.production || log "⚠️ Could not remove environment file"

    log "✅ Cleanup completed"
}

# Main deployment function
main() {
    log "Starting enhanced deployment process..."

    # Change to deployment directory
    cd /root/shillers || {
        log "❌ Could not change to /root/shillers directory"
        exit 1
    }
    log "✅ Changed to deployment directory"

    # Pull latest code
    log "📥 Pulling latest code from master branch..."
    if git pull origin master; then
        log "✅ Successfully pulled latest code"
    else
        log "❌ Failed to pull latest code"
        exit 1
    fi

    # Login to Docker Hub
    if [ -n "$DOCKER_HUB_USERNAME" ] && [ -n "$DOCKER_HUB_TOKEN" ]; then
        log "🔑 Logging in to Docker Hub as $DOCKER_HUB_USERNAME..."
        if echo "$DOCKER_HUB_TOKEN" | docker login -u "$DOCKER_HUB_USERNAME" --password-stdin; then
            log "✅ Docker login successful"
        else
            log "❌ Docker login failed. Proceeding without authentication, but pulls might be rate-limited or fail for private images."
            # Depending on policy, you might want to exit 1 here if login is critical
        fi
    else
        log "⚠️ DOCKER_HUB_USERNAME or DOCKER_HUB_TOKEN not set. Skipping Docker login. Pulls might be rate-limited or fail for private images."
    fi

    # Create environment file
    create_env_file || {
        log "❌ Failed to create environment file"
        exit 1
    }

    # Check Docker health
    if ! check_docker_health; then
        log "🔧 Docker health check failed, attempting to fix..."
        fix_docker_storage || {
            log "❌ Failed to fix Docker storage issues"
            exit 1
        }
    fi

    # Check if images exist on Docker Hub
    check_image_exists "$BACKEND_IMAGE" || {
        log "❌ Backend image not available on Docker Hub"
        exit 1
    }

    check_image_exists "$FRONTEND_IMAGE" || {
        log "❌ Frontend image not available on Docker Hub"
        exit 1
    }

    # Pull images with retry logic
    pull_image_with_retry "$BACKEND_IMAGE" || {
        log "❌ Failed to pull backend image"
        exit 1
    }

    pull_image_with_retry "$FRONTEND_IMAGE" || {
        log "❌ Failed to pull frontend image"
        exit 1
    }

    # Deploy application
    deploy_application || {
        log "❌ Application deployment failed"
        cleanup
        exit 1
    }

    # Cleanup
    cleanup

    log "=========================================="
    log "🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!"
    log "=========================================="
    log "All containers are running and healthy"
    log "Application should be accessible at https://shilldao.xyz"
    log "=========================================="
}

# Trap to ensure cleanup on exit
trap cleanup EXIT

# Run main function
main "$@"
