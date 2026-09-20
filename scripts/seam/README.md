# THE SEAM TEST

One command that walks the whole product journey and asserts against **server
state** — rows in Postgres, HTTP statuses, the bytes of a real file, a real token
response — never against what the screen shows.

```bash
npm run seam                    # the whole journey (starts its own dev server on :3010)
npm run seam -- --skip-evals    # everything except the anti-fabrication pack
npm run seam -- --http-only     # no browser: endpoints, database, deploy only
npm run seam -- --cleanup       # delete the test account this run created
npm run seam -- --app-url=http://localhost:3000   # use a server you already have up
```

Exit code is **0 only when the whole journey was exercised and every assertion
held**. Any FAIL *and* any BLOCKED keeps it non-zero: "we could not check" is not
"it works".

## Why it exists

Three bugs shipped in one day and every one lived at a **seam between
components**, while each component passed its own tests in isolation:

```
app sends 8 digits       vs  server sends 6                     ← seam
web signs in via Supabase vs  Android signs in via Google        ← seam
config says X            vs  the deployed environment holds Y    ← seam
tests pass               vs  the product does not work           ← seam
```

The pieces were tested. **The journey never was.** Every step in `run.mjs` reads
its assertion from the server, and the report labels each claim with where it
came from: `[server-state]`, `[real-bytes]`, `[source-read]`, `[screen-only]`.

## Antiseam discipline (encoded in the code, printed in every run)

**TWO SURFACES EXIST:**

1. **web** — desktop AND mobile web; one bundle, two layouts
2. **the Android app** — a separate codebase, its own API host, its own build

**One passing proves NOTHING about the other.** A green web run is not evidence
about the APK, and this script never claims it is: the summary prints which
surfaces the run exercised and which it did not, and the Android surface is
always listed as NOT EXERCISED (no device, no emulator is driven here).

## What it walks

| Step | Assertion comes from |
|---|---|
| Preflight: credentials, project ref, DB reachable | env presence, `select 1` |
| Bring up the app under test | `/api/health` → `{ok:true,db:connected}` |
| Guest opens the editor, types, uploads a photo, downloads the PDF | HTTP status, browser storage the editor itself wrote |
| **The PDF** | real bytes: size, page count, page size, `%PDF-` header, and the extracted text layer containing the name that was typed |
| The guest-orphan question | a `LIKE` over `cv.data` + a `cv` count for the run window |
| What the **public anon key** can read | PostgREST with the anon key: CV rows, job internal columns |
| A real session | admin-created account, `POST /auth/v1/token`, `GET /auth/v1/user`, then 401-vs-200 on `/api/cv` |
| **The guest→account seam** | the product's OWN `/migrate-guest` page, driven in the browser; then the row, its `fullName`, its photo length, and its `jsonb` shape in Postgres; then a PDF re-exported from the signed-in editor |
| Email sign-in | auth settings, the OTP request status, and the digit rules read from **both** surfaces' source |
| Google sign-in | the dead Supabase OAuth route, the live ID-token route, and a comment-stripped source comparison of web vs native |
| The deploy seam | every JS chunk `/sign-in` references, counted for **our own** markers, plus a live click of the real Google button |
| The job feed | the DB's own counts vs `GET /api/jobs`, with the route's 100-row page cap applied |
| The anti-fabrication harness | `npm run evals`, run for real, with its exit code |

## Rules this file follows (and the failures that taught them)

- **A marker must come from OUR code.** `signInWithOAuth` and
  `signInWithIdToken` are supabase-js's own method names, so every bundle that
  includes the library contains them whether or not the app calls them. The
  deployed-bundle check uses `apps/web/lib/google-identity.ts`'s loader URL and
  its `google-identity-services` script id instead, and prints the reason on
  every run so nobody reintroduces the library symbols.
- **Unwrap nothing silently.** Rows written through the app's own API are stored
  as a JSON *string inside* jsonb, so `data->'personal'->>'fullName'` is NULL on a
  row that holds the data. Assertions read the raw column and normalise in JS —
  and the shape itself is asserted separately, because a test that silently
  unwraps the product's bug is not a test.
- **Wait before calling it broken.** A control checked immediately after a
  navigation reported "missing" on a page that had not hydrated yet. A false
  failure is as damaging as a false pass.
- **A driver error is not a product finding.** Playwright rejected a cookie
  object carrying both `url` and `path`; the message said exactly that. Read the
  error instead of blaming the app.
- **Counts only, never values.** Secrets are read from
  `C:/Users/hamis/projects/_hdd-data/env/` at runtime, used in memory, and
  reported as presence or as an occurrence count. The service_role key is counted
  in the deployed bundles (must be 0) and never printed.

## Layout

```
scripts/seam/
  run.mjs              the command: steps, assertions, summary, exit code
  lib/env.mjs          secret loading, redaction, project-ref facts
  lib/report.mjs       PASS / FAIL / BLOCKED / UNVERIFIED + evidence classes
  lib/http.mjs         status-and-body probes (a 400 is data, not an exception)
  lib/db.mjs           Postgres reads; jsonb normalisation + shape
  lib/auth.mjs         real account, real token, real @supabase/ssr cookies
  lib/pdf.mjs          what the downloaded file actually IS
  lib/app-server.mjs   start (or reuse) the app under test, wait for health
  lib/browser.mjs      the guest journey, the session injection, the live probes
  lib/deploy.mjs       deployed-bundle scan with OUR markers + secret boundary
```

## Test data

The run creates one account (`seam-<id>@sumaiya-seam.invalid`) in the live
database, plus the CV row the journey produces, and leaves them as evidence.
`--cleanup` removes the account (and its rows, by cascade) at the end.
