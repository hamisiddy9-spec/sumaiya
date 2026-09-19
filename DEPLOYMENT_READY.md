# 🚀 DEPLOYMENT_READY — Sumaiya Launch Checklist

> **Partly superseded (2026-09-19).** Written 2026-09-15. The claims flagged here were wrong
> and are removed or corrected inline: there is no `TemplateHubProvider` (deleted in
> `aee08ae` — `docs/DECISIONS.md` D1), the registry holds 266 entries, not 267, and
> `NEXT_PUBLIC_TEMPLATE_PROVIDER` is not a variable any code reads. Treat the rest as a
> 2026-09-15 snapshot; `apps/web/CLAUDE.md` carries the verified figures.

**Status**: ✅ Ready for production deployment (TemplateHub is a separate repo)

---

## Build Status

✅ **Web Build**: SUCCESSFUL
✅ **Mobile Build (APK)**: Ready (`apps/native`, package `pro.sumaiya.app`)
✅ **TemplateProvider**: Native provider active (266 registry entries) and it is the **only**
provider — the remote `TemplateHubProvider` was deleted in `aee08ae` (`docs/DECISIONS.md` D1)

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
