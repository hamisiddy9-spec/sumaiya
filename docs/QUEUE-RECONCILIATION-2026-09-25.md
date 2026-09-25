# Queue reconciliation — 2026-09-25

`docs/CLAUDE-QUEUE-2026-09-20.md` is the standing work list. Measuring it item by item
today found **four of its highest-severity entries are already done** — and one of them
(the share feature) was the item the owner had personally approved and was sitting unbuilt
while the queue pointed elsewhere. A stale P0 is not a neutral error: it costs a session to
rediscover, and it hides the real P0s.

This file records what was measured, how, and what is genuinely still open. Nothing is
marked done here on the strength of a code comment — each entry says what was run.

## Verified done (measured today, with the method)

### §7 — "the database is readable AND writable with the public key" — **FIXED**

Measured with live probes against Sumaiya production using the anon key that ships in the app:

| probe | result |
|---|---|
| `GET /rest/v1/cv` as anon | `401` `42501` insufficient privilege |
| `POST /rest/v1/…` as anon | `401` `42501` — and no row was created |
| `relrowsecurity` on all 33 public tables | `true` for every one |
| policies present | `<table>_owner_select/_insert/_update/_delete` for `{authenticated}` |

The claim in the queue described a state that no longer exists. It was fixed by an earlier
migration; the guard that keeps it fixed (`scripts/assert-rls.mjs`, plus
`.github/workflows/rls-guard.yml`) already existed too — my own notes claiming it was "not
wired to CI" were wrong.

**The real residual risk is different and worth stating:** the default ACL for the `public`
schema grants `anon` `arwdDxtm` on tables created by `postgres`, so *the next table someone
creates is born world-writable with RLS off*. `assert-rls.mjs` catches exactly that — which
means the guard is load-bearing. GitHub Actions is currently dead (account billing), so the
guard cannot run there; it is now also exposed as `npm run assert:rls` so it can be run
deliberately, and CI should be restored.

### §10 — "OTP is 8 digits on phone / 6 on web" — **FIXED**

`apps/web/lib/otp-length-parity.test.ts` — **5 tests, all passing**. It asserts the web
accepts an 8-digit code and rejects the 6 it used to stop at. The native input uses
`maxLength={EMAIL_OTP_DIGITS}`, a shared constant, so the parity is structural rather than
two numbers that happen to agree today.

### §11 — job feed — **FIXED**

`GET https://sumaiya.app/api/jobs?limit=3` → `200` with real listings (HV Electrician ·
Barrick). The database holds **1,874 jobs**, freshest ingested the same morning.

### §0 — "Nitumie Sumaiya" (share the APK without data) — **BUILT TODAY**

Approved by the owner on 20 September ("weka option ya share without data"), never built,
and the highest-value item on the list: 16 installs and **not one provably organic user**
is a distribution problem, and the APK had no way to travel. Committed `551583d` (local, for
review — no APK released). Reads the app's own installed APK via an Expo native module,
shares it as `application/vnd.android.package-archive` with the referral code in the
filename, and removes an unused ~4.9 MB (ML Kit's barcode scanner) so the shared file is
cheaper to send.

## Evidence says done, not yet confirmed on a device

### §8 — "the exported PDF has no text layer" — **looks already correct**

The CV PDF is produced from HTML through `expo-print` (`apps/native/src/lib/cv-html.ts`
states it is built to work in expo-print and react-native-webview), which prints real text.
Supporting evidence: `/api/tools/extract-text` (unpdf) exists for reading PDFs back, and the
app's own guidance tells the user to export "a text-based PDF (not a photo of a printout)".

This is a strong structural argument, **not a measurement of an exported file**. It should be
confirmed by exporting a CV on the device and running the PDF through text extraction — one
command, and worth doing before anyone spends a session rewriting the export path.

## Genuinely still open

- **§12 guest mode and autosave** — guest mode works (verified on device: a signed-out guest
  sees the job feed and a real listing). **Autosave was not checked.** Split the item: guest
  is done, autosave is unknown.
- **The rest of the queue (0.5 onwards)** — not measured in this pass. 0.5 (the seam test),
  0.6/0.6.1 (Google OAuth), 0.7 (mobile web), 0.8 (profile photo with camera), 1 (the Swahili
  programme) and the remaining sections still need the same treatment.

## The lesson worth keeping

Four stale P0s in one file. They were stale for the same reason: **an item is written when the
problem is seen, and nothing updates it when the problem is fixed.** A queue that is only ever
appended to becomes a list of things people are afraid to re-check.

Cheapest structural fix, and what this file is: after acting on an item, write the measurement
that closed it into the queue itself. "Fixed in commit X, verified by running Y and seeing Z"
takes one minute and saves a session.
