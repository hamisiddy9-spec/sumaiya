# Task: mobile usage visibility + user-initiated problem reports

Repo: `C:\Users\hamis\projects\sumaiya`, branch `main`, HEAD `7adfbc7`. Work ONLY in this repo.
Two apps matter: `apps/native` (Expo/RN 0.86, **jest**) and `apps/web` (Next.js, **vitest**).

## Why (measured today, not assumed)

`app_event` in Supabase holds 77 events from 5 phones over two days:

```
app.open 31 (5 phones) · onboarding.slide 8 · firstrun.step 8 · app.error 8 (2 phones!)
auth.signin 6 (4 phones) · update.available/start/downloaded/minimize · onboarding.done 3
phones by version: 1.6.26 =>3, 1.6.25 =>3, 1.6.24 =>2, 1.6.23 =>1
```

So telemetry works. Two things do not, and they are the job:

1. **The activation funnel never reaches the server.** All seven of `signed_up, onboarded,
   profile_completed, cv_created, cv_exported, application_created, template_selected` read
   NEVER ARRIVED, because `setAnalyticsSink()` is **defined in
   `apps/native/src/lib/analytics.ts` and never called** — its `track()` only `console.info`s.
2. **Nothing renders `app_event`.** `/admin/insights` reads a different table (`outcomeEvent`).
   An owner asking "how do I see mobile users?" has to run SQL by hand.

And there is no way for a user to report a problem with evidence.

## 1. Wire the funnel sink (native, ~5 lines)

In `apps/native/src/app/_layout.tsx`, next to the existing `startTelemetry()` / `track("app.open")`
/ `setReporter(...)` block (around lines 70-90), register the analytics sink so
`analytics.track()` routes into the **telemetry** queue, not the console.

**Careful, this is the trap:** two different modules export a function named `track` —
`lib/analytics.ts` (console-only, the funnel API) and `lib/telemetry.ts` (the real batched
pipe that posts to `/api/app/telemetry`). Import them under distinct names and be explicit
about which is which. The sink must be registered **once** (guard like `startTelemetry`'s
`started` flag, or registration is idempotent — say which you chose and why).

Result: the funnel lands in `app_event` beside everything else, with the batching, PII
stripping, cost cap and server-side opt-out that pipe already has.

## 2. A recent-log ring buffer (native)

