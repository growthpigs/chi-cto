#!/bin/bash
# scripts/deploy.sh - Chi CTO Deployment Helper

set -e

echo "🚀 Chi CTO Deployment"
echo "===================="

# Check prerequisites
if ! command -v wrangler &> /dev/null; then
  echo "Error: wrangler not installed. Run: npm install -g wrangler"
  exit 1
fi

# Build
echo "📦 Building..."
npm run build

# Test
echo "🧪 Running tests..."
npm test -- --passWithNoTests

# Deploy to staging first
echo "📤 Deploying to staging..."
wrangler deploy --env staging

echo ""
echo "✅ Staging deployment complete"
echo "Staging URL: https://chi-cto-staging.roderic-andrews.workers.dev"
echo ""
echo "To deploy to production, run:"
echo "  npm run deploy"
echo ""
