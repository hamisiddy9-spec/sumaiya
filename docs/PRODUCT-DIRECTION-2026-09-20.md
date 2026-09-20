# Sumaiya — product direction: screens, features, implementation, and the retention loop

**Date:** 2026-09-20 · **Repo:** `C:\Users\hamis\projects\sumaiya` (`main` @ `cb29d9f`, 11:12:52 +0300)
**Live:** https://sumaiya.app · **Author:** an agent working under the user's directive:
*"research screens na features na how best to implement those features, make sure the AI is hands on,
mtu akiingia hatoki"* — research the screens and features, and how best to implement them; make the AI
hands-on; and once a person enters, they do not leave.

**The last clause is the requirement. The rest is the method.** This document is organised accordingly:
retention first (§1), then the screens and features that serve it (§2), then how to build them (§3),
then where the AI is actually active (§4), then the week (§5).

**Baseline not repeated here:** `docs/FEATURE-INVENTORY.md` (measured 2026-09-19 at `aee08ae`) and
`docs/RESEARCH-2026-09-20.md` (competitive teardown at `babbe55`). Read those first. This document only
adds what they do not contain: the retention argument, the outcome loop, and today's live-state evidence.

## 0 · How to read the evidence

| Marker | Means |
|---|---|
| **OBSERVED — live, today** | I ran the command or fetched the URL in this session and quote the output verbatim. Timestamps in Africa/Nairobi. |
| **OBSERVED — source** | Read in the working tree, cited `file:line`. |
| **MARKET** | A third-party claim with a URL. Labelled if I read it only through a search index rather than the page itself. |
| **JUDGEMENT** | My reasoning. Not a fact. Stated as such. |
| **UNVERIFIED** | I could not establish it. Never presented as known. |

**What I could not do, stated up front:** the browser tooling (Playwright-over-CDP) timed out twice at
420 s, so I did **not** click through the guest journey by hand — §1.2 is reconstructed from the live
HTTP responses at each step plus the source that renders them, and each step says which. I did not
connect to the Pixel (`10.229.114.105:5555`), did not build or install the APK, and did not query the
production database. Anything about the phone is quoted from `apps/native/QA-REPORT-2026-09-11.md` or
the context I was given, and labelled.

**The tree is moving.** `git status --porcelain` showed 20 modified files at 11:13 — native UI
components, `cv-editor-client.tsx`, and six files under `apps/web/components/templates/`. Four other
agents are working the same checkout (Swahili audit, CV photo, campaign/attribution, device QA). Nothing
here proposes touching their files; §3 names them as gates instead.

---

# 1 · Retention first

## 1.1 The moment a person first feels Sumaiya is worth something

**The moment is when the preview pane shows a finished-looking CV with their own name in it. Not before.**
Everything upstream — the form, the template list, the marketing page — is cost. That single screen is
the entire first payoff, and in a CV product it is structurally the *last* thing a blank-start user
reaches.

**Where that moment currently happens, and how far away it is:**

| Entry | Steps to the payoff | Evidence |
|---|---|---|
| Web guest, blank start | Land → **default tab is the form, not the preview** → type a whole CV → switch to Preview tab | `cv-editor-client.tsx:999` → `useState<"edit" \| "preview" \| "design">("edit")`; the preview panel is `hidden` unless that tab is active (`:3108`) |
| Web guest, "Anza na mfano" | Land → tap **Start from an example** → switch to Preview → *now* it looks like a real CV | `cv-editor-client.tsx:3076` button, `loadExample` at `:1236`; the button is in the **edit** panel (`:3062`) |
| Native APK | **Cannot happen.** No guest mode: the whole app is behind an account | `apps/native/src/navigation/root-navigator.tsx:245` → `) : !user ? (` (quoted in `RESEARCH-2026-09-20.md` §2 and re-read in the tree) |

So the product's fastest route to its own aha moment is already built, already Swahili, already in the
first paint — **and it is one tab away from where a phone user lands.**

I verified the "already in the first paint" part, because it matters:

```
$ curl -sL -m 30 -A "Mozilla/5.0" -w "%{http_code} bytes=%{size_download}\n" https://sumaiya.app/editor/cv/try
200 bytes=76362
$ grep -c "Anza na mfano" /c/Users/hamis/AppData/Local/Temp/guest.html
1
$ grep -o 'lang="[a-z-]*"' .../guest.html | head -1
lang="sw"
```
**OBSERVED — live, 11:14 EAT.** The guest editor is server-rendered in Swahili, and the example button
and the download button are both present in the initial HTML. The distance to the payoff is one tab
switch and one tap — not a rebuild.

**JUDGEMENT:** the highest-leverage retention change in this product may not be a new loop at all. It is
putting the *filled* example CV on screen at first paint, ahead of the blank form, for guests on small
screens. Rank: highest confidence in this document, because it needs no new data and no new backend.

## 1.2 Walking the real guest journey — where it loses people

Each step below is the live behaviour today. "Live" means I fetched it; "source" means I read the code
that produces it.

| # | Step | What the person sees | Evidence |
|---|---|---|---|
| 1 | Lands on `https://sumaiya.app/` | Swahili homepage. `https://sumaiya.app/` and `https://sumaiya.app/sw` return **byte-identical** HTML (`md5 d4732892c16348af2192945b6301ed20`, 241,891 bytes each, `lang="sw"`) — Swahili-first by default, which is right | OBSERVED — live (two fetches, 10:50 and 11:13) |
| 2 | CTA to the guest editor | `/editor/cv/try` → **200**, 76,362 bytes | OBSERVED — live |
| 3 | Guest editor, phone | Default tab is **edit**; a blank form; the CV preview is behind the Preview tab | OBSERVED — source (`:999`, `:3108`) |
| 4 | Blank start is the default data | `data: createEmptyCVData()` — every array empty, no sample rows | OBSERVED — source, `app/(app)/editor/cv/try/page.tsx:45`; `createEmptyCVData` in `types/index.ts` |
| 5 | If they pick "Anza na mfano" | The CV fills in; `CvStrengthMeter` starts scoring it (`:3060`); autosave stashes to `localStorage["sumaiya-guest-cv"]` (`:1279`) | OBSERVED — source |
| 6 | Export | PDF / Word / text / share all fire, then the sign-up sheet appears **after** delivery — the prompt literally says "Your CV is saved on this device" | OBSERVED — source, copy at `cv-editor-client.tsx:103-110` |
| 7 | The jobs tab | **"0 kazi"** — the live page says *"Bado hakuna nafasi zilizoorodheshwa. Rudi hivi karibuni — tunaongeza nafasi mpya."* and gates matching behind sign-in: *"Ingia na uunde CV yako bila malipo ili kuona alama zako za kufanana kwa kila kazi."* | OBSERVED — live, text extracted from `https://sumaiya.app/sw/jobs` (11:13 EAT) |
| 8 | The jobs API | `GET /api/jobs?limit=5` → `{"success":true,"data":[]}`; `GET /api/jobs?status=published` → `{"success":true,"data":[]}` | OBSERVED — live, twice |
| 9 | Any AI action as a guest | **401 Unauthorized** | OBSERVED — source: `lib/api/routes/ai.ts:117-118` (`/enhance` requires `getUserId`) |

### The drop-off points, named

**D1 — The native app has no door.** Every screen is behind `!user ? <Auth/>` (`root-navigator.tsx:245`).
The platform the brief calls "the real product" asks for an account before it shows a single thing. This
is not a leak in a funnel; it is a wall in front of it. The web proves the alternative works live today
(step 6 above). **Highest-impact, 4 days, spec already written** (`RESEARCH-2026-09-20.md` §3 item 9).

**D2 — The aha moment is behind a tab.** Confirmed twice over: the guest lands in the form
(`cv-editor-client.tsx:999`), and the preview panel is CSS-hidden on small screens unless the Preview tab
is active (`:3108`). **JUDGEMENT:** on a phone this is the single largest avoidable loss, and it is a
one-file change.

**D3 — The Swahili URL 404s.** `/editor/cv/try` → 200. `/sw/editor/cv/try` → **404** (observed live, twice).
Every marketing page is locale-prefixed (`/sw/jobs`, `/sw/templates`, `/sw/ats-checker` all 200), so a
Swahili user who pattern-matches the URL structure — or forwards a `/sw/...` link into a WhatsApp group —
lands on a 404. **JUDGEMENT:** small blast radius, near-zero cost to fix (a redirect), and it is exactly
the "expensive data, cheap phone" case: a 404 costs a page-load worth of a bundle.

