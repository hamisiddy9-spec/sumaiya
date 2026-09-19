# DECISIONS — binding, with reasons

**Purpose:** stop decisions being re-litigated. If a question is answered here, the answer
stands until someone writes a new entry above it saying otherwise.

**Date:** 2026-09-19

---

## D1 · Sumaiya is fully independent. No TemplateHub integration.

**Decided:** Sumaiya owns its templates, its database, its auth, its everything.

**Why — and this one is not a preference:**

> **Sumaiya's APK must work with no network.** That is the product: phone-first,
> offline-first, for a market where connectivity is not guaranteed.

**An offline-first app cannot fetch its templates from a remote service.** That is a
contradiction, not a trade-off. Sumaiya already ships **267 template files and 266 registry
entries, locally** — which is exactly what an offline product requires.

**What the integration actually delivered, verified:**
- `TemplateHubProvider` in Sumaiya — self-labelled *"STUB only. Not yet integrated."*
- The six Sumaiya touchpoints in TemplateHub — **missing from master, 0 imports**
- Their env vars — **not in `.env.example`**

**Never ran in production. Cost three duplicated fixes** — the export wall, the business
card, the CV quality work — because two repos contained one app.

---

## D2 · The boundary rule, if they ever meet again

**Sumaiya renders. TemplateHub supplies DATA — never React components.**

The APK cannot render React DOM. If TemplateHub is ever consumed, it ships **HTML/CSS or an
engine-consumable schema** — nothing that needs a browser.

---

## D3 · TemplateHub is parked, not deleted

Three honest options, and **the owner must pick one and write it here:**

| Option | Means | Domain |
|---|---|---|
| Separate product | Its own users and brand | keep `templatehub.pro` |
| A library | The document engine as a package Sumaiya depends on | none needed |
| **Retire (recommended)** | Archive the repo as reference | **repurpose the domain** |

**Recommendation: retire it.** It has **194 branches and no shipped standalone product** —
that is a lot of motion without a destination. Unless you can name its first paying user.

Either way the repo stays backed up. Parking is free; rebuilding the integration is not.

---

## WHAT IS NEEDED TO EXECUTE D1

### Code — in the Sumaiya repo (`apps/web`)

| # | File | Change |
|---|---|---|
| 1 | `lib/templates/templatehub-provider.ts` | **Delete** (295 lines, self-declared stub) |
| 2 | `lib/templates/index.ts` | `selectProvider()` — return the native provider unconditionally; remove the `templatehub`/`remote` branch and the graceful-fallback path |
| 3 | `lib/templates/provider-select.test.ts` | Update: the test currently pins remote-selection behaviour that no longer exists |
| 4 | `lib/templates/schema.ts` | Remove `TemplateProvider` fields that only the remote path used |
| 5 | `.env.example` | Confirm no `NEXT_PUBLIC_TEMPLATE_PROVIDER`, `TEMPLATE_HUB_API_URL`, `TEMPLATE_HUB_API_KEY` |
| 6 | `CLAUDE.md` (both) | Remove the "Remote TemplateHub serving" item from Plans |

**Verify with:** `npx tsc --noEmit` · `npx vitest run` (expect ~127 files) · `npm run build`.
**The test that proves it:** the template picker still renders and selects in the editor with
**no** `TEMPLATE_HUB_*` variables set — open the editor and pick a template.

**Do not `git add -A`** — another agent's work is uncommitted in that tree.

### From the owner

1. **Pick the D3 option** — that's the only thing blocking the doc from being final.
2. **Repurpose `templatehub.pro`** if it's retire: point the DNS wherever the next idea lands.
   The domain is registered and currently resolving to Vercel, so it's a DNS change, not a purchase.
3. **Say whether Claude is still live in the Sumaiya repo** — the code changes above are
   one sitting's work, but not while another agent is typing in that tree.

---

## WHAT IS *NOT* NEEDED

- **No new infrastructure.** Independence removes a dependency; it adds nothing.
- **No data migration.** Sumaiya's templates were always local.
- **No Neon, no second database.** One Supabase project carries database and auth.
- **No changes to TemplateHub's code** to make this work. Sumaiya simply stops calling it.
