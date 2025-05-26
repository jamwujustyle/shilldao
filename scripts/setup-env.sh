#!/bin/bash

# Environment setup script
set -e

echo "🔧 Setting up Shillers environment..."

# Create environments directory if it doesn't exist
mkdir -p environments

# Create .env.dev if it doesn't exist
if [ ! -f ./environments/.env.dev ]; then
    if [ -f ./environments/.env.example ]; then
        cp ./environments/.env.example ./environments/.env.dev
        echo "✅ Created development environment from example"
    else
        echo "❌ .env.example not found! Please create it first."
        exit 1
    fi
else
    echo "✅ Development environment already exists"
fi

# Create .env.prod template if it doesn't exist
if [ ! -f ./environments/.env.prod ]; then
    if [ -f ./environments/.env.example ]; then
        cp ./environments/.env.example ./environments/.env.prod

        # Update production-specific values
        sed -i 's/NODE_ENV=development/NODE_ENV=production/' ./environments/.env.prod
        sed -i 's/DEBUG=true/DEBUG=false/' ./environments/.env.prod
        sed -i 's/BUILD_TARGET=development/BUILD_TARGET=production/' ./environments/.env.prod
        sed -i 's/localhost:3000/shilldao.xyz/g' ./environments/.env.prod
        sed -i 's/http:/https:/g' ./environments/.env.prod

        echo "✅ Created production environment template"
        echo "⚠️  Please update production secrets in ./environments/.env.prod"
    else
        echo "❌ .env.example not found! Please create it first."
        exit 1
    fi
else
    echo "✅ Production environment already exists"
fi

# Make scripts executable
chmod +x scripts/start-dev.sh
chmod +x scripts/start-prod.sh
chmod +x scripts/setup-env.sh

echo "✨ Environment setup complete!"
echo ""
echo "Next steps:"
echo "1. Review and update ./environments/.env.dev for your development setup"
echo "2. Review and update ./environments/.env.prod for your production setup"
echo "3. Run './scripts/start-dev.sh' to start development environment"
echo "4. Run './scripts/start-prod.sh' to start production environment"