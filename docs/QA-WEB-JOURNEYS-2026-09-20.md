# QA — Web signed-in journeys (account, profile, every creation mode)

**Date:** 2026-09-20 · **Surface:** the live web app at https://sumaiya.app (Vercel, `main` branch deploy)
**Method:** real Chrome (installed `chrome.exe`) driven with `playwright-core` from `C:\Users\hamis\qa-web` — typing, clicking, uploading real files, downloading real bytes, and reading rows back out of Postgres. Nothing below is inferred from source alone; every "verified" line has a command, a URL, a row or a byte count behind it.
**Not this surface:** the Android APK on the Pixel 8 Pro (a sibling agent owns the device), and the input/output format matrix (a sibling agent). Where I touch PDF/Word/txt export it is only as the tail of a creation journey.

---

## 1. Executive summary

| Severity | Count | Headline |
|---|---|---|
| Critical | 0 | — |
| High | 2 | AI is off product-wide and the snap-to-apply journey dead-ends; the dashboard tells free users "everything is unlocked" |
| Medium | 5 | Hydration failure on the authed shell; English error/explanations inside the Swahili UI; version history is inert; two-tab edits silently overwrite; a dead "Barua Rasmi Mpya" button |
| Low | 6 | new-account copy, guest `/voice` gate, keyword-fragment noise, export filename, offline status wording, API shape drift |

The core promise holds: **a signed-out visitor can build a CV and download a real PDF with no account, and the work is carried into the account after sign-in** (verified end to end, §5). The manual editor is solid — every section saves, survives a hard reload, and matches what the API returns. What is not usable today is everything sold as "AI".

---

## 2. Defects

### D1 — HIGH — Every AI feature is off; the snap-to-apply journey dead-ends with no tailored CV

**Steps**
1. Signed in, `GET /api/ai/status` → `{"configured":false,"provider":null}` (re-checked at the end of the run, still false).
2. Paste a real job advert into `/snap` and press **"Snap ombi langu"**.
3. Open `/assistant` and send a message.
4. Press **"Boresha na AI"** in a CV editor summary.

**Expected:** advertised AI features either work, or their absence is stated before the user invests effort.
**Actual:**
- `POST /api/ai/cover-letter`, `/api/ai/assistant-turn`, `/api/ai/interview-turn`, `/api/ai/skill-gap` → `503 {"error":"AI is not configured."}`
- Snap produces only a score and keyword diff (`15%` for a sales-officer advert against a sales CV). The banner says AI writing is unavailable, but the deliverable promised by the screen ("pata alama ya ulinganifu, **CV lengwa** na **barua ya maombi** kwa mguso mmoja") is never produced, and **"Hifadhi kwenye akaunti yako" renders disabled** (greyed, no tooltip). The journey ends at a share card.
- `POST /api/ai/enhance` returns **200 with the input unchanged** and `"source":"local"` — e.g. `{"enhanced":"Nina uzoefu wa mauzo.","source":"local"}` for that exact input. An AI-labelled button that silently no-ops is worse than a disabled one.
- The dashboard's primary CTAs are "Unda CV kwa kuzungumza na AI", "Msaidizi wa AI", "Sema CV" — all routes into the same 503.

**Evidence:** `/api/ai/status` body; per-endpoint statuses (§7 probe table); `shots/p7-snap-full.png` (disabled save button + AI-unavailable banner); `shots/p6b-assistant-turn.png`.
**Reproduce:** `node C:/Users/hamis/qa-web/p6-ai.mjs` and `p7-snap.mjs` (probe lists in `p6-ai.json`, `p7-snap.json`).

---

### D2 — HIGH — The dashboard tells a free account "everything is unlocked" while the entitlement API disagrees

**Steps:** sign in as a brand-new account → read the banner under the sidebar → `GET /api/entitlements`.
**Expected:** the banner reflects what the account actually has.
**Actual:** the banner reads **"Umefunguliwa Kila Kitu / Kila kitu kipo tayari kutumika."** ("Everything is unlocked / Everything is ready to use.") while `/api/entitlements` returns `premium:false` and `capabilities` containing `application.track:false`, `career.interview:false`, `outcome.record:false`, `template.premium:false`, `ats.deepCheck:false`. In the same account, `/career-interview` is gated and `/brief` says "Nafasi 0 zilichunguzwa".
**Evidence:** banner text captured on `/dashboard` for a brand-new user (`p1c-tour.json`, and re-verified on the just-migrated guest account); entitlements JSON §7.
**Impact:** a user who is told everything is unlocked will treat a later paywall as bait-and-switch.

