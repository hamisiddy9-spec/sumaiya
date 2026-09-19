# INFRASTRUCTURE REGISTRY — Sumaiya & TemplateHub

**Purpose:** one place that answers "which database?", "which project?", "which domain?"
without anyone guessing. Tonight's confusion came from exactly this being scattered.

**Last verified:** 2026-09-19

---

## ⚠️ RULES (learned the hard way)

1. **The project named `sumaiya` is NOT the live one.** The live Sumaiya site is the
   project named **`sumaiya.ai`**. There is also a decoy named **`web`**. Both decoys
   build from the repo root of a monorepo whose app lives in `apps/web` — they can never
   serve the product.
2. **Never put an env value in chat.** Passwords and keys go in files only.
   A Supabase `service_role` / `secret` key is full database admin — treat as radioactive.
3. **`NEXT_PUBLIC_` values ship to browsers, so the live bundle always tells the truth.**
   Env files and dashboards can be stale; the bundle cannot. When they disagree, the
   bundle wins.
4. **Check `X` and `Y` are from the same provider.** A Supabase URL from one project with
   a key from another fails silently.

---

## Products

| Product | Domain | Vercel project | GitHub repo |
|---|---|---|---|
| **Sumaiya** | `sumaiya.app` (+ `www`) | `sumaiya.ai` | `hamisiddy9-spec/sumaiya` |
| **Sumaiya (Android)** | — | — | `hamisiddy9-spec/sumaiya-releases` |
| **TemplateHub** | `templatehub.pro` | `TemplateHub` | `hamisiddy9-spec/TemplateHub` |

**Decoys to delete:** Vercel projects `sumaiya` and `web`.

---

## Databases — the thing that caused the most confusion

**Sumaiya's live app currently runs on Supabase**, verified by connecting and reading its
data, and by the ref in the live browser bundle.

| Ref | What it is | Status |
|---|---|---|
| `ayczgaddnufdxnhizpcr.supabase.co` | **The project the LIVE app uses today** — confirmed from the live JS bundle | Live |
| `fskokfnunjlrvxspkftx.supabase.co` | A newer Supabase project named "sumaiya" | Being set up fresh |
| `round-sunset-45714155` (Neon) | Postgres target | Set up, schema only |

**Two rules that prevent the confusion returning:**
- **Auth lives wherever the app's Supabase project is.** The data can move; auth cannot
  move to Neon, because **Neon has no auth product.**
- **The user-id string links auth to data.** Your tables store the Supabase user id as
  plain `text` with **no foreign key** to `auth.users` — which is why data can move
  between databases without breaking identity, and also why a **new Supabase project
  makes the old data unattachable** (new project = new user ids).

**Neon:** project `round-sunset-45714155`; branches `production` (default) and
`vercel-dev`. Its connection string would **not** come out of the CLI — read it from the
Neon console. A Neon database **suspends when idle**; the first query after a pause is slow.

---

## ⚠️ Supabase signup trigger

The old project has `on_auth_user_created` on `auth.users` → `public.handle_new_user`,
which writes the `profile` row. **It writes into that Supabase project's own database.**

- If data lives in Neon, that trigger writes to the wrong place and new users get no profile.
- **A new Supabase project has no trigger** — so the app must create the profile itself.

Evidence it already misfires: **25 `auth.users` rows but only 15 `profile` rows.**

---

## Google OAuth

- **Google Cloud project:** `811013224847`
- **Consent screen** must read **`Sumaiya`** — unbranded, users see
  `ayczgaddnufdxnhizpcr.supabase.co wants access`, which reads as a phishing attempt.
- **Web client redirect URI** must be the ref of the app's Supabase project:
  `https://<ref>.supabase.co/auth/v1/callback` — no trailing slash, ref spelled exactly.
- **Android client:** package `pro.sumaiya.app` + the signing SHA-1.
- **Scopes: only `userinfo.email`, `userinfo.profile`, `openid`.** All three are
  non-sensitive → **no Google review needed.** Adding Gmail/Drive/Calendar triggers a
  verification queue. Never add one.
- **Enable the provider in Supabase** (Authentication → Providers → Google). Without this
  step the consent screen keeps showing the ugly hostname no matter what Google says.

---

## What cannot be regenerated

**`sumaiya-release.jks`** — the Android signing key (`_hdd-data/sumaiya-transfer/`).
Lose it and **no update can ever ship again** to an installed Sumaiya; Android rejects a
new key permanently. Backed up to the HDD. **Never commit it to a repo.**

---

## Backups

`D:/backup-20260919/` — **all 9 repos as full mirrors** (every branch, tag, ref),
the APKs, `_hdd-data`, and `redeploy/RESTORE.md`.

**A mirror is a snapshot.** Re-run it *after* work stops and *before* deleting anything
online. **Uncommitted work is never in a mirror.**

---

## CLIs

```
gh        ✅ authenticated
neonctl   ✅ authenticated
vercel    ⬜ installed, needs login     → deploys
supabase  ⬜ installed, needs login     → database + auth
eas       ⬜ installed, needs login     → APK builds
claude    ⚠️  not on PATH in bash
docker    ❌ not installed
```

**Environment traps:** `adb` and `git` are native Windows binaries — pass `C:/...` paths,
never `~/` or `/c/...`. `node` cannot read `/tmp`; use `%LOCALAPPDATA%\Temp`.
`apps/web` runs **vitest**, `apps/native` runs **jest** — the wrong runner reports dozens
of false failures. **GitHub Actions fails account-wide in both repos**, so a local green
build does not mean CI passes.
