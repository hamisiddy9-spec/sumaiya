Sumaiya Android launch audit
Generated: (in-progress)

Progress: CONFIG DRIFT checks complete 


---

1) CONFIG DRIFT

Finding 1 (P0) 
- file: /home/oem/sumaiya/apps/native/src/lib/app-hosts.ts:46
- offending line: export const PASSWORD_RESET_URL=`${CAN...rd`;
- what is wrong: The PASSWORD_RESET_URL constant is a truncated/unreadable template literal (contains literal ellipsis) instead of a valid URL derived from CANONICAL_ORIGIN. This means the canonical password-reset target is wrong in code.
- user-visible consequence: Password-reset links embedded into emails or used by the app may be broken or point to an invalid/malformed target. Users clicking reset links may receive an error or be unable to reset their password.
- fix: Replace the line with a correct template derived from CANONICAL_ORIGIN. Example: export const PASSWORD_RESET_URL = `${CANONICAL_ORIGIN}/reset-password`;

Finding 2 (P0) 
- file: /home/oem/sumaiya/apps/native/src/lib/supabase.ts:73
- offending line: export const PASSWORD_RESET_REDIRECT_TO=PASSWO...URL;
- what is wrong: This is not a reference to the exported PASSWORD_RESET_URL constant, but an unquoted, invalid identifier (PASSWO...URL) 
- invalid JS/TS token. Module evaluation will throw (ReferenceError / SyntaxError) or TypeScript will not compile this file.
- user-visible consequence: Importing this module at runtime will crash the JS bundle (module load error) or cause the app to fail to start or break any flow that imports supabase.ts. Password reset flows will certainly fail; sign-in flows that rely on Supabase may also break. This is a P0 crash-risk.
- fix: Reference PASSWORD_RESET_URL properly (import or use the existing same-module const). Replace the line with: export const PASSWORD_RESET_REDIRECT_TO = PASSWORD_RESET_URL; or fully-qualified: export const PASSWORD_RESET_REDIRECT_TO = `${CANONICAL_ORIGIN}/reset-password`;

Finding 3 (P2) 
- files checked: app.json, eas.json, android/app/src/main/AndroidManifest.xml, android/app/build.gradle, plugins/with-release-signing.js, src/lib/app-hosts.ts
- evidence:
  - /home/oem/sumaiya/apps/native/app.json: "scheme": "sumaiya", android.intentFilters: host: "sumaiya.app", android.package: "pro.sumaiya.app", version: "1.6.12", android.versionCode: 10612 (app.json lines 5, 9, 20, 21, 48-50)
  - /home/oem/sumaiya/apps/native/eas.json: EXPO_PUBLIC_API_URL = "https://sumaiya.app" in all build profiles (eas.json lines 13,27,38,46)
  - /home/oem/sumaiya/apps/native/android/app/src/main/AndroidManifest.xml: intent-filter data android:host="sumaiya.app" and <data android:scheme="sumaiya"/> present (AndroidManifest.xml lines 36, 52)
  - /home/oem/sumaiya/apps/native/android/app/build.gradle: namespace/applicationId 'pro.sumaiya.app', versionCode 10612, versionName "1.6.12" (build.gradle lines 125-131)
  - /home/oem/sumaiya/apps/native/src/lib/app-hosts.ts: CANONICAL_HOST = "sumaiya.app" and CANONICAL_ORIGIN = `https://${CANONICAL_HOST}` (app-hosts.ts lines 24,27)
- conclusion: The canonical host (sumaiya.app), the Android package (pro.sumaiya.app), the scheme (sumaiya) and the version (1.6.12 / 10612) are consistent across app.json, eas.json, AndroidManifest.xml and build.gradle. The only configuration drift detected is the broken password-reset constant and the dependent usage in supabase.ts.

---

2) DEAD OR WRONG LINKS

I crawled and HTTP-checked every app-facing URL (update APK, app update JSON, assetlinks, canonical origin, support domain, and the Supabase project root). Output below.

- https://sumaiya.app
  - HTTP: 200 OK (headers show Vercel; content-type text/html)
  - Evidence: curl -I -L returned 200 and url_effective https://sumaiya.app/
  - Consequence: Good. Canonical host serves pages.
  - Severity: P3 (informational)

