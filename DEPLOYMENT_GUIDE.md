# Production Deployment & Testing Guide

Complete guide for deploying Sumaiya web and mobile apps to production.

---

## 🌐 WEB APP DEPLOYMENT

### Prerequisites

1. **Vercel Account**
   - Create account at https://vercel.com
   - Link GitHub account
   - Create "Sumaiya" project

2. **Environment Variables**
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://ayczgaddnufdxnhizpcr.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID=811013224847-1g6ml0490hh...
   NEXT_PUBLIC_API_URL=https://sumaiya.app
   NEXT_PUBLIC_TEMPLATE_PROVIDER=native  # Will change to 'templatehub' later
   ```

### Step 1: Authenticate with Vercel

```bash
cd apps/web

# Option A: Interactive login
npx vercel login
# Follow prompts to authenticate with GitHub

# Option B: Token-based (CI/CD)
export VERCEL_TOKEN=your-token-here
```

### Step 2: Deploy to Production

```bash
# One-time setup (link to project)
npx vercel --prod --confirm

# OR deploy directly with environment variables
npx vercel deploy --prod \
  --env NEXT_PUBLIC_SUPABASE_URL=... \
  --env NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
  --env NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID=...
```

### Step 3: Verify Deployment

```bash
# Check deployment status
vercel status

# View live URL
vercel env

# Check logs
vercel logs
```

**Expected Output:**
```
✓ Production (42) deployed to sumaiya.app
  ├─ Ready [2m45s]
  ├─ Functions: 12
  ├─ Build: 89 seconds
  └─ URL: https://sumaiya.app
```

### Step 4: Configure Domain

1. Go to https://vercel.com/dashboard
2. Select "Sumaiya" project
3. Settings → Domains
4. Add custom domain: `sumaiya.app`
5. Point DNS to Vercel nameservers
6. Wait 24-48h for DNS propagation
7. SSL certificate auto-issued

---

## 📱 MOBILE APP DEPLOYMENT

### Prerequisites

1. **Google Play Console Account**
   - Create at https://play.google.com/apps/publish
   - Enroll in Google Play Developer Program ($25)
   - Create new app entry

2. **Signing Certificate**
   ```bash
   # Generate keystore (one-time)
   keytool -genkey -v -keystore sumaiya-release.keystore \
     -keyalg RSA -keysize 2048 -validity 10000 \
     -alias sumaiya-release
   
   # Store safely in password manager
   # Keep sumaiya-release.keystore in safe location
   ```

3. **EAS Build Credentials**
   - Account at https://expo.dev
   - Link GitHub account
   - Set up build credentials

### Step 1: Build Signed APK

```bash
cd apps/native

# Configure EAS for production
# Edit eas.json: ensure production profile has:
# {
#   "production": {
#     "android": {
#       "buildType": "apk"  # or "app-bundle" for Play Store
#     }
#   }
# }

# Build with EAS
eas build --platform android --profile production

# Output: signed APK ready for distribution
# Downloaded to: ./build-*.apk
```

### Step 2: Upload to Google Play

```bash
# Option A: Manual upload via Console
# 1. Go to https://play.google.com/apps/publish
# 2. Select "Sumaiya"
# 3. Release → New release → Upload APK
# 4. Fill metadata (screenshots, description, etc.)
# 5. Submit for review

# Option B: Automated via EAS
eas submit --platform android --profile production
# Requires serviceAccount.json in Google Play Console
```

### Step 3: Submit for Review

**Google Play Requirements:**
- [ ] Target API level 34+ (compliant ✅)
- [ ] Privacy policy URL
- [ ] Contact email
- [ ] Content rating questionnaire
- [ ] 2-3 screenshots (at least 320x180px)
- [ ] App icon (512x512px)
- [ ] App description
- [ ] Category & content rating

**Expected Review Time:** 1-3 hours

### Step 4: Monitor Deployment

```bash
# Check build status
eas builds

# Check submission status
eas submissions

# View app on Play Store
# https://play.google.com/store/apps/details?id=com.sumaiya.app
```

---

## 🧪 REAL USER TESTING

### Web Testing (30 minutes)

**Setup:**
1. Visit https://sumaiya.app (or your deployment URL)
2. New private browser window
3. Open DevTools (F12) to monitor errors

**Test Workflow (10 minutes):**
```
1. Sign up with test email
2. Create new CV
3. Fill: Name, Email, Phone, Location, Title
4. Add: 1 experience, 1 education, 3 skills
5. Change template 3x
6. Download PDF
7. Open PDF → verify content
8. Share via email
9. Logout
```

**Verification:**
- [ ] No console errors (DevTools → Console)
- [ ] PDF renders correctly
- [ ] Email with PDF arrives
- [ ] All data persists (refresh page)
- [ ] Responsive on mobile (F12 → device mode)

### Mobile Testing (45 minutes)

**Setup:**
```bash
# Install on Android device
adb install apps/native/dist/app.apk

# OR scan QR code from Play Store preview
```

**Test Workflow (30 minutes):**
```
Phase 1: Onboarding (5 min)
1. Launch app
2. See splash screen
3. Swipe through onboarding
4. Tap "Get Started"

Phase 2: Authentication (5 min)
1. Tap "Sign in with Google"
2. Complete Google auth
3. See dashboard

Phase 3: Camera Scan (10 min) ⭐ CRITICAL
1. Tap "Scan CV"
2. Grant camera permission
3. Point at CV (printed or screen)
4. Hold steady 2 seconds
5. See extraction progress
6. Review extracted data
7. Tap "Use This"
8. Verify fields populated

