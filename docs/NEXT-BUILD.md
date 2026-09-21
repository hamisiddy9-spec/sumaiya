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

1. **The application letter (barua ya maombi ya kazi).** Every Tanzanian advert mandates a *signed*
   letter alongside the CV; both direct competitors already ship one; our `cover_letter` table holds
   **zero rows**, ever. This is the MVP gap — see `docs/MVP-2026-09-21.md`.
2. **The templates legibility pass.** `components/templates/engine/typography.ts` is written,
   correct, and **imported by nothing**. 707 literals across 47 templates sit below its floor, and
   `rift` compresses 7 of its 8 sizes into a 9.5–12.5px band. A per-template design pass — raising a
   floor on an already-full page can re-overflow the three templates that already overflow.
   **Decision needed: wire it in, or delete the orphan.**
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
