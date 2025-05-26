#!/bin/bash

# Development startup script
set -e

echo "🚀 Starting Shillers in DEVELOPMENT mode..."

# Load development environment
if [ -f ./environments/.env.dev ]; then
    set -a
    source ./environments/.env.dev
    set +a
    echo "✅ Loaded development environment"
else
    echo "❌ Development environment file not found!"
    echo "Please create ./environments/.env.dev based on .env.example"
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

# Free up development ports
echo "🧹 Cleaning up ports..."
free_port 3000
free_port 8000
free_port 5432
free_port 6379

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker compose -f docker-compose.yml -f docker-compose.dev.yml down

# Remove client/.next directory
echo "🗑️  Removing client/.next directory..."
sudo rm -rf client/.next

# Start development environment
echo "🏗️  Building and starting development containers..."
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

echo "✨ Development environment ready!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:8000"
echo "📊 Database: localhost:5432"
