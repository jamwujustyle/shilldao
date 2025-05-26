#!/bin/bash

# Docker Deployment Fix Script
# This script addresses the Docker daemon storage issues causing deployment failures

set -e

echo "=========================================="
echo "🔧 DOCKER DEPLOYMENT FIX SCRIPT"
echo "=========================================="
echo "Timestamp: $(date)"
echo "=========================================="

# Function to check if running as root
check_root() {
    if [ "$EUID" -ne 0 ]; then
        echo "❌ This script must be run as root"
        echo "Please run: sudo $0"
        exit 1
    fi
}

# Function to stop all Docker containers and services
stop_docker_services() {
    echo "🛑 Stopping all Docker services..."

    # Stop all running containers
    if [ "$(docker ps -q)" ]; then
        echo "Stopping running containers..."
        docker stop $(docker ps -q) || true
    fi

    # Stop Docker daemon
    echo "Stopping Docker daemon..."
    systemctl stop docker || true
    systemctl stop docker.socket || true

    echo "✅ Docker services stopped"
}

# Function to clean Docker storage
clean_docker_storage() {
    echo "🧹 Cleaning Docker storage..."

    # Remove all containers
    if [ "$(docker ps -aq)" ]; then
        echo "Removing all containers..."
        docker rm -f $(docker ps -aq) || true
    fi

    # Remove all images
    if [ "$(docker images -q)" ]; then
        echo "Removing all images..."
        docker rmi -f $(docker images -q) || true
    fi

    # Remove all volumes
    if [ "$(docker volume ls -q)" ]; then
        echo "Removing all volumes..."
        docker volume rm $(docker volume ls -q) || true
    fi

    # Remove all networks (except default ones)
    if [ "$(docker network ls -q --filter type=custom)" ]; then
        echo "Removing custom networks..."
        docker network rm $(docker network ls -q --filter type=custom) || true
    fi

    # System prune
    echo "Running system prune..."
    docker system prune -af --volumes || true

    echo "✅ Docker storage cleaned"
}

# Function to reset Docker daemon storage
reset_docker_storage() {
    echo "🔄 Resetting Docker daemon storage..."

    # Stop Docker daemon
    stop_docker_services

    # Remove Docker data directory
    echo "Removing Docker data directory..."
    rm -rf /var/lib/docker/* || true

    # Remove Docker tmp directory
    echo "Removing Docker tmp directory..."
    rm -rf /var/lib/docker/tmp/* || true

    # Create fresh directories
    echo "Creating fresh Docker directories..."
    mkdir -p /var/lib/docker/tmp
    mkdir -p /var/lib/docker/containers
    mkdir -p /var/lib/docker/image
    mkdir -p /var/lib/docker/volumes
    mkdir -p /var/lib/docker/network

    # Set proper permissions
    echo "Setting proper permissions..."
    chown -R root:root /var/lib/docker
    chmod -R 755 /var/lib/docker

    echo "✅ Docker storage reset complete"
}

# Function to restart Docker services
restart_docker_services() {
    echo "🚀 Restarting Docker services..."

    # Start Docker daemon
    systemctl start docker
    systemctl enable docker

    # Wait for Docker to be ready
    echo "Waiting for Docker daemon to be ready..."
    timeout=60
    while ! docker info >/dev/null 2>&1; do
        if [ $timeout -le 0 ]; then
            echo "❌ Docker daemon failed to start within 60 seconds"
            exit 1
        fi
        echo "Waiting for Docker daemon... ($timeout seconds remaining)"
        sleep 2
        timeout=$((timeout - 2))
    done

    echo "✅ Docker daemon is ready"
}

# Function to verify Docker installation
verify_docker() {
    echo "🔍 Verifying Docker installation..."

    # Check Docker version
    echo "Docker version:"
    docker --version

    # Check Docker info
    echo "Docker system info:"
    docker system df

    # Test Docker functionality
    echo "Testing Docker functionality..."
    docker run --rm hello-world

    echo "✅ Docker verification complete"
}

# Function to configure Docker for better stability
configure_docker() {
    echo "⚙️ Configuring Docker for better stability..."

    # Create Docker daemon configuration
    mkdir -p /etc/docker

    cat > /etc/docker/daemon.json << EOF
{
    "storage-driver": "overlay2",
    "log-driver": "json-file",
    "log-opts": {
        "max-size": "10m",
        "max-file": "3"
    },
    "data-root": "/var/lib/docker",
    "exec-opts": ["native.cgroupdriver=systemd"],
    "live-restore": true,
    "userland-proxy": false,
    "experimental": false,
    "features": {
        "buildkit": true
    },
    "default-ulimits": {
        "nofile": {
            "Name": "nofile",
            "Hard": 64000,
            "Soft": 64000
        }
    }
}
EOF

    echo "✅ Docker configuration updated"
}

# Function to check disk space
check_disk_space() {
    echo "💾 Checking disk space..."

    df -h /var/lib/docker 2>/dev/null || df -h /

    # Check if we have at least 10GB free
    available_space=$(df /var/lib/docker 2>/dev/null | tail -1 | awk '{print $4}' || df / | tail -1 | awk '{print $4}')
    available_gb=$((available_space / 1024 / 1024))

    if [ $available_gb -lt 10 ]; then
        echo "⚠️ WARNING: Less than 10GB available space detected"
        echo "Available space: ${available_gb}GB"
        echo "Consider freeing up disk space before proceeding"
    else
        echo "✅ Sufficient disk space available: ${available_gb}GB"
    fi
}

# Main execution
main() {
    echo "Starting Docker deployment fix..."

    # Check if running as root
    check_root

    # Check disk space
    check_disk_space

    # Ask for confirmation
    echo ""
    echo "⚠️ WARNING: This script will:"
    echo "  - Stop all Docker containers and services"
    echo "  - Remove all Docker data (containers, images, volumes)"
    echo "  - Reset Docker daemon storage"
    echo "  - Restart Docker services"
    echo ""
    read -p "Do you want to continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Operation cancelled"
        exit 0
    fi

    # Execute fix steps
    echo "Proceeding with Docker fix..."

    # Configure Docker first
    configure_docker

    # Reset Docker storage
    reset_docker_storage

    # Restart Docker services
    restart_docker_services

    # Verify Docker installation
    verify_docker

    echo "=========================================="
    echo "✅ DOCKER DEPLOYMENT FIX COMPLETED!"
    echo "=========================================="
    echo "Docker daemon has been reset and is ready for deployment"
    echo "You can now retry your deployment process"
    echo "=========================================="
}

# Run main function
main "$@"