New `apps/native/src/lib/log-buffer.ts`: keep the **last 40** entries in memory — each
`{ at, kind, name, detail }`. Feed it from the same seams that already exist
(`setReporter`'s errors and the telemetry sink). Cap it, never throw, never touch storage.
It exists so a problem report can carry context instead of a screenshot alone.

## 3. User-initiated problem report (native) — CONSENT FIRST

A "Report a problem" action, reachable from **the error boundary**
(`components/error-boundary.tsx`, which already says *"Nimekutana na tatizo kwenye skrini
hii"*) **and** from Profile/Settings.

Flow, and do not short-circuit it:

1. The user taps Report.
2. Capture: a **downscaled** screenshot of the current screen (see §4), the last 40 log
   entries, app version, platform, device model, and their optional written note.
3. **Show a consent sheet listing EXACTLY what will be sent** — "a picture of this screen",
   "the last 40 app messages", "your app version and phone model", and the note. It must
   state plainly that **CV contents, names, emails and phone numbers are never included**.
   The user can uncheck the screenshot, and can cancel. Nothing uploads before they confirm.
4. Only on confirm, POST it.
5. Confirm back to the user in her voice, and that they can carry on.

Voice rules for every string you write (house copy, non-negotiable):
- **First person, because the app IS Sumaiya.** "Sikuweza…" / "Nimekutana na tatizo…" —
  never "Imeshindwa…" (that is the `i-` machine register the owner has corrected by hand).
- Bilingual EN/SW in one `{en, sw}` pair. Every string in both. No "link" — use *kiungo*.
- Both apps have a `swahili-lint.test.ts` guard. Run it; if it fires, fix the copy, never the guard.

## 4. The screenshot, without inventing infra

`react-native-view-shot` is NOT installed. **Use `expo install react-native-view-shot`** so
the version is aligned to SDK 57, and capture the app's root view. Downscale to **width 720,
JPEG quality 0.6** — a report is evidence, not a wallpaper; it must be cheap on Tanzanian
mobile data. If you judge a different library to be lower-risk on this bare workflow, say so
in your report and explain the trade-off rather than silently substituting.

## 5. The endpoint + the table (web)

- New table `app_report` in `apps/web/lib/db/schema.ts`, alongside `appEvent`:
  `id`, `installId`, `userHash` (salted, nullable — **never a raw user id**), `kind`
  ('crash'|'problem'|'idea'), `note`, `screenshot` (text, base64 JPEG, nullable),
  `logs` (jsonb), `appVersion`, `platform`, `device`, `createdAt`.
  Write the migration SQL under `apps/web/drizzle/migrations/` in the same style as the
  existing ones. **Do not run it against production** — say so in your report and leave it.
- New Hono route `POST /api/app/report` in `apps/web/lib/api/routes/`, mounted in
  `app/api/[[...route]]/route.ts`. Requirements:
  - Accepts the payload above; **auth optional** (a guest must be able to report).
  - **Rate-limit hard** — reuse whatever limiter the repo already has (grep for it). A
    screenshot is expensive; an unauthenticated endpoint taking base64 images is a target.
  - **Size cap** (reject >2MB decoded) and **validate the base64 actually decodes to JPEG**
    — do not store whatever arrives.
  - Strip/reject any PII-shaped keys it is handed, the same way `/api/app/telemetry` does.
  - Never 500 the client: a failure returns a plain message the app can show.

**Why a table and not Supabase Storage:** at this volume a bucket plus policies is more
moving parts and more to go wrong, and the service key would become a write path for
anonymous uploads. Postgres TOASTs the blob fine. Leave that trade-off written in a comment
where the upgrade would happen.

## 6. The screen the owner actually asked for — `/admin/app` (web)

A read-only server component, following `app/(app)/admin/users/page.tsx`'s pattern
(`isAdmin` guard, drizzle `db.select`). Above the fold:

- **Phones by app version** (which build is really out there)
- **Active installs over 7 and 30 days** (distinct `installId`)
- **Top events**, last 7 days, with phone counts
- **Error count** and the most common error messages
- **The activation funnel as a conversion chain**: how many installs reached each of the
  seven stages, and the drop between them — this is the number the whole sharing plan runs on
- **Recent problem reports**, newest first, each showing the note, version/device, the
  screenshot (rendered from base64), and the log lines — collapsible.

Empty states must be honest sentences, not zeros pretending to be data. If `app_event` is
empty, say no phone has reported yet.

## Hard constraints

- **Do NOT run `vercel deploy` and do NOT `git push`.** Commit locally only, named paths only,
  after the gates pass. Never `git add -A`.
- Do NOT run the migration against production.
- Do NOT change `/api/app/telemetry`'s existing contract or the `app_event` table.
- Do NOT send, log, or store CV content, names, emails, or phone numbers anywhere.
- No new dependency beyond the view-shot library, and justify that one.

## Verification — run these and report the exact output

```bash
cd apps/native && npx tsc --noEmit && npx jest
cd apps/web    && npx tsc --noEmit && npx vitest run
```

**A green suite is not a green tree** — run both, every time, and capture exit codes WITHOUT a
pipe (`npx tsc --noEmit > log 2>&1; echo $?`) because `cmd | head; echo $?` reports `head`'s
status. A file no test imports can be syntactically broken while jest stays green; that has
happened in this repo twice. If a gate fails and you cannot fix it, say which and quote the error.

## Report back, in this order

1. What you built, file by file, with line counts, and the exact `expo install` command used.
2. Every verification command and its REAL output, or the honest failure.
3. The commit SHA, and the exact migration filename left unapplied.
4. Anything you could not do and why. "I did not verify X" is expected and acceptable.
