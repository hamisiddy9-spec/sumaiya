# Maombi / applications — research findings and build order
*2026-09-23. Evidence-backed audit of the applications domain (phone + web), prompted by the owner's
questions: "cover letter, jobs posted etc why its only cv" and "applications au maombi research hizo".*
Raw subagent output (every file:line): `docs/maombi-research-2026-09-23.json`.

---

## THE HEADLINE: the account wall is on the wrong room, and its copy is false

The phone has a complete-looking maombi feature — and it is the **one surface in the app that needs no
account at all**, gated the hardest, and hidden from guests entirely:

| Where | What it says |
|---|---|
| `applications-store.ts:2-9` | *"Fully local — no /api/mobile/* endpoint needed. Syncs to the server later when that lands."* |
| `home-screen.tsx:285-292` | removes the Applications tile for guests, commented that jobs/applications/cover letters *"are all written on the server against an account"* |
| `guest-invite.ts:138-147` | tells the guest *"The applications you send, their status and the letters you write all live in your account"* |
| `app-tabs.tsx:79-80` + `guest-mode.test.ts:71-72` | both routes wrapped `withAccountGate(..., "applications")` |

So the app locks a device-only feature behind an account and **tells the user a false reason for it.** This
contradicts the product's own non-negotiable (a guest finishes real work before being asked for an account)
in the precise place that rule was written for. The wall belongs on **syncing**, not on reading/writing.

## Why nobody has ever created one (measured: `application` 0 rows, 0 relevant events in 149)

1. **No birth path.** `jobs-screen.tsx` / `job-detail-screen.tsx` import nothing from the applications
   domain; the feed hands a sliced `jd` string to `JobApply` and the outward link opens the employer's site
   without recording anything. The only way to create an Application is to tap a small `+` and **type the
   company and role by hand**. The web has the feeder the phone lacks (`jobs-feed.tsx:120-137` →
   `POST /api/applications/from-cv`).
2. **The best moment in the app throws its work away.** `job-apply-screen.tsx` generates a retuned CV
   summary/experience **and a grounded cover letter**, then offers only "Tailor to another job". It never
   writes an Application — so *the tailored CV is applied over the master CV with no record of which advert
   it was for*, and the letter survives only as a file in WhatsApp.
3. **The letter isn't a document.** One `coverLetter` TEXT column (`applications-store.ts:33,60`) — a second
   advert's letter overwrites the first; no library, no reuse. The only in-app drafting path needs network
   **and** an account (`/api/mobile/chat` → 401), breaking offline-first exactly at the letter.
4. **Signing in buys nothing.** No owner column (unlike CVs, `local-owner.ts:41-44`), no server id, no sync
   queue op, no endpoint. So the assistant always sees **0** applications (`context.ts:155,350-360`), the
   `application.followUp` signal can never fire (`signals.ts:196-205`), the dashboard/brief stay empty, and
   `outcome_event` never receives `application.created`.
5. **Nothing is measurable.** Zero `track()` calls on the entire path. The funnel name
   `applicationCreated = "application_created"` is **already declared** (`analytics.ts:30`) and already
   whitelisted by the admin aggregator (`app-admin/aggregate.ts:12`) — **and no call site has ever fired it.**
6. **Two incompatible status vocabularies:** native `saved|applied|interview|offer|closed` vs web
   `draft|applied|interviewing|offer|rejected|archived`. Plus dead web routes targeting a non-existent
   `applications` table (plural) — `app/api/applications/list/route.ts`, `app/api/jobs/[id]/apply/route.ts`.
7. **No schema versioning** on the local table (`applications-store.ts:51-69`, no `PRAGMA user_version`), so
   a future column change can silently drop a user's whole maombi history.

## THE LOOP TO BUILD (phone first, network never required)

**One advert → one kit (tailored CV + letter) → one status the user owns.** A signed-out person can save an
advert from the feed, paste one, tailor the CV, write and export the letter, and move it through all five
statuses — exactly as they can build and download a CV today. The account is asked for only when a server row
becomes genuinely necessary: *"keep this on your account", "follow it up", "let Sumaiya remember it"* — the
same shape the CV path already proves works (`local-owner.ts:124-157`).

## BUILD ORDER

