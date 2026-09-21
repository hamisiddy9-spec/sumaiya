# NEXT BUILD — the accumulator

**Owner's rule, 2026-09-21:** *"we never build anything unless it's mandatory for both versions to
work"* and *"lets not bothers users with updates everytime"*.

So: work accumulates here. Nothing gets built for a single nice-to-have, and users are not asked to
update every time something changes. A build happens when **something is broken on both surfaces**,
or when the accumulated payload is worth one user-visible update.

---

## HELD — written, committed, deliberately not built

### Observability + problem reports (`698d029`)
- **The activation funnel now reports.** `setAnalyticsSink()` was defined and never called, so
  `analytics.track()` only `console.info`'d — all seven funnel stages read NEVER ARRIVED against 77
  real events from 5 phones. Now registered at startup and routed into the telemetry pipe.
- **A user can report a problem with evidence** — screenshot, last 40 log entries, version, device —
  behind a consent sheet that lists exactly what is sent and states that CV contents, names, emails
  and phone numbers are never included.
- **`/admin/app`** — the screen that reads `app_event`: phones by version, active installs 7/30d,
  top events, errors, funnel conversion, recent reports with screenshot and logs.

**Why it's held:** nothing is broken without it. **Why it should ride the next build anyway:** it is
the only source of real user data, and the sharing push is meant to be gathering data. Today a
sharing campaign gathers less than it should.

**Before it can work, the migration must be applied:** `apps/web/drizzle/migrations/0023_app_report.sql`
has **not** been run (`GET /rest/v1/app_report` → 404). The endpoint will 500-free fail until it is.

---

## QUEUED — not started

1. **Un-wall the advert → letter flow.** *(Corrected — this is not "build the letter". The letter
   is built, one tap from home (`JobApply {want:"letter"}`), and the server can write it. The real
   defect is that `applications.ts` and `cover-letter.ts` are entirely `getUserId → 401`, and the
   home screen hides those tiles from guests on purpose.)* So a guest can finish a **CV** but not an
   **application** — which cuts against the standing rule that a guest finishes before being asked
   for an account. Evidence: CV editor open to guests → **7 rows**; letter/application account-walled
   → **0 and 0**. Cheapest fix: a **no-AI letter generated on the device** — the advert already
   states the position, addressee and reference — leaving AI polish as the premium upsell. See
   `docs/MVP-2026-09-21.md`.
2. **The templates legibility pass** — a free-model panel ruled on 2026-09-21 (see
   `docs/panels/`). `components/templates/engine/typography.ts` is written, correct, and **imported
   by nothing**; 707 literals across 47 templates sit below its floor and `rift` compresses 7 of its
   8 sizes into a 9.5–12.5px band.
   **Ruling: neither "all 47" nor "delete" — raise only what is below ~9px, and fix the three
   overflowers FIRST.** Both roles independently flagged the same constraint: *"raising type on pages
   at usedFraction 1.254 will worsen overflow"* (meridian, grid, mono-cv). So the order is
   (a) fix horizontal overflow on those three, (b) apply the floor as a raise-only clamp to the
   sub-9px literals — starting with the 16 templates measured at 7.5px — (c) re-measure usedFraction
   before/after and gallery-check at 0.48 scale on a cheap screen. `rift`'s density problem is
   separate and needs its own pass. This is a panel's opinion, not a measured finding.
3. **A screen to enter a friend's code.** `POST /api/referral/claim {code}` exists; nothing calls it.
   So a Bluetooth or WhatsApp *file* hand-off — how apps actually spread here — credits nobody, which
   is exactly what the sharing model depends on.
4. **arm64-only ABI split.** The APK is 53MB; a full download took **58 seconds** on a decent
   connection. Halving it is the single biggest win for Bluetooth and WhatsApp sharing.

---

## WATCHING

- **The in-app update prompt.** If it re-asks on every launch, that is itself the thing the owner
  just objected to. Check whether a dismissed/skipped version is remembered and never asked again.
- **DeepSeek balance.** Owner confirmed the AI works (2026-09-21). If a user reports the chat
  failing, this is the first thing to check — the routes are auth-guarded, so it cannot be tested
  without a session or the key.

---

## THE BUILD TRIGGER

Build when either is true:

- **Something is broken on both surfaces** (this is mandatory by definition), or
- **the payload would be visible and worth one update**, and the owner says so.

When a build does happen, it carries everything in HELD and anything finished in QUEUED — one build,
one update prompt, not four.


### Copy: the guest gate says its button six ways

`lib/guest-invite.ts` holds 8 gate bodies. Every one ends by inviting the user to `Fungua akaunti
bure` (open a free account) — and they finish that clause **six different ways**:

| line | closing clause | form |
|---|---|---|
| 125 | `...bure tuzungumze` | bare subjunctive |
| 135 | `...bure nami nianze kukulinganisha` | `nami` + subjunctive |
| 145 | `...bure ili kuyafuatilia` | explicit `ili` |
| 155 | `...bure ili kutuma moja` | explicit `ili` |
| 165 | `...bure upate chako` | bare subjunctive |
| 175 | `...bure` (no verb) | bare |
| 185 | `...bure ili kuusoma` | explicit `ili` |

Bare subjunctive for purpose is **correct, idiomatic Swahili** (`Njoo tule`) — so this is not a
grammar error. It is an **inconsistency across strings the same user reads minutes apart**, and one
of these should be chosen as the house form and applied everywhere. **Awaiting the owner's ruling;
not changed unilaterally.** A free-model panel flagged this as a "comma splice" by applying English
grammar, which is exactly why panel grammar rulings are relayed as candidates, never applied.

Separately flagged, and genuinely contested: line 145 `hali yake` (singular possessive) sits beside
`Maombi uliyotuma` and the plural verb `ziko`. A panel proposes `hali zake`. `hali` is a class 9/10
noun, so `yake` is also defensible — **a native speaker decides.**


### The A4 fit defect — one engine, not nine templates

Full write-up in `docs/TEMPLATE-FIT-FINDINGS-2026-09-21.md`. In short: the page is A4 on both
surfaces and correct (794x1123px = 210.1x297.1mm, `engine/fit.tsx` and the native
`cv-engine/fit.ts` agree). What is wrong is what happens at the A4 edge — `clampFitScale`
refuses to shrink below **0.92**, the page carries `overflow: hidden`, so content needing more
than 8% of shrink is **clipped and silently lost**. `mono-cv` loses 137px (~5 lines).

The warning that exists is marked `data-pdf-exclude`, so the exported PDF says nothing: **the
person who downloads the file is the only one who never sees it.**

A free-model panel (2/2, independently) ruled that silent clipping at export is a
**correctness bug, not a design limit**, and converged on the order: **A** (confirm at export —
non-negotiable) → **B** (second A4 page, the honest fix for `mono-cv`) → **D** (make the
existing spacing tiers work harder) → **C** (shrink below 0.92) last resort only, floor >= 0.88.

Also retracted here: the earlier reading that "42 of 47 templates overflow" from
`usedFraction`. That metric includes non-text boxes, so its floor is 1.000 by construction and
29 templates sharing exactly 1.12 is an artefact. The true counts are **7 spilling vertically**
and **3 overflowing horizontally**.