---

### D3 — MEDIUM — English error text and English "why" text inside the Swahili UI

**Steps**
1. `/assistant` → type any message → send.
2. `/snap` → paste a job advert → "Snap ombi langu".

**Expected:** user-facing copy in the product's language (Swahili-first).
**Actual:**
- Assistant reply bubble, verbatim: **"AI is not configured."** with links "Jaribu tena" / "Nenda nyumbani" (`shots/p6b-assistant-turn.png`). The snap screen shows a *well-worded Swahili* version of the same fact ("Uandishi wa AI haupatikani kwa sasa…"), so the strings exist in the codebase and the assistant is simply not using them.
- Snap "KWA NINI ILIBADILIKA" bullets are raw English: "Still missing from your profile: sales, officer, ccbrt, requirements, least, customer." and "Your profile already covers this job well — the reorder keeps the same match while putting the most relevant content first for a human recruiter." (`shots/p7-snap-full.png`).

**Evidence / reproduce:** `p6b-ai2.json` (`chips[].tail`), `p7-snap.json` (`full`).

---

### D4 — MEDIUM — React hydration fails on the signed-in shell (8 of the 16 signed-in routes)

**Steps:** sign in → hard-load `/dashboard`, `/dashboard?tab=<any>`, `/settings`, `/brief`, `/import-cv`, `/voice`, `/career-interview`; watch the console.
**Expected:** one server render, hydrated once.
**Actual:** each of those routes raises **`Minified React error #418`** and **`#422`** (hydration mismatch, then that error inside a Suspense boundary → the boundary is thrown away and re-rendered on the client). Not raised on `/jobs`, `/snap`, `/assistant`, `/interview`. With JavaScript disabled, the same URLs return a loading state where the hydrated page shows content — i.e. the user sees a flash of "Inapakia…" and a full client re-render.
**Evidence:** console capture in `p1c-tour.json` (per-route `errors`), `p1g-hydration-diff.json` (`pageErrors: 2` on `/settings` and `/dashboard`, 199/244 leaf-text diffs), `p1h-template.mjs` output. **Root cause not determined** — I could not get React to name the offending node in a production build; the shell's `useSearchParams()` header (`components/dashboard/dashboard-header.tsx`) inside the Suspense fallback is the obvious suspect but I did not prove it.

---

### D5 — MEDIUM — Version history is inert and unreachable from the UI

**Steps:** create a CV, edit it for ~1 hour (rename, sections, photo, entries) → `GET /api/versions/cv/<id>` → query `document_version`.
**Expected:** a version per meaningful save, and some way to see/restore them.
**Actual:** exactly **one** `document_version` row exists, created at CV creation time (`created_at 2026-09-20T18:27:57.587`, `title "My CV"` — i.e. the pre-rename title), after dozens of PATCHes. The endpoint `/api/versions?cvId=<id>` 404s; `/api/cv/<id>/versions` 404s; the editor exposes no history/restore control (no matching button or string on any of the five steps).
**Evidence:** `p9-crud.json` (`v`, `dbv`).

---

### D6 — MEDIUM — Two tabs on the same CV: silent last-write-wins, no warning

**Steps:** open `/editor/cv/<id>` in two tabs; type a new title in tab A; moments later type a different title in tab B.
**Expected:** a conflict notice, or at least a "this document is open elsewhere" warning.
**Actual:** the DB ends at tab B's value (`"Tab-B title"`); neither tab showed any warning, banner or toast (searched for `tab nyingine|another tab|mgongano|conflict` — none). A whole edit made in tab A can be lost with no signal.
**Evidence:** `p9-crud.json` (title after both edits; per-tab text snapshots).

---

### D7 — LOW/MEDIUM — The dashboard's "Barua Rasmi Mpya" button does nothing

