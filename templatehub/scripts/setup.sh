#!/bin/bash
# TemplateHub setup script
# Initializes development environment

set -e

echo "🚀 TemplateHub Setup"

# 1. Check Node version
echo "✓ Checking Node version..."
node --version

# 2. Install dependencies
echo "✓ Installing dependencies..."
npm install

# 3. Create .env file if not exists
echo "✓ Setting up environment..."
if [ ! -f .env.local ]; then
  cp .env.example .env.local
  echo "  Created .env.local (update with actual values)"
fi

# 4. Run database migrations
echo "✓ Running database migrations..."
npm run migrate

# 5. Seed template data
echo "✓ Seeding template data..."
npm run seed

# 6. Build TypeScript
echo "✓ Building TypeScript..."
npm run build

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Update .env.local with your database URL and API keys"
echo "  2. Run: npm run dev"
echo "  3. Visit: http://localhost:3001"
