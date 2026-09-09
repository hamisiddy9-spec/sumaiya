# Rebrand Runbook — TemplateHub → Sumaiya

> Companion to the rebrand proposal. This is the operational checklist for
> standing up **Sumaiya** as a clean, fresh project. Nothing here is destructive
> to the old project — `templatehub.pro` keeps running until you cut it over.
>
> Decisions locked (2026-09-08): brand-new empty repo · name **Sumaiya** ·
> primary domain **sumaiya.pro** · same Supabase database · old-project
> migration handled as a later, separate step.

---

## What's already done in the code (branch `rebrand/sumaiya`)

| Area | Change |
|---|---|
| Product name | Every user-facing `TemplateHub` → `Sumaiya` (metadata, JSON-LD, footer, auth, install prompts, "Made with…" share strings, blog, legal copy, emails, DOCX creator, watermark, support-AI persona) |
| Domain | `templatehub.pro` / `templatehub.co` / `templatehub-two.vercel.app` → `sumaiya.pro` (all `NEXT_PUBLIC_APP_URL` fallbacks, sitemap, robots, OG images, email from/support, bot user-agents) |
| npm workspace scope | `@templatehub/*` → `@sumaiya/*` (tsconfig paths, `packages/*/package.json`, all imports, `package-lock.json` regenerated) |
| `package.json` name | `templatehub` → `sumaiya` |
| Browser storage keys | `templatehub-guest-cv`, `-guest-letter`, `-guest-business-card`, `-sync-queue`, `-interview-v1`, `-assistant-v3/v4`, `-snap-prefill`, IndexedDB `templatehub.db` → `sumaiya-*` (safe: `sumaiya.pro` is a new origin with empty storage) |
| Android | `twa-manifest.json` packageId `pro.templatehub.app` → `pro.sumaiya.app`, host, names, icon URLs, keystore alias `templatehub` → `sumaiya`; `public/.well-known/assetlinks.json` package_name; `scripts/generate-twa.js` defaults |
| Score feature | "TemplateHub Score" → "Sumaiya Score" (composite.ts, outcomes, assistant UI, evals) |
| Logo | `components/ui/logo.tsx` now renders the three-blade Sumaiya mark + "Sumaiya" wordmark (was the ember-document mark) |
| Releases | `hamisiddy9-spec/templatehub-releases` / `templatehub.apk` → `sumaiya-releases` / `sumaiya.apk` (`next.config.mjs` APK 301, `lib/app-release.ts`) |
| Docs | `CLAUDE.md`, `AGENT.md`, `ENV_VARS.md`, `DEPLOYMENT_GUIDE.md`, `BUILD_CHECKLIST.md`, `BRAND.md`, `evals/README.md`, `docs/surface-map.md`, architecture doc |

**Verified:** `npx tsc --noEmit` clean · `npx vitest run` 924 pass / 3 skip · `npm run build` exit 0.

### NOT changed (deliberately — do these as separate, scoped tasks)

- **Color palette.** Ember stays `#DA4A1C`. The proposal's tightening to
  `#D8531F` touches dozens of files with WCAG-audited contrast comments —
  it's a design pass, not a rename. Ember `#DA4A1C` already satisfies "keep the
  warmth".
- **Raster brand assets.** `public/favicon.png`, `icon-192.png`, `icon-512.png`,
  `icon-maskable-512.png`, `apple-touch-icon.png`, `og-image.png` still show the
  old document mark (no SVG rasteriser on this machine). `icon.svg` /
  `icon-maskable.svg` also still old. Regenerate the whole set from the
  three-blade mark — Phase 2.
- **Legal entity.** `Infoserve Technologies Limited` is the company, not the
  brand — unchanged. Only `lib/legal.ts` `product` field flipped to "Sumaiya".
- **`assetlinks.json` SHA-256 fingerprint.** Still the old keystore's. A new
  package id needs a **new keystore**; replace the fingerprint after you
  generate it (see Android section).
- **Historical `PHASE_*.md` / `HERMES_*.md` / `COMPLETE_*.md` docs.** Left as
  point-in-time records. Archive or delete them when seeding the new repo
  rather than rewriting history.
- **Supabase `OUTCOME_SALT`** dev fallback string — prod uses the env var;
  changing the fallback would break local outcome-dedup continuity for no gain.

---

## Reference IDs

| Thing | Value |
|---|---|
| Vercel team | `hamisiddy9-9360's projects` · slug `hamisiddy9-9360s-projects` · `team_rnS6I17qVcDYkbQCs4HjcixT` · **Hobby** |
| Old Vercel project | `templatehub` · `prj_VKqiG1lNRsy30wJUQFZ0TEPWlXLS` · linked to `hamisiddy9-spec/TemplateHub` |
| Supabase org | `lzveholtxclibxsqaygz` |
| Supabase project (KEEP) | `templatehub` · ref `ayczgaddnufdxnhizpcr` · `eu-central-1` · ACTIVE_HEALTHY · Free |
| New GitHub repo | `hamisiddy9-spec/sumaiya` (to create) |
| New releases repo | `hamisiddy9-spec/sumaiya-releases` (to create, public) |
| Primary domain | `sumaiya.pro` (~$4.99/yr) |
| App-face domain | `sumaiya.app` (~$9.99/yr) |
| Defensive hold | `ajiri.app` (~$9.99/yr) — optional |

---

## Phase 0 — Provision (paid; you run these)

