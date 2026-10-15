# SUMAIYA — APP SPECIFICATION BRIEF

**Purpose:** everything an outside model needs to work on this codebase without prior context.
Verified against the working tree on **2026-10-14**. Where a number appears here it was
measured, not remembered — re-run the command before trusting it.

---

## 1. WHAT THE PRODUCT IS

**Sumaiya** is bilingual (Swahili/English) career intelligence for Tanzania → East Africa →
the Gulf: build a CV, tailor it to a job advert, check it honestly, apply. Bilingual is not a
translation layer — en/sw parity is enforced by tests that fail if a key exists in one
language and not the other.

Two properties drive every technical decision:

1. **Phone-first, offline-first.** The Android APK is the product, not a companion to the
   website. A user on a phone with no data bundle must be able to work. The web app is the
   second client.
2. **The name is a memorial.** Sumaiya is named for the founder's late sister. Copy stays
   warm, respectful and empowering; no cynical tech jargon, nothing a family would wince at.
   This is a quality bar, not a style note.

Monetisation is **mobile money**, and the free tier must remain genuinely useful.

---

## 2. REPOSITORY LAYOUT

```
apps/web        Next.js (App Router, [locale] routing, Drizzle + Postgres, Hono-style API)
apps/native     Expo / React Native (the phone product; own node_modules, NOT an npm workspace)
apps/whatsapp   Node worker (node --test)
packages/       api-client, analytics, core, design-tokens, hooks, templates, types, utils
docs/           briefs/, audit/, design/, plus the design + handover documents
```

Root `workspaces` is `["apps/web", "packages/*"]`. **`apps/native` and `apps/whatsapp` are
not workspaces** — run them from their own directories.

Key paths: `apps/web/lib/db/schema.ts` (Drizzle, 29 tables), `apps/web/lib/jobs/**` (ingest +
sources + lifecycle), `apps/web/lib/api/routes/**`, `apps/native/src/screens/**`,
`apps/native/src/lib/templates/**` (218 implementations), `apps/web/components/templates/**`.

---

## 3. THE GATES (what "done" means here)

**The two apps use DIFFERENT test runners. This is the single most common mistake.**

```bash
# apps/web — VITEST
npx tsc --noEmit && npm run lint && npx vitest run && npm run evals && npm run build
npm run verify            # chains all of the above + Playwright E2E + Lighthouse + DB checks

# apps/native — JEST (never run vitest here; it reports ~39 bogus failures)
npx tsc --noEmit && npx jest && node scripts/test-release-invariants.js

# apps/whatsapp
node --test
```

Current measured state (2026-10-14): **web 2498 tests passing**, **native 1684 tests passing**,
tsc clean in both.

**`npm run evals` is an anti-fabrication gate.** It exists to stop the product asserting
something it cannot back. Treat it as a merge gate, not a nicety.

**And a green build is not evidence a screen works.** Every change that touches a surface
must be opened with real data and reported. Tests plus a clean build have never once caught
the defects that mattered here.

---

## 4. THE INVOLABLE LAWS

A change that breaks one of these has failed, however good it looks.

1. **Ember is the root.** `#DA4A1C` and the warm scale derived from it. No second accent, no
   foreign palette. If you find `emerald-`/`indigo-`/`blue-`/`amber-` classes, they are bugs.
2. **No pure `#FFFFFF` as a surface.** White is for text and icons **on** ember. Surfaces use
   the warm scale: base `#FBF9F5`, raised `#F5F3EF`, sunken `#EFEEEA`. (Exception: a document
   preview is paper, and paper is legitimately white.)
3. **Never "ATS" in Swahili-facing copy.** The Swahili surface says **Ukaguzi wa CV**, and
   findings group as **Kikubwa / Wastani / Kidogo**. English surfaces may keep the acronym.
4. **No fabricated numbers, scores, counts or timers.** A score appears only when a real
   evaluation produced it. An empty state says so plainly. A count in unconditional chrome is
   a lie that ships regardless of what the engine knows.
5. **Salary honesty.** Never an employer's salary we predicted rather than read; never a figure
   without its period; never a `"70k"`-style guess. A posting date is the source's date, not
   our crawl time.
6. **No version pills, no bell/notification chrome, no badges implying an unbuilt feature.**
7. **Honest premium.** Payment methods may be named; a price may not be invented. Sell only
   what is actually gated.
8. **Provenance stays internal.** `source_url`, `source`, `external_id` are crawl data, not
   product facts, and do not reach a user.
9. **Bilingual parity.** Every user-facing string exists in SW and EN, in the same register.
10. **Memorial dignity** (§1).

---

## 5. THE DESIGN SYSTEM

- **Palette:** ember `#DA4A1C`, ember-pressed `#B93C13`, ember-hover `#C2410C`; surfaces
  `#FBF9F5` / `#F5F3EF` / `#EFEEEA`, border `#E2BFB5`; ink `#1B1C1A` / body `#5A413A` /
  muted `#8E7068`; success `#186A22`, warning `#B45309`, error `#BA1A1A`; Espresso dark
  `#1B1C1A` / `#24201C` / `#141210`.
- **Type:** Bricolage Grotesque (display), Hanken Grotesk (body), JetBrains Mono (numerics).
- **House mark:** three blades at 120°, opacities 1.0 / 0.9 / 0.8; wells 128dp hero, 96dp
  dialogs, 80dp bars. Never redrawn, recoloured or rotated.
- **The design source of truth** is `docs/DESIGN-GUIDE.md`. Where it disagrees with any HTML
  mock, **it wins**.
