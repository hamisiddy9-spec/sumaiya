#!/usr/bin/env bash
# =============================================
# Sumaiya — Agent Onboarding Script
# Run: bash scripts/setup.sh
# =============================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🚀 Sumaiya Setup${NC}"
echo "============================================="
echo ""

# --- 1. Check prerequisites ---
echo -e "${YELLOW}[1/6] Checking prerequisites...${NC}"

command -v node >/dev/null 2>&1 || { echo -e "${RED}Node.js not found. Install Node 18+ first.${NC}"; exit 1; }
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo -e "${RED}Node.js 18+ required. Found: $(node -v)${NC}"; exit 1;
fi
echo -e "  Node.js: $(node -v) ✓"

command -v git >/dev/null 2>&1 || { echo -e "${RED}git not found.${NC}"; exit 1; }
echo -e "  git: $(git --version) ✓"

command -v npx >/dev/null 2>&1 || { echo -e "${RED}npx not found.${NC}"; exit 1; }
echo -e "  npx: ✓"
echo ""

# --- 2. Install dependencies ---
echo -e "${YELLOW}[2/6] Installing dependencies...${NC}"
npm install --legacy-peer-deps 2>&1 | tail -3
echo -e "  Dependencies installed ✓"
echo ""

# --- 3. Environment variables ---
echo -e "${YELLOW}[3/6] Environment setup...${NC}"
if [ ! -f .env.local ]; then
  if [ -f .env.example ]; then
    cp .env.example .env.local
    echo -e "  ${GREEN}.env.local created from .env.example${NC}"
    echo -e "  ${RED}⚠️  EDIT .env.local with real values before running!${NC}"
  else
    echo -e "  ${RED}No .env.example found. Create .env.local manually.${NC}"
  fi
else
  echo -e "  .env.local already exists ✓"
fi
echo ""

# --- 4. Database setup ---
echo -e "${YELLOW}[4/6] Database setup...${NC}"
echo -e "  Run migrations with: ${GREEN}npx drizzle-kit push${NC}"
echo -e "  Or for local dev: ${GREEN}npx drizzle-kit generate && npx drizzle-kit migrate${NC}"
echo ""

# --- 5. Build check ---
echo -e "${YELLOW}[5/6] Build check...${NC}"
npm run build 2>&1 | tail -5
echo -e "  Build passed ✓"
echo ""

# --- 6. Summary ---
echo -e "${GREEN}=============================================${NC}"
echo -e "${GREEN}✅ Sumaiya ready!${NC}"
echo ""
echo "Commands:"
echo "  npm run dev      → Start dev server (http://localhost:3000)"
echo "  npm run build    → Production build"
echo "  npm start        → Start production server"
echo "  npx drizzle-kit push  → Push DB schema"
echo ""
echo "Stack: Next.js 14, Better Auth, Drizzle+Neon, Hono API, Stripe, Tailwind"
echo "Docs: https://github.com/hamisiddy9-spec/Sumaiya"
