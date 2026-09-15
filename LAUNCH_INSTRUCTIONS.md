# 🚀 LAUNCH INSTRUCTIONS — Deploy to Production

**Status**: Both projects ready to deploy  
**Time Required**: 15-30 minutes  
**Requirements**: Vercel account, Docker (optional for API), cloud platform (for TemplateHub)

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

### 1. Sumaiya Web (Vercel)
- Next.js web app
- All routes + API endpoints
- 602 pre-rendered pages
- 267 templates available

**Domain**: Your Vercel domain (sumaiya.vercel.app or custom)  
**Region**: Vercel global CDN

### 2. TemplateHub API (Docker)
- Node.js/Next.js API server
- 4 endpoints (templates, families, render, pdf)
- PostgreSQL database
- Redis cache

**Domain**: Your cloud platform (AWS/GCP/Azure/Vercel)  
**Region**: Your choice

---

## Step-by-Step Deployment

### Part 1: Sumaiya Web on Vercel

#### Step 1.1: Authenticate Vercel
```bash
npx vercel login
```
**What happens**: Opens browser, signs you into Vercel account  
**Time**: 1-2 minutes

#### Step 1.2: Build Verification
```bash
npm run build
```
**Status**: ✅ Already verified (602 pages, success)  
**Time**: ~2 minutes (cached: 110ms)

#### Step 1.3: Deploy to Production
```bash
npx vercel deploy --prod
```
**What happens**: 
- Uploads build to Vercel
- Creates production deployment
- Assigns URL
- Sets up SSL/HTTPS
- Configures CDN

**Time**: 2-5 minutes  
**Output**: `https://sumaiya.vercel.app` (or your custom domain)

#### Step 1.4: Configure Environment Variables

**In Vercel Dashboard** (vercel.com):
1. Go to Project → Settings → Environment Variables
2. Add these variables:

```
DATABASE_URL=postgresql://user:pass@host:5432/db
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
**Time**: 2-5 minutes

#### Step 1.6: Verify Web Deployment
```bash
# Test health endpoint
curl https://sumaiya.vercel.app/api/health

# Test template endpoint
curl https://sumaiya.vercel.app/api/templates
```

**Expected**: 200 OK responses  
**Time**: 1 minute

---

### Part 2: TemplateHub API Deployment

#### Step 2.1: Choose Deployment Platform

**Option A: Vercel (Recommended for Quick Setup)**
```bash
cd templatehub
vercel deploy --prod
```
- Easiest setup
- Free tier available
- Same infrastructure as Sumaiya

**Option B: Docker (Recommended for Production Scale)**
```bash
docker build -t templatehub:latest templatehub/
```
- Full control
- Better for large workloads
- Requires cloud platform (AWS/GCP/Azure)

**Option C: GitHub Container Registry + Cloud Run**
```bash
# Push to registry
docker build -t ghcr.io/youruser/templatehub:latest templatehub/
docker push ghcr.io/youruser/templatehub:latest

# Deploy to Google Cloud Run
gcloud run deploy templatehub \
  --image ghcr.io/youruser/templatehub:latest \
  --platform managed \
  --region us-central1
```

#### Step 2.2a: Deploy via Vercel (Quickest)
```bash
cd templatehub
npx vercel login  # If not already logged in
npx vercel deploy --prod
```
**Time**: 5-10 minutes

#### Step 2.2b: Deploy via Docker to AWS ECS
```bash
# Build image
docker build -t templatehub:latest templatehub/

# Push to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin [account].dkr.ecr.us-east-1.amazonaws.com

docker tag templatehub:latest [account].dkr.ecr.us-east-1.amazonaws.com/templatehub:latest
docker push [account].dkr.ecr.us-east-1.amazonaws.com/templatehub:latest

# Update ECS service
aws ecs update-service \
  --cluster templatehub-cluster \
  --service templatehub-api \
  --force-new-deployment
```
**Time**: 10-15 minutes

#### Step 2.2c: Deploy via Google Cloud Run
```bash
# Authenticate
gcloud auth login

# Create artifact registry repo
gcloud artifacts repositories create templatehub \
  --location=us-central1 \
  --repository-format=docker

# Build and push
gcloud builds submit --tag us-central1-docker.pkg.dev/[project]/templatehub/api:latest templatehub/

# Deploy
gcloud run deploy templatehub \
  --image us-central1-docker.pkg.dev/[project]/templatehub/api:latest \
  --platform managed \
  --region us-central1 \
  --set-env-vars DATABASE_URL=[your-db-url] \
  --set-env-vars REDIS_URL=[your-redis-url]
```
**Time**: 10-15 minutes

#### Step 2.3: Configure TemplateHub Environment Variables

**In your cloud platform dashboard:**
```
DATABASE_URL=postgresql://user:pass@host:5432/templatehub
REDIS_URL=redis://host:6379
NODE_ENV=production
JWT_SECRET=[generate-strong-secret]
TEMPLATEHUB_API_KEY=[generate-api-key]
PUPPETEER_HEADLESS=true
LOG_LEVEL=info
```

#### Step 2.4: Verify TemplateHub Deployment
```bash
# Test health
curl -H "Authorization: Bearer $API_KEY" \
  https://api.templatehub.app/api/health

# Test templates endpoint
curl -H "Authorization: Bearer $API_KEY" \
  https://api.templatehub.app/api/templates

# Test render endpoint
curl -X POST \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"templateId":"rift","userData":{}}' \
  https://api.templatehub.app/api/documents/render
