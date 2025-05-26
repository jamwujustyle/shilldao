#!/bin/bash

# Production startup script
set -e

echo "🚀 Starting Shillers in PRODUCTION mode..."

# Load production environment
if [ -f ./environments/.env.prod ]; then
    set -a
    source ./environments/.env.prod
    set +a
    echo "✅ Loaded production environment"
else
    echo "❌ Production environment file not found!"
    echo "Please create ./environments/.env.prod"
    exit 1
fi

# Check if required production secrets are set
if [ -z "$SECRET_KEY" ] || [ -z "$DB_PASSWORD" ]; then
    echo "❌ Required production secrets are not set!"
    echo "Please set SECRET_KEY and DB_PASSWORD environment variables"
    exit 1
fi

# Function to free up ports
free_port() {
    port=$1
    container_id=$(docker ps -q --filter "publish=$port")

    if [ -n "$container_id" ]; then
        echo "🔄 Releasing port $port (used by container $container_id)..."
        docker stop "$container_id" >/dev/null 2>&1
        docker rm "$container_id" >/dev/null 2>&1
    fi
}

# Free up production ports
echo "🧹 Cleaning up ports..."
free_port 80
free_port 443
free_port 5432
free_port 6379

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml down

# Start production environment
echo "🏗️  Building and starting production containers..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build

echo "✨ Production environment started!"
echo "🌐 Application: https://$(echo $ALLOWED_HOSTS | cut -d',' -f1)"
echo "📊 Check logs: docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f"