**Steps:** go to `/dashboard?tab=letter`; click the small header button **"Barua Rasmi Mpya"** (the 4th element matching `/Barua Rasmi/`, `<button>`, 165×20).
**Expected:** it opens the same creation sheet as the other three document types.
**Actual:** nothing happens — no sheet (`[role=dialog]` absent), no navigation, URL stays `/dashboard?tab=letter`. Reproduced with a locator click (auto-scrolled, actionability-checked) and twice more. The empty-state card **"Barua Rasmi Unda →"** (`div[role=button]`) *does* open the creation sheet, so the path exists and only this control is dead.
**Evidence:** `p15.json`, `p16`/`p17` console transcripts.

---

### D8 — LOW — A brand-new account is greeted as a returning one

**Steps:** create a fresh account, sign in, land on `/dashboard`.
**Expected:** first-run copy ("Karibu!") and first-run guidance.
**Actual:** **"Karibu tena!"** ("Welcome back!") and the account card already shows the "Umefunguliwa Kila Kitu" banner, plus "Taarifa zinasubiri uthibitisho" (1 fact awaiting confirmation) on an account that has never entered data — because the guest/`career-profile` seeding wrote a fact before the user typed anything.
**Evidence:** `p1c-tour.json` (`/dashboard`), `p2-profile.json`.

---

### D9 — LOW — Inconsistent guest gating: `/voice` bounces a signed-out visitor to sign-in

**Steps:** signed out, open `/editor/cv/try`, `/assistant`, `/snap`, `/voice`, `/templates`.
**Expected:** a coherent rule for what a guest can do.
**Actual:** the guest editor (with a "Hali ya mgeni — pakua bila malipo, hakuna usajili" banner), `/assistant`, `/snap` and `/templates` all open; **`/voice` 200s into `/sign-in?callbackUrl=%2Fvoice`**. The guest editor itself promotes "Anza na Sumaiya →" (→ `/assistant`, open) while the signed-in dashboard's "Sema CV" tile (→ `/voice`) would bounce a guest.
**Evidence:** `p8-guest.json` (`steps` for the four guest routes).

---

### D10 — LOW — Offline status is a bare "Jaribu tena" with no explanation of what is at risk

**Steps:** open a CV editor, cut the network (`Network.emulateNetworkConditions offline`), type into a field.
**Expected:** an honest "offline — your change is not saved yet".
**Actual:** the top bar replaces the save badge with a warning triangle + **"Jaribu tena"** ("Try again") only. Nothing says the edit is unsaved or held locally. The behaviour underneath is correct (the PATCH fails with `ERR_INTERNET_DISCONNECTED`, the field keeps the text, and on reconnect the value reaches the server — API then shows `personal.fullName = "Offline Name Change"`), so only the copy is wrong.
**Evidence:** `shots/p9b-offline.png`, `p9b-crud.json`.

---

### D11 — LOW — Snap keyword chips contain fragments and filler

**Steps:** paste a real advert into `/snap`.
**Actual:** `HAYAPO KWENYE WASIFU WAKO` includes `independently.` (trailing period), `least`, `grow`, `prepare`, `region`; `MANENO YALIYOLINGANA` includes `salaam.` — i.e. sentence punctuation is kept and stop-words are not filtered. A user cannot tell a real ATS keyword from noise.
**Evidence:** `shots/p7-snap-full.png`, `p7-snap.json`.

---

### D12 — LOW — API shape drift + a missing download route

- `/api/cv` returns a **bare array** while `/api/cv/<id>` returns `{success,data}` (`p11-docs-cross.json` → `list endpoint keys ["0"]`).
- `/api/cover-letter/<id>/download` → **404** (the editor generates that PDF client-side), while `/api/documents/business-card/<id>/download` and `/api/documents/letter/<id>/download` exist and answer 405 to GET (POST-only). Three documents, three different export conventions.
- Business-card export filename is `My_Business_Card_business_card.pdf` (type suffix appended twice).

---

## 3. Verified WORKING (do not "fix" these)

**Account**
- `/sign-up` → 200 → `/sign-in` (the product creates the account on first login; no separate sign-up screen, and the comment in `app/(app)/(auth)/sign-up/page.tsx` matches reality).
- `/sign-in` offers Google + email; the 8-digit-code toggle flips the copy in place: "Hakuna nywila — tutakutumia kiungo cha kuingia." → "…msimbo wa tarakimu 8 kwa barua pepe."
- With a dead-mailbox domain (`@sumaiya-seam.invalid`), Supabase returns `429 over_email_send_rate_limit` and the UI shows the **localised** message "Umejaribu mara nyingi — subiri dakika chache kisha ujaribu tena." — the SDK's English string is not leaked.
- Magic-link confirm route (`/api/auth/confirm?token_hash=…&type=magiclink&next=…`) sets the session and redirects; signed-out `/dashboard` → `/sign-in?callbackUrl=%2Fdashboard`; sign-out ("Toka") lands on `/` and the protected route bounces afterwards.