1. **Birth from the feed and from the tailor result.** `jobs-screen.tsx:75-85` JobCard gets "Save this job";
   `job-detail-screen.tsx:48-61` gets "Start an application" carrying the **whole job object** (not the sliced
   `jd`); `job-apply-screen.tsx:142-227` gets "Keep this as an application". Uses the job already in memory +
   `createApplication` (`applications-store.ts:111-141`). *Unblocks: the loop existing at all.*
2. **Instrument steps 1-3 first, before polish** — via the existing telemetry pipe (`lib/telemetry.ts` →
   `/api/app/telemetry`, anonymous, batched, opt-out-safe). *Unblocks: knowing whether the next fix is the
   wall or the feeder.*
3. **Move the wall to sync and make the copy honest.** Remove `withAccountGate` from both routes
   (`app-tabs.tsx:79-80`), stop hiding the tile (`home-screen.tsx:285-292`), rewrite `guest-invite.ts:138-147`
   to say what is true today. **Can ship before sync exists** — the feature is already local-only, so
   ungating it is honest immediately.
4. **The letter as a document.** Split `coverLetter` into a local letters table mirroring web's
   `cover_letter` (`schema.ts:75-81`); export through the path that already exists (`letterToHtml + Print +
   renamePdf + reportExport`); store the model's draft instead of leaving it in a textarea. Add
   `PRAGMA user_version`.
5. **The offline follow-up.** Port `needsFollowUp` / `FOLLOW_UP_DAYS = 7` (`apps/web/lib/applications.ts:9,29`)
   into the list as a "how it's going" strip. *No server, no account — the difference between a form and a loop.*
6. **Owner column, sync queue, status map.** Owner column matching `local-owner.ts:41-44`; `create_application`
   / `update_application` queue ops; send the local `app-…` id as `clientId`; extend `claimGuestWork`;
   one 5→6 status map. *Unblocks the assistant context, the follow-up signal, the dashboards, outcome events,
   and cross-device continuity.*
7. **Server side that makes 6 real.** Extend the already-mounted Hono `/api/applications` route
   (`routes/applications.ts`) with a clientId upsert + the phone's statuses via the map.
8. **Clean up and deepen.** Delete/repoint the dead routes; add `jobId` so the signal engine stops
   fuzzy-matching title+company (`signals.ts:98`); let the letter carry a template like a CV does.

## EVENTS TO FIRE (names + where)

`application.created` (via=feed|pasted|tailor, has_jd, has_cv, guest) · **`application_created`** (the
already-declared funnel name, same 4 sites) · `application.status` (from, to, via — *only* on a real change;
today the update is unconditional at `application-detail-screen.tsx:72`) · `application.applied`
(hours_since_created, had_letter, had_tailored_cv, guest) · `application.letter.drafted` (source, chars,
offline, guest) · `application.letter.draft_failed` (reason=offline|auth|quota|error — *this is the event that
proves or kills the "the wall is the cause" theory*) · `application.letter.exported` (has a server-side twin in
`download_log`, so it can be verified from both ends) · `application.deleted` (age_days, status) ·
`applications.list.view` (count, isEmpty, guest — the true top of funnel) · `applications.empty.cta`
(action=find_jobs|add_job) · `job.detail.saved` · `job.detail.apply_opened` (*decides whether the app is a
preparation tool or an application tool*) · `application.reminder.shown/tapped` · `application.claim.done` ·
`application.sync.failed` (via existing `reportError({ scope: "applications.sync" })`).
Rules already enforced elsewhere: fire from the screen that owns the action; props are counters/booleans/enums
only, never content. Read props back with `props->>'via'` (the table casts jsonb explicitly for that reason).

## THE OWNER'S ORIGINAL QUESTION, ANSWERED

*"Why is it only CV?"* — It isn't by design. The web has **four** document editors (CV, cover letter, letter,
business card) and only the CV has ever been used (`cv` 8 rows; `cover_letter` `letter` `business_card` all 0).
Cover letters exist on the phone as a *field* on an application, not as a document. Applications exist
*fully*, but device-only, gated, unfed, unsynced and unmeasured — so the product currently reads as a CV
generator with job-shaped decoration. The unit that makes the CV worth having — the application — has never
had a single row.
