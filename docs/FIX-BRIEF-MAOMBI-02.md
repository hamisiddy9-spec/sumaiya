# Fix brief: maombi can't produce its first row — two reach fixes

Repo: `C:\Users\hamis\projects\sumaiya` · branch `release/1.6.25`. HANDS. TWO items. Do NOT bump the
version, do not switch branches, do not upgrade a dependency. Background: `docs/MAOMBI-RESEARCH-2026-09-23.md`.

Both items were found by running the shipped 1.6.28 on a real Pixel, not by reading code.

---

## ITEM 1 — the manual form creates an application and records nothing

`application.created` and `FUNNEL_EVENTS.applicationCreated` are fired from exactly two places:
`src/screens/jobs-screen.tsx:191-192` (the feed's save action) and `src/screens/job-apply-screen.tsx:134-135`
(the tailor result). `src/screens/application-detail-screen.tsx` — the form every manual application goes
through — has **no `track()` call at all**. So the one birth path a signed-out user can actually reach is the
one that is invisible; `app_event` will never show it and the funnel stays unmeasurable.

**Do:** fire both names (the dot-name and the declared funnel name) wherever that screen first writes an
Application, and again on a **status change** — use these event names and props:
- `application.created` — props `{ via: "manual", has_jd: Boolean(jobDescription), has_cv: Boolean(cvId), guest: Boolean }`
- `application.status` — only when the status actually changes (the save at `:72` is currently unconditional),
  props `{ from, to }`
Props are counters, booleans and enums only — never content, names or phone numbers. Follow the rules at the
top of `src/lib/telemetry.ts`, and the existing call in `jobs-screen.tsx` is the pattern to copy.

## ITEM 2 — a guest can open maombi but cannot reach anything that creates one

`src/navigation/stacks/app-tabs.tsx:78-80` still wraps three screens in `withAccountGate(..., "jobs")`:
`JobsScreen`, `JobDetailScreen` and `JobApplyScreen`. So for a signed-out user:

- the new "Hifadhi kazi hii / Save this job" button (on the *gated* feed) is unreachable,
- "Kuanza ombi / Start an application" (on the *gated* advert page) is unreachable,
- and the Applications empty state's own door, "Tafuta ajira za kuomba", leads **into a gate** — a wall
  inside the room we just opened.

That means two of the three birth paths added in `7ed2d53` cannot be used by the product's declared majority.

**Do:**
- Remove the gate from `JobsScreen` and `JobDetailScreen`. Browsing the feed and opening an advert need no
  account: the listings are public data and the fit score is computed **on the device** from the shared rules
  (`src/lib/ats.ts`), not on the server — check that claim yourself before you rely on it, and say in your
  report whether it held.
- **Keep** the gate on `JobApplyScreen`. That screen calls `/api/mobile/apply`, which is the server/AI part
  and genuinely does need a session. Do not un-gate it.
- `src/lib/guest-mode.test.ts` pins the old decisions by route name — update it to the new truth, and keep a
  test that asserts `JobApply` is still gated (so the boundary is pinned in both directions).
- `src/lib/guest-invite.ts` lists `jobs` among the surfaces that need an account. Correct that string so it
  matches the new reality (browsing and saving are free; tailoring is the account part). Both languages — the
  house voice names the user's own object in the second person, and `lib/swahili-lint.test.ts` in the web app
  enforces that for web strings.

If, after reading, you judge that un-gating the feed is wrong (for example the feed really does need a
session to load), **stop and say so with the evidence** rather than shipping a screen that 401s. That
outcome is acceptable; a silent dead end is not.

---

## Gates and report

`cd apps/native && npx tsc --noEmit && npx jest && node scripts/test-release-invariants.js` — quote the
counts. Commit NAMED PATHS ONLY (this clone is shared; never `git add -A`). Report: files changed, the exact
commands with pass/fail counts, the commit sha, whether the fit score really is device-side, and what you
could NOT establish (you cannot see a phone — say so rather than implying you checked the screens).

BOUNDARIES: no push, no APK build, no deploy, no migration, no dependency upgrade, do not touch other
projects, never read or print `.env` or a secret. Do NOT touch: the render engine or fonts, the export/save
picker, the landing page, or the gallery — those are separate briefs.
