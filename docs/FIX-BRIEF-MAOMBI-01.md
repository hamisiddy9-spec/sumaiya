# Fix brief: make maombi real — a birth path, an honest wall, and the event that never fires

Repo: `C:\Users\hamis\projects\sumaiya` · branch `release/1.6.25`. HANDS. Do NOT bump the version, do not
switch branches, do not upgrade a dependency. THREE items. Background and every file:line:
`docs/MAOMBI-RESEARCH-2026-09-23.md` (read it first).

The phone has a complete applications feature that has **never had a single row** (`application` is 0 in the
live DB, and zero of the 149 recorded app_events concern jobs or applications). Two reasons, and these are the
items.

---

## ITEM 1 — there is no way to start one from anywhere the user already is

`src/screens/app/jobs-screen.tsx` and `src/screens/app/job-detail-screen.tsx` import **nothing** from the
applications domain. The feed hands a sliced `jd` string to `JobApply` and the outward link opens the
employer's site; nothing is ever recorded. The only way to create an Application today is to tap a small `+`
on the Applications list and **type the company and role by hand**
(`applications-store.ts:111-141` is the creator; the manual form is `application-detail-screen.tsx`).

**Do:**
- `jobs-screen.tsx:75-85` (JobCard): add a third action, **"Hifadhi kazi hii" / "Save this job"**, beside
  Tailor / Open the advert. It calls `createApplication` with the job already in memory
  (company, role, location, description, url) and status `"saved"`. No network, no account.
- `job-detail-screen.tsx:48-61` (footer): add **"Kuanza ombi" / "Start an application"** that passes the
  **whole job object**, not the sliced `jd` string it passes today.
- `job-apply-screen.tsx:142-227` (the tailor RESULT view): add **"Kuweka hii kama ombi" / "Keep this as an
  application"**, using the JD it was given and the `cvId` it used. Today that screen produces a retuned CV
  summary/experience and a grounded cover letter and then offers only "Tailor to another job" — the strongest
  moment in the app discards its own work, and the tailored CV is written over the master CV with no record of
  which advert it was for. Name that in the commit message.

Do not restructure the feed or add fields to the job model. If a needed field is genuinely absent, say so in
your report instead of inventing it.

## ITEM 2 — the account wall is on the wrong room, and its copy is false

The applications feature is **device-only** — `applications-store.ts:2-9` says verbatim *"Fully local — no
/api/mobile/* endpoint needed"* — yet it is the most heavily gated surface in the app:

- `src/navigation/stacks/app-tabs.tsx:79-80` wraps both routes in `withAccountGate(..., "applications")`;
  `src/lib/guest-mode.test.ts:71-72` pins that gate (that test encodes an old decision — update it, do not
  work around it),
- `src/screens/app/home-screen.tsx:285-292` **removes the Applications tile for guests entirely**, with a
  comment claiming jobs/applications/cover letters *"are all written on the server against an account"*,
- `src/lib/guest-invite.ts:138-147` tells the guest *"The applications you send, their status and the letters
  you write all live in your account"* — which is false today.

The product's non-negotiable is that **a guest can finish real work before being asked for an account**. The
wall belongs on **syncing**, not on reading or writing local rows.

**Do:** remove the gate from those two routes, stop hiding the tile from guests, and rewrite
`guest-invite.ts:138-147` to say what is true now — the work is on the phone and stays there; an account is
how it gets kept, followed up and remembered by Sumaiya. Do **not** add sync in this brief (that is a later
item) and do not promise anything the app cannot yet do: the new copy must be true the moment it ships.

## ITEM 3 — fire the event that is already declared and has never fired

`src/lib/analytics.ts:30` already declares `applicationCreated = "application_created"`, and the web admin
aggregator already knows that name (`apps/web/lib/app-admin/aggregate.ts:12`) — **no call site has ever fired
it**, and there is not one `track()` call anywhere on the applications path.

**Do:** fire `application.created` and `application_created` at the three new call sites from Item 1 plus the
existing pasted-advert door, through the existing pipe (`src/lib/telemetry.ts`). Props only:
`via=feed|advert|tailor|pasted`, `has_jd`, `has_cv`, `guest`. Counters, booleans and enums only — never
content, names or phone numbers. Read the rules at the top of `src/lib/telemetry.ts` and follow them.

---

## Copy rules (enforced by tests — do not exempt yourself)

Every new user-facing string needs an **English and a Swahili twin**. The house voice names the **user's own
object in the second person** (`CV yako`, not the first-person possessive) — `lib/swahili-lint.test.ts` fails
otherwise, and it reads comments too. Approved Swahili: `nafasi za kazi`, `vigezo`, `muundo`, `herufi`,
`ujazo`; `ujanja` is banned; no "ATS" in Swahili.

## Gates and report

`cd apps/native && npx tsc --noEmit && npx jest && node scripts/test-release-invariants.js` — all three, and
quote the counts. Commit NAMED PATHS ONLY (this clone is shared). Report: files changed, commands, pass/fail
counts, the commit sha, and explicitly what you could NOT establish.

BOUNDARIES: no push, no APK build, no deploy, no migration, no dependency upgrade, do not touch other
projects, never read or print `.env` or a secret. Do NOT do the letter-as-a-document work, sync, the status
map, or the follow-up strip — those are later briefs and would make this one die unfinished.
