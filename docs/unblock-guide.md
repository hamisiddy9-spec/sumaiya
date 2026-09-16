# Sumaiya — unblock guide

What's done is on `main` (1.6.21 built + installed). These five things need your accounts.
Ordered by impact-per-minute.

---

## 1. Google sign-in — 2 min, highest impact
**Problem:** Google sign-in dies with `DEVELOPER_ERROR` (code 10) because the release keystore's SHA-1 isn't registered. Every Android user hitting "Endelea na Google" is bounced to email.

1. Open https://console.cloud.google.com → select project **811013224847**
   (the project that owns `811013224847-1g6ml0490hhfngrips635ropm8tka4ep.apps.googleusercontent.com`).
2. **APIs & Services → Credentials**.
3. Find the **OAuth 2.0 Client ID** of type **Android**. If none exists, **Create Credentials → OAuth client ID → Android**.
4. Fill in:
   - **Package name:** `pro.sumaiya.app`
   - **SHA-1:** `68:54:30:C3:10:3C:8F:18:C4:66:66:89:35:E7:A3:2F:D5:61:4B:CE`
5. **Save.** Takes effect immediately — no rebuild, no redeploy.

✅ Done when: tapping Google on the phone opens the account picker and signs in.

---

## 2. Ship the web update prompt — 5 min
**Problem:** `main` was pushed, but the live site still serves the old manifest, so installed users never get prompted to update. The manifest is now correctly at **1.6.21**.

- **If the Vercel project is connected to the repo:** the push to `main` should already be deploying. Check https://vercel.com → your project → Deployments for a build from commit `31d9a5b`.
- **If not connected / you deploy manually:** run in `apps/web`:
  ```bash
  vercel --prod
  ```
- **Or** create a token at https://vercel.com/account/tokens and hand it to me — I'll deploy and verify the endpoint returns `1.6.21`.

✅ Done when: `https://sumaiya.app/api/app/update` returns version `1.6.21`.

---

## 3. Crash monitoring — 5 min (then I finish + build)
**Problem:** no crash reporting; a bad release is invisible.

1. Create a free account at https://sentry.io → **New Project → React Native**.
2. Copy the **DSN** (looks like `https://abc123@o123456.ingest.sentry.io/123456`).
3. Send me the DSN (or paste it into `apps/native/.env` as `EXPO_PUBLIC_SENTRY_DSN`).

The wiring is already saved on `hermes/crash-funnel-wip` — with the DSN I'll finish it, typecheck, and fold it into the next build.

---

## 4. Support email on your own domain — 10 min
**Problem:** the app's support/FAQ/Profile footer shows `support@templatehub.pro` — the other project's address.

Choose one:
- **A — proper:** add MX records for `sumaiya.app` (Google Workspace or your DNS provider), create `support@sumaiya.app`, then tell me and I'll switch one constant (`SUPPORT_EMAIL` in `apps/native/src/lib/app-hosts.ts` + the web contact page).
- **B — quick:** give me an existing mailbox to use instead (e.g. a Gmail), and I'll wire that.

⚠️ Do NOT just switch to `@sumaiya.app` without MX — it will bounce (no MX records today).

---

## 5. Play Store listing — 30 min
**Problem:** no store presence; the app only updates via the in-app prompt.

1. Open https://play.google.com/console → **Create app**.
2. Paste the copy from `docs/aso-play-store.md` (name, short + full description).
3. Upload the signed APK: `apps/native/android/app/build/outputs/apk/release/app-release.apk` (1.6.21).
4. Take the 7 screenshots listed in that doc (I listed exactly which screen + the caption).
5. Privacy policy URL: `https://sumaiya.app/privacy`.
6. Submit for review.

---

## What I do the moment you unblock anything
| You do | I then do |
|---|---|
| Google SHA-1 | nothing needed — test it live with you |
| Vercel token | deploy + verify `/api/app/update` = 1.6.21 |
| Sentry DSN | finish crash monitoring, typecheck, one build |
| Support email choice | swap it in native + web, verify |
| Play Console | help with screenshots/copy review |

**Cheapest high-leverage pair:** the **Google SHA-1** (2 min, fixes a dead auth path) and the **Vercel deploy** (turns the update prompt on for every installed user).