```

**Expected**: 200 OK responses with valid JSON  
**Time**: 5 minutes

---

### Part 3: Database Setup

#### Step 3.1: Apply Migrations (Sumaiya)
```bash
# Connect to your production database
psql $DATABASE_URL -f lib/templates/database-schema.sql
```

**What happens**: Creates `documents` table with proper schema, indexes, and constraints  
**Time**: 1 minute

#### Step 3.2: Apply Migrations (TemplateHub)
```bash
# Connect to TemplateHub database
psql $TEMPLATEHUB_DATABASE_URL -f templatehub/scripts/migrate.sql
```

**What happens**: Creates `templates`, `api_keys`, `render_analytics` tables  
**Time**: 1 minute

#### Step 3.3: Seed TemplateHub with Templates (Optional)
```bash
cd templatehub
npm run seed
```

**What happens**: Loads 267 templates into database  
**Time**: 2-5 minutes

---

### Part 4: Integration & Testing

#### Step 4.1: Update Sumaiya Environment Variables
```
NEXT_PUBLIC_TEMPLATE_PROVIDER=remote
TEMPLATE_HUB_API_URL=https://api.templatehub.app
TEMPLATE_HUB_API_KEY=[your-api-key]
```

#### Step 4.2: Redeploy Sumaiya with Remote Provider
```bash
npx vercel deploy --prod
```

#### Step 4.3: Test Integration
```bash
# Test that Sumaiya connects to TemplateHub
curl https://sumaiya.vercel.app/api/templates
# Should return templates from TemplateHub API
```

#### Step 4.4: Run E2E Tests
```bash
# See E2E_TEST_PLAN.md for full test scenarios
npm run test:e2e
```

---

## Deployment Validation Checklist

### Sumaiya Web
- [ ] `https://sumaiya.vercel.app` loads
- [ ] `/api/health` returns 200
- [ ] `/api/templates` returns template list
- [ ] Home page renders
- [ ] Sign-in works
- [ ] Dashboard accessible
- [ ] CV editor loads
- [ ] Template picker shows 267 templates
- [ ] PDF export works
- [ ] Mobile responsive

### TemplateHub API
- [ ] `/api/health` returns 200
- [ ] `/api/templates` lists templates
- [ ] `/api/families` lists families
- [ ] `/api/documents/render` returns HTML
- [ ] `/api/exports/pdf` returns PDF
- [ ] Rate limiting works
- [ ] Authentication enforced
- [ ] Error handling returns proper codes

### Database
- [ ] Sumaiya documents table created
- [ ] TemplateHub templates table created
- [ ] Both databases accessible
- [ ] Indexes optimized
- [ ] Connection pools configured

### Monitoring
- [ ] Sentry error tracking active
- [ ] Datadog metrics flowing
- [ ] Vercel analytics enabled
- [ ] Health checks automated
- [ ] Alerts configured

---

## Troubleshooting

### Build Fails
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### Vercel Deployment Fails
```bash
# Check deployment logs
npx vercel logs [deployment-id]

# Verify environment variables
npx vercel env list

# Check build settings
vercel.json is configured correctly
```

### TemplateHub API Returns 503
```bash
# Check database connection
psql $DATABASE_URL -c "SELECT 1"

# Check Redis
redis-cli ping

# View API logs
docker logs templatehub
# or
gcloud run logs read templatehub
```

### Templates Not Rendering
```bash
# Verify API key
curl -H "Authorization: Bearer $API_KEY" \
  https://api.templatehub.app/api/health

# Check database seeds
psql $TEMPLATEHUB_DATABASE_URL -c "SELECT COUNT(*) FROM templates"

# View render logs
docker logs templatehub | grep render
```

---

## Rollback Procedures

### Rollback Sumaiya Web
```bash
# List previous deployments
npx vercel list

# Rollback to previous version
npx vercel promote [previous-deployment-id]
```

### Rollback TemplateHub API
```bash
# Docker: Use previous image version
docker run -p 3001:3001 templatehub:previous

# Google Cloud Run: Rollback to previous revision
gcloud run services update-traffic templatehub --to-revisions [previous-revision]=100

# AWS ECS: Update service with previous image
aws ecs update-service --cluster templatehub --service api \
  --force-new-deployment
```

---

## Post-Deployment Checklist

- [ ] Both deployments verified
- [ ] Integration tests passing
- [ ] Error tracking active
- [ ] Performance monitoring enabled
- [ ] Alerts configured
- [ ] SSL certificates valid
- [ ] CDN cache warmed
- [ ] Documentation updated
- [ ] Team notified
- [ ] Monitoring dashboard reviewed

---

## Support & Documentation

- **Architecture**: See `CLAUDE.md`
- **Testing**: See `E2E_TEST_PLAN.md`
- **Deployment**: See `DEPLOYMENT_READY.md`
- **API Docs**: See `templatehub/README.md`
- **Issues**: Check error logs and monitoring dashboards

---

## Timeline

| Phase | Time | Status |
|-------|------|--------|
| Verify builds | 5 min | ✅ Done |
| Deploy web | 10 min | ⏳ Ready |
| Deploy API | 15 min | ⏳ Ready |
| Run tests | 10 min | ⏳ Ready |
| Verify production | 5 min | ⏳ Ready |
| **Total** | **~45 min** | ⏳ Ready |

---

## Ready to Deploy?

**Yes, everything is ready.** 

**Next step**: Execute the appropriate deployment command above based on your preferred platform.

For quickest deployment:
```bash
LAUNCH.bat  # Windows
bash LAUNCH.sh  # macOS/Linux
```

---

**Last Updated**: 2026-09-15  
**Status**: ✅ All systems ready for production launch