- https://sumaiya.app/.well-known/assetlinks.json
  - HTTP: 200 OK
  - Body (excerpt):
    [
      {
        "relation": ["delegate_permission/common.handle_all_urls"],
        "target": {
          "namespace": "android_app",
          "package_name": "pro.sumaiya.app",
          "sha256_cert_fingerprints": [
            "29:B8:02:FF:52:C6:18:3F:D5:D6:45:15:3C:10:11:FC:ED:F9:BC:E6:E3:4A:BF:5C:35:57:CE:A4:41:0C:BC:D8"
          ]
        }
      }
    ]
  - Consequence: assetlinks.json is present on the APEX (sumaiya.app) and clearly references package pro.sumaiya.app with an sha256 cert fingerprint. This is correct and necessary for Android App Links verification. Good.
  - Severity: P3 (informational)

- https://www.sumaiya.app
  - HTTP: 308 Redirect -> Location: https://sumaiya.app/
  - Evidence: curl -i | head shows 308 with location header -> https://sumaiya.app/
  - Consequence: Expected. Important: Android will NOT follow redirects when fetching /.well-known/assetlinks.json for verification. Because the manifest claims the apex (sumaiya.app) and assetlinks is served at the apex, verification will work. If the manifest instead claimed www.sumaiya.app, verification would permanently fail (domain state 1024). The code correctly claims the apex.
  - Severity: P2 (informational + warning if misconfigured)

- https://sumaiya.app/downloads/sumaiya.apk (APK_DOWNLOAD_URL)
  - HTTP: 308 Redirect -> Location: https://github.com/hamisiddy9-spec/sumaiya-releases/releases/latest/download/sumaiya.apk
  - Evidence: curl -i showed 308 and Location header to GitHub releases URL.
  - Consequence: The app's default APK_DOWNLOAD_URL points at sumaiya.app which redirects to a GitHub release asset. The in-app downloader (expo FileSystem.createDownloadResumable) should follow redirects, so downloads will succeed in-app. But the URL is not a direct 200 asset; it is a redirect chain. If GitHub changes the release path or Vercel redirect rules change, the chain could break. Also note redirected host differences (github.com) are fine for downloads but are worth documenting.
  - Fix/mitigation: Prefer a direct, short-lived signed CDN URL or ensure GitHub release link is stable. Keep the redirect intentionally documented.
  - Severity: P1 (update UX/robustness)

- https://sumaiya.app/api/app/update (what the app GETs at launch)
  - HTTP: 200 OK
  - Response body (JSON excerpt):
    {"version":"1.6.11","url":"https://sumaiya.app/downloads/sumaiya.apk","notes":{...}}
  - What is wrong: The server advertises version 1.6.11 as the "latest", while app.json / build.gradle in the mobile tree are 1.6.12 / 10612.
  - User-visible consequence: The mobile app's update logic prompts only when the server advertises a STRICTLY NEWER version. Because the server currently claims 1.6.11 (older), users on 1.6.12 will not be prompted to update and the rollout is inconsistent. If you intended to publish 1.6.12 widely, the backend must be updated; otherwise users will never be offered the real latest build.
  - Fix: Deploy the web config or the API that returns /api/app/update with the correct latest version and APK URL (update config/app-release.json or equivalent). Ensure CI updates both mobile tag and backend config atomically.
  - Severity: P1 (update/rollout correctness)

- https://ayczgaddnufdxnhizpcr.supabase.co (EXPO_PUBLIC_SUPABASE_URL)
  - HTTP: 404 on the project root (curl -I shows 404 at /)
  - Notes: Supabase project roots frequently 404 for the bare host and are not themselves a health check; the Supabase JS client contacts specific endpoints. A 404 at / is not a fatal sign by itself. The app uses the URL as the Supabase project endpoint via the SDK (createClient) which is normal.
  - Severity: P3 (informational)

- https://templatehub.pro and https://www.templatehub.pro (support mail domain)
  - https://templatehub.pro -> 308 -> https://www.templatehub.pro/
  - https://www.templatehub.pro -> 200 OK (site served)
  - Consequence: SUPPORT_EMAIL = "support@templatehub.pro" (src/lib/app-hosts.ts). templatehub.pro is live and redirects to the public site. Good.
  - Severity: P3 (informational)

Summary of DEAD/WRONG link items:
- P1: sumaiya.app/downloads/sumaiya.apk is a redirect to GitHub releases (works today but fragile) 
- P1: /api/app/update advertises a stale version (1.6.11) while mobile is 1.6.12 (prevents updates being offered)
- P0: (implicit) the broken PASSWORD_RESET constants (see CONFIG DRIFT) mean password reset redirect links may be malformed and must be fixed before emailing users.

---

(Next: COPY / UI strings, SCREENS vs CODE and SWALLOWED ERRORS. Appending those sections next.)