**Career profile (`/settings`)**
- All 8 fields saved: `POST /api/user/update-user 200` + `POST /api/profile 200`, and every value came back after a hard reload and after sign-out/sign-in.
- `GET /api/profile` on the live API returns exactly what the form shows.
- Career Interview (`/career-interview`): 11 questions, one input each, each answer persisted; the last step uses **"Maliza"** (not "Hifadhi jibu") and *does* save (`certifications: [{name:"FINISH11"}]`); a returning visit **pre-fills** the known answer (Q1 showed the stored `MARKER01`) so it does not blindly re-ask.
- The interview aggregates into a 13-key `careerProfile` (`personal, summary, experience, education, skills, certifications, languages, projects, achievements, volunteer, references, preferences, factMeta`) with per-fact provenance — a wrong answer is at worst one field, never a lost profile.

**Manual CV editor** (`/editor/cv/<id>`, reached via dashboard → **Unda** → "Anza Tupu")
- Filled and persisted: name, job title, email, phone, location, LinkedIn, website, summary; experience (company/position/description); education (institution/degree); skills (the `+ Python` chip); languages; projects; certifications; referees; hobbies.
- Live preview updates while typing (name and summary visible before any save); autosave badge shows **"Imehifadhiwa"**; `PATCH /api/cv/<id> 200`; a hard reload mid-edit restored every field exactly.
- Add/remove entries works (`Ondoa uzoefu`: 2 → 1, the surviving entry intact); "Ficha kutoka CV" removes the entry from the preview and the toggle's title flips to "Onyesha kwenye CV", then restores.
- Profile photo: upload a real 240×240 PNG → stored as a 1,491-char JPEG data URL; **replace** with a second file changes the stored hash and the `<img>` follows it; **remove** clears it (stored length 0, editor back to "Hakuna picha"). *(Note: the editor DOM contains two hidden file inputs — `accept=".pdf,.txt,.doc,.docx"` (profile menu import) precedes `accept="image/jpeg,image/png,image/webp"` (the photo). A human clicking the labelled "Pakia picha" control is unaffected; scripted/assistive tools must target the image one.)*
- CRUD: **rename** (title saved to the DB), **duplicate** (`POST /api/cv/<id>/duplicate` → "Copy of …" row), **delete** (two-click confirm — first click arms "Thibitisha kufuta?" for 3 s, second click fires `DELETE /api/cv/<id>` and the row disappears).

**Exports (real bytes on disk)**
| What | File | Bytes |
|---|---|---|
| Editor → Pakua PDF | `My_CV.pdf` (`%PDF-1.3`) | 308,915 |
| Editor → more downloads → Maandishi (.txt) | `My_CV.txt` | 817 |
| Editor → more downloads → Word (.docx) *(headed Chrome)* | `My_CV.docx` (valid zip, contains `word/document.xml`) | 9,356 |
| Guest editor → Pakua PDF (no account) | `My_CV.pdf` | 94,436 |
| Cover-letter editor → Pakua PDF | `My_Cover_Letter.pdf` | 94,766 |
| Business-card editor → Pakua PDF | `My_Business_Card_business_card.pdf` | 62,395 |

**Other document types** — cover letter and business card were created from the dashboard creation sheet, filled, survived a hard reload (`persisted=true`), exported, and were deleted afterwards. The formal-letter editor works the same way when reached through its empty-state card (`/editor/letter/<id>`, 14 inputs, PDF download event fires).

**Guest journey (the core promise)** — signed-out, zero cookies:
1. `/editor/cv/try` opens with no account and says so: "Hali ya mgeni — pakua bila malipo, hakuna usajili; kazi yako imehifadhiwa kwenye kivinjari hiki tu."
2. Built a CV (name/title/email/phone/location/summary); preview updated; draft stored under `localStorage["sumaiya-guest-cv"]`.
3. **Downloaded a real PDF (94,436 bytes) with no account and no sign-up wall** — the header's "Jisajili bure" is a soft CTA, not a gate.
4. `/sign-in` then shows the draft notice "Una rasimu ya CV ambayo haijahifadhiwa…".
5. First sign-in with `next=/migrate-guest` → landed in `/editor/cv/m_rx5LN_ZC8L73ViS-P4pS`; **the guest CV is now a row owned by the new user** (`personal.fullName "Neema Guest Mwakyusa"`, `jobTitle "Mhasibu"`, `location "Mbeya, Tanzania"`); `localStorage` draft cleared; the dashboard greets the name and the first-document empty state is gone.