- Known drift to be aware of: the web has ~520 arbitrary font sizes, 92 raw brand hex values
  where tokens exist, and 42 white surfaces. See
  `docs/audit/2026-10-14-web-ui-inconsistencies.md` for the measured list and its risk order.

---

## 6. DATA + PIPELINE

- Drizzle + Postgres. **There is no `documents` table** — `cv`, `cover_letter`, `letter` are
  separate; version history is `document_version.snapshot` (jsonb). No `content_snapshot`.
- **Jobs:** `/api/jobs` (feed) filters `status IN ('published','expiring')`. Salary and
  `postedAt` columns arrived in migration `0024_job_posted_salary.sql` (additive, 7 ×
  `ADD COLUMN IF NOT EXISTS`, **no backfill on purpose**).
- **Lifecycle:** deadline passed → expired; `VERIFY_GRACE_DAYS = 30` unverified → expired;
  deadline within `EXPIRING_WINDOW_DAYS = 3` → expiring.
- **Crawl:** `/api/cron/jobs` daily at 06:00 (`0 6 * * *`), plus signals 07:00, follow-ups
  08:00. Eleven source adapters parse a real posting date; several publish salary.
- **Templates, measured:** 268 `.tsx` files → 266 registry entries → **47 offered** → 7
  premium (native: 218 implementations). **The number 273 does not exist anywhere in the
  tree and must never be written.** `lib/templates/families.ts` is a **STUB** (260 of 266
  entries are `family: "pending"`), so families must not be presented as shipped.

---

## 7. DEPLOYMENT

- GitHub `hamisiddy9-spec/sumaiya`; **Vercel auto-deploys `main`** for `sumaiya-web` (root
  directory `apps/web`, build command `npm run build`).
- **Order matters: schema before code.** A deploy whose code needs columns the database lacks
  takes the feature down — this happened, with `column "salary_text" does not exist` on every
  feed request for ~90 minutes. Migrations are additive and guarded; apply them before
  shipping code that reads the new columns.
- Production secrets are **not** readable via `vercel env pull` (35 values come back
  `[SENSITIVE]`). The build and runtime environments do have them.

---

## 8. TRAPS THAT HAVE ACTUALLY COST TIME HERE

- **`git add -A` is forbidden.** Agents and a human share one clone; stage named paths only,
  and never revert a file you did not author.
- **Do not trust a hand-written file list.** A "10 files" inventory built from a grep that
  omitted `amber-` actually hid 5 more files. Discover, don't list.
- **Tailwind silently drops a class it cannot resolve.** A guessed token name
  (`text-ink-body` when the config has no `ink` group) does not error — the element just
  loses its colour. Read the token names from the config and assert them.
- **A piped command hides a failure.** `build.py | grep law` swallowed an assertion failure
  and a false claim shipped in a commit. Run gates unpiped, or check exit codes explicitly.
- **Windows/MSYS:** native binaries do not accept `/c/...` paths. Use `C:/...`. `/tmp` is not
  the same place for MSYS and native Python.
- **`head -N` on a grep truncates the line that disproves you.** It has, twice.
- **Repo docs contradict each other.** Several markdown files describe a product that does not
  exist (a `mobile/` directory, a `documents` table, `npm run build:android`, "273 templates").
  Code is the only authority.

---

## 9. HOW WORK IS EXPECTED TO BE DONE

- **Ship-first, verify hard.** A feature is not done at "it compiles"; it is done when someone
  has opened it with real input and reported what appeared.
- **Never print a number you did not measure.** No estimated scores, no placeholder counts, no
  "roughly N files".
- **Say what is unverified.** A stated gap is worth more than a confident summary. Every
  report here carries its own holes.
- **Design copy that the code contradicts gets the copy changed, with the reasoning in a
  comment** — so a later pass cannot "restore" the mock's wording.
- **Prefer the honest empty state to the impressive one.** "Nothing matched — finish your
  profile and I'll match you" beats a fabricated list.

---

## 10. CURRENT STATE (2026-10-14)

**Live and verified**

- Job feed fixed and serving: rows carrying `postedAt` + salary fields; confirmed through the
  API, the deployed site, and the app on a Pixel 8 Pro showing *"Posted yesterday"* on a real
  listing.
- Foreign palette purged on the web: 80 classes across 15 files, zero remaining, deployed.
- Native app **1.8.2 / versionCode 10802** installed and verified on hardware.
- A self-contained design suite (all four viewports + a wiring manual) at
  `docs/design/2026-10-14/`, offline — embedded fonts, no external references.

**Open, in the order they should be tackled**

1. **Token migration (web)** — add the missing `ink` group (+ confirm success/warning/error
   names) to `tailwind.config.ts`, then migrate 92 raw hex values and ~43 arbitrary radii.
   Zero visual change.
2. **White-surface review (web)** — classify the 42 `bg-white` uses; change only the surfaces.
3. **Type ramp (web)** — ~520 arbitrary sizes (`10px` ×198, `11px` ×195 …) against a config
   with no `fontSize` scale. Needs eyes on every surface at 360 / 768 / 1280 / 1440.
4. **Design shell (web)** — the 240px rail and split editor/preview from the design's desktop
   view, once the layer beneath it is trustworthy.
5. **Carry-over defects** — `support@templatehub.pro` is still the support address users see;
   `templatehub.pro` remains in `vercel.json`, `.env.example`, `twa-manifest.json`, the `/pro/`
   marketing page and the native gallery label.
6. **Self-healing stop-gap to remove** — `apps/web/lib/db/index.ts` creates the job columns at
   runtime once per process. Delete it (and the `ensure-job-columns.mjs` prebuild step) once
   production is confirmed to carry the columns.