1. **Vercel Pro** — team Settings → Billing → upgrade (~$20/mo). Removes the
   metered-connector pause that's blocking deploys.
2. **Supabase Pro** — project `ayczgaddnufdxnhizpcr` → Settings → Billing →
   upgrade (~$25/mo). Stops the 7-day idle auto-pause. The **database does not
   move** — same project, same data, same keys.
3. **Buy domains** — `sumaiya.pro` + `sumaiya.app` (Vercel Domains, or any
   registrar). Grab `sumaiya.pro` regardless of timeline — it's the squat
   target.

## Phase 1 — New repo + Vercel project

4. **Create `hamisiddy9-spec/sumaiya`** on GitHub (empty, private).
5. **Seed it** from this working tree (squashed history):
   ```bash
   cd ~/TemplateHub                     # this checkout, branch rebrand/sumaiya
   git checkout rebrand/sumaiya
   rm -rf .git
   # optional: delete historical docs before first commit
   #   rm PHASE_*.md HERMES_*.md COMPLETE_BUILD_SUMMARY.md ALL_PHASES_COMPLETE_DELIVERABLE.md
   git init -b main
   git add -A
   git commit -m "Sumaiya — initial commit (rebrand from TemplateHub)"
   git remote add origin git@github.com:hamisiddy9-spec/sumaiya.git
   git push -u origin main
   ```
   Then rename the local directory to match: `mv ~/TemplateHub ~/sumaiya`.
6. **New Vercel project** — Add New → Project → import `hamisiddy9-spec/sumaiya`.
   Framework auto-detects Next.js. Fresh Git connector, no paused state.
7. **Env vars** — copy every var from the current project (or local
   `.env.local`) into the new project's Production + Preview envs. Same Supabase
   URL / anon key / service-role key — the DB is unchanged. Set:
   - `NEXT_PUBLIC_APP_URL=https://sumaiya.pro`
   - `EMAIL_FROM=Sumaiya <noreply@sumaiya.pro>`  (or leave unset — code
     defaults to this)
   - regenerate `CRON_SECRET` for the new project
   Full list: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `RESEND_API_KEY`,
   `DEEPSEEK_API_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`, `NEXT_PUBLIC_POSTHOG_KEY`,
   `BROWSERBASE_API_KEY`, `BROWSERBASE_PROJECT_ID`, `CRON_SECRET`,
   plus any `GOOGLE_CLIENT_ID/SECRET`, `OUTCOME_SALT`, `ALERT_EMAIL` set on the
   old project. Diff against the old project's env list before first deploy.
8. **Deploy.** Confirm the build is green on the new project.

## Phase 2 — Domains + brand assets

9. **Attach `sumaiya.pro`** to the new project as the primary domain
   (`www` → apex redirect). Add `sumaiya.app` too (redirect to `.pro` for now,
   or serve the download page there later).
10. **Regenerate the icon/OG set** from the three-blade mark: `icon.svg`,
    `icon-maskable.svg`, `favicon.png`, `icon-192/512.png`,
    `icon-maskable-512.png`, `apple-touch-icon.png`, `og-image.png`,
    plus splash. (Use the `canvas-design` skill or a design tool.)
11. **Resend sending domain** — add `sumaiya.pro` in Resend, publish the
    SPF/DKIM/DMARC DNS records, verify. Until it verifies, transactional mail
    from `noreply@sumaiya.pro` will spam-foulder.
12. **Supabase Auth** — add `https://sumaiya.pro` to the allowed redirect URLs
    and Site URL. If Google sign-in is used, add the new origin to the Google
    Cloud OAuth client's authorised redirect URIs.

## Phase 3 — Old-domain cutover (separate step, when the new site is proven)

13. Add `templatehub.pro` to the **new** Vercel project as a secondary domain.
14. Add a wildcard 301: `templatehub.pro/*` → `sumaiya.pro/*` (Vercel redirect
    rule, or `vercel.json` `redirects`). Keep it indefinitely — it's carrying
    "tengeneza CV" search equity.
15. Google Search Console — add `sumaiya.pro`, submit the sitemap, use Change of
    Address from the old property.
16. Once traffic has moved and 301s are verified, **pause then delete** the old
    Vercel project (`prj_VKqiG1lNRsy30wJUQFZ0TEPWlXLS`). Don't delete the old
    GitHub repo — keep it archived.

## Phase 4 — Android (own release cycle)

17. New app = **new keystore**. Generate it, store as GitHub secrets in
    `hamisiddy9-spec/sumaiya`, get the SHA-256 fingerprint.
18. Put the fingerprint into `public/.well-known/assetlinks.json` (replace the
    old one) and redeploy so Google Digital Asset Links verifies
    `pro.sumaiya.app` ↔ `sumaiya.pro`.
19. Build `Sumaiya` (package `pro.sumaiya.app`, new icon/splash). Existing
    testers **reinstall once** — package id can't change in place.
20. Create the public `hamisiddy9-spec/sumaiya-releases` repo; publish the APK
    there as `sumaiya.apk` on the `latest` release
    (`/downloads/sumaiya.apk` 301s to it).

---

## Rollback

Nothing in Phases 0–2 touches the live `templatehub.pro` deployment. If the new
project misbehaves, keep pointing DNS at the old one. The only shared resource
is the Supabase database — no schema changes are part of this rebrand, so both
projects can run against it simultaneously during the transition.
