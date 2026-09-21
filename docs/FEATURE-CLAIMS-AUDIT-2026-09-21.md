# Feature-claims audit — 2026-09-21

Every advertised feature, checked against what the product actually does today.

**Repo:** `C:\Users\hamis\projects\sumaiya` — branch `release/1.6.25`, HEAD `01e3300` (2026-09-21 09:45 +0300).
**Live site:** https://sumaiya.app — UP throughout this audit.
**Method:** read the source, then fetched the deployed pages and APIs, and queried the production
database read-only. Where a claim depends on the database, the number below is a real
`SELECT count(*)` against the DB that serves sumaiya.app (cross-checked by matching the API's
newest row to the table's newest row — see §5).

**Verdict key**
- **TRUE** — I exercised it and it did what the copy says.
- **PARTLY TRUE** — the mechanism exists, but the sentence as written promises more than happens.
- **FALSE** — the copy describes something the product does not do.
- **BROKEN-TODAY** — true by design, dead right now because sign-in is down. Would become TRUE
  when the mailer is fixed; the claim is still unsafe to leave up while it is down.

## 1. What I could and could not check

| Check | Command / source | Result |
|---|---|---|
| AI provider live | `curl https://sumaiya.app/api/ai/status` | `{"configured":true,"provider":"deepseek"}` |
| AI reachable by a stranger | `POST /api/ai/summary` with a valid body | **HTTP 401** `{"error":"Unauthorized"}` |
| Sign-in works | `POST .../auth/v1/otp` (`create_user:true`) | **HTTP 429** `over_email_send_rate_limit` |
| Job feed default view | `GET https://sumaiya.app/api/jobs` | 100 rows, **0 Tanzanian** |
| Job feed, Tanzania filter | `GET /api/jobs?limit=100&q=Tanzania` | 30 rows, all `JobwebTanzania`, all Tanzania |
| Jobs page as rendered | `curl https://sumaiya.app/jobs` | "100 jobs", locations Germany / Berlin / Munich / US / Stuttgart / Hamburg / Indonesia / Australia / Bulgaria / China / Egypt. **No Tanzania.** |
| DB: job rows | `select count(*) from job` | **1304** live; **365** TZ-located |
| DB: newest 100 rows, TZ-located | window query | **0** |
| DB: recommendations | `select count(*) from job_recommendation` | **0** |
| DB: anyone ever had Pro | `select count(*) from profile where premium_until is not null` | **0** of 15 profiles |
| DB: referrals paid out | `referral_code` / `referral_claim` | 6 / **0** |
| DB: payments | `subscription` / `payment` | **0** / **0** |
| DB: what users have built | `cv` / `cover_letter` / `business_card` / `letter` | 7 / 0 / 0 / 0 |
| APK download | `curl -L https://sumaiya.app/downloads/sumaiya.apk` | 308 → GitHub release asset, **44,762,304 bytes**, `application/vnd.android.package-archive` |
| ATS text reader (web upload) | `POST /api/tools/extract-text` with a real PDF | 200, extracted the text back |
| Template gallery | `curl https://sumaiya.app/templates` | "Inaonyesha 1–12 kati ya **47**" |
| Nav / footer "Pricing" | `PAYMENTS_ENABLED` gates it (`components/ui/marketing-nav.tsx:44`) | not rendered — no false claim |

---

## 2. Claims table

### 2.1 Play Store listing — `docs/aso-play-store.md`
What a user reads **before** installing. Highest reach, highest cost. The file has an EN listing
only; the app it advertises is bilingual, so I give both languages in §3.

| # | Claim (quoted) | Surface | What is actually true (evidence) | Verdict |
|---|---|---|---|---|
| P1 | *"Build an ATS-ready CV, find Tanzanian jobs, and get AI career advice."* (short description, `aso-play-store.md:14`) | Play listing, short desc | Three promises in one line. The CV editor + PDF export work (`lib/pdf.ts:247` dynamic `jspdf`+`html2canvas`; APK downloads at 44.7 MB). "Find Tanzanian jobs" fails on the default feed: `/api/jobs` → 100 rows, 0 Tanzanian. "AI career advice" → `POST /api/ai/summary` returns **401**; `POST /auth/v1/otp` returns **429**. | **FALSE** |
| P2 | *"Create a CV that passes ATS — 200+ professional designs, free and premium"* (`:29`) | Play listing, full desc | The gallery offers **47**, not 200+. `curl https://sumaiya.app/templates` renders *"Inaonyesha 1–12 kati ya 47"*. 266 template sources exist (`types/index.ts:981`, `TEMPLATE_PRESENTATION`), but `CURATED_CV_TEMPLATE_IDS` (`lib/templates/curation.ts`) offers 47 and the rest are deliberately not offered. "passes ATS" is a guarantee no external ATS was ever run against. | **FALSE** |
| P3 | *"Check your ATS score and see exactly what to fix"* (`:31`) | Play listing, full desc | The score is real and runs free with no sign-up: `/ats-checker` scores pasted text in the browser via `scoreResumeText` (`lib/ats-text.ts`). But the advertised fix path is sign-gated: `Fix this CV` → `/import-cv` → **307** → `/sign-in?callbackUrl=%2Fimport-cv`, and sign-in is 429. Also the "ATS" is the product's own heuristic (`lib/ats-score.ts`), not a named ATS. | **PARTLY TRUE** |
| P4 | *"Find jobs that match your profile — Tanzanian roles first, then nearby nations"* (`:32`) | Play listing, full desc | `job_recommendation` has **0 rows** (`select count(*)`). The default feed returns **0** Tanzanian rows of 100 while **365** Tanzanian rows exist in `job`. The `/jobs` location filter lists Germany, Berlin, Munich, United States, Stuttgart, Hamburg, Indonesia, Australia, Bulgaria, China, Egypt — **Tanzania is not in it**. | **FALSE** |
| P5 | *"Track every application in one place and get nudged to follow up"* (`:33`) | Play listing, full desc | The nudge loop is coded and scheduled: `app/api/cron/follow-ups/route.ts:11` emails after 7 days on `applied`. But "one place" is false across clients: the Android app keeps applications in **device-only SQLite** — `apps/native/src/lib/applications-store.ts:2` *"Local job-applications store (SQLite, device-only)"* — while the dashboard keeps `application` rows. `application` = **0 rows**; `translations.ts:33-35` says the same thing in its own comment. Nothing has ever been tracked. | **PARTLY TRUE** |
| P6 | *"Write cover letters that match each job"* (`:34`) | Play listing, full desc | A cover-letter editor and 27 designs exist (`components/templates/cover-letter/index.tsx:21`, union of 27 ids). The AI cover-letter route (`lib/api/routes/ai.ts:317`) opens with `if (!userId) return 401`. `cover_letter` table = **0 rows**. | **PARTLY TRUE** |
| P7 | *"Learn the skills your target role needs"* (`:35`) | Play listing, full desc | Real surface: `apps/native/src/screens/learning-hub-screen.tsx`, backed by `lib/learning-resources.ts` (51 distinct URLs) via `resourcesForGaps` (`lib/skill-gap.ts:17`). | **TRUE** |
| P8 | *"Scan or import an existing CV and improve it"* (`:30`) | Play listing, full desc | OCR stack is real (`lib/api/routes/mobile-ocr.ts` — tesseract.js server-side; `apps/native/src/screens/app/scan-screen.tsx`). But the import path is sign-gated and sign-in is down: `/import-cv` → 307 → `/sign-in?callbackUrl=%2Fimport-cv`; OTP → 429. | **BROKEN-TODAY** |
| P9 | *"check how you score against real ATS systems"* (`:21`) | Play listing, full desc | *"real ATS systems"* is the specific false phrase. The score comes from the repo's own deterministic engine (`lib/ats-score.ts`, `lib/ats-text.ts`). No external ATS (Workday, Taleo, Greenhouse, Lever) was run, and no evidence of one exists in the tree or in the DB (`ats_score_snapshot`). | **FALSE** |
| P10 | *"AI advice grounded in your real profile — never invented experience"* (`:26`) | Play listing, full desc | The anti-fabrication constraint is genuinely in the prompts (`TRUTH_CONSTRAINT` in the `/ai/summary` prompt, `lib/api/routes/ai.ts:437+`) and there is an anti-fabrication eval gate (`npm run evals`, 135 tests). But the route returns **401** to anyone not signed in, and 429 blocks signing in. `ai_usage` holds 3 rows total, one of them the literal test user `u_test`. I could not measure the quality of a reply myself without a session. | **BROKEN-TODAY** |
| P11 | *"Your data stays yours. Your CVs are private to your account."* (`:41`) | Play listing, full desc | `cv` requires auth (`lib/api/routes/cv.ts`) and the privacy policy is live (`/privacy` → 200, 73,086 bytes). I did not audit RLS policies or storage permissions, so I cannot certify the privacy half. | **UNVERIFIED** |
| P12 | *"Made for Tanzania and East Africa — local jobs first, not roles you can't reach"* (`:24`) | Play listing, full desc | Same measurement as P4: the jobs surface a Tanzanian user opens shows Berlin, Munich, and a US remote role; `Tanzania` is absent from the location list. The mechanism that was supposed to fix this (`homeMarketFirst`, `lib/jobs/feed-filter.ts:189`) only re-orders the 100 rows already fetched, and **0 of those 100 are Tanzanian**. | **FALSE** |
| P13 | *"Bure kuanza. Anza kazi yako leo."* (`:43`) | Play listing, final line | "Free to start" is true for the CV editor; there is no `payment` or `subscription` row and `PAYMENTS_ENABLED = false` (`lib/features.ts:8`). "Anza kazi yako leo" ("start your work today") reads as starting a job. | **PARTLY TRUE** |
| P14 | Keywords include *"ATS checker"*, *"cv checker tanzania"*, *"Kiswahili"* (`:47-51`) | Play listing, ASO tags | Tags are not user-facing promises; the underlying features are covered above. No separate finding. | **TRUE** |

### 2.2 Landing page — `apps/web/app/[locale]/(marketing)/home-page-client.tsx`
Verified against the deployed text (`curl https://sumaiya.app/en`, `/sw`) — the rendered copy
matches the source.

| # | Claim (quoted EN / SW) | Surface | What is actually true (evidence) | Verdict |
|---|---|---|---|---|
| L1 | EN *"Paste the job advert. I'm Sumaiya — I'll write the CV that matches it, in Swahili, on your phone, free, **with no account**."* (`:495-496`) · SW *"Bandika tangazo la kazi. Mimi ni Sumaiya — nitakuandikia CV inayolingana nalo, kwa Kiswahili, kwenye simu yako, bila malipo, **bila akaunti**."* (`:495`) | Landing hero, below the H1 | This is the single most-read sentence on the site and it is the one that is broken. Writing the CV is what the AI does, and every AI route starts `const userId = await getUserId(c); if (!userId) return c.json({ error: "Unauthorized" }, 401)`. I ran `POST /api/ai/summary` with a valid body and got **401 `{"error":"Unauthorized"}`**. There is no anonymous sign-in anywhere (`grep signInAnonymously` → no hits in web or native). So "with no account" is exactly inverted for the advertised feature. | **FALSE** |
| L2 | EN *"No account. No card. Nothing to pay."* (`:531-533`) · SW *"Hakuna akaunti. Hakuna kadi ya benki. Hakuna malipo."* | Landing hero, reassurance line | True for the guest CV editor (`/editor/cv/try` → 200, no redirect) and true about money (`PAYMENTS_ENABLED=false`; 0 payment rows). It directly contradicts L1, which needs an account. Two adjacent lines on the same screen cannot both be right. | **PARTLY TRUE** |
| L3 | EN *"47 looks — pick one and start"* (`:838`) · SW *"Miundo 47 — chagua mmoja, uanze"* | Landing, "THE LOOK" section | `CURATED_CV_TEMPLATE_IDS` = **47** ids in `lib/templates/curation.ts`; the live gallery says *"Inaonyesha 1–12 kati ya 47"*. | **TRUE** |
| L4 | EN *"47 looks"* / *"27 looks"* / *"29 designs"* / *"17 looks"* for CV / cover letters / cards / formal letters (`:229-256`) · SW *"Miundo 47 / 27 / 29 / 17"* (`:268-295`) | Landing, product grid | Counted in source: `CURATED_CV_TEMPLATE_IDS` = 47; `CoverLetterTemplateId` union (`components/templates/cover-letter/index.tsx:21`) = 27; `BUSINESS_CARD_TEMPLATES` (`types/index.ts:1310`) = 29; `LETTER_TEMPLATES` (`types/index.ts`) = 17. All four numbers are right. | **TRUE** |
| L5 | EN *"Your PDF is made on your phone"* (`:706-707`, `:543`) · SW *"PDF yako inatengenezwa kwenye simu yako"* | Landing, "On your phone" cards | `lib/pdf.ts:247-248` imports `html2canvas` and `jspdf` dynamically on the client; generation is in-browser. Claim matches mechanism. | **TRUE** |
| L6 | EN *"Nothing to install"* (`:711`) · SW *"Hakuna kupakua programu"* | Landing, "On your phone" | True of the web product, and the web product needs nothing installed. It sits on the same page as, and is contradicted by, the app page's "Get the Android app" — see §3 R1. | **TRUE** |
| L7 | EN *"Is Sumaiya really free? — Yes. ... **Payments are not switched on at all yet** ..."* (`:449`) · SW `:440` | Landing FAQ (also emitted as FAQPage JSON-LD) | Verified: `PAYMENTS_ENABLED = false` (`lib/features.ts:8`), `payment` 0 rows, `subscription` 0 rows, and nothing sells a tier. This is the most honest copy on the site. | **TRUE** |
| L8 | EN *"Can I get a Word (DOCX) file? — Yes."* (`:455`) · SW *"Je, naweza kupata faili la Word (DOCX)? — Ndiyo."* (`:446`) | Landing FAQ + JSON-LD | `apps/web/lib/docx.ts` exists and is wired into the editor (`components/editor/cv-editor-client.tsx:1640` dynamic `downloadCvDocx`) and the assistant (`components/assistant/cv-assistant-client.tsx:38`). | **TRUE** |
| L9 | EN *"No invented numbers here. These are three things you can verify yourself in one minute."* (`:759`) · SW *"Hakuna namba za kubuni hapa."* (`:758`) | Landing, PROOF section | No number appears in the section, `TESTIMONIALS` is `[]` and `CVS_CREATED = 0` (`lib/testimonials.ts:35,39`), and the band that used to hold invented quotes is gone. Honest. **But** the same brand's `/pata-kazi` page carries an uncited "8 in 10" statistic — so this line is true here and the brand it belongs to is not clean (P-K1 below). | **TRUE** |
| L10 | EN *"Free PDF tools ... No sign-up, and your files are never stored."* (`:885`) · SW *"Zana za PDF ... Hakuna usajili, na faili zako hazihifadhiwi."* (`:884`) | Landing, PDF tools band | `/tools` → 200. The text reader runs server-side and I exercised it (`POST /api/tools/extract-text` returned the text of my PDF, no auth needed). "Never stored" I did not audit — no storage-layer check was run. | **PARTLY TRUE** (sign-up half verified; storage half not) |
| L11 | EN *"or talk to me"* — the secondary hero CTA to `/assistant` (`:516-521`) | Landing hero, secondary button | `/assistant` → 200 (40,676 bytes) renders. The AI behind it answers **401** to a guest. As currently shipped this button leads to a wall that sign-in cannot open. | **BROKEN-TODAY** |
| L12 | EN *"The page itself needs a connection once, to open. After that, typing and downloading do not need another bundle."* (`:738`) · SW `:737` | Landing, honest-limit note | The landing page deliberately does **not** claim "works offline" and the source comment (`:677-685`) explains why. The `/pro` page claims exactly that. See §3 R6. | **TRUE** here / **FALSE** on `/pro` |

### 2.3 Other marketing pages

| # | Claim (quoted EN / SW) | Surface | What is actually true (evidence) | Verdict |
|---|---|---|---|---|
| K1 | EN *"It's not you — it's your CV. **Screeners filter 8 in 10 CVs sent**, before the boss ever sees your profile."* (`pata-kazi/page.tsx:75-77`) · SW *"Wakaguzi huchuja **8 kati ya 10** CV zinazotumwa, hata kabla boss hajaona profile yako."* (`:71-73`) | `/pata-kazi` hero | An uncited statistic. I found no source in the repo, no citation on the page, and no methodology. It is a real-sounding industry number used as the emotional hook of a scan-landing page aimed at someone who is anxious about not being called. On a site whose landing page says *"No invented numbers here"*, this is the number. | **FALSE** |
| K2 | EN *"Tailored to the job you apply for — **So it passes screeners** and reaches the boss"* (`:33`) · SW *"Rekebishwa kuendana na kazi unayoomba — **Ili ipite wakaguzi** na kumfikia boss"* (`:28`) | `/pata-kazi` step 2 | A guarantee of passing a screener. The product's own landing FAQ says the opposite in its own words: *"We cannot promise that an employer will reply; no tool can promise that."* (`home-page-client.tsx:453`). | **FALSE** |
| K3 | EN *"**Get the interview** — Start getting called and working"* (`:34`) · SW *"**Pata usaili** — Anza kuitwa na kufanya kazi"* (`:29`) | `/pata-kazi` step 3 | Promises the interview outcome from a CV builder. Neither the DB nor the product can support it (`application` 0 rows; no outcome tracking wired to interviews — `outcome_event` 0 rows). | **FALSE** |
| K4 | Meta description: EN *"...Sumaiya builds a CV that passes screeners. Free."* (`:12`) · SW *"...inakujengea CV inayopita wakaguzi. Bure."* (`:11`) | `/pata-kazi` `<meta>` + OpenGraph | Same as K2, in the snippet Google and WhatsApp will show for this page. | **FALSE** |
| K5 | EN *"Or download the free app"* (`:107`) · SW *"Au pakua App ya bure"* (`:107`) | `/pata-kazi` secondary CTA | `curl -L https://sumaiya.app/downloads/sumaiya.apk` → 308 → GitHub release asset, **44,762,304 bytes**, correct MIME type. The download really works. | **TRUE** |
| K6 | EN *"Choose from 260+ CV designs, then Sumaiya writes every section and hands you an ATS-ready PDF."* (`pro/page.tsx:32`) · SW *"Chagua kutoka miundo 260+ ya CV ... PDF inayosomeka kwa mifumo ya kuajiri."* (`:31`) | `/pro` meta description | "260+" is false as offered — 266 sources exist, **47** are offered, and `/templates` says so in its own title. "Sumaiya writes every section" needs an account (401/429). The SW half correctly avoids the word ATS; the EN half names it. | **FALSE** |
| K7 | EN *"260+ designs — Every design works on a phone."* (`templatehub-pro-landing.tsx:258`) · SW *"Miundo 260+"* (`:252`) | `/pro` feature cards | Live page contains "260+" once (`curl https://sumaiya.app/pro` → 200, 133,296 bytes). | **FALSE** |
| K8 | EN *"...and hands you an **ATS-ready PDF**"* (`:245`, `:334`) · SW *"Pakua PDF **inayopitishwa na mifumo ya kuajiri**"* (`:240`, `:333`) | `/pro` how-it-works + hero | Claims the output is accepted/passed by hiring systems. No external ATS was ever run; the score is the product's own engine. The SW phrasing ("PDF accepted by hiring systems") makes the same promise. | **FALSE** |
| K9 | EN *"works **offline**, uses the camera to read your certificates, and updates itself."* (`:295`) · SW *"**inafanya kazi bila intaneti**, inatumia kamera kusoma vyeti, na inajipakia yenyewe."* (`:279`) | `/pro`, "the full experience in the app" card | Live SW page contains *"inafanya kazi bila intaneti"*. The landing page's own source comment says it deliberately avoids this headline because *"the native app's offline path has never been tested in airplane mode (docs/FEATURE-INVENTORY.md §5) ... that headline would be the loudest false claim on the site."* The camera/OCR half is real (`mobile-ocr.ts`, `src/screens/app/scan-screen.tsx`). The self-update half is wired (`app/api/app/update/route.ts`) but the manifest is stale — see K10. | **FALSE** |
| K10 | EN *"...and **updates itself**."* (`:295`) | `/pro`, app card | `curl https://sumaiya.app/api/app/update` → `{"version":"1.6.22", ...}`. The app in the repo is `apps/native/app.json:5` **`"version": "1.6.25"`**, `versionCode: 10625`, and the branch is `release/1.6.25`. The updater tells a user on 1.6.22 they are current. The mechanism is real; the number it serves is wrong. | **PARTLY TRUE** |
| K11 | EN *"**The first 50 installers get a week of Sumaiya Pro**, and Founding Member status through early access."* (`:534`) · SW *"Wapatao 50 wa kwanza wanapata wiki moja ya Sumaiya Pro..."* (`:533`) | `/pro`, early-access card | The counter is real and live: `GET /api/stats/early-access` → `{"taken":14,"seats":50,"remaining":36,"full":false}`. **But** `taken` is `count(*) from profile` (`app/api/stats/early-access/route.ts:25`) — it counts *accounts*, not installers — and `select count(*) from profile where premium_until is not null` = **0**. So the offer is being displayed 14 times over and no one has ever been given the week of Pro. There is no code path that grants Pro for installing. | **FALSE** |
| K12 | EN *"7 days of Pro per friend ... **Once they build their first CV you get 7 days of Sumaiya Pro** — and so do they. 7 completed friends converts it to Pro for life."* (`:578-579`) · SW (`:578`) | `/pro`, invite card (and `premium-sheet.tsx:33`, `premium-template-modal.tsx:100`) | The mechanism is coded (`lib/referral.ts:128` calls `grantPremiumDays`, writing `profile.premium_until`) and 6 referral codes exist. `referral_claim` = **0** and `premium_until` set on **0 of 15** profiles: nobody has ever gone round this loop, so the route the paywall calls "the route that works today" has never been demonstrated to work. | **PARTLY TRUE** |
| K13 | EN *"No payment is being taken yet. Pro is earned through early access and referrals."* (`:599`) · SW (`:598`) | `/pro`, closing note | True about money (`payment` 0 rows, `PAYMENTS_ENABLED=false`). It is the sentence that makes K11 and K12 load-bearing. | **TRUE** |
| K14 | EN *"Free tool that scores a CV/resume for Applicant Tracking System compatibility"* (`ats-checker/page.tsx`, JSON-LD) · SW *"Angalia alama ya CV yako bila malipo..."* | `/ats-checker` structured data | Structured data asserting ATS compatibility scoring. The scoring is local and deterministic. | **PARTLY TRUE** |
| K15 | EN *"**Free · No sign-up**"* badge + *"Upload your CV and get an instant ATS score with the exact fixes to pass — in seconds."* (`ats-checker/page.tsx:67-69`) | `/ats-checker` hero | The badge is true: paste-mode scoring runs in the browser with no session (`lib/ats-text.ts`). The upload path needs no session either, and I exercised `POST /api/tools/extract-text` successfully. "the exact fixes to **pass**" is the over-reach — passing depends on the employer's system, not this one. | **PARTLY TRUE** |
| K16 | EN *"Tailor Your CV to Any Job in 30 Seconds — Free"* + *"Get an instant **ATS match score**, then a tailored CV and cover letter that **pass the robots** — free, no sign-up."* (`snap-to-apply/page.tsx:11-13`) · SW (`:11`) | `/snap-to-apply` meta + hero | "pass the robots" is a guarantee about someone else's software. The tailoring engine is real (`/api/jobs/targeted-cv` uses `buildTargetedCv` with deterministic `matchCvToJd`), and `/snap` renders for a guest (200, 32,448 bytes). "in 30 seconds" is an uncited timing. | **PARTLY TRUE** |
| K17 | EN *"Copy-paste a job description, or **snap a photo of a job poster** with your phone."* (`:52-54`) | `/snap-to-apply`, step 01 | OCR is real infrastructure (`lib/api/routes/mobile-ocr.ts`, tesseract.js, 4 MB cap, MIME sniffing) and a Scan screen exists. I did not photograph anything on a device, so the end-to-end photo path is unexercised by me. | **UNVERIFIED** (code path present) |
| K18 | EN *"The app is not on Play Store yet."* / *"Play Store soon."* (`:534`, `:632`) | `/pro` | Consistent with `aso-play-store.md:65` ("Play Console account access" still needed). Not a false claim; it is the reason the Play listing in §2.1 is copy and not a live page. | **TRUE** |
| K19 | Doc comment: *"TemplateHub Pro — the page sumaiya.app serves at its root."* (`pro/page.tsx:8`) | `/pro/page.tsx` source comment | `curl -L https://sumaiya.app/` → 200, 244,599 bytes, `<title>Tengeneza CV Bila Malipo — Kwa Kiswahili | Sumaiya</title>` — the root serves the **Swahili landing page**, byte-identical in size to `/sw`. The root rewrite to `/pro` described in that comment is not what is deployed. A doc asserting a stale fact is how the next agent gets it wrong (`verification-traps` §16). | **FALSE** (documentation, not user-facing) |

### 2.4 The jobs surface — where the biggest gap between copy and data lives

| # | Claim (quoted EN / SW) | Surface | What is actually true (evidence) | Verdict |
|---|---|---|---|---|
| J1 | Page title: EN *"Jobs — **Matched to Your CV**"* · SW *"**Ajira Zinazolingana na CV Yako**"* (`app/[locale]/(marketing)/jobs/page.tsx:18`) | `/jobs` `<title>` + `<h1>` | `job_recommendation` = **0 rows for every user**. Nothing is matched to anybody's CV. The visible list is 100 rows, all foreign: `Founder's Office Lead — Bjak — Berlin`, `Research Associate I — Lifelancer — United States`, `Senior Embedded Linux Engineer — Wemolo — Munich`, `Business Operations Associate — Bjak — Berlin`. | **FALSE** |
| J2 | Meta description: EN *"Automatically discovered openings from trusted job sources, **scored against your CV**. See your match..."* (`jobs/page.tsx:19-21`) | `/jobs` `<meta>` | The scoring engine exists (`lib/job-match.ts`) and runs only for a signed-in user with a CV. For the crawling visitor — and for Google — nothing is scored. | **FALSE** for an unauthenticated visitor |
| J3 | EN *"Sign in and build a free CV to unlock your match score on every job."* (`components/jobs/jobs-feed.tsx:180`) · SW *"Ingia na uunde CV yako bila malipo ili kuona alama zako za kufanana kwa kila kazi."* (`:179`) | `/jobs` feed banner | This line is honest about the gate — and the gate is shut: OTP returns **429**. The banner is an instruction the product currently cannot obey. | **BROKEN-TODAY** |
| J4 | EN *"100 jobs"* (`jobs feed`), location filter: *Remote, Germany, Berlin, Munich, United States, Stuttgart Schockenriedstr. 17, Hamburg, Indonesia, Australia, Berlin - hybrid, Bulgaria, China, Egypt, Turkey* | `/jobs` sidebar | The count is real (100 rows rendered). The list is the finding: **Tanzania is not an option**, and 28% of the whole 1,304-row feed *is* Tanzanian. | **TRUE** as a count / **the filter is the defect** |
| J5 | The engineering intent: `homeMarketFirst()` — *"home-market listings first, everything else after"* (`lib/jobs/feed-filter.ts:189`) plus the source comment at `lib/api/routes/jobs.ts:112-116` claiming the fix for *"0 of 8,079 rows mentioned Tanzania"* | `lib/api/routes/jobs.ts:97-117` | The fix is defeated by its own query. The route fetches `.orderBy(desc(job.featured), desc(job.createdAt)).limit(100)` **and only then** calls `homeMarketFirst(rows)`. Measured: of the newest 100 live rows, **0 are Tanzanian**; of the newest 300, **200 are**. The newest TZ row is `2026-09-20T12:46` (JobwebTanzania); the newest Arbeitnow rows are `2026-09-21T03:00` — Arbeitnow bulk-inserts fresher timestamps than JobwebTanzania, so the TZ rows are permanently pushed just outside the window the sorter can see. Existing code, working exactly as written, producing a Tanzanian-free front page. | **FALSE** in effect |
| J6 | Play listing: *"Tanzanian roles first, then nearby nations"* (`aso-play-store.md:32`) | Play listing | Same mechanism, same result: /jobs and the Play-listed app's jobs tab show Europe and the US first, with no Tanzania present at all. | **FALSE** |

### 2.5 Android first-run — `apps/native/src/screens/first-run-screen.tsx`
What the app promises a brand-new user, in person, before they have any work in it.

| # | Claim (quoted EN / SW) | Surface | What is actually true (evidence) | Verdict |
|---|---|---|---|---|
| F1 | EN *"**Six quick taps** so I start knowing you — no typing your whole history."* (`:491`) · SW *"**Migusiko sita mifupi** ili nianze kukufahamu — bila kuandika historia yote."* (`:492`) | first-run, intro step | The wizard is `["intro", "photo", "fields", "experience", "skills", "recent", "look"]` when the account already has a name (`:146-149`) = **7** taps, **8** if it does not. The count is off by at least one, in the direction that makes the ask sound smaller than it is. | **PARTLY TRUE** |
| F2 | EN *"See all **224** designs"* (`:478`, `ALL_TEMPLATES.length` = 6 `CV_TEMPLATES` + 218 `TEMPLATE_REGISTRY` keys) · SW *"Ona miundo yote 224"* | first-run, look step | 224 is right for the **app**. The web offers **47** and its own gallery says *"Inaonyesha 1–12 kati ya 47"*. A user who counts in the app and then counts on the web meets two different products. Neither number is wrong on its own surface; the divergence is unmanaged. | **TRUE** on-device / **inconsistent with web** |
| F3 | EN *"The 7 flagship designs — colour sidebars, photo rings, timelines / **Earned by inviting friends — 7 days each time one builds a CV**"* (`apps/native/src/components/premium-sheet.tsx:31-33`) · SW *"Inapatikana kwa kuwalika marafiki — siku 7 kila mmoja akijenga CV"* | first-run look step → tapping a locked design | `PREMIUM_TEMPLATE_IDS` really is 7 (`lib/templates/curation.ts`). But `referral_claim` = **0** and `profile.premium_until` set on **0 of 15** accounts. The screen tells a first-run user the way past the lock is to invite friends; no one has ever got through that way. Compare the web's identical lock: `components/premium-template-modal.tsx:100` *"Pata Premium bure — walika marafiki"*. | **PARTLY TRUE** |
| F4 | The whole first-run flow | `apps/native/src/navigation/root-navigator.tsx:245-262` | It is gated **behind sign-in**: `!user ? <Auth> : !firstRunDone ? <FirstRun> : <AppTabs>`. Sign-in is 429. **Every promise on this screen is currently unreachable by a new user** — they never get past the auth stack. | **BROKEN-TODAY** |
| F5 | EN *"Totally optional — skip it now and add one later from your CV editor."* (`:336`) · SW *"Si lazima kabisa..."* | first-run, photo step | The skip path exists (`canNext` returns true for `photo`, `:216`) and the profile screen can change it later. | **TRUE** |
| F6 | EN *"Safe everywhere. Great for ATS."* (`apps/native/src/lib/cv-html.ts:36`, the `classic` template blurb) | native template blurb | An ATS-performance claim in the native picker. The SW sibling is clean — *"Salama popote. Nzuri kwa waajiri."* ("safe everywhere. Good for employers") — which is what the EN should say too. | **FALSE** (EN only) |

### 2.6 Copy that looks like a claim but is not on screen
Recorded so nobody re-opens these as findings, and so nobody re-enables them by accident.

| # | Text | Where it lives | Status |
|---|---|---|---|
| D1 | EN *"Pricing"* / SW *"Bei"* (`lib/i18n/translations.ts:6,161`) | nav labels | **Not rendered.** Both the footer and the nav build the pricing entry behind `PAYMENTS_ENABLED` (`components/ui/footer.tsx:18`, `components/ui/marketing-nav.tsx:44`), which is `false`. `/pricing` → 307. Dead copy, no false claim today. |
| D2 | EN *"Upgrade to Premium"* / *"Unlock PDF downloads, every look, and help with your wording"* / *"See plans →"* (`lib/i18n/translations.ts:53-55`) · SW *"Pata Premium"* (`:209-211`) | dashboard strings | **Dead keys.** Nothing reads `upgradeTitle`, `upgradeDesc`, `seePlans` or `premiumActive` — the only `seePlans` in the tree is a separate local object in `components/settings/settings-form.tsx:59`. So there is no live "upgrade for money" claim anywhere, which is the right state while payments do not exist. Flagged so the next person who wires a premium screen does not resurrect the price. |

---

## 3. Ranked actions — ordered so the user furthest from you is protected first

Ranking rule: a claim on the Play listing or the first screen beats one on a page the user has to
go looking for, and a claim that takes money or trust beats one that only takes a click.

---

### R1 — Play Store listing: three false claims, read before install · **CHANGE** (highest reach)
`docs/aso-play-store.md`. A user reads this and then gives you 45 MB and a promise of their time.
Everything here is a sentence, so this is a one-file edit and the cheapest large win available.

**(a) `:29`** — *"Create a CV that passes ATS — 200+ professional designs, free and premium"*
→ EN: `Create a CV with me — 47 designs, all of them free today`
→ SW: `Ninaunda CV nawe — miundo 47, yote bure kwa sasa`

**(b) `:32`** — *"Find jobs that match your profile — Tanzanian roles first, then nearby nations"*
→ EN: `Browse openings I've gathered — Tanzanian roles among them, plus remote work you can do from here`
→ SW: `Vinjari nafasi nilizokusanyia — pamoja na kazi za Tanzania, na kazi za mbali unazoweza kufanya ukiwa hapa`

**(c) `:21`** — *"check how you score against real ATS systems"*
→ EN: `see how clearly your CV reads before you send it`
→ SW: `uone jinsi CV yako inavyosomeka kabla ya kuituma`

**(d) `:14`** — short description (80 max), *"Build an ATS-ready CV, find Tanzanian jobs, and get AI career advice."*
→ EN (78): `Build a CV with me, browse jobs, and get advice — free, in Swahili or English.`
→ SW (76): `Ninaandika CV nawe, tunatafuta kazi, na nakupa ushauri — bure, kwa Kiswahili.`

**(e) `:33`** — *"Track every application in one place and get nudged to follow up"*
→ EN: `Keep a list of what you applied for, and I'll remind you to follow up`
→ SW: `Tunza orodha ya uliyoomba, nami nitakukumbusha kufuatilia`
(the "one place" had to go: the app's list is on the phone and the dashboard's is on the account — `applications-store.ts:2`)

**(f) `:24`** — *"Made for Tanzania and East Africa — local jobs first, not roles you can't reach"*
→ EN: `Built for job seekers in Tanzania`
→ SW: `Imejengwa kwa wanaotafuta kazi Tanzania`
(the promise is about *who it is for*, which is true, instead of *what the feed contains*, which is not)

**(g) `:31`** — *"Check your ATS score and see exactly what to fix"* → keep the feature, lose the capitalised mechanism:
→ EN: `See how readable your CV is, and what to fix`
→ SW: `Uone jinsi CV yako inavyosomeka, na cha kurekebisha`

**(h) `:26`** — *"AI advice grounded in your real profile — never invented experience"* is **true to the code**
(`TRUTH_CONSTRAINT` in the prompt, anti-fabrication evals) but currently unreachable. Leave the
sentence; fix R2.

---

### R2 — Landing hero: the first sentence on the site promises a thing no stranger can do · **CHANGE**
`home-page-client.tsx:494-497`. Live in both languages on `/`, `/en`, `/sw`, and in the meta. It
advertises the AI writing the CV and then says no account is needed — while every AI route answers
**401** to a guest and sign-in answers **429**. Almost every visitor who arrives anywhere will read
this line first.

EN → `Paste the job advert. I'm Sumaiya — I'll help you write the CV that matches it, in Swahili, on your phone. Free to start, and sign in when you want me to do the writing.`
SW → `Bandika tangazo la kazi. Mimi ni Sumaiya — nitakusaidia kuandika CV inayolingana nalo, kwa Kiswahili, kwenye simu yako. Bure kuanza; ukinitaka niandike mimi, ingia tu.`

**Then the line two elements below it, `:531-533`**, because it now contradicts the hero:
EN → `No card. Nothing to pay. Your file is yours whether or not you sign in.`
SW → `Hakuna kadi. Hakuna malipo. Faili lako ni lako, ukiingia au usiingie.`

The strongest words survive — "No card. Nothing to pay." — and the false half ("no account") goes.
If the mailer fix (the 429) lands first, the hero edit is still right: the AI needs a session.

---

### R3 — `/pata-kazi`: the paid-traffic page that invents a statistic and promises an interview · **CHANGE**
This is a scan-landing page: short, emotional, aimed at someone who has sent applications and heard
nothing. That is the worst place in the product for a number nobody can check, and it is the page
most likely to be read by someone who is already hurting. Four edits, `pata-kazi/page.tsx`.

**(a) `:71-73` / `:75-77`** — delete *"Screeners filter 8 in 10 CVs sent"* / *"Wakaguzi huchuja 8 kati ya 10 CV zinazotumwa"*. Replacement:
→ EN: `It's not you — it's your CV. I build yours so a tired screener can read it in one pass, and so the boss sees the right things first.`
→ SW: `Si wewe — ni CV yako. Ninaijenga yako ili mtu anayechuja kwa haraka aisome kwa mpigo mmoja, na ili boss aone mambo sahihi kwanza.`

**(b) `:28`** — *"Rekebishwa kuendana na kazi unayoomba / Ili ipite wakaguzi na kumfikia boss"*
→ EN: title `Aimed at the job you apply for` · desc `The wording follows that advert, so a person reading it sees why you fit.`
→ SW: title `Inalengwa kwa kazi unayoomba` · desc `Maneno yanafuata tangazo hilo, ili anayesoma aone kwa nini unafaa.`

**(c) `:29`** — *"Pata usaili — Anza kuitwa na kufanya kazi"* / *"Get the interview — Start getting called and working"*
→ EN: title `Send it, and keep track` · desc `Yours to download, yours to send — and I'll remind you to follow up.`
→ SW: title `Tuma na ufuatilie` · desc `Ni yako kupakia na kuituma — nami nitakukumbusha kufuatilia.`

**(d) `:11-12`** — the meta description carrying *"builds a CV that passes screeners"* / *"inakujengea CV inayopita wakaguzi"*
→ EN: `Not getting called back? It's not you — it's your CV. I build a CV a tired screener can read in one pass. Free.`
→ SW: `Hukuitwa baada ya kutuma maombi? Si wewe — ni CV yako. Ninaijenga ili mtu anayechuja aisome kwa mpigo mmoja. Bure.`

The APK link on the same page (`:104`) is real — leave it.

---

### R4 — `/jobs`: the page title asserts a matching that has never happened · **CHANGE the copy, then ADD the fix**
`app/[locale]/(marketing)/jobs/page.tsx:18` renders in the browser tab and in the H1, and `:19-21`
in the Google/WhatsApp snippet. `job_recommendation` is empty for every user, so the promise is
about a mechanism that has produced nothing.

Title:
→ EN: `Jobs — browse openings, then see your match`
→ SW: `Ajira — vinjari nafasi, kisha uone ulinganifu wako`

Meta description:
→ EN: `Openings I've gathered from trusted sources. Browse them free, and once you have a CV here, see how you match each one.`
→ SW: `Nafasi nilizokusanya kutoka vyanzo vinavyoaminika. Vinjari bure, na ukishakuwa na CV hapa, uone unavyolingana na kila moja.`

Leave `jobs-feed.tsx:179-180` ("Sign in and build a free CV to unlock your match score") — it is the
one honest sentence on the surface; it just needs R2's sign-in fix behind it.

---

### R5 — The jobs feed shows a Tanzanian user Berlin · **ADD** (this is the real defect, and it is small)
`lib/api/routes/jobs.ts:97-117`. Not a copy problem: the data is there and the sorter cannot reach
it. Measured: **365** Tanzanian rows in `job` out of 1,304 (28%), **0 of the newest 100**, **200 of
the newest 300**. The route fetches `.limit(100)` newest-globally and *then* re-sorts in JS
(`homeMarketFirst`, `feed-filter.ts:189`), so it can only ever promote a Tanzanian row that already
happened to land in the newest 100 — and Arbeitnow's bulk inserts (`2026-09-21T03:00`) always beat
JobwebTanzania's (`2026-09-20T12:46`), so they never do.

**Minimum honest version — one of these, cheapest first:**
1. Do the partition in SQL, so the limit applies *after* the ordering the product wants:
   `ORDER BY (location ILIKE '%tanzania%' OR location ILIKE '%dar es salaam%') DESC, featured DESC, created_at DESC LIMIT 100`.
   One query, no JS resort, and the 100 rows are the 100 the user should see.
2. Or fetch the home market as its own query (`WHERE source_name = 'JobwebTanzania' OR location ILIKE … LIMIT 100`) and append the already-working rest after it.
3. Raising the JS-side fetch to 300 also works **today** (200 of the newest 300 are Tanzanian) but it depends on the insert ratio, so it is a band-aid, not the fix.

While this is unshipped, the Play listing's job line must stay changed (R1b) and `/jobs` must not
claim to lead with Tanzania.

---

### R6 — `/pro`: four claims the rest of the product refuses to make · **CHANGE two, ADD one, IMPROVE one**
`components/marketing/templatehub-pro-landing.tsx` — live at `/pro` (200, 133,296 bytes).

**(a) `:252`, `:258`** — *"Miundo 260+ / 260+ designs"* · **CHANGE**
→ EN: `47 designs, all of them free today`
→ SW: `Miundo 47, yote bure kwa sasa`
(266 sources exist; the product offers 47 and `/templates` says so in its own `<title>`. Publishing
a number the user can falsify in ten seconds is worse than publishing the smaller true one.)

**(b) `:240`, `:245`, `:333`, `:334`** — *"PDF inayopitishwa na mifumo ya kuajiri / an ATS-ready PDF"* · **CHANGE**
→ EN: `Download a clean PDF, or send it straight to WhatsApp`
→ SW: `Pakua PDF safi, au itume moja kwa moja kwenye WhatsApp`

**(c) `:279`, `:295`** — *"inafanya kazi bila intaneti / works offline"* · **CHANGE** (the landing page
already refuses this claim in writing, `home-page-client.tsx:677-685`, because the offline path has
never been tested in airplane mode)
→ EN: `uses the camera to read your certificates, keeps your work on the phone as you type, and updates itself`
→ SW: `inatumia kamera kusoma vyeti, inahifadhi kazi yako kwenye simu unapoandika, na inajipakia yenyewe`

**(d) `:533-534`** — *"The first 50 installers get a week of Sumaiya Pro"* · **ADD, or drop it**
The counter is honest (`{"taken":14,"seats":50,"remaining":36,"full":false}`) but it counts
**accounts**, not installers, and `profile.premium_until` is set on **0 of 15** accounts — the week
of Pro has never been given to anyone, and nothing in the tree grants it. Minimum version of the
offer: (i) a grant on the first 50 `profile` rows that writes `premium_until`, and (ii) a test that
reads it back. If that is not being built this week, use the copy that is true today:
→ EN: `I'm not taking any money yet. Install the app and use all of it while I'm building.`
→ SW: `Bado sipokei fedha. Pakua app na uitumie yote wakati ninajenga.`

**(e) `:578-579`** — *"7 days of Pro per friend"* plus the same lock in `premium-sheet.tsx:33` and
`premium-template-modal.tsx:100` · **IMPROVE** (see R7)

**(f) `:598-599`** — *"No payment is being taken yet"* is **TRUE** and is the note that makes the
rest of the page load-bearing. Leave it, and make sure it stays next to whatever replaces (d).

---

### R7 — The premium lock: a wall the user is told leads somewhere, with no one who has ever climbed it · **IMPROVE**
`premium-sheet.tsx:31-33`, `premium-template-modal.tsx:100`, `components/premium-template-modal.tsx`.
A new user picks a nice design, hits a lock, and is told the way through is to invite friends —
while `referral_claim` = **0** and `premium_until` is set on **0 of 15** accounts. The mechanism is
coded (`lib/referral.ts:128` → `grantPremiumDays`) and has never completed once.

**Improve, in this order:**
1. **Walk the loop once, end to end, against production data and assert on the server row** — create a code, claim it from a second account, activate it, and read `select premium_until from profile where id = <referrer>`. Assert it moved. Until that passes, nobody may say "earned by inviting friends" (this is the `verification-traps` §15 rule: a path never observed completing is not a path).
2. **While it is unproven, unlock the 7 flagships for everyone** (`PREMIUM_TEMPLATE_IDS` is 7 — that set is genuinely small). A paywall on 7 designs buys almost nothing and costs the trust of every user who hits it in a first run.
3. Only re-lock when (1) passes and there is a measured reason.

---

### R8 — Android first-run: three small untruths, plus one shut door · **CHANGE**
`apps/native/src/screens/first-run-screen.tsx`.

**(a) `:491-492`** — *"Six quick taps"* is **seven** (`:146-149`: intro, photo, fields, experience,
skills, recent, look), eight without a prefilled name. Drop the number rather than fix it — it will
drift again:
→ EN: `A few quick taps so I start knowing you — no typing your whole history.`
→ SW: `Migusiko michache ili nianze kukufahamu — bila kuandika historia yote.`

**(b) `:478`** — *"See all 224 designs"* is right for the app (6 + 218 registry keys) and the web
offers 47. A user who counts on both sees two products. Align the app's `look` step to the web's
curated set, or label it, so "see all" means one thing across surfaces.

**(c) `lib/cv-html.ts:36`** — EN *"Safe everywhere. Great for ATS."* · **CHANGE** to match its own
Swahili, which is already clean:
→ EN: `Safe everywhere. Good for employers.`

**(d)** The flow sits behind `!user ? <Auth> : …` (`root-navigator.tsx:245-262`). With OTP at 429,
**no new user reaches any of this.** Nothing to change in the copy; it is the reason R2 and the
mailer fix outrank everything under them.

---

### R9 — `/snap-to-apply` and `/ats-checker`: guarantees about other people's software · **CHANGE**
Two pages that name a mechanism the product does not control.

`snap-to-apply/page.tsx:11-13,18-19` — *"in 30 Seconds"* and *"pass the robots"*
→ EN title: `Tailor Your CV to Any Job — Free` · EN body: `...then a CV and a cover letter that speak the language of that job — free, no sign-up.`
→ SW title: `Lenga CV Yako kwa Kazi Yoyote — Bure` · SW body: `...kisha CV na barua ya maombi inayozungumza lugha ya kazi hiyo — bure, bila usajili.`

`ats-checker/page.tsx:69` — *"get an instant ATS score with the exact fixes to pass"*
→ EN: `Upload your CV and, in seconds, see how clearly it reads — and what to fix.`
→ SW: `Pakia CV yako na, kwa sekunde chache, uone jinsi inavyosomeka — na cha kurekebisha.`
The "Free · No sign-up" badge stays: it is true (paste-mode scoring runs in the browser).

---

### R10 — The in-app updater advertises the wrong version · **IMPROVE**
`curl https://sumaiya.app/api/app/update` → `"version":"1.6.22"`; `apps/native/app.json:5` is
`"1.6.25"` (versionCode 10625). The app tells a user on 1.6.22 they are current while three releases
have landed. "Updates itself" is only true if the manifest is right.
**Improve:** derive the served version from the release tag at build time, and add a gate that fails
when the deployed manifest version is behind the shipped `app.json` version.

---

### R11 — Dead copy that is one wire away from becoming a price · **IMPROVE (delete the keys)**
`lib/i18n/translations.ts:6,161` (`nav.pricing` = "Pricing"/"Bei") and `:52-55,208-211`
(`premiumActive`, `upgradeTitle` "Upgrade to Premium", `upgradeDesc` "Unlock PDF downloads…",
`seePlans`). Nothing renders them — the nav and footer gate pricing behind `PAYMENTS_ENABLED`
(`footer.tsx:18`, `marketing-nav.tsx:44`). Delete them rather than leave them: the next person who
builds a premium screen will reach for `upgradeTitle` and ship a price on a product with no rail.
`translations.ts:22-27` (`pricing.title` "Free right now" / "Bure kwa sasa") is honest and should
stay.

---

### R12 — `/pro/page.tsx:8` claims a root rewrite that is not deployed · **CHANGE** (one comment)
*"TemplateHub Pro — the page sumaiya.app serves at its root."* — the root serves the Swahili landing
page (200, 244,599 bytes, byte-equal to `/sw`). Fix the comment, and check `vercel.json`: either the
rewrite is missing or it was deliberately dropped, and the next agent will believe the comment.

---

### R13 — Make this class of defect impossible to re-introduce · **IMPROVE**
Every finding above is a sentence that drifted from the code. The repo already knows how to gate
numbers: it has en/sw parity tests, a Swahili lint (`lib/swahili-lint.test.ts`), and an
anti-fabrication eval suite. Add a claims test that asserts the numbers in user-facing copy against
their source of truth — 47 from `CURATED_CV_TEMPLATE_IDS`, 7 from `PREMIUM_TEMPLATE_IDS`, 29/27/17
from the template arrays — and a rule that no user-facing string may contain `260`, `200+`, or `8 in
10` without a citation in the same file. `CLAUDE.md:231` already proposes gating the docs' numbers
in CI; this is the same idea pointed at the copy.

---

## 4. The three claims I would delete outright

Not softened, not reworded — deleted, because each one is unfixable by editing the sentence around it.

### 1. *"Screeners filter 8 in 10 CVs sent"* / *"Wakaguzi huchuja 8 kati ya 10 CV zinazotumwa"*
`pata-kazi/page.tsx:71-77` (hero, both languages, and the voice of the whole page).
**Why delete:** it is an uncited statistic — I found no source, no citation, no methodology anywhere
in the repo — and it is the load-bearing sentence of a page whose only job is to make a discouraged
jobseeker believe you. A page that opens by asserting a research finding it cannot produce has
already spent the trust it was built to earn. There is no honest edit that keeps the number, and the
number is the hook; so the paragraph goes, and R3(a) replaces it with something the product can
actually do. **Note the specific sting:** the landing page prints *"No invented numbers here"*
(`:759`). Two pages, one brand, opposite promises about the same class of claim.

### 2. The "matched to you" jobs promise, wherever it appears
Play listing *"Find jobs that match your profile — Tanzanian roles first, then nearby nations"*
(`aso-play-store.md:32`), the listing's *"Made for Tanzania … local jobs first"* (`:24`), the page
title *"Jobs — Matched to Your CV"* / *"Ajira Zinazolingana na CV Yako"* (`jobs/page.tsx:18`), and
the meta *"scored against your CV"* (`:19-21`). **Why delete rather than reword:** re-wording keeps
the promise alive in slightly weaker words and keeps the user looking for a feature that does not
exist. The evidence is not marginal — `job_recommendation` is **empty for every user**, the default
feed is **0 Tanzanian of 100** while 365 Tanzanian rows sit unreachable in the table, no Tanzania
entry exists in the location filter, and the one sentence that honestly describes the gate ("sign
in … to unlock your match score") points at a sign-in that answers 429. Three independent layers are
empty. Delete the claim; ship R5 and re-add it once `job_recommendation` has rows for real users.

### 3. The invented design count — *"200+ professional designs"* (Play Store) and *"260+ designs"* (`/pro`)
`aso-play-store.md:29`, `templatehub-pro-landing.tsx:252,258`, and the `/pro` meta (`pro/page.tsx:32`).
**Why delete:** it is checkable in ten seconds by the exact user you want — the person deciding
between you and another CV builder — and the check fails. `/templates` renders *"Inaonyesha 1–12 kati
ya 47"* in its own `<title>`. 266 template *sources* exist and 47 are *offered*; the big number
describes a shelf the user cannot see. A gallery of 47 honest designs beats a claim of 200+ that the
first click disproves, and the smaller true number is the one that survives contact with the product.
(Same class, smaller blast radius, also worth deleting while you are in the file: *"Great for ATS."*
in `cv-html.ts:36` — its own Swahili sibling already says the honest version.)

---

## 5. What I could NOT verify

Listed plainly. I did not guess at any of these, and none of them is scored above.

1. **The quality of the AI's output.** I confirmed it is configured (`{"configured":true,"provider":"deepseek"}`) and that it refuses guests (**401**), but I could not get a signed-in session (OTP **429**), so I did not run a single real AI conversation. **"AI writes your CV" is unverified in both directions** — I cannot confirm it writes well, and I cannot confirm the device measurement that it deflects. Any verdict on AI quality needs one authenticated call.
2. **Whether an employer's ATS accepts the PDF.** No external ATS was run. The "passes ATS" claim is unverifiable by construction from inside this repo — which is why it should be deleted rather than tested.
3. **The photo-to-OCR round trip on a device.** `lib/api/routes/mobile-ocr.ts` and `apps/native/src/screens/app/scan-screen.tsx` both exist and look complete, but I have no device with the app installed and did not photograph a job poster. `/snap-to-apply`'s photo promise is unexercised.
4. **The Android app's offline behaviour.** `offlineStorage.init()` is called at startup and `/pro` claims *"works offline"*, but nobody has tested it in airplane mode — the repo says so itself (`home-page-client.tsx:677-685`, citing `docs/FEATURE-INVENTORY.md §5`). Untested means untested; the claim is the thing that is wrong.
5. **The privacy half of the Play listing.** *"Your data stays yours. Your CVs are private to your account."* I did not audit RLS policies, storage bucket permissions, or who can read another user's rows. `cv` is auth-gated at the route layer; that is not the same claim.
6. **"Your files are never stored"** (landing PDF tools band). I confirmed the endpoint works without sign-up; I did not inspect where an uploaded file lands or how long it survives.
7. **Any live referral payout.** `referral_claim` = 0 and `premium_until` set on 0 profiles, so there is no historical instance to inspect — the mechanism is only readable, never observed running. (Same shape of gap the repo's own `verification-traps` skill §15 describes.)
8. **Test-suite health.** I did not run vitest or jest. Every count in this document comes from reading the source, `curl`, or SQL — not from a suite.
9. **Whether the founders' seats count is even meaningful.** `taken` is `count(*) from profile` cached for 5 minutes; the API said 14 while the table held 15. I did not determine what "early access" is *supposed* to count, the API or the install.
10. **Play Store state.** There is no listing to inspect (the ASO file is a draft). I cannot check what a user would actually read in the store today, whether screenshots exist, or whether the listing is live at all.

---

## 6. Appendix — the claims that held up, for the record

These I exercised and they did what the copy says. Stated so the defects above stand out, and so
nobody "fixes" one of these by accident.

| Claim | Evidence |
|---|---|
| "47 looks" for CVs (`home-page-client.tsx:838`) | `CURATED_CV_TEMPLATE_IDS` = 47; live gallery: "Inaonyesha 1–12 kati ya 47" |
| "27 looks" cover letters, "29 designs" cards, "17 looks" letters | 27 id union in `components/templates/cover-letter/index.tsx:21`; 29 entries in `BUSINESS_CARD_TEMPLATES`; 17 in `LETTER_TEMPLATES` |
| "Your PDF is made on your phone" | `lib/pdf.ts:247-248` dynamic `html2canvas` + `jspdf`, client-side |
| "No account in the way" for the guest CV editor | `/editor/cv/try` → 200, no redirect; `/dashboard` → 307 proves the gate exists elsewhere |
| "Can I get a Word (DOCX) file? — Yes" | `lib/docx.ts`, wired at `cv-editor-client.tsx:1640` and `cv-assistant-client.tsx:38` |
| "Is Sumaiya really free? … Payments are not switched on at all yet" | `PAYMENTS_ENABLED = false` (`lib/features.ts:8`); `payment` 0 rows, `subscription` 0 rows |
| "No invented numbers here" (landing PROOF band) | `TESTIMONIALS = []`, `CVS_CREATED = 0` (`lib/testimonials.ts:35,39`); band self-hides |
| "Or download the free app" / "Get the Android app" | `curl -L` → 308 → GitHub release asset, 44,762,304 bytes, `application/vnd.android.package-archive` |
| "Free · No sign-up" on the CV check | paste-mode scoring is client-side (`lib/ats-text.ts`); the upload path needs no session (`/api/tools/extract-text` → 200 in my run) |
| "Learn the skills your target role needs" | `learning-hub-screen.tsx` + `lib/learning-resources.ts` (51 URLs) via `resourcesForGaps` |
| "The app is not on Play Store yet / Play Store soon" | `aso-play-store.md:65` still lists Play Console access as outstanding |
| "No payment is being taken yet" (`/pro`) | 0 `payment` rows; `PAYMENTS_ENABLED=false` |
| "Free right now" pricing copy (`translations.ts:22-27`) | same three facts as above |
| The AI is really configured | `GET /api/ai/status` → `{"configured":true,"provider":"deepseek"}` |
| The job feed is real, and so are Tanzanian jobs | `job` = 1,304 live rows, 365 Tanzanian, 352 from JobwebTanzania, 13 from Ajira Portal |
| The early-access counter is real | `GET /api/stats/early-access` → `{"taken":14,"seats":50,"remaining":36,"full":false}`, computed from `count(*) from profile` |

**One sentence for the founder.** The product is more honest than it looks — the landing page, the
FAQ, the free-tools band and the testimonials file are all telling the truth, and someone has
clearly been through them with a red pen already. The lies are concentrated in the four places
nobody re-read after the code changed: **the Play listing, the hero line above the fold, the
paid-traffic page, and the jobs surface** — and the jobs defect is a `LIMIT 100` applied before a
sort, not a missing feature. 365 Tanzanian jobs are sitting in the table behind a query that cannot
see them.

