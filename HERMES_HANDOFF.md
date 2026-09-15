# HERMES — Sumaiya Native App Handoff Audit

**Date:** 2026-09-15  
**From:** Claude (Haiku 4.5) audit  
**To:** Hermes AI Agent  
**Status:** Ready for Week 1 implementation

---

## Current State Summary

### Web Platform ✅ SHIPPED
- 273 CV templates, fully functional
- ATS matching, CV tailor, jobs feed
- Bilingual (SW/EN) with parity tests
- 946 vitest tests passing
- Accessibility audited (36px tap targets, focus rings)

### Native App 📋 SPEC'D, NOT STARTED
- Expo 57 / React Native 0.86 configured
- 8 screens designed, not implemented
- NATIVE_APP_SPEC.md ready (942 lines, detailed)
- Package structure in place but screens empty

---

## Critical Findings (Audit)

### 🚨 BLOCKING ISSUES

#### 1. Uncommitted Changes on native/ (4 files)
- `android/app/build.gradle`: version bump 1.6.14 → 1.6.18
- `app.json`: version bump 1.6.14 → 1.6.18
- `src/contexts/auth-context.tsx`: OTP code comment ("6-digit" → "one-time")
- `src/screens/auth/sign-in-screen.tsx`: OTP logic refactored (hardcoded 6 → EMAIL_OTP_DIGITS)

**ACTION:** Commit or reset these before starting Week 1. They're version bumps + refactoring cleanup.

#### 2. Untracked Files (4 files)
- `apps/native/src/lib/auth-code.test.ts` (NEW)
- `apps/native/src/lib/auth-code.ts` (NEW)
- `scripts/tmp-g3.sh`, `tmp-probe-editor.mjs`, `tmp-verify-photo.mjs` (temp scripts)

**ACTION:** Decide: commit auth-code lib or delete? Delete temp scripts.

#### 3. OTP Refactoring Incomplete
- New file `apps/native/src/lib/auth-code.ts` exists but not imported everywhere
- `sign-in-screen.tsx` now uses `isCompleteEmailOtp()` / `normalizeEmailOtp()` but pattern inconsistent
- **Risk:** Email OTP validation may have edge cases (non-digit chars, partial fills)

**ACTION BEFORE WEEK 2:** Test all code paths (code complete → submit, backspace recovery, paste handling).

#### 4. Template Count Mismatch (CRITICAL for Week 3)
- Web: 273 templates
- Mobile script generates: 266 templates (gap of 7)
- CLAUDE.md calls this out as a blocker for Week 2

**ACTION BEFORE WEEK 3:** Run `scripts/gen-mobile-templates.mjs` and verify. If intentional (e.g., design-heavy templates skipped), document why.

#### 5. OCR Architecture Undefined
- `/api/mobile/ocr` endpoint exists on web but latency not tested
- CLAUDE.md questions Cloud Vision vs tesseract.js
- **Target:** <500ms per CV

**ACTION BEFORE WEEK 3:** Benchmark `/api/mobile/ocr` with 5 test PDFs. If >1s, escalate to Cloud Vision option.

---

### ⚠️ MODERATE ISSUES

#### 1. Offline Sync Strategy is Basic
- Delete-wins conflict resolution (simple but data-lossy)
- No UI to show conflicts or let user choose
- May lose work if user deletes locally while pending sync

**ACTION FOR WEEK 3:** Add mock conflict UI (show user, ask which version to keep). Defer real impl to post-MVP if needed.

#### 2. SQLite Schema Not Yet Defined
- NATIVE_APP_SPEC.md mentions `cvs` table + `syncQueue` table
- No `schema.ts` or migrations yet
- Must align with Supabase schema to avoid data shape mismatches

**ACTION FOR WEEK 1:** Add `packages/db/schema-mobile.ts` or similar. Sync with `apps/web/lib/db/schema.ts` to ensure CV shape parity.

#### 3. Shared Package Symlinks May Break
- `apps/native/package.json` uses `file:../../packages/*` for shared packages
- Works in dev but not in EAS build (may need `file:` → published npm package)

**ACTION FOR WEEK 4:** Test EAS build with symlinked packages. If it fails, publish packages to npm first.

#### 4. No E2E Test Plan Yet
- Evals exist for web (100+ tests, anti-fabrication)
- Mobile has no equivalent — camera/OCR/offline sync hard to E2E test

**ACTION FOR WEEK 4:** Add Playwright test for happy path (sign up → scan → template → export PDF).

---

### ✅ READY TO GO

