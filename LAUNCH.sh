#!/bin/bash

# 🚀 SUMAIYA × TEMPLATEHUB LAUNCH SCRIPT
# Deploys both projects to production

set -e  # Exit on error

echo "================================================"
echo "🚀 SUMAIYA × TEMPLATEHUB PRODUCTION LAUNCH"
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

if ! command -v docker &> /dev/null; then
  echo "${YELLOW}⚠️  Docker not found (needed for TemplateHub)${NC}"
fi

echo "${GREEN}✅ Prerequisites checked${NC}"
echo ""

# Part 1: Sumaiya Web Deployment
echo "================================================"
echo "PART 1: SUMAIYA WEB (Vercel)"
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

# Part 2: TemplateHub Deployment
echo "================================================"
echo "PART 2: TEMPLATEHUB API (Docker)"
echo "================================================"
echo ""

cd templatehub

echo "${YELLOW}Step 1: Verify TemplateHub build...${NC}"
npm run build
if [ $? -eq 0 ]; then
  echo "${GREEN}✅ TemplateHub build successful${NC}"
else
  echo "${RED}❌ TemplateHub build failed${NC}"
  exit 1
fi
echo ""

if command -v docker &> /dev/null; then
  echo "${YELLOW}Step 2: Build Docker image...${NC}"
  docker build -t templatehub:latest .
  if [ $? -eq 0 ]; then
    echo "${GREEN}✅ Docker image built${NC}"
  else
    echo "${RED}❌ Docker build failed${NC}"
    exit 1
  fi
  echo ""

  echo "${YELLOW}Step 3: Push to registry...${NC}"
  echo "Set REGISTRY_URL environment variable to push"
  echo "Example: export REGISTRY_URL=ghcr.io/yourusername"

  if [ -n "$REGISTRY_URL" ]; then
    docker tag templatehub:latest $REGISTRY_URL/templatehub:latest
    docker push $REGISTRY_URL/templatehub:latest
    echo "${GREEN}✅ Image pushed to $REGISTRY_URL${NC}"
  else
    echo "${YELLOW}⚠️  Skipping registry push (set REGISTRY_URL)${NC}"
  fi
  echo ""

  echo "${YELLOW}Step 4: Deploy instructions${NC}"
  echo "To deploy to production, use one of:"
  echo "  - AWS ECS: aws ecs update-service --cluster templatehub --service api"
  echo "  - Google Cloud Run: gcloud run deploy templatehub --image $REGISTRY_URL/templatehub"
  echo "  - Azure Container Instances: az container create --image $REGISTRY_URL/templatehub"
  echo "  - Vercel: vercel deploy --prod (from templatehub directory)"
else
  echo "${YELLOW}⚠️  Docker not available${NC}"
  echo "Manual deployment required for TemplateHub"
fi

cd ..
echo ""

# Part 3: Summary
echo "================================================"
echo "✅ DEPLOYMENT COMPLETE"
echo "================================================"
echo ""
echo "${GREEN}Sumaiya Web:${NC}"
echo "  URL: $VERCEL_URL"
echo "  Status: Deployed to Vercel"
echo ""
echo "${GREEN}TemplateHub API:${NC}"
if command -v docker &> /dev/null; then
  echo "  Image: templatehub:latest"
  if [ -n "$REGISTRY_URL" ]; then
    echo "  Registry: $REGISTRY_URL/templatehub:latest"
    echo "  Status: Ready for cloud deployment"
  else
    echo "  Status: Docker image ready (set REGISTRY_URL to push)"
  fi
else
  echo "  Status: Build complete (Docker required for deployment)"
fi
echo ""
echo "${GREEN}Next steps:${NC}"
echo "  1. Configure environment variables in Vercel dashboard"
echo "  2. Apply database migrations: psql \$DATABASE_URL -f lib/templates/database-schema.sql"
echo "  3. Deploy TemplateHub to your cloud platform"
echo "  4. Test endpoints and verify health checks"
echo "  5. Set up monitoring (Sentry, Datadog)"
echo ""
echo "${GREEN}Documentation:${NC}"
echo "  - Architecture: CLAUDE.md"
echo "  - Deployment: DEPLOYMENT_READY.md"
echo "  - Testing: E2E_TEST_PLAN.md"
echo ""