**D4 — The AI is locked at the moment of conversion.** The live Swahili homepage promises
*"Msaidizi wako wa AI anayekuandikia CV, kuilenga kwa kila kazi…"*. Inside the guest editor every AI route
returns 401 (`ai.ts:117-118`). **The irony is documented in the code:** `/enhance` already has a
keyless deterministic fallback — `generateLocalEnhancement` when no provider answers, so that "the
editor's Enhance never blocks" (`ai.ts:143-152`). The fallback exists; guests just can't reach it.

**D5 — The jobs tab is a dead end that tells the user to come back later.** Live copy: *"Rudi hivi
karibuni"* ("come back soon"). In retention terms that is the product actively teaching the user it has
nothing. And the underlying cause is visible in the code: `lib/api/routes/jobs.ts:53` filters to
`LIVE_STATUSES` (published/expiring); `lib/jobs/lifecycle.ts:21-45` expires any listing that has not been
re-verified for `VERIFY_GRACE_DAYS = 30` (`lib/jobs/constants.ts:6`); and the daily ingest cron refuses
to run without `CRON_SECRET` (`app/api/cron/jobs/route.ts:18-21`). **INFERENCE (not verified — I have no
DB access):** the most likely cause of an empty feed is that ingestion stopped and the 30-day grace
expired every row. The confirmed half is the observed empty feed, not the cause.

**D6 — The nudge engine cannot reach the people who used it.** `dispatchSignalsForAllUsers` selects
distinct `cv.userId` — i.e. only signed-in users who own a saved CV — capped at 200 per run
(`lib/notify/dispatch-signals.ts:144-149`). A guest who built and downloaded a CV tonight is not a row
anywhere, so nothing ever calls them back. The one thing a guest proved — "this gave me a CV" — is not
remembered.

**D7 — The outcome question is buried four levels deep.** "Any news from {company}?" exists and is good
(`components/dashboard/outcome-check.tsx`), but it renders in exactly one place: `application-workspace.tsx:451`,
which is reached only from `/applications/[id]`, which is reached only from `/dashboard?tab=applications`,
only when signed in, only for applications created *inside* Sumaiya, and only once
`status ∈ {applied, interviewing} && days ≥ 4` (`outcome-check.tsx`, `relevant` computation).

**D8 — On the phone, the outcome data never leaves the device.** The native tracker is a local SQLite
store with its own status vocabulary — `saved | applied | interview | offer | closed`
(`apps/native/src/lib/applications-store.ts:13`) — while the server's `application` table uses
`draft | applied | interviewing | offer | rejected | archived` (`lib/api/routes/applications.ts:20`;
`APPLICATION_STATUSES` at `lib/applications.ts:41`). There is no sync path: `POST /api/mobile/apply`
is a *tailoring* endpoint (`lib/api/routes/mobile.ts:168-187`), not a tracker write. **So a native user's
outcome — the asset §1.5 says is the whole moat — is invisible to the server, permanently.**

**D9 — Web pushes all land on the chat page.** `webDeepLink()` returns `/assistant` for every signal
type, with a comment explaining that every signal is surfaced inside the assistant chat
(`dispatch-signals.ts:76-78`). So a nudge about a job deadline opens a conversation, not the job. And the
last device QA recorded that the composer on that screen did not accept taps (`QA-REPORT-2026-09-11.md`
P0-2 — against a since-deleted backend, so current state unknown).

## 1.3 Why a person does not come back — the episodic problem, quantified

**MARKET.** Job boards are structurally forgettable because demand is episodic: *"Job seekers search for
work once or twice per year"*, and both sides *"arrive with urgent intent, do what they came for, and
leave"* — https://cavuno.com/blog/job-board-retention (read through the search index; the page itself
was unreachable from this host). The same framing describes job boards as living in the "forgettable
zone" — https://www.linkedin.com/posts/cavuno_the-job-board-retention-playbook-frameworks-activity-7447417319540297728-js0L

