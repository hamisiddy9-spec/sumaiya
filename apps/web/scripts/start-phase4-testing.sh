#!/bin/bash

# Phase 4: Device Testing - Start Development Servers
# This script starts both the Next.js backend and Expo mobile app
# for integrated device testing of Sumaiya

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Sumaiya Phase 4: Device Testing Startup  ${NC}       ${BLUE}║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command -v node &> /dev/null; then
  echo -e "${RED}❌ Node.js not found. Install from https://nodejs.org${NC}"
  exit 1
fi

if ! command -v npm &> /dev/null; then
  echo -e "${RED}❌ npm not found.${NC}"
  exit 1
fi

if [ ! -d "$PROJECT_ROOT/node_modules" ]; then
  echo -e "${YELLOW}📦 Installing root dependencies...${NC}"
  cd "$PROJECT_ROOT"
  npm install
fi

if [ ! -d "$PROJECT_ROOT/apps/mobile/node_modules" ]; then
  echo -e "${YELLOW}📦 Installing mobile dependencies...${NC}"
  cd "$PROJECT_ROOT/apps/mobile"
  npm install
fi

echo -e "${GREEN}✅ Prerequisites verified${NC}\n"

# Instructions
echo -e "${BLUE}Starting development servers...${NC}\n"
echo -e "${YELLOW}IMPORTANT: Open 2 separate terminals${NC}"
echo ""

# Terminal 1: Backend
echo -e "${GREEN}═══ TERMINAL 1: Backend Server ═══${NC}"
echo "cd $PROJECT_ROOT"
echo "npm run dev"
echo ""
echo "Expected output:"
echo "  ▲ Next.js 14.x.x"
echo "  - Local:        http://localhost:3000"
echo ""

# Terminal 2: Mobile
echo -e "${GREEN}═══ TERMINAL 2: Mobile App ═══${NC}"
echo "cd $PROJECT_ROOT/apps/mobile"
echo "npx expo start"
echo ""
echo "Expected output:"
echo "  Expo Go: https://expo.dev/dev-client/latest"
echo "  Local:   http://localhost:8081"
echo ""
echo "Then:"
echo "  - Press 'i' for iOS Simulator"
echo "  - Press 'a' for Android Emulator"
echo "  - Press 'w' for Web (limited testing)"
echo ""

# Quick start option
echo -e "${YELLOW}Quick Start (one window with tmux):${NC}"
echo "tmux new-session -d -s sumaiya"
echo "tmux send-keys -t sumaiya:0 'cd $PROJECT_ROOT && npm run dev' Enter"
echo "tmux new-window -t sumaiya:1"
echo "tmux send-keys -t sumaiya:1 'cd $PROJECT_ROOT/apps/mobile && npx expo start' Enter"
echo ""
echo -e "${GREEN}To view both terminals:${NC}"
echo "tmux attach -t sumaiya"
echo ""

# API endpoints
echo -e "${BLUE}Available API Endpoints:${NC}"
echo "  POST   /api/auth/signup              — User registration"
echo "  POST   /api/auth/signin              — User login"
echo "  GET    /api/cvs                      — Fetch CVs"
echo "  POST   /api/cvs                      — Create CV"
echo "  POST   /api/chat/sumaiya             — AI chat"
echo "  POST   /api/learning/resources       — Learning resources"
echo "  POST   /api/jobs                     — Job listings"
echo ""

# Test reference
echo -e "${BLUE}Testing Reference:${NC}"
echo "  📖 Complete guide:        $PROJECT_ROOT/PHASE_4_DEVICE_TESTING.md"
echo "  🧪 10 test flows:         $PROJECT_ROOT/INTEGRATION_TEST_GUIDE.md"
echo "  📱 Native app spec:       $PROJECT_ROOT/mobile/NATIVE_APP_SPEC.md"
echo ""

echo -e "${GREEN}Ready to start development servers!${NC}"
