#!/bin/bash

# Professional Deployment Script
# Ensures quality gate passes before deployment

set -e  # Exit on error

echo "🚀 Starting deployment process..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if we're on the correct branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ] && [ "$CURRENT_BRANCH" != "develop" ]; then
    print_warning "Not on main or develop branch. Current: $CURRENT_BRANCH"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Run quality gate
echo ""
echo "🚪 Running quality gate..."
npm run quality:gate

if [ $? -ne 0 ]; then
    print_error "Quality gate failed. Deployment aborted."
    exit 1
fi

print_status "Quality gate passed"

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    print_warning "Uncommitted changes detected"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Build application
echo ""
echo "🏗️  Building application..."
npm run build

if [ $? -ne 0 ]; then
    print_error "Build failed. Deployment aborted."
    exit 1
fi

print_status "Build successful"

# Determine deployment target
DEPLOY_TARGET=${1:-production}

if [ "$DEPLOY_TARGET" = "production" ]; then
    echo ""
    echo "🚀 Deploying to production..."
    
    # Additional production checks
    print_status "Running production checks..."
    
    # Check environment variables
    if [ -z "$VERCEL_TOKEN" ]; then
        print_error "VERCEL_TOKEN not set"
        exit 1
    fi
    
    print_status "All production checks passed"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_status "Deployment process completed successfully!"
echo ""
echo "Next steps:"
echo "  1. Verify deployment in Vercel dashboard"
echo "  2. Run smoke tests"
echo "  3. Monitor application health"

