# 🚀 DEPLOYMENT_READY — Sumaiya Launch Checklist

**Status**: ✅ Ready for production deployment (TemplateHub is a separate repo)

---

## Build Status

✅ **Web Build**: SUCCESSFUL
✅ **Mobile Build (APK)**: Ready (`apps/native`, package `pro.sumaiya.app`)
✅ **TemplateProvider**: Native provider active (267 templates), `TemplateHubProvider` client ready for later remote use

---

## Deployment Checklist

### Phase 1: Sumaiya Web (Vercel)

**Prerequisites:**
- [ ] Vercel account configured locally: `vercel link`
- [ ] Environment variables added to Vercel dashboard
- [ ] Database migrations applied (`documents` table)

**Steps:**
```bash
npx vercel login
npx vercel deploy --prod
npx vercel inspect <deployment-url>
```

**Environment Variables:**
```
DATABASE_URL=postgresql://[user]:***@[host]:[port]/[db]
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[key]
NEXT_PUBLIC_TEMPLATE_PROVIDER=native
NEXT_PUBLIC_APP_URL=https://sumaiya.app
STRIPE_SECRET_KEY=[key]
STRIPE_WEBHOOK_SECRET=[key]
```

### Phase 2: Database Migrations

```bash
psql $DATABASE_URL -f lib/templates/database-schema.sql
psql $DATABASE_URL -c "\dt documents"
```

### Phase 3: Post-Launch Monitoring

**Vercel Dashboard:**
- [ ] Monitor Analytics
- [ ] Check Error tracking
- [ ] Set up alerting for 5xx errors

---

## Current Deployment Status

| Component | Build | Config | Ready? |
|-----------|-------|--------|--------|
| Web (Sumaiya) | ✅ | ✅ | ⏳ Auth needed |
| Mobile (APK) | ✅ | ✅ | ✅ Ready |
| Database Schema | ✅ | ✅ | ⏳ Migration needed |

---

## Quick Start for Deployment

```bash
npm run build          # Web
npm run build:android  # Mobile APK
npx vercel login
npx vercel deploy --prod
```

---

## Rollback Procedures

### Vercel Rollback
```bash
vercel list
vercel alias <deployment-url> production
```

### Database Rollback
```bash
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
```

---

## Post-Launch Checklist

- [ ] All API endpoints responding (200 OK)
- [ ] Database connections stable
- [ ] Error tracking configured
- [ ] SSL certificates valid

---

## Success Criteria

✅ **Web**:
- Home page loads < 2s
- Auth flow completes
- Template picker displays templates
- PDF export works
- E2E tests pass

✅ **Mobile**:
- APK installs on Android device
- App connects to API
- Template rendering works

---

**Status**: Ready for deployment  
**Last Updated**: 2026-09-15
