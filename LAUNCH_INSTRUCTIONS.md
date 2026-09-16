# 🚀 LAUNCH INSTRUCTIONS — Deploy Sumaiya to Production

**Status**: Sumaiya ready to deploy (TemplateHub is a separate repo)  
**Time Required**: 10-15 minutes  
**Requirements**: Vercel account

---

## Quick Start

### Windows
```bash
LAUNCH.bat
```

### macOS/Linux
```bash
bash LAUNCH.sh
```

---

## What Gets Deployed

### Sumaiya Web (Vercel)
- Next.js web app
- All routes + API endpoints
- 267 templates available via the native `TemplateProvider`

**Domain**: Your Vercel domain (sumaiya.vercel.app or custom)  
**Region**: Vercel global CDN

> **TemplateHub** lives in its own repo (`hamisiddy9-spec/TemplateHub`) and is not
> deployed from this repo. Sumaiya talks to it only through `TemplateHubProvider`
> (an HTTP client), enabled later via `NEXT_PUBLIC_TEMPLATE_PROVIDER=remote`.

---

## Step-by-Step Deployment

### Part 1: Sumaiya Web on Vercel

#### Step 1.1: Authenticate Vercel
```bash
npx vercel login
```
**Time**: 1-2 minutes

#### Step 1.2: Build Verification
```bash
npm run build
```
**Time**: ~2 minutes

#### Step 1.3: Deploy to Production
```bash
npx vercel deploy --prod
```
**Time**: 2-5 minutes  
**Output**: `https://sumaiya.vercel.app` (or your custom domain)

#### Step 1.4: Configure Environment Variables

**In Vercel Dashboard** (vercel.com):
1. Go to Project → Settings → Environment Variables
2. Add:

```
DATABASE_URL=postgresql://user:***@host:5432/db
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[key]
NEXT_PUBLIC_TEMPLATE_PROVIDER=native
STRIPE_SECRET_KEY=[key]
STRIPE_WEBHOOK_SECRET=[key]
```

**Time**: 5 minutes

#### Step 1.5: Redeploy with Environment Variables
```bash
npx vercel deploy --prod
```

#### Step 1.6: Verify Web Deployment
```bash
curl https://sumaiya.vercel.app/api/health
```

---

### Part 2: Database Setup

```bash
psql $DATABASE_URL -f lib/templates/database-schema.sql
```

Creates the `documents` table with proper schema, indexes, and constraints.

---

## Deployment Validation Checklist

### Sumaiya Web
- [ ] `https://sumaiya.vercel.app` loads
- [ ] `/api/health` returns 200
- [ ] Home page renders
- [ ] Sign-in works
- [ ] Dashboard accessible
- [ ] CV editor loads
- [ ] Template picker shows templates
- [ ] PDF export works
- [ ] Mobile responsive

### Database
- [ ] `documents` table created
- [ ] Database accessible
- [ ] Connection pools configured

---

## Troubleshooting

### Build Fails
```bash
rm -rf .next node_modules
npm install
npm run build
```

### Vercel Deployment Fails
```bash
npx vercel logs [deployment-id]
npx vercel env list
```

### Templates Not Rendering
- Confirm `NEXT_PUBLIC_TEMPLATE_PROVIDER=native` is set
- Check the browser console for provider errors

---

## Rollback Procedures

### Rollback Sumaiya Web
```bash
npx vercel list
npx vercel promote [previous-deployment-id]
```

---

## Support & Documentation

- **Architecture**: `CLAUDE.md`
- **Testing**: `E2E_TEST_PLAN.md`
- **Deployment**: `DEPLOYMENT_READY.md`

---

**Last Updated**: 2026-09-15  
**Status**: Sumaiya ready for production launch (TemplateHub in its own repo)