1. **Project Structure** — monorepo layout solid
2. **TypeScript** — strict mode, no loose types
3. **CI/CD Gates** — GitHub workflows exist (verify.yml, apk-build.yml)
4. **Authentication** — auth-context.tsx + sign-in-screen.tsx in good shape (OTP refactoring cleanup needed)
5. **Design Tokens** — shared via `@sumaiya/design-tokens`
6. **Privacy** — CLAUDE.md confirms Section 5 of privacy policy updated (conversation logging disclosed)

---

## Week-by-Week Blockers

### Week 1: Setup
- **BLOCKER:** Commit/reset uncommitted changes
- **BLOCKER:** Decide on auth-code.ts (commit or delete)
- **BLOCKER:** Define SQLite schema
- **ACTION:** Create `hermes/native-setup` branch from `claude/sumaiya-continuation-ife7xj`

### Week 2: Navigation + Screens
- **BLOCKER:** Verify template count (266 vs 273)
- **ACTION:** Build RootNavigator, 8 screens (stubs OK for now)
- **GATE:** `npm run native:typecheck` must pass

### Week 3: Camera + OCR + Offline
- **BLOCKER:** Benchmark `/api/mobile/ocr` latency
- **BLOCKER:** Decide OCR strategy (tesseract.js vs Cloud Vision)
- **ACTION:** Camera + OCR integration, SQLite + sync queue
- **GATE:** All 3203 modules compile, no runtime errors

### Week 4: Export + EAS
- **BLOCKER:** Test EAS build with symlinked packages
- **ACTION:** PDF export, share sheet, dark mode, language toggle, EAS config
- **GATE:** Play Store & App Store metadata complete

---

## Pre-Start Checklist

```bash
# 1. Check uncommitted state
git status
git diff --stat HEAD

# 2. Typecheck native
npm run native:typecheck

# 3. Test OTP refactoring (if test suite added)
npm -C apps/native run test

# 4. Verify templates
node scripts/gen-mobile-templates.mjs | wc -l

# 5. Benchmark OCR endpoint (if live)
curl -X POST http://localhost:3000/api/mobile/ocr \
  -H "Content-Type: application/json" \
  -d '{"imageData":"base64..."}'
```

---

## Critical Questions

1. **OTP Length:** Is it always 6 digits, or can it vary? (The refactoring suggests flexibility.)
2. **Template Count:** Why 266 instead of 273? Design constraints or intentional MVP subset?
3. **OCR Latency Budget:** What's the max acceptable latency on 3G? (Current target: <500ms)
4. **Offline Priority:** If sync queue fills up (>1000 items), should we warn the user or drop oldest?
5. **EAS Credentials:** Do you have Expo account + Apple/Google signing keys ready?

---

## Success Criteria (All Must Pass Before Release)

- ✅ `npm run native:typecheck` (zero errors)
- ✅ `npm -C apps/native run test` (if test harness added)
- ✅ `npm run native:export` (Expo export succeeds, 3203 modules)
- ✅ App launches on Android emulator (Splash → Auth → Onboarding → Home)
- ✅ Camera + OCR flow works end-to-end (photo scan → text extraction → field prefill)
- ✅ Offline sync tested (create CV offline → go online → verify synced, no duplicates)
- ✅ All 266 (or 273) templates render without crash on carousel
- ✅ Dark mode toggle works on all 8 screens
- ✅ Bilingual (SW/EN) strings match web (length ±10%)
- ✅ EAS build completes, APK/IPA signed and ready for store submission

---

## Key Files to Review Before Starting

- `apps/native/NATIVE_APP_SPEC.md` — 942 lines, week-by-week checklist
- `apps/web/CLAUDE.md` — full session context, PR history
- `apps/native/src/contexts/auth-context.tsx` — OTP flow design
- `apps/web/lib/db/schema.ts` — Supabase schema (sync with mobile)
- `apps/native/package.json` — shared package symlinks
- `packages/api-client/` — typed API client for Hono

---

## Branch & PR Strategy

- **Base:** `claude/sumaiya-continuation-ife7xj` (tracking development)
- **Week 1 Branch:** `hermes/native-setup` → PR #296 (project structure + schema)
- **Week 2 Branch:** `hermes/native-screens` → PR #297 (navigation + 8 screens)
- **Week 3 Branch:** `hermes/native-camera-offline` → PR #298 (camera + OCR + SQLite + sync)
- **Week 4 Branch:** `hermes/native-export-eas` → PR #299 (export + EAS + store)
- **Merge to master** only after all CI gates pass

---

**Status:** ✅ Audit complete. Ready for implementation.  
**Last Update:** 2026-09-15  
**Next Step:** Clean up uncommitted changes, then start Week 1 setup.