**MARKET — the volume that makes reminders rational.** US surveys put the application-to-interview ratio
at roughly **42 applications per interview (2.4%)** (https://blog.fastapply.co/how-many-applications-to-get-an-interview-2026)
and **~63 applications with 4.76 interviews (~13:1)** in a 1,000-person survey
(https://www.lifeshack.com/resources/job-search/how-many-applications-does-it-take-to-find-a-job-in-2025/).
The US Bureau of Labor Statistics measures this directly in the CPS job-search supplement —
https://www.bls.gov/opub/btn/volume-9/how-do-jobseekers-search-for-jobs.htm (I could read only the PDF's
head and tail; the figures I quote above are the secondary sources, not BLS). **These are US numbers and
I am labelling them as such** — there is no Tanzanian equivalent I could find, and inventing one would be
worse than not having it. What transfers is the direction, not the digits: *a person with 30 open
applications cannot remember which ones went quiet, and most of them will.* A follow-up reminder and an
outcome question are therefore not engagement bait — they are the only two things a jobseeker genuinely
cannot do for themselves at that volume.

**MARKET — the Tanzania context that decides the design.** Mobile is the whole market: 56.3M active
internet subscriptions by September 2025, internet penetration 87% of the population, and **over 99% of
users reach the web through a phone**, per TCRA's September-2025 statistics report as reported at
https://techafricanews.com/2025/10/20/tanzania-records-56-3-million-internet-users-as-connectivity-reaches-87-of-population
Total telecom subscriptions reached 106.9M by December 2025 —
https://tanzaniainvest.com/telecoms/tcra-telecom-stats-q4-2025. Mobile money is the payment rail, not
cards: active mobile-money subscriptions rose 24.74% to **75.78 million** with **1.98 million agents**
(Bank of Tanzania, National Payment Systems Annual Report 2025, PDF —
https://www.bot.go.tz/Publications/Regular/Annual%20Report/en/2026060211494565.pdf; **read through the
search index, not first-hand — the extractor blocked this host**).

**Data is the tax on every return visit.** A 2 GB entry-level mobile-broadband basket cost **4.8% of
monthly GNI per capita** in Tanzania in 2025 (ITU figure via https://africa-api.com/data/tanzania/mobile-data-price
— snippet only; the page would not load here). Where mobile broadband exceeds 10% of monthly income,
the share of internet users is typically **less than one third of the global average** — ITU,
*The affordability of ICT services 2023*, https://www.itu.int/en/ITU-D/Statistics/Documents/publications/prices2023/ICTPriceBrief2023.pdf
A 2023 Tanzanian analysis put the cost of 5 GB at **12× the income share** the Alliance for Affordable
Internet recommends — https://thechanzo.com/2023/01/20/heres-why-costs-of-data-in-tanzania-are-high/
(**snippet only; the site did not resolve from this host**).

**MARKET — WhatsApp is the interface, not a channel.** In a 2025 study of voters in Busega District,
Tanzania, **WhatsApp was the most-used platform for engagement, preferred by 53.3% of participants**
(Instagram 20%, Facebook 16.7%, X and TikTok ~10%) —
https://ideas.repec.org/a/bhx/ojtjts/v7y2025i3p1-11id2656.html. **Caveat, stated because it matters:**
this measures platform preference in a *political-engagement* study, not job-search behaviour, and I
found no Tanzanian job-search channel study at all. It is evidence that WhatsApp is where Tanzanians
conduct consequential conversation; it is not evidence about how they look for work.
**JUDGEMENT:** that is still the strongest constraint on this design. A loop that needs the user to open
an app and browse will lose to a loop that arrives as a message.

**What the Tanzanian labour market actually looks like (and why "unemployed" is the wrong lens).**
ILO-modelled youth unemployment for Tanzania is **2.38% in 2025** (FRED series SLUEM1524ZSTZA —
https://fred.stlouisfed.org/series/SLUEM1524ZSTZA). **JUDGEMENT:** that number is low because most
Tanzanian work is informal and self-employment, not because everyone has a good job — it is a modelled
rate and it is not a measure of under-employment, of the search for *better* work, or of how long a
search takes. It matters for retention because it means the target user is often **employed and
searching intermittently**, not unemployed and searching continuously. The user who comes back is not
"the unemployed one"; it is "the one with something to gain from changing jobs, plus the one who just
finished school". The product must be worth opening in both states.

## 1.4 The loops that make returning rational — judged against what the code can do today

Five candidate loops. For each: what pulls the person back, whether the code can support it **today**,
why it works for a Tanzanian jobseeker on a cheap phone with expensive data, and what makes it fail.

### L1 · "A new job matched you" — PROVEN MECHANISM, STARVED OF DATA

- **Code, today:** `job.newMatch` signal, priority 85, requires a listing posted within
  `newMatchDays = 3` and a match score ≥ 40 (`lib/assistant/signals.ts:148-165`, thresholds at `:83-86`).
  Recommendations refresh nightly and push dispatch runs at 07:00 (`vercel.json`).
- **Why it works here:** it asks nothing of the user. It is the only loop on this list that is worth a
  push notification on its own merits, and it is the standard reason a jobseeker opens a board.
- **Why it fails today:** the feed is **empty** — `GET /api/jobs?limit=5` → `{"success":true,"data":[]}`
  (observed twice, live). A matcher with nothing to match is not a loop; it is a daily reminder that the
  product has no jobs.
- **Second-order failure to note before anyone builds on it:** a fresh listing is only "fresh" for 3 days
  (`signals.ts:152`), while the only Tanzanian source publishes a handful of adverts a week
  (measured: **10 items** in https://www.jobwebtanzania.com/feed, newest dated Fri 18 Sep 2026 —
  observed live, 11:20 EAT). A 3-day freshness window on a low-frequency source produces near-zero
  triggers. And `appliedFor()` matches a job to an application by exact `title|company` string equality
  (`signals.ts:99-102`), so anything the user applied to outside the feed will be re-announced.
- **Cheap mitigation available today:** the `job` table already supports admin-curated rows with a
  `featured` flag and a `published` status (`lib/db/schema.ts:313-366`; `lib/api/routes/jobs.ts:155-206`
  exposes the admin status patch). Twenty hand-entered real adverts would make the loop testable before
  the pipeline is fixed.

### L2 · "Time to follow up" — EXISTS, BEST ENGINEERED, WRONG PLATFORM

- **Code, today:** `application.followUp`, priority 80, fires when an application has sat in `applied`
  for ≥ `followUpDays = 7` (`signals.ts:189-205`). It has its own dedicated cron at 08:00
  (`vercel.json`) and its own idempotency column — `application.followUpRemindedAt` exists specifically
  so the reminder goes at most weekly per job (`lib/db/schema.ts:255-257`). It is the only signal with
  its own claim column.
- **Why it works here:** by the US data above the user has dozens of silent applications; a follow-up is
  one of the few low-cost actions with a real chance of a reply, and the message is short enough to send
  from a phone. In a market where hiring runs through WhatsApp and email, "follow up" is culturally
  legible in a way "optimise your ATS score" is not.
- **Why it fails today:** it fires only for `status === "applied"` on the **server** `application` table
  (`signals.ts:190`). Native users track applications in local SQLite with a different vocabulary
  (`applications-store.ts:13`) and never sync (D8) — so every phone user, i.e. the product's actual
  market, is exempt from its own best loop.

### L3 · "Did you get the interview?" — THE UNIQUE ASSET, MIS-WIRED

- **Code, today:** more of this exists than the brief suggests. There is a `outcome.record` capability
  (`lib/assistant/tools.ts:94` declares `policy: auto`, `cost: none`, **`offline: "queue"`**; the tool
  definition is at `:418-422`), a UI that asks the question with four one-tap answers — got an
  interview / got an offer / I got hired / not this time (`components/dashboard/outcome-check.tsx`),
  an `outcome_event` table storing a **salted hash of the user id** rather than the user id
  (`lib/db/schema.ts:457-470`), and an aggregation layer that already defines the analyses
  (`lib/outcomes/aggregate.ts`: `aggregateTailorLift`, `aggregateMatchOutcome`, `aggregateNudgeEfficacy`,
  `aggregateConfirmationRate`, `insightsOverview`).
- **What is wrong with it:** placement (D7), identity (D8), and vocabulary. `hired` is accepted by
  `outcome.record` but is **not a legal application status** — the enum is
  `draft|applied|interviewing|offer|rejected|archived` (`lib/api/routes/applications.ts:20`,
  `lib/applications.ts:41`). So the terminal, product-defining outcome can be recorded as an event but
  the tracker can never display it back to the user as their own state.
- **Correction to my brief:** I was told "there IS an `outcome_report` table". There is not — grepping
  the whole tree for `outcome_report` and `outcomeReport` returns **nothing**. What exists is
  `outcome_event` (`schema.ts:457`). The distinction matters: an append-only event log is the right
  shape for analytics and the wrong shape for "show me my own result" — which is part of why the loop
  has never closed for a user.

### L4 · "Your CV is stale for this advert" — IMPLEMENTED, STRUCTURALLY DEAD FOR TANZANIAN JOBS

- **Code, today:** `cv.tailor` signal, priority 90 (the highest non-trust signal), fires for a job with
  an `applicationDeadline` inside 14 days that the user has not applied to (`signals.ts:169-186`).
- **The defect:** line `:170` is `if (!job.applicationDeadline) continue;`. The only Tanzania-specific
  source does not produce deadlines — `jobwebTanzaniaAdapter` (`lib/jobs/sources/jobwebtanzania.ts`)
  returns no `applicationDeadline` field, and `normalizeRawJob` therefore stores `null`
  (`lib/jobs/sources/registry.ts:86` → `applicationDeadline: raw.applicationDeadline ?? null`).
  **The deadline-driven urgency nudge can never fire for a jobwebtanzania listing.**
- **JUDGEMENT:** this is the highest-value *fix* in the loop set, because a real closing date is the only
  legitimate source of urgency the product has that is not manufactured. It is a parser addition over
  advert text already fetched, not a new data source.

### L5 · Interview prep — EXISTING, CORRECTLY DEPRIORITISED, RIGHT AS A PAYOFF

- **Code, today:** `/interview` and `POST /api/ai/interview-turn` (`lib/api/routes/ai.ts:355`), plus a
  native mock interview. `RESEARCH-2026-09-20.md` §4 item 1 says explicitly: do not invest in interview
  copilots now, because the front door is broken.
- **Agreement, with a boundary:** prep is not a retention loop (nobody opens an interview coach on a
  Tuesday). It is the **payoff** of the outcome loop — "you said you have an interview; here is today's
  three questions for that particular employer". Keep it uninvested-in as a standalone; wire it as the
  reward for answering.

### L6 · Skill gap → a named course — GOOD IDEA, THIN INPUTS

- **Code, today:** `career.skillGap` signal, priority 50, names the specific missing skills when it can
  by diffing the JD's known-tool lexicon against the CV's own terms (`signals.ts:246-287`), so a nudge
  that says "Excel" can be matched to the exact course in the Learning Hub
  (`apps/native/src/screens/learning-hub-screen.tsx`, `src/lib/short-courses.ts`).
- **Why it works here:** it converts the most demoralising event in the funnel — silence — into a
  concrete next action, which is what keeps a person from quitting the process entirely.
- **Why it fails:** it needs a JD with a recognised tool vocabulary (`analyzeJob`), a CV with terms to
  diff, and a course that exists for the named skill. All three must line up; the code guards each with
  a try/catch and falls back to a vaguer nudge, which is honest but weaker.

## 1.5 The loop to build: close the outcome, and let it pay the user back

**The unique asset is not the CV builder and not the AI. It is that Sumaiya is the only place in Tanzania
that can know whether a person got the job.** `lib/db/schema.ts:457-470` and
`lib/outcomes/aggregate.ts` already exist to hold that knowledge; today almost nothing reaches them
(§1.2, D7/D8). No global competitor can copy this, because none of them have a Tanzanian application
ledger with a response attached, and the local human competitor (Mabumbe at TZS 30,000–180,000 per CV —
`RESEARCH-2026-09-20.md` §1b) sells a document, not a track record.

### The loop, in four beats

**Beat 1 — Ask at the one moment the answer is known.** One sheet, four one-tap answers, exactly as
`outcome-check.tsx` already renders it. Do not rebuild it. **Move it**: render the ask inline on the
application card in the list (§2, S1) so answering requires no navigation, and make it reachable from a
push notification that opens the sheet directly.

**Beat 2 — Ask on the employer's clock, not the app's.** Cadence: day 7, day 14, day 30 after the
application, then stop. Cap at three asks. **"No answer" is a first-class outcome**, recorded and never
punished — in a market where most applications die silently, an unanswered ask is the norm, and a design
that treats silence as failure will lose the user. (The existing `followUpRemindedAt` column,
`schema.ts:257`, is the precedent for per-application cadence tracking.)

**Beat 3 — Every answer immediately changes what the app does next.** This is what makes the question
worth answering, and it is where the AI becomes hands-on (§4):

| Answer | Immediate action | Code it reuses |
|---|---|---|
| Got an interview | Ask for the date → set a reminder → offer three questions for **that** employer's advert | `POST /api/ai/interview-turn` (`ai.ts:355`); existing interview prep |
| Got an offer | Congratulate; list what to check before signing (no legal advice) | new static content, no backend |
| I got hired | Ask permission to use the story anonymously + offer a referral code | `lib/referral.ts`, `lib/entitlements.ts` — **7 days of Premium per activated friend already ships** |
| Not this time | Ask one question — "what did they ask?" — and return a **named** gap plus the course for it | `signals.ts:246-287` skill-gap logic; Learning Hub |

**Beat 4 — Pay it back where credibility is highest.** The instant a user reports "I got hired" is the
only moment they will gladly tell someone else. That is where the existing referral loop should live,
instead of behind a generic "invite a friend" screen (`apps/native/src/screens/invite-screen.tsx`).

### What Sumaiya accumulates, and why it is not copyable

A per-application outcome ledger: advert → CV version and its score → application → response →
interview → offer / hired / rejected, with a timestamp at each step. From that, three things nobody else
in this market has:

1. **Response rates by role, employer, region and sector** in Tanzania. This is the honest answer to
   "which CV, which template, which channel actually works" — computed on the aggregate layer already
   built (`lib/outcomes/aggregate.ts`).
2. **Personal evidence for the user.** "You have applied 12 times, heard back 3 times, interviewed twice."
   That is a reason to open the app on a day with **no new jobs** — which is every day, given L1's supply.
3. **A ranked wish-list of employers to cover**, which is the only defensible way to fix the empty feed
   without scraping: go get the employers whose adverts actually get responses.

**Privacy position, already decided in code and worth keeping:** the ledger stores a SHA-256 of the user
id plus a PII-free payload (`schema.ts:457-470`, `lib/outcomes/types.ts`), and per-user aggregation still
works. Agreement reporting is opt-in via the same flag as analytics (`user_profile.analytics_opt_out`,
referenced at `schema.ts:229`).

### Skeptic's table — why each loop could fail here, and what the design must do about it

| Risk | Concrete form | Design response |
|---|---|---|
| A new user has nothing to report | The outcome loop is empty for someone who has never applied | Gate the ask on a real application event, never on time-in-app. The first session's job is a CV, not a survey |
| Silent employers make "unanswered" the norm | 3 asks, 0 answers | Record "no answer" as an outcome; never show it as a failure; stop after 3 |
| Data cost | 2 GB = 4.8% of monthly GNI per capita (ITU via africa-api.com) | Every loop must complete **from a notification**, without opening a page. Answers are one tap; `outcome.record` is already declared `offline: "queue"` (`tools.ts:94`) |
| Cheap phone, no connection that day | The user cannot answer when asked | Queue the answer client-side and sync later; the native store is already SQLite-first (`applications-store.ts`) |
| Push may not be deliverable | Native push needs a device token; web push needs a permission | Never make the loop depend on push alone: the ask must also be on the screen the user already opens (§2, S1) |
| WhatsApp is 53.3% preference (Busega District study, repec — and it is a political-engagement study, not a job-search one) | The user would rather answer in WhatsApp | **NOT BUILT — flag honestly.** A WhatsApp worker exists (`apps/whatsapp/src/`, `POST /api/whatsapp/turn`) but Meta provisioning is an owner task; do not plan the loop around it until it is provisioned |
| Asking too often destroys trust | Four pushes in a month | Cooldowns already implemented for six signal types (`dispatch-signals.ts:31-38`: 3–5 days) and a cap of 2 notifications per user per run (`:28`). Reuse the pattern; add the outcome types with 7/14/30-day cadence |
| An empty feed makes every loop look dead | `data: []` today | Fix ingest (or seed 20 curated adverts) **before** tuning any nudge, or the first experience of the loop is evidence the product is empty |

## 1.6 What "mtu akiingia hatoki" reduces to

**JUDGEMENT, stated plainly:** no single feature makes a person stay. In this product, retention is the
product of four things, in this order of dependency:

1. **A door with no lock** (D1) — nothing else can retain a user who never got in.
2. **The aha moment on first paint** (§1.1, D2) — the filled CV, before the blank form, on the phone.
3. **A reason to come back that requires no supply from us** (Beat 3: the outcome answer pays the user
   back immediately) — because supply (L1's job feed) is the thing we cannot guarantee.
4. **A record the user owns** (the ledger summary, "you applied 12 times, 2 interviews") — the only
   asset that is worth opening on a day when nothing new arrived.

The order is the plan. §5 is this list, sequenced.

---

# 2 · Screens and features

Not a wishlist: each item names the loop it serves. Costs are **JUDGEMENT** in focused days for the
person who owns this codebase. Priority: **P0** = without it the retention argument is false; **P1** =
strengthens a P0; **P2** = only after the P0s are live and measured.

## 2.1 Screens

| # | Screen | Problem it solves | Reuses | Cost | Priority |
|---|---|---|---|---|---|
| **S1** | **Kazi Yangu — the application ledger**, a first-class tab (not `?tab=applications`) | D7: the outcome ask and the user's own record are four levels deep. Buttons go **on the list card** so the answer needs no navigation | `components/dashboard/applications-grid.tsx`, `application-workspace.tsx`, `outcome-check.tsx`; native `applications-screen.tsx` + `applications-store.ts` | 1.5 | **P0** |
| **S2** | **Home = today's one answer** | An empty home teaches the user the product is empty (live `/jobs` says "come back soon"). One card, in priority order: outcome owed → follow-up due → strongest new match → "your CV is ready to send" | `lib/assistant/signals.ts` + `lib/daily-brief.ts` (both already deterministic and tested); native `home-screen.tsx:129-137,173-178` already renders `topSignal` | 1 | **P0** |
| **S3** | **Guest mode on the phone** (native parity with `/editor/cv/try`) | D1: the APK's first ask is an account. Purely a port — web has the design, the local draft and the sign-in migration | `app/(app)/editor/cv/try/page.tsx`; `localStorage["sumaiya-guest-cv"]` (`cv-editor-client.tsx:1279`); `app/(app)/migrate-guest/page.tsx`; `lib/migrate-guest-failure.ts` | 4 | **P0** |
| **S4** | **First paint = the filled example, not the blank form** | D2: on a phone the guest lands in the form (`:999`) with the preview hidden (`:3108`) | `loadExample` (`:1236`) + the existing example card (`:3062`) — reorder, don't rewrite | 0.5 | **P0** |
| **S5** | **Jobs screen with an honest floor** | D5: the live jobs page sells browsing when it has 0 jobs. Below a floor, switch to "we watch these N employers for you" and show what is watched | `lib/jobs/sources/registry.ts` (14 adapters, per-source reports), `lib/api/routes/jobs.ts` | 1 | **P1** |
| **S6** | **"Kilichonipata" — your record** (in Profile / Memory) | Nothing to open on a day with no new jobs. Shows applications, responses, interviews, and what changed | `lib/outcomes/aggregate.ts`; native `memory-screen.tsx`; the `apps/native/src/lib/ai-memory.ts` consent gate | 1.5 | **P1** |
| **S7** | **A plain-language AI review strip in the editor** | The AI is a chat nobody opens (§4). Put the review where the CV is | `lib/ats-score.ts`, `lib/ats-explain.ts`, `POST /api/ai/enhance` shape | 2 | **P1** |
| **S8** | **The outcome sheet reachable from a notification** | D9: every web push opens `/assistant` | `lib/notify/dispatch-signals.ts` + `public/sw.js` notification click handler + native `lib/notification-route.ts` | 1 | **P1** |
| **S9** | **Proof wall (only if real and consented)** | The testimonial slot currently carries a quote with no source (`lib/testimonials.ts:27`) | the outcome ledger; `lib/referral.ts` for the ask | 1 | **P2 — do not build until outcomes are real** |

## 2.2 Features

| # | Feature | Loop | Problem | Cost | Priority |
|---|---|---|---|---|---|
| **F1** | **Native guest mode** (= S3) | every | D1 | 4 | **P0** |
| **F2** | **Job ingest repair + a watchdog that shows skipped sources** | L1 | feed is `[]` live; 5 of 14 adapters are key-gated and skip silently (`registry.ts:42-46`) | 2 | **P0** |
| **F3** | **Outcome asks on a 7/14/30-day cadence, and `hired` promoted to a real application status** | L3 | the moat is not collected; the terminal outcome is unrepresentable | 2 | **P0** |
| **F4** | **Native → server application sync** (`POST /api/mobile/applications`) | L2, L3 | D8: a phone user's outcome never reaches the server | 2 | **P0** |
| **F5** | **AI provider key + AI reachable from the guest draft** | L3, L6 | `{"configured":false,"provider":null}` live; guests get 401 (`ai.ts:117`) | 1 | **P0** |
| **F6** | **Deadline capture for RSS adverts** | L4 | `cv.tailor` can never fire for jobwebtanzania (`registry.ts:86` → `null`; `signals.ts:170` skips) | 1 | **P1** |
| **F7** | **Offline queue for the outcome answer** | L3 | tools already declare `offline: "queue"` (`tools.ts:94`) — wire the client side | 1 | **P1** |
| **F8** | **Per-install AI quota for guests** | F5 | a guest has no user row, so the existing per-user cap (`checkAiQuota`) cannot apply | 1 | **P1** |
| **F9** | **The ledger summary surfaced as the user's own record** (= S6) | L3 | no reason to open on an empty-news day | 1.5 | **P1** |
| **F10** | **`/sw/editor/cv/try` redirect** | all | D3: 404 on a locale-prefixed guest URL (observed live) | 0.1 | **P1** |
| **F11** | **A gate that fails the build if the feed is empty** | L1 | with no watchdog, an empty feed is discovered by a user, not by us | 0.5 | **P1** |
| **F12** | **Curated seed adverts (20 real, admin-entered)** | L1, L4, L6 | every nudge is untestable with a `[]` feed; the schema already supports `published` + `featured` | 1 | **P1** |

**Explicitly not proposed** (already argued in `RESEARCH-2026-09-20.md` §4 and still true): auto-apply at
scale, LinkedIn optimisation, applicant-ranking gamification, Gulf compliance fields, new CV templates,
payments, dark-pattern billing.

---

# 3 · How best to implement

## 3.1 F2 — Job ingest repair *(do this first; every nudge depends on it)*

- **Where:** `apps/web/lib/jobs/*`, `apps/web/app/api/cron/jobs/route.ts`, `vercel.json`.
- **The complaint to check first:** `/api/jobs` filters to `LIVE_STATUSES` (`lib/api/routes/jobs.ts:53`)
  and `lifecycle.ts:21-45` expires anything unverified for 30 days (`constants.ts:6`) while the cron
  requires `CRON_SECRET` (`app/api/cron/jobs/route.ts:18-21`). **INFERENCE, unverified:** ingest stopped
  and a month of grace expired the feed. Check it in this order — (a) does `CRON_SECRET` exist in the
  deployment; (b) did `/api/cron/jobs` ever return 200 (Vercel cron logs); (c) `SELECT status, count(*)
  FROM job GROUP BY status` — because "0 published" and "0 rows" need different fixes.
- **What I did verify about the source itself:** the only Tanzania-specific adapter is keyless and the
  upstream feed is alive and fresh —
  ```
  $ curl -sL -m 30 -A "Sumaiya-Jobs-Ingest/1.0 (+https://sumaiya.app)" \
      -H "Accept: application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8" \
      https://www.jobwebtanzania.com/feed
  200  73815 bytes   https://www.jobwebtanzania.com/feed/
  items=10   newest: Fri, 18 Sep 2026 14:40:40 +0000
  ```
  (`jobwebtanzania.ts:88` sets `enabled: () => true`; the UA is `JOBS_USER_AGENT` from
  `sources/shared.ts:8-9`.) Two notes for whoever fixes this: the bare URL **301s to `/feed/`** (Node's
  `fetch` follows that; plain curl without `-L` does not), and the site **406s a default curl UA** —
  both are traps for a re-test that concludes "the source is dead" when it is not.
- **Watchdog:** `runSources` already returns a per-source report including `skipped: true`
  (`registry.ts:108-119`). Persist it and surface counts in admin; the 5 key-gated adapters (Adzuna,
  Jooble, USAJobs, Careerjet, Talent) skip silently by design and must be *visible* as skipped, not
  invisible.
- **Must not break:** `lib/jobs/sources/registry.test.ts`, `feed-filter` (21 tests), `dedup`, `enrich`,
  `authenticity`, `location-relevance`; `lib/api/routes/jobs.ts` status semantics used by admin.
- **Acceptance test:** `curl -s "https://sumaiya.app/api/jobs?limit=5"` returns ≥5 rows, at least one with
  a Tanzanian location; the cron response body carries a per-source count; `✓ grep -c skipped` in the
  saved report is non-zero and explained.

## 3.2 F3 — The outcome loop *(the headline feature)*

- **Where:** `lib/api/routes/applications.ts` (status enum), `lib/applications.ts:41`
  (`APPLICATION_STATUSES` + `canTransitionStatus`), `lib/assistant/signals.ts` (a new
  `application.outcomeAsk` signal type), `lib/notify/dispatch-signals.ts` (dispatch it),
  `components/dashboard/outcome-check.tsx` (reuse as-is), `lib/outcomes/aggregate.ts` (already capable).
- **Cheapest possible path to `hired`:** `application.status` is `text`, not a Postgres enum
  (`schema.ts:252`) — so promoting `hired` is a **code** change plus validation, **no migration**.
  Add it to `APPLICATION_STATUSES` and to the `z.enum` in the route, then map the existing
  `outcome.record` stage to it (the mapping table already exists in `outcome-check.tsx`:
  `interview→interviewing`, `offer→offer`, `no→rejected` — `hired` is the one missing).
- **Cadence:** a deterministic function of `appliedAt` and the number of asks already recorded, not a
  queue of scheduled rows — the pattern already proven by `followUpRemindedAt` (`schema.ts:257`). Reuse
  the cooldown ledger shape in `dispatch-signals.ts:31-42` (`notifKey` = type + applicationId).
- **Placement:** the ask must render **inline on the list card** (S1) and be the deep-link target of the
  push (S8). Do not add a new modal.
- **Offline:** `outcome.record` is already declared `offline: "queue"` (`tools.ts:94`). Wire the client
  to honour that: store the tap locally, replay on the next successful call. Never show a spinner the
  user has to wait on for a one-tap answer.
- **Must not break:** `lib/applications.test.ts` (8 — pins the status state machine),
  `lib/application-copilot.test.ts`, `lib/outcomes/{events,aggregate}.test.ts`,
  `lib/assistant/signals.test.ts` (which pins each signal's trigger), and the
  `outcome.record` tool contract in `lib/assistant/{tools,tool-authz,run-tool}.test.ts`. Adding a status
  is exactly the kind of change those tests are for; run them, do not guess.
- **Risks:** (a) asking too early makes it a nag — gate on a real application event; (b) if the response
  rate is low, the aggregate analyses (`aggregate*`, which guard small samples with `SMALL_SAMPLE_N = 10`
  at `aggregate.ts:19`) will refuse to report for a long time — that is correct behaviour and should be
  presented to the user as "not enough answers yet", not hidden.
- **Acceptance test:** an application 7 days old shows the ask **on the list**, no navigation; answering
  "I got hired" persists `hired` as the application's status and the tracker displays it; a test asserts
  the transition is legal in `canTransitionStatus`; the aggregate view counts it.

## 3.3 F4 — Native → server application sync

- **Where:** new Bearer-authed route in `apps/web/lib/api/routes/mobile.ts` (which already has the
  `getUserId` + `device-token` precedent at `:563-567`); client in `packages/api-client/src/index.ts`
  (pattern at `:551`); the local store at `apps/native/src/lib/applications-store.ts`.
- **Shape:** `POST /api/mobile/applications` taking an array of `{id, title, companyName, jobTitle,
  status, appliedAt}` and upserting on `id` into the `application` table, mapping
  `saved|applied|interview|offer|closed` → `draft|applied|interviewing|offer|…`. Idempotent, so a
  retried sync cannot double-count.
- **Why it is P0 and not a nice-to-have:** without it L2 and L3 — the two loops with the best
  engineering in the repo — do not exist for the platform the product is for (D8).
- **Must not break:** `apps/native/src/lib/applications-store.ts` consumers
  (`applications-screen.tsx`, `application-detail-screen.tsx`); the web `applications.test.ts` state
  machine; nothing in this route may reject a local-only application — a failed sync must be silent and
  retried, never a blocking error.
- **Acceptance test:** create an application on the phone → it appears in the server table with the same
  status; an outcome answered on the phone increments the server-side aggregate.

## 3.4 F1/S3 — Native guest mode

- **Where:** `apps/native/src/navigation/root-navigator.tsx:245` (remove the wall for the first-run
  path), a guest CV screen that reuses the existing on-device engine, and a draft store beside
  `src/hooks/use-cvs.ts` (which is already an offline-first, account-scoped cache — `use-cvs.test.ts`, 6).
- **Reuses:** the web design and its failure semantics — `lib/migrate-guest-failure.ts` (9 tests) exists
  precisely because migrating a guest draft can fail in interesting ways, and that knowledge is worth
  porting rather than rediscovering.
- **Must not break:** `src/navigation/root-navigator.tsx`'s existing onboarding/first-run/splash gating
  (device-QA'd; the QA reports at the app root are evidence for a *different* APK — do not treat them as
  current), `src/hooks/use-cvs.test.ts` (6), `src/lib/cv-engine/registry-sync.test.ts` (20 — it renders
  every template), `scripts/test-release-invariants.js`.
- **Gate:** the app must reach an exported PDF with **zero** sign-in taps, and the guest CV must survive
  sign-in and become a real CV.
- **Risk:** the app's auth gate also protects the AI routes, so a guest's AI call needs F8 (per-install
  quota) or must be absent. Absent is acceptable for week one; silent 401s are not.

## 3.5 Where the three known weaknesses change the plan

**Weakness 1 — "one generic renderer behind 266 template names".** **Partly wrong, and the real number
is more useful.** There are 268 `.tsx` files under `components/templates/` of which **266** are distinct
template components wired through `components/templates/registry.ts`,
and the web editor renders `TEMPLATE_COMPONENTS` from that registry (`cv-editor-client.tsx:22`) — so on
web the variety is real, per-template code:
`grep -c "^import { .*Template } from" components/templates/registry.ts` → **266** (re-measured today,
matching `docs/FEATURE-INVENTORY.md` §3). The one-generic-renderer claim is true of
`lib/templates/native-provider.ts:158` (`buildTemplateHtml`), which **ignores the template id** — and that
file is referenced only from `lib/templates/index.ts:21,39` and its own test
(`lib/templates/provider-select.test.ts`): it is not what users see.
**The weakness is real on the platform that matters, and here is the true measurement:** the native app's
**218 templates are drawn by five layouts** —
```
70 layout: "SidebarLayout"      59 layout: "MinimalLayout"     59 layout: "HeaderLayout"
15 layout: "TwoColumnLayout"    15 layout: "AccentBandLayout"    (218 total)
```
(`grep -rho 'layout: "[A-Za-z-]*"' apps/native/src/lib/templates/*.ts`). So "218 templates" is 5 layouts
× per-template design tokens. It is not a lie — the tokens do change the look — but it is not 218 designs,
and `RESEARCH-2026-09-20.md` §2 already notes users are offered **47**.
**How this changes the plan:** (a) never build a retention loop on template variety — the variety is
narrower than the count implies and the user was only ever shown 47; (b) do not add templates; (c) the
one thing worth spending here is *content* variety (a Tanzanian persona, TZS figures, real employers),
which is the cheapest, highest-trust change and is already on the list as item 7 of that document.

**Weakness 2 — empty job data.** It reorders the week. Every one of L1, L4 and L6 needs a job row to
exist; with `data: []` live, the flagship loop is a no-op and a nudge that says "new job matched you"
would be false. So F2 (or the 20-advert seed, F12) is **day one**, and no nudge tuning happens before it.
It also changes what "done" means for the jobs screen: S5 must ship the honest-floor behaviour in the
same change, so that a thin feed is *stated*, never dressed up.

**Weakness 3 — AI 503s.** `curl /api/ai/status` → `{"configured":false,"provider":null}` live, and
`/api/mobile/apply` returns 503 outright without a key (`lib/api/routes/mobile.ts:187`). The plan must
therefore be built so that **no loop depends on the model being up**: the spine is the deterministic
engine (`signals.ts`, `daily-brief.ts`, `ats-score.ts`, `job-match.ts` — all unit-tested) and the model is
an accelerator on top. `/enhance` is the pattern to copy: it degrades to a local heuristic so that
"the editor's Enhance never blocks" (`ai.ts:143-152`). Everything else should follow it, and any surface
that cannot degrade must say so in plain language rather than showing an error.

## 3.6 Gates that must pass before any of this is called done

- `apps/web`: `npx tsc --noEmit`, `npx vitest run` (**2052 passing / 3 skipped** as measured in
  `docs/FEATURE-INVENTORY.md` §2 — re-measure, do not trust).
- `apps/native`: `npx tsc --noEmit`, `npx jest` (**1201 passing**), `expo export`, and
  `scripts/test-release-invariants.js`.
- **Swahili copy:** any new Swahili string must pass `lib/swahili-lint.test.ts` (web) and its native
  mirror. **This gate has a hole** — see §4.3.
- **AI-dependent evals** (`evals/language-fidelity.test.ts`, `evals/tailor-quality.test.ts`) are skipped
  without a key; they must be run once a key exists, because they are the anti-fabrication guard.
- **Do not touch** (other agents in flight): the Swahili audit files (`docs/SWAHILI-*`), the CV photo
  work (`apps/native/src/lib/cv-engine/photo.ts` and the template/editor layer), campaign/attribution
  (`lib/campaign/*`, `lib/analytics/attribution.ts`), and device-QA documentation. Stage **named paths
  only**; never `git add -A`.

---

# 4 · The AI, hands-on

## 4.1 The problem with the AI as it stands

The AI exists and is well engineered — 35 tools with declared policy, cost and offline behaviour
(`lib/assistant/tools.ts`, 35 `id:` entries counted), an orchestrator, intent routing, a conversation
store, ~21 test files. It is also (a) **dark in production** (`{"configured":false,"provider":null}`),
(b) **unavailable to guests** (`ai.ts:117-118` → 401), and (c) **placed in a chat** (`/assistant`,
3,786 lines) that by the brief's own framing nobody opens. The device QA even recorded that the native
chat composer ignored taps (`QA-REPORT-2026-09-11.md` P0-2).

**JUDGEMENT:** a chat is the weakest possible place for an AI in a product used on a cheap phone with
expensive data — it asks the user to bring the problem, the words and the data. The fix is not a better
chat. It is to put the AI **where the work already is**, holding a piece of it, and to make every AI
surface degrade honestly.

## 4.2 Where the AI should be active

| # | Surface | What the AI does there | Reuses | Offline behaviour |
|---|---|---|---|---|
| **A1** | Editor, under the preview — a **"Rekebisha" review strip** | Reads the CV and names **three concrete fixes**, each with a tap to apply ("your last two roles have no dates — employers screen on dates"). Not a chat: three sentences and three buttons | `lib/ats-score.ts` + `lib/ats-explain.ts` (deterministic, tested: 3 + 16 tests); `POST /api/ai/enhance` shape | Renders the deterministic findings from `ats-score`/`ats-explain`, which need no network. The AI only adds phrasing |
| **A2** | The blank first screen — **"Saidia kujaza"** | Turns two facts into a first draft of the summary, in Swahili, grounded in what the user typed. Never invents an employer, a date or a number | `POST /api/ai/enhance` with its local fallback (`ai.ts:143-152`); `buildEnhancementPrompt` | Deterministic template summary from the fields present; the button never blocks |
| **A3** | The job-target panel — **"Lenga CV kwa kazi hii"** | Diffs the advert against the CV, shows keyword coverage and the honest before/after, and offers the tailored rewrite as a **preview** the user must apply | `lib/job-match.ts` (24 tests), `lib/targeted-cv.ts` (13), `lib/requirement-evidence.test.ts` (14), anti-fabrication guards in `evals/tailor-quality.test.ts`; `POST /api/ai/tailor-cv` | Deterministic coverage + gap list render; the rewrite is simply unavailable, and the UI says so |
| **A4** | The outcome sheet — **after "not this time"** | Asks one question ("what did they ask?"), then returns a **named** gap and the specific course | `signals.ts:246-287` skill-gap diffing; Learning Hub | Shows the named gap from the JD text already saved on the application — no model needed for the core value |
| **A5** | The outcome sheet — **after "got an interview"** | Three questions for **that employer's** advert, drawn from the JD stored on the application | `POST /api/ai/interview-turn` (`ai.ts:355`) | Falls back to a static, role-bucketed question set |
| **A6** | Home card — the **one nudge** | Rewrites the deterministic signal into one plain sentence in the user's language, with the real numbers left untouched | `lib/assistant/signals.ts` (already bilingual, `title.en/sw`, `detail.en/sw`) | The signal engine's own copy is already user-ready — the model is optional polish |
| **A7** | Guest editor | The same as A1/A2 **on the guest draft**, with a per-install quota (no user row exists to charge) | `checkAiQuota` shape + F8 | Local fallbacks only; a guest never sees an error for an AI action |

**What the AI must never do** (these are the product's own rules, two of them currently broken in
production — see §4.3):

1. **Never name the mechanism in Swahili.** Sell the outcome: "CV inayofikia waajiri", not "ATS".
2. **Never invent experience, dates, employers or numbers.** The guard already exists in code and tests
   (`evals/tailor-quality.test.ts`, `lib/requirement-evidence.test.ts`) — it must not be relaxed to make a
   demo look better.
3. **Never claim an outcome it cannot back.** No "you will get an interview", no invented success rates,
   no fabricated testimonials (`lib/testimonials.ts:27` currently carries a quote with no source — that
   is the shape to avoid).
4. **Never be the only path to a result.** Every AI action must have a deterministic floor.
5. **Never block an export, a save or a tap on a network call** — on a phone with no bundle, a spinner
   that never resolves is worse than no feature.

## 4.3 The Swahili mechanism rule: still broken in production, with the exact lines

The commit `b2100ad` ("fix(web): sell the outcome in Swahili copy, never the 'ATS' mechanism", 09:57
today) landed and **is now live** — I caught both sides of the deploy:
at **10:50** `https://sumaiya.app/sw` still rendered *"Inapita mifumo ya waajiri (ATS)"*, *"Je, CV zenu
zinapita mifumo ya ATS?"* and *"kukagua ATS"*; at **11:13** the same URL renders *"Inapita vichujio vya
waajiri"*, *"Je, CV zenu zinapita vichujio…"* and *"kukagua CV"*. **OBSERVED — live, both fetches.**
That is a ~76-minute deploy lag, which is fine, and it is also why "the fix is committed" is not evidence
that the fix is live.

**What is still live in Swahili at 11:13** (`grep -o '.\{70\}ATS.\{70\}'` on the fetched page, 11 more
occurrences, all user-visible):

| Live Swahili string | Source | Why the lint misses it |
|---|---|---|
| nav + mobile nav + footer link label **"Kagua ATS"** | `components/ui/marketing-nav.tsx:41` and `:110`; `components/ui/footer.tsx:14` | the pattern requires a **preposition** before `ATS` (`lib/swahili-lint.test.ts:219`), and here it follows a verb |
| meta/og/twitter description **"Miundo inayopita ATS"** | `app/[locale]/(marketing)/layout.tsx:20` | same hole — `inayopita ATS` has no listed preposition. This string is what a WhatsApp link preview shows, so it is very visible in this market |
| tool label in the editor, **"Kagua ATS"** | `components/editor/cv-editor-client.tsx:3312` | same |

**JUDGEMENT:** the tripwire is a good mechanism with a narrow pattern. Widening it to cover
verb + `ATS` (and adding a plain-string ban on `ATS` inside Swahili string values) closes the rule the
product already claims to hold. It is a ~0.5-day change and it should be part of the same week, not a
separate project — but it belongs to the agent who owns `docs/SWAHILI-*`; I am flagging it, not touching
those files.

## 4.4 The AI when there is no connection

The offline story is a design decision, not a fallback someone adds later. Three rules:

1. **The deterministic engine is the product; the model is the polish.** `signals.ts`, `daily-brief.ts`,
   `ats-score.ts`, `job-match.ts` are pure and unit-tested and already produce bilingual, user-ready
   text (`title.en/sw`, `detail.en/sw`). Every one of them works in aeroplane mode for the data already
   on the device.
2. **AI actions are queueable, not failable.** The tools registry already declares offline behaviour per
   tool (`lib/assistant/tools.ts` — `outcome.record` is `offline: "queue"`). Extend that to the AI
   actions that can be replayed, and let the UI say "nitakamilisha ukiwa mtandaoni" rather than an error.
3. **Nothing that the user already earned may require a connection to see.** A CV is local on native
   (`use-cvs.ts` offline-first cache; guest draft in `localStorage`). The ledger summary (S6) must be
   readable offline, because it is the reason to open the app on a day with no bundle — ironic if it is
   the one screen that needs data.

**Honest gap:** `docs/FEATURE-INVENTORY.md` §5 states the on-device offline path has **never been tested
in aeroplane mode**. Until that pass exists (item 8 of `RESEARCH-2026-09-20.md`, 3 days), every offline
claim in this section is a design intention, not a property.

---

# 5 · The one-week plan

One person, seven days. Order is dependency order, not preference order. Everything not listed is
dropped, and the drops are named at the end.

| Day | Item | Why this order | Acceptance test (the command or the observable) |
|---|---|---|---|
| **1** | **F2 — job ingest repair + watchdog** | Every job-based loop is a no-op with `data: []` live. Also the honest-floor UI (S5) ships in the same change | `curl -s "https://sumaiya.app/api/jobs?limit=5"` returns ≥5 rows, ≥1 with a Tanzanian location; the cron body reports per-source counts; skipped sources are listed, not silent |
| **1 (parallel, cheap)** | **F10 — `/sw/editor/cv/try` → 200**, and **S4 — filled example on first paint** | Both are sub-day, both are pure loss today (404 observed live; the aha moment is behind a tab, `cv-editor-client.tsx:999`/`:3108`) | `/sw/editor/cv/try` → 200; an on-phone first paint shows a filled CV without a tab switch |
| **2–3** | **F1/S3 — native guest mode** | The door. Nothing retains a user who never got in (`root-navigator.tsx:245`) | Fresh install → exported PDF with **zero** sign-in taps; the guest CV survives sign-in |
| **4** | **F3 — outcome asks on the 7/14/30 cadence + `hired` as a real status** | The moat. No migration needed (`status` is `text`, `schema.ts:252`) | An application 7 days old shows the ask **on the list**; "I got hired" persists and displays; `canTransitionStatus` accepts it; the aggregate counts it |
| **5** | **F4 — native → server application sync** | Without it, days 4's loop does not exist for phone users (D8) | Create an application on the phone → it appears server-side with the same status; an outcome answered on the phone moves the server aggregate |
| **6** | **F5 + F8 — AI key, guest AI, and a degrade path everywhere** | The AI is the loudest promise and it is dark. Do it after the loops exist so the AI is *doing* something, not just answering | `/api/ai/status` → `configured: true`; a guest completes one AI action; **then remove the key and confirm no surface shows a raw 503** |
| **7** | **S6/F9 — "your record" screen, plus the four numbers** | The only reason to open the app on a day with no new jobs. Ship the measurement in the same day or day 7's work is unfalsifiable | A user with ≥1 application sees their own ledger summary; the weekly review has real values for the four numbers below |

**The four numbers that decide whether retention is working** (all four are already instrumentable —
`app_event` records install / first launch / sign-up keyed by an anonymous `installId`
(`lib/db/schema.ts:652`), `outcome_event` records the loop (`schema.ts:457`)):

1. **% of first sessions reaching an export without an account** — web and native, separately. This is
   the door, and it is the number days 2–3 move.
2. **Day-7 return rate** of users who exported. If it does not beat the pre-change baseline, the loops
   are wrong, not the copy.
3. **Outcome answer rate** — of asks shown, how many were answered. Below ~20% the cadence is too eager
   or the ask is in the wrong place.
4. **Live jobs count** per day and **per source**. Any day at zero is a day the product has nothing to
   say, and the fix is supply, not nudging.

## What gets dropped, deliberately

| Dropped | Why |
|---|---|
| Interview prep as a standalone feature | It is the *payoff* of day 4's loop, not a loop (`RESEARCH-2026-09-20.md` §4 item 1) |
| Gulf fields (photo, nationality, visa status) | Attestation is a 4–8 week paper process; software cannot finish that journey |
| New CV templates / the 219 unoffered ones | The native variety is 5 layouts × tokens, users are offered 47, and Novoresume offers 50+ — the count is not the constraint |
| Payments / mobile money checkout | `PAYMENTS_ENABLED = false` (`lib/features.ts:8`) — and the file is explicit that this is a **removal, not a pause**: *"Payments were removed (2026-09-08) — PayMe Africa never went live and the whole payment stack was retired."* Rebuilding it is a project, not a flag flip. The priority is a user who returns, not a rail |
| Auto-apply, LinkedIn optimisation, ranking gamification | SwiftKazi owns auto-apply at KES 60/application; LinkedIn penetration does not justify the build; ranking demoralises in a high-unemployment market |
| WhatsApp as the outcome channel | The right answer on the evidence (53.3% preference) and **not available this week** — Meta provisioning is an owner task. Design the ask so it can be pointed at WhatsApp later without redesign |
| Re-running the Playwright suite as a gate | It is not in CI and needs a build + Supabase env; useful, not this week |
| Fixing the 11 remaining live Swahili "ATS" occurrences | Correct and needed, but it belongs to the Swahili-audit owner — flagged in §4.3 with exact `file:line` rather than touched |

## The one thing, if only one day exists

**Fix the ingest, then make the first paint show a filled CV.** Supply first, because a retention loop on
an empty feed is furniture; then the aha moment, because it is the cheapest change in the document and it
is where every new user currently stops.

---

## Appendix A · Commands run, verbatim

```
$ cd /c/Users/hamis/projects/sumaiya && git log --oneline -1 --format="%h %ci %s"
cb29d9f 2026-09-20 11:12:52 +0300 fix(native): first-person busy line, natural chat greeting, real help-row copy

$ curl -s https://sumaiya.app/api/health
{"ok":true,"db":"connected"}

$ curl -s https://sumaiya.app/api/ai/status
{"configured":false,"provider":null}

$ curl -s "https://sumaiya.app/api/jobs?limit=5"
{"success":true,"data":[]}

$ curl -s "https://sumaiya.app/api/jobs?status=published"
{"success":true,"data":[]}

$ curl -s -o /dev/null -w "%{http_code}" https://sumaiya.app/editor/cv/try ; echo
200
$ curl -s -o /dev/null -w "%{http_code}" https://sumaiya.app/sw/editor/cv/try ; echo
404

$ curl -sL -A "Mozilla/5.0" https://sumaiya.app/ | md5sum ; curl -sL -A "Mozilla/5.0" https://sumaiya.app/sw | md5sum
d4732892c16348af2192945b6301ed20
d4732892c16348af2192945b6301ed20      # byte-identical; 241891 bytes each; <html lang="sw">

$ curl -sL -A "Mozilla/5.0" https://sumaiya.app/editor/cv/try | wc -c
76362                                 # and: grep -c "Anza na mfano" = 1, lang="sw"

$ curl -sL -m 30 -A "Sumaiya-Jobs-Ingest/1.0 (+https://sumaiya.app)" \
   -H "Accept: application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8" \
   -w "%{http_code} %{size_download} %{url_effective}\n" https://www.jobwebtanzania.com/feed
200 73815 https://www.jobwebtanzania.com/feed/      # items=10; newest Fri, 18 Sep 2026 14:40:40 +0000
# (the bare URL 301s to /feed/; a default curl UA gets 406 — both are traps for a re-test)

$ grep -rho 'layout: "[A-Za-z-]*"' apps/native/src/lib/templates/*.ts | sort | uniq -c | sort -rn
     70 layout: "SidebarLayout"
     59 layout: "MinimalLayout"
     59 layout: "HeaderLayout"
     15 layout: "TwoColumnLayout"
     15 layout: "AccentBandLayout"

$ grep -rn "outcome_report\|outcomeReport" --include=*.ts --include=*.tsx .     # (no output)
$ grep -c "id: \"" apps/web/lib/assistant/tools.ts
35
$ ls -1 apps/web/components/templates/*.tsx | wc -l
268
```

## Appendix B · Market and third-party sources

- Tanzania internet subscriptions and mobile share (TCRA Sept-2025 report, via TechAfrica News):
  https://techafricanews.com/2025/10/20/tanzania-records-56-3-million-internet-users-as-connectivity-reaches-87-of-population
- Total telecom subscriptions, Q4 2025: https://tanzaniainvest.com/telecoms/tcra-telecom-stats-q4-2025
- Mobile money scale (Bank of Tanzania, National Payment Systems Annual Report 2025, PDF —
  **read via search index, not first-hand**):
  https://www.bot.go.tz/Publications/Regular/Annual%20Report/en/2026060211494565.pdf
- Data-basket cost as a share of income (ITU, via aggregator; **snippet only**):
  https://africa-api.com/data/tanzania/mobile-data-price
- ITU affordability threshold: https://www.itu.int/en/ITU-D/Statistics/Documents/publications/prices2023/ICTPriceBrief2023.pdf
- Tanzanian data-cost analysis (**snippet only; host unreachable from here**):
  https://thechanzo.com/2023/01/20/heres-why-costs-of-data-in-tanzania-are-high/
- WhatsApp preference in a Tanzanian district study: https://ideas.repec.org/a/bhx/ojtjts/v7y2025i3p1-11id2656.html
- ILO-modelled youth unemployment, Tanzania 2025: https://fred.stlouisfed.org/series/SLUEM1524ZSTZA
- Job-board retention is structurally hard (episodic demand): https://cavuno.com/blog/job-board-retention
  and https://www.linkedin.com/posts/cavuno_the-job-board-retention-playbook-frameworks-activity-7447417319540297728-js0L
  (**search index only — the site did not resolve from this host**)
- Applications per interview (US): https://blog.fastapply.co/how-many-applications-to-get-an-interview-2026
  and https://www.lifeshack.com/resources/job-search/how-many-applications-does-it-take-to-find-a-job-in-2025/
- BLS job-search supplement (methodology; **PDF read only partially**):
  https://www.bls.gov/opub/btn/volume-9/how-do-jobseekers-search-for-jobs.htm
- Everything about competitors, local pricing and the Gulf: `docs/RESEARCH-2026-09-20.md` §1, with its
  own URLs (Careergo TZS 600/hour, Mabumbe TZS 30,000–180,000, SwiftKazi KES 20/60, Zoom Tanzania's free
  Swahili CV maker, BrighterMonday Tanzania's 301 to TATC).

## Appendix C · What I could not verify

| Not verified | Why |
|---|---|
| Any hand-driven walkthrough of the guest journey | The browser tool timed out twice (420 s each). §1.2 is reconstructed from live HTTP responses plus the source that renders them, step by step |
| The APK: version, screens, guest path, offline behaviour | No device session — I did not connect to `10.229.114.105:5555`, and device QA is another agent's scope. Version 1.6.24 comes from the task context, unverified by me |
| **Why** the job feed is empty | No production DB access. The empty feed is observed; the "ingest stopped and 30-day grace expired everything" explanation is an inference from `lifecycle.ts:21-45` + `constants.ts:6` + `cron/jobs/route.ts:18-21`, labelled as such |
| Whether crons have ever fired, whether `CRON_SECRET` is set, whether the DB is at schema | Live-state questions; `/api/cron/*` returns 401 to an unauthenticated caller whether or not the secret is set, so it is not diagnostic |
| The four retention numbers' current baseline | `app_event`/`outcome_event` need DB access; PostHog is a third-party dashboard this repo cannot query |
| Live AI behaviour | `configured: false` — no AI call is possible in production today |
| The web test suites / tsc | 2052 / 1201 counts are quoted from `docs/FEATURE-INVENTORY.md` (measured 2026-09-19) and were not re-run in this session |
| Whether the native email-OTP path works on the current build | The only device evidence is against deleted infrastructure; out of scope here |
| Bank of Tanzania figures and the Chanzo/africa-api numbers | Read through search indexes; the sources themselves were unreachable from this host. Labelled **MARKET** with that caveat in §1.3 |

---

*Written by an agent at the user's direction, 2026-09-20, in Africa/Nairobi. Every repo claim carries a
`file:line`; every market claim carries a URL and a label saying how it was read; every judgement is
labelled JUDGEMENT. Where the brief I was given was wrong — there is no `outcome_report` table, and the
"one generic renderer" is dead code rather than the live renderer, though the native app's 218 templates
really are 5 layouts — I have said so and shown the evidence rather than repeating it.*
