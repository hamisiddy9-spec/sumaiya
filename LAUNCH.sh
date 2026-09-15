#!/bin/bash

# 🚀 SUMAIYA LAUNCH SCRIPT
# Deploys the Sumaiya web app to production (Vercel).
# TemplateHub is a separate repo (hamisiddy9-spec/TemplateHub) — see that repo for its own deploy.

set -e  # Exit on error

echo "================================================"
echo "🚀 SUMAIYA PRODUCTION LAUNCH"
echo "================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check prerequisites
echo "${YELLOW}📋 Checking prerequisites...${NC}"

if ! command -v node &> /dev/null; then
  echo "${RED}❌ Node.js not found${NC}"
  exit 1
fi

if ! command -v npx &> /dev/null; then
  echo "${RED}❌ NPX not found${NC}"
  exit 1
fi

echo "${GREEN}✅ Prerequisites checked${NC}"
echo ""

# Sumaiya Web Deployment
echo "================================================"
echo "SUMAIYA WEB (Vercel)"
echo "================================================"
echo ""

echo "${YELLOW}Step 1: Verify build...${NC}"
npm run build
if [ $? -eq 0 ]; then
  echo "${GREEN}✅ Build successful${NC}"
else
  echo "${RED}❌ Build failed${NC}"
  exit 1
fi
echo ""

echo "${YELLOW}Step 2: Authenticate with Vercel...${NC}"
echo "Running: npx vercel login"
npx vercel login

if [ $? -eq 0 ]; then
  echo "${GREEN}✅ Vercel authentication successful${NC}"
else
  echo "${RED}❌ Vercel authentication failed${NC}"
  exit 1
fi
echo ""

echo "${YELLOW}Step 3: Deploy to Vercel...${NC}"
echo "Running: npx vercel deploy --prod"
VERCEL_URL=$(npx vercel deploy --prod)

if [ $? -eq 0 ]; then
  echo "${GREEN}✅ Deployment successful${NC}"
  echo "URL: $VERCEL_URL"
else
  echo "${RED}❌ Deployment failed${NC}"
  exit 1
fi
echo ""

echo "${YELLOW}Step 4: Verify deployment...${NC}"
sleep 5
curl -s "$VERCEL_URL/api/health" | jq . || echo "API not yet ready"
echo ""

# Summary
echo "================================================"
echo "✅ DEPLOYMENT COMPLETE"
echo "================================================"
echo ""
echo "${GREEN}Sumaiya Web:${NC}"
echo "  URL: $VERCEL_URL"
echo "  Status: Deployed to Vercel"
echo ""
echo "${GREEN}Next steps:${NC}"
echo "  1. Configure environment variables in Vercel dashboard"
echo "  2. Apply database migrations: psql \$DATABASE_URL -f lib/templates/database-schema.sql"
echo "  3. Test endpoints and verify health checks"
echo "  4. Set up monitoring (Sentry, Datadog)"
echo ""
echo "${GREEN}Documentation:${NC}"
echo "  - Architecture: CLAUDE.md"
echo "  - Deployment: DEPLOYMENT_READY.md"
echo "  - Testing: E2E_TEST_PLAN.md"
echo ""