Phase 4: Template & Export (10 min)
1. Tap "Change Template"
2. Select different template
3. Preview updates
4. Tap "Download PDF"
5. See progress
6. PDF downloads
7. Open in native viewer
8. Verify formatting
9. Share via email
```

**Verification:**
- [ ] App doesn't crash
- [ ] Camera works smoothly
- [ ] OCR extracts data reliably (>70% accuracy)
- [ ] PDF exports < 2 seconds
- [ ] Share sheet works
- [ ] Offline mode works (airplane mode)
- [ ] Sync works when back online

---

## 📊 Post-Deployment Monitoring

### Web Metrics

**Performance (Vercel Dashboard):**
- First Contentful Paint (FCP): < 2s
- Largest Contentful Paint (LCP): < 2.5s
- Cumulative Layout Shift (CLS): < 0.1
- Time to Interactive (TTI): < 3s

**Traffic & Errors:**
- 404 errors: < 0.5%
- 5xx errors: < 0.1%
- Page load time: average < 2s

**User Engagement:**
- Daily Active Users (DAU)
- Session duration
- Export completion rate
- Template selection distribution

### Mobile Metrics

**Crash Rate:**
- Target: < 0.1%
- Monitor in Expo Dashboard
- Track by OS version

**Performance:**
- Startup time: < 2s
- Camera capture: < 3s
- OCR processing: < 2s
- PDF export: < 2s

**User Actions:**
- Login rate
- Scan success rate
- Export completion
- Template popularity

### Setup Monitoring

**Option 1: Vercel Analytics (built-in)**
```
Dashboard → Analytics → View metrics
```

**Option 2: Sentry (error tracking)**
```bash
npm install @sentry/nextjs

# In next.config.js
const withSentryConfig = require("@sentry/nextjs/config");

module.exports = withSentryConfig(
  { /* next.js config */ },
  { org: "sumaiya", project: "web" }
);
```

**Option 3: Datadog (comprehensive)**
```bash
npm install @datadog/browser-rum @datadog/browser-logs

# Initialize in app root
import { datadogRum } from '@datadog/browser-rum';

datadogRum.init({
  applicationId: 'YOUR_APP_ID',
  clientToken: 'YOUR_CLIENT_TOKEN',
  site: 'datadoghq.com',
  service: 'sumaiya-web',
  env: 'production',
  sessionSampleRate: 100,
});
```

---

## 🚨 Rollback Procedures

### If Web Deployment Fails

```bash
# Revert to previous version
vercel rollback

# Or redeploy specific commit
git checkout <previous-commit>
vercel deploy --prod
```

### If Mobile App Has Critical Bug

**Play Store:**
1. Remove from production
2. Fix bug
3. Build new version
4. Submit with higher version code
5. Re-release when approved

**Staging Deployment:**
```bash
# Keep "production" profile for production builds
# Use "preview" profile for staging/testing

eas build --platform android --profile preview
# Smaller audience tests first
```

---

## ✅ Pre-Launch Checklist

**Web:**
- [ ] Build succeeds (`npm run build`)
- [ ] TypeScript passes (`npx tsc --noEmit`)
- [ ] No console errors in production
- [ ] All pages load without 404s
- [ ] PDF export works
- [ ] Mobile responsive tested
- [ ] HTTPS certificate valid
- [ ] Environment variables set
- [ ] Database connected

**Mobile:**
- [ ] App builds (`eas build --platform android`)
- [ ] Installs without errors
- [ ] Launches without crash
- [ ] Camera permission prompt works
- [ ] OCR extracts data
- [ ] Templates render
- [ ] PDF exports
- [ ] Share sheet works
- [ ] Offline mode functional

**Infrastructure:**
- [ ] Database backups configured
- [ ] Error tracking enabled
- [ ] Performance monitoring active
- [ ] SSL certificates valid
- [ ] DNS configured
- [ ] Email delivery working
- [ ] Rate limiting active

---

## 📞 Support & Troubleshooting

### Common Issues

**Vercel Deploy Fails**
```
Error: No existing credentials found.
Solution: Run `npx vercel login` first
```

**EAS Build Fails**
```
Error: Pod install failed
Solution: Clear cache: rm -rf ~/.eas && eas build --platform android --clear-cache
```

**PDF Export Times Out**
```
Error: Puppeteer timeout
Solution: Increase timeout in lib/pdf.ts
```

**OCR Accuracy Low**
```
Solution: 
1. Increase image quality in camera settings
2. Ensure good lighting
3. Use printed CV (not digital)
4. Try different angles
```

---

## 🎉 Post-Launch

**Day 1:**
- Monitor error rates
- Check real user feedback
- Test key flows live
- Have rollback ready

**Week 1:**
- Collect user metrics
- Monitor performance
- Fix reported bugs
- Gather feedback

**Month 1:**
- Analyze usage patterns
- Optimize hot paths
- Plan Phase 2 improvements
- TemplateHub integration

---

## 📋 Deployment Summary

| Component | Status | URL | Notes |
|-----------|--------|-----|-------|
| Web | Ready | https://sumaiya.app | Needs Vercel auth |
| Mobile APK | Ready | Google Play | Needs signing cert |
| Database | Ready | Supabase | Configured |
| Storage | Ready | S3/Cloudinary | Configured |
| Email | Ready | SendGrid | Configured |

**Everything is ready. Just need credentials and manual deployment.**