**CRUD/state** — hard refresh mid-edit: verified twice (CV editor, covered above). Second tab: works but see D6. Offline: fails safe and syncs on reconnect (see D10).

---

## 4. Could not test / limits

1. **Cover-letter, business-card and letter PDFs could not be saved to disk in headless Chrome.** The download event fires with the right filename (`My_Cover_Letter.pdf`, `My_Letter.pdf`), but the tab is then reported closed and `saveAs` fails; reproducible. In **headed** Chrome the same code path saves fine (that is how the `.docx` above was verified). Treated as a harness artefact, not a product defect — but the letter PDF's *bytes* were never read back, so treat "letter exports a PDF" as unverified-beyond-the-event.
2. **The email-code sign-in screen was never reached** (Supabase rate-limits sends to the throwaway domain), so the 8-digit *entry* UI was not exercised. Session establishment was tested through the production magic-link confirm route instead, which is the same route the email template points at. The code-step's submit handler was not run.
3. **React #418/#422 root cause** — reproduced on 8 routes with console evidence, but not localised to a component (production build gives no node name).
4. **`/voice`, `/interview`, `/career-interview` (engine), `/studio`** were loaded and their entry screens inspected; the voice/interview *conversation* engines were not driven because they resolve through the same unavailable AI provider (D1).
5. **Sibling-surface overlap:** the ARM agent covers the Android app and another agent covers the input/output format matrix, so file-import (`/import-cv` with real PDFs/DOCX) and the full output matrix are out of scope here; `/import-cv` was only loaded and read.

---

## 5. Test-data hygiene

Accounts created through the Supabase admin API at `@sumaiya-seam.invalid` (MX goes nowhere): `qa1.journeys@`, `qa2.guest@`, plus `qa3.letter@` / `qa4.letter@` for the letter-button re-tests.

**Deleted and verified by query, not by intention** — final state of every table I could write to, filtered on the three test uids:

```
residual rows for the test user ids: {}   (cv, cover_letter, business_card, letter,
  user_profile, profile, document_version, download_log, ai_usage, referral_code,
  referral_claim, application, ats_score_snapshot, outcome_event, tool_invocation,
  job_recommendation, subscription, payment, device_token, web_push_subscription,
  app_event, signal_notification, template_submission, debug_event, provenance,
  eval_sample — all zero)
deleted: cv 2, cover_letter 1, business_card 1, letter 1, download_log 13,
  ai_usage 1, document_version 1, referral_code 3, user_profile 2, profile 2
auth users: 4 created, 4 deleted (200 each)
users in the project now: 7 — hamisiddy9@gmail.com (the real user, untouched)
  + 6 accounts belonging to OTHER agents' runs, left alone:
  qa-io-matrix-1@, seam-b4bc66fb@, seam-b6437651@, seam-6e7f9c1c@,
  seam-3b2fff11@, seam-927ab0d7@
```

**Harness note for the next agent:** Hermes redacts phone-number-shaped strings in tool output (`+255755999888` prints as `+255****9888`). I nearly filed a "the phone is stored masked" defect; the DB hash of the stored value equals the hash of the value sent, so the mask is output-side only. Verify such findings with a hash or a boolean, never by eyeballing the printed value.

---

## 6. Environment

- Repo `C:\Users\hamis\projects\sumaiya`, branch `release/1.6.25` (the tree carries ~50 uncommitted entries from a motion workstream that is not mine — untouched).
- Drive scripts live outside the repo in `C:\Users\hamis\qa-web` (`harness.mjs`, `p1*`–`p19*`), with JSON evidence per phase and screenshots in `qa-web/shots`, downloads in `qa-web/downloads`.
- Browser: `C:/Program Files/Google/Chrome/Application/chrome.exe` via `playwright-core` 1.63.0 (see §4.1 for the headless tab-close artefact).
