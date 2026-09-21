# Sumaiya — what it should LEAD WITH, system-wide

**Date:** 2026-09-20 · **Repo:** `C:\Users\hamis\projects\sumaiya` · **Live:** https://sumaiya.app
**Owner's brief, verbatim:** *"research the whole platform all features and think of rebranding
system wide right now we still lead with ai cv maker i feel so research tumia all free models
from openrouter na gpts online research deep na mabadiliko ya jinsi ya kuboresha tulichonacho
sio kuongeza features but latest ways and attractive ways and screens designs na implementations
etcc"*

**Scope:** research only. **No product code was changed.** The one file written is this document
plus the passes under `docs/research/rebrand-2026-09-20/`.

**Audit snapshot:** `HEAD = 8d2f2a6`, working tree dirty, captured **2026-09-20T21:10:51Z**.
All `file:line` references below are against that instant because the tree is being edited by
other agents concurrently (see §0.3).

---

## 0 · Three corrections to the brief, before anything else

The brief I was handed contained three premises that are wrong, and each one changes the answer.
I am recording them first because a positioning document built on them would be built on sand.
Every claim here is something I fetched or measured myself.

### 0.1 The product's AI is ON in production. It is not dark.

The brief stated: *"DEEPSEEK_API_KEY is empty … THE PRODUCT'S AI IS OFF in production right now:
`/api/ai/status` returns `{configured:false,provider:null}` and chat, import, snap and
cover-letter generation all fail."*

Fetched live, 2026-09-20:

```
$ curl -s https://sumaiya.app/api/ai/status
{"configured":true,"provider":"deepseek"}
```

And `POST https://sumaiya.app/api/ai/tailor-cv` reached the route and returned a **Zod payload
error (HTTP 400)** — i.e. the endpoint is alive and validating, not dead. `apps/web/lib/api/ai-provider.ts:101`
shows the provider order (`litellm → deepseek → openrouter → anthropic → openai`) and the live
status resolves `deepseek`.

The local key file is genuinely empty (`C:/Users/hamis/projects/_hdd-data/env/ai.env`,
`DEEPSEEK_API_KEY` length 2), which is where the brief's premise came from — **the local env is
not production.** Production is configured.

**Why this matters for the rebrand:** the brief told me to treat "you cannot lead with an AI
claim the product cannot honour" as central. That premise is false, so that particular argument
does not hold. **The case against leading with "AI" is still strong — but for a completely
different reason: it is the mechanism, not the outcome, and every competitor occupies it already
(§2).** I would have been reasoning correctly from a wrong fact. Recorded so nobody re-derives it.

*Caveat, stated honestly:* "provider configured" is not the same as "every AI surface returns 200
for every user." I did not exercise each AI route as an authenticated user. See §6.

### 0.2 OpenRouter WAS available, and it did the multi-model work

The brief said: *"THERE IS NO OPENROUTER KEY … you cannot meet the owner's 'tumia all free models
from openrouter' request."* A key does exist at
`C:/Users/hamis/projects/_hdd-data/env/research.env` (`OPENROUTER_API_KEY`, 73 chars, validated:
it returns upstream 429s rather than 401s, which is what a valid key looks like).

**I used it — `:free` model ids only, asserted in code, never printed, never committed.**

| Pass | Model that answered | Finding it produced |
|---|---|---|
| 6 | `nvidia/nemotron-3-ultra-550b-a55b:free` | The East-Africa-operator framing (§3.6) |
| 7 | `nex-agi/nex-n2.5-pro:free` (**vision**) | The critique of the real OG card, from the actual pixels (§3.7) |

Models tried and rejected, with the real reason: `nvidia/nemotron-3.5-lightning:free` leaks its
reasoning into the content field; `qwen/qwen3.8-27b:free`, `google/gemma-4-31b-it:free`,
`google/gemma-4-26b-a4b-it:free` rate-limited upstream (429). Rotation code lives in
`docs/research/rebrand-2026-09-20/openrouter_pass.py`.

**Runtime keys never appear in this document or in any committed file.**

### 0.3 Claude was session-limited, so the five Claude framings ran before the limit hit and two more ran on OpenRouter

`C:/Users/hamis/.local/bin/claude --version` → `2.1.274 (Claude Code)`, and all **five** Claude
passes exited 0 between 23:40:30 and 23:48:30 EAT (see
`docs/research/rebrand-2026-09-20/RUNLOG.txt`). A later probe returned:

```
You've hit your session limit · resets 1:40am (Africa/Nairobi)
```

So the five framings in §3.1–§3.5 are Claude's; the two in §3.6–§3.7 are OpenRouter free models.
Each pass file carries a `<!-- PRODUCED BY: … -->` header naming its model, so no finding in this
document is attributable to the wrong engine. Passes were run **sequentially, one at a time**,
because the repo's own prior research (`docs/BRAND-AND-MESSAGE-2026-09-20.md` §Method) records that
parallel Claude invocations race the OAuth credential lock and die.

### 0.4 The tree is moving under this audit — and that is itself a finding

`git status --short` at snapshot time: **71 modified files, ~30 untracked**, and `HEAD` advanced
from `dafa760` (where it stood when I started) to `8d2f2a6` while I worked. Several of the files
whose self-description I was auditing changed *during* the audit.

Observed concretely: at 23:52 the strings `about/page.tsx:22` (`"Msaidizi wa AI upande wako"`) and
`sign-in-form.tsx:239` (`"Msaada wa AI kwa muhtasari na uzoefu"`) existed; by 21:10Z they read
`"Msaidizi wa kazi upande wako"` and `"Msaada wa kuandika muhtasari na uzoefu"`. Somebody is
already de-AI-ing surfaces.

**Consequence for the owner:** a "system-wide rebrand" executed by several agents in parallel
without a single written string table will drift. **The first deliverable of the rebrand is not a
new hero — it is one canonical copy table (`docs/`) that every edit is diffed against.** That
recommendation is a JUDGEMENT, and it is the cheapest one in this document.

---

## 1 · HOW THE PLATFORM CURRENTLY INTRODUCES ITSELF

Every place the product describes what it is, with the exact string in both languages.

### 1.1 The public face — what a stranger actually sees

| # | Surface | Swahili | English | Location |
|---|---|---|---|---|
| 1 | **Page `<title>`** (marketing) | `Tengeneza CV Bila Malipo — Kwa Kiswahili` | `Sumaiya — write a CV that reaches the employer` | `apps/web/app/[locale]/(marketing)/layout.tsx:21-22` |
| 2 | **Meta description** | `Andika CV yako kwa Kiswahili, kwenye simu yako, bila malipo. Bandika tangazo la kazi na Sumaiya anakusaidia kuandika CV inayolingana nalo — kisha pakua PDF yako bila akaunti.` | `Write your CV in Swahili or English, on your phone, free. Paste the job advert and Sumaiya helps you write the CV that matches it — then download your PDF with no account.` | `…/(marketing)/layout.tsx:24-25` |
| 3 | **Hero eyebrow** | `KWA WATAFUTA KAZI — TANZANIA` | `FOR JOB SEEKERS — TANZANIA` | `…/(marketing)/home-page-client.tsx:474` |
| 4 | **Hero `<h1>`** | `CV inayokufikisha kwa mwajiri.` | `The CV that reaches the employer.` | `home-page-client.tsx:487` |
| 5 | **Hero subhead** | `Bandika tangazo la kazi. Sumaiya anakusaidia kuandika CV inayolingana nalo, kwa Kiswahili — kwenye simu yako, bila malipo, bila akaunti.` | `Paste the job advert. Sumaiya helps you write the CV that matches it, in Swahili — on your phone, free, with no account.` | `home-page-client.tsx:494-496` |
| 6 | **Primary CTA** | `Anza CV yako — Bure` | `Start your CV — free` | `home-page-client.tsx:512` |
| 7 | **Secondary CTA** | `au ongea na Sumaiya` | `or talk to Sumaiya` | `home-page-client.tsx:520` |
| 8 | **Reassurance** | `Hakuna akaunti. Hakuna kadi ya benki. Hakuna malipo.` | `No account. No card. Nothing to pay.` | `home-page-client.tsx:532-533` |
| 9 | **Trust row** | `PDF yako inatengenezwa kwenye simu yako` · `Kiswahili kwanza` · `Hakuna kupakua programu` | `Your PDF is made on your phone` · `Swahili first` · `Nothing to install` | `home-page-client.tsx:543,547,551` |
| 10 | **Nav** | `Nyumbani · Miundo · Sumaiya · Ajira · Zana za PDF · Kagua CV · Snap-to-Apply` | `Dashboard · Looks · Sumaiya · Jobs · PDF Tools · ATS Checker · Snap to Apply` | `apps/web/components/ui/marketing-nav.tsx:37-42` |
| 11 | **Documents section** | `Hati za maombi, zote mahali pamoja` | `The documents an application needs, in one place` | `home-page-client.tsx:792-796` |
| 12 | **Footer strapline** | *(EN only, live)* `Your career assistant — CVs, cover letters, jobs and advice in one place.` | same | `apps/web/components/ui/footer.tsx:50` |
| 13 | **Sign-up pitch** | `Kila kitu unachohitaji kupata ajira` + bullets `Miundo yanayopitishwa na mifumo ya kuajiri`, `Tengeneza na pakua PDF bila malipo`, `Msaada wa kuandika muhtasari na uzoefu` | `Everything you need to get hired` + `ATS-friendly designs`, `Build & download a polished PDF — free`, `Writing help for your summary & experience` | `apps/web/app/(app)/(auth)/sign-in/sign-in-form.tsx:234-240` |

**Live verification** (same day, `curl https://sumaiya.app/`): `<title>` = `Tengeneza CV Bila Malipo — Kwa Kiswahili | Sumaiya`; `<h1>` = `CV inayokufikisha kwa mwajiri.`; `og:title` = `Tengeneza CV Bila Malipo — Kwa Kiswahili`. The live site matches the source. **`/en` returns the English title.**

### 1.2 The surfaces that still carry the AI voice — the owner's actual complaint

| # | Surface | Exact string | Location |
|---|---|---|---|
| 14 | **Root metadata (marketing locale)** | SW: `Jukwaa la Ajira lenye AI — Tengeneza CV Bila Malipo \| Sumaiya` · EN: `Sumaiya — AI Career Platform: CV, Job Match & Interview Prep` | `apps/web/app/[locale]/layout.tsx:95-96` |
| 15 | **Same block, DUPLICATED** | identical strings | `apps/web/app/(app)/layout.tsx:71-72` |
| 16 | **JSON-LD `WebSite`** | `Create ATS-optimized CVs, cover letters, business cards and professional letters with an AI assistant that helps you get hired.` | `apps/web/app/[locale]/layout.tsx:166` **and** `apps/web/app/(app)/layout.tsx:137` |
| 17 | **JSON-LD `Organization`** | `Professional document builder with an AI assistant — CVs, cover letters, business cards and formal letters.` | `apps/web/app/[locale]/layout.tsx:185` **and** `apps/web/app/(app)/layout.tsx:156` |
| 18 | **OG image alt** | `Sumaiya — Professional CV & document builder with an AI assistant` | `[locale]/layout.tsx:122`, `(app)/layout.tsx:98`, `…/(marketing)/templates/page.tsx:25` |
| 19 | **Keyword lists (SEO, both)** | SW includes `msaidizi wa CV AI`, `AI ya kutengeneza CV` · EN includes `AI CV assistant`, `AI resume writer` | `…/(marketing)/layout.tsx:27-28`; `[locale]/layout.tsx:101-102`; `(app)/layout.tsx:77-78` |
| 20 | **About page H1** | `Hati za kitaalamu, pamoja na msaidizi wa kazi` | `Professional documents, with a career assistant` | `…/(marketing)/about/page.tsx:68` |
| 21 | **About page body** | `…muundo unaoidhinishwa na waajiri… kupita programu ya uchujaji inayosoma CV yako kwanza.` | `…recruiter-friendly templates, an AI writing assistant and one-tap PDF export — so you can look your best and get past the screening software that reads your CV first.` | `about/page.tsx:72-73` |
| 22 | **About page values card** | `Shinda roboti` | `Beat the robots` | `about/page.tsx:28` |
| 23 | **Play Store app name** | *(EN)* `Sumaiya: CV & Career AI` | | `docs/aso-play-store.md:9` |
| 24 | **Play Store short description** | *(EN)* `Build an ATS-ready CV, find Tanzanian jobs, and get AI career advice.` | | `docs/aso-play-store.md:14` |
| 25 | **Play Store full description, first line** | *(EN)* `Sumaiya is your career workspace — not just a CV maker.` | | `docs/aso-play-store.md:19` |
| 26 | **PWA manifest name** | `Sumaiya — CV & Document Builder` | | `apps/web/public/manifest.json:2` |
| 27 | **PWA manifest description** | `Build a professional CV, cover letter, business card or formal letter — with an AI assistant that helps you get hired.` | | `apps/web/public/manifest.json:3` |
| 28 | **THE SHARE CARD** — see §1.3 | `CV inayokupa ajira — kwa AI` | *(no English variant exists)* | `apps/web/public/og-image.png` (binary, 44,629 B) |
| 29 | **`/preview` landing (live, noindexed)** | `Msaidizi wa Kazi` · `Mwambie AI unachohitaji. Inaongoza kutoka hapo…` | `Career Copilot` · `Tell the AI what you need. It leads from there…` | `…/(marketing)/preview/page.tsx:11-15` |
| 30 | **`/preview` body line** | *(EN)* `Sumaiya — an AI career copilot that helps you get hired.` | | `apps/web/components/marketing/ai-copilot-landing.tsx:385` |
| 31 | **Tools page** | `Miundo ya kitaalamu inayopita ATS, pamoja na msaidizi wa AI.` | `Professional ATS-optimized templates with an AI assistant.` | `…/(marketing)/tools/tools-client.tsx:622-623` |
| 32 | **Template detail page** | *(EN)* `…seekers everywhere, with an AI assistant to help you get hired.` | | `…/(marketing)/templates/[slug]/page.tsx:85` |
| 33 | **Terms of Service** | *(EN)* `…with AI-powered content suggestions…` | | `…/(marketing)/terms/page.tsx:33` |
| 34 | **Package description** | *(EN)* `Sumaiya — get hired with AI.` | | `package.json` |

### 1.3 The single most-forwarded asset is the most mechanism-first line in the product

`apps/web/public/og-image.png` is a **binary asset** (44,629 bytes), committed directly — there is
no generator script in the repo (`find scripts apps/web/scripts -name '*og*'` → nothing). Its last
change is commit `49eade4`, *"copy(web): SW value-prop 'kupata/inayokupa kazi' → 'ajira'"*.

I fetched it and read the pixels. It reads, in cream on the ember field:

```
Sumaiya
CV inayokupa ajira — kwa AI
```

("The CV that gets you a job — with AI.")

Three problems, all measured, none of them stylistic:

1. **It is the only surface that leads with the mechanism *and* the strongest outcome promise at
   once.** "inayokupa ajira" = *that gets you a job*. That is the exact claim the site's own FAQ
   refuses to make (`home-page-client.tsx:444`: `Hatuwezi kuahidi kuwa mwajiri atakujibu — hakuna
   zana inayoweza kuahidi hilo` — "we cannot promise an employer will reply; no tool can"). **The
   product argues with itself across two surfaces, and the louder one is the one strangers see.**
2. **It is not the same sentence as the `<h1>`.** The page says `inayokufikisha kwa mwajiri`
   ("reaches the employer"); the card says `inayokupa ajira` ("gets you a job") plus `kwa AI`. Three
   different self-descriptions exist simultaneously across `<h1>`, OG card and JSON-LD.
3. **English shares show Swahili.** `og:image` is `/og-image.png` for **both** locales — verified
   live on `/en`. Every English share of every marketing page (templates, tools, ats-checker,
   pata-kazi, snap-to-apply, blog — `grep` found `/og-image.png` in 10 places) presents Swahili-only
   copy to an English reader.

**JUDGEMENT:** on this one surface the owner's instinct is exactly right, and it is the cheapest
high-impact fix in the whole document. WhatsApp is where this audience forwards things; this card
is the product's handshake, and it currently shakes hands in a language half its readers don't read,
using a word ("AI") the owner has banned from the lead, to promise a result the product's own FAQ
says it cannot promise.

### 1.4 The app's own home screen and tab labels

| Surface | Strings | Location |
|---|---|---|
| Native tab bar (5 tabs, EN-only `title` options) | `Home` · `My CVs` · `Sumaiya` · `Import` · `Profile` | `apps/native/src/navigation/stacks/app-tabs.tsx:120,125,130,137,142` |
| Native tab structure doc-comment | "Sumaiya Tab → the AI assistant, first-class — mirrors the web nav" | `app-tabs.tsx:7-9` |
| Native home CTAs | `Build your CV` / `Jenga CV yako` | `apps/native/src/screens/app/home-screen.tsx:392` |
| Native home quick actions | `Find jobs` / `Tafuta kazi` · `ATS check` / `Ukaguzi wa CV` | `home-screen.tsx:285-286` |
| *(removed mid-audit)* native quick action | `Career AI` / `AI ya kazi` — present at 23:52, gone by 21:10Z | `home-screen.tsx:284` |
| Native onboarding | `Meet Sumaiya` / `Karibu — mimi ni Sumaiya`; `Karibu · Welcome` | `apps/native/src/screens/onboarding-screen.tsx:41,194` |
| Android app metadata | `"name": "Sumaiya"`, version 1.6.25, `pro.sumaiya.app` | `apps/native/app.json` |

**Note what the native tabs already are:** `Home · My CVs · Sumaiya · Import · Profile`. Four of
five are nouns about **documents**. The product's real second half — jobs, applications, the CV
check, learning — lives one or two levels below a tab called `Home` and a tab called `Import`
(`Import` is a *verb*, the only outcome-shaped word in the bar).

### 1.5 The one place the wide positioning already exists — and it is buried

`apps/web/components/ui/footer.tsx:50`:

> `Your career assistant — CVs, cover letters, jobs and advice in one place.`

**JUDGEMENT:** that single line is the widest, most honest self-description the product currently
owns, and it is in the footer. The homepage hero is narrower than the footer. That inversion is the
whole problem in one observation.

### 1.6 Counts

| Measure | Count |
|---|---|
| Marketing pages under `/app/[locale]/(marketing)/` | **14** |
| Web files containing human-facing `"…AI…"` string literals | **14** |
| Total such string literals in web app/components/i18n | **45** |
| Native files containing them | **2** |
| Distinct `file:line` sites in the tables above | **~34** (several duplicated across 2–3 files) |
| Metadata/JSON-LD blocks that are **byte-identical duplicates** of each other | **2 pairs** (`[locale]/layout.tsx` ↔ `(app)/layout.tsx`) |
| Languages every string must exist in | **2** (enforced: `apps/web/lib/i18n/translations.test.ts` fails if a key exists in one and not the other) |

### 1.7 What a stranger concludes after 30 seconds — and whether it is true

**A stranger who lands on sumaiya.app today concludes they have found a free Swahili CV maker.**
The `<h1>` promises a CV that reaches the employer; the subhead promises a CV matched to a pasted
job advert; the biggest button says "Start your CV — free"; the reassurance line says no account,
no card, nothing to pay; and the visual proof is a fan of CV templates. Nothing above the fold
names a job feed, an application tracker, a CV check, an interview, or a lesson. The nav offers
`Ajira` and `Kagua CV` as small links, but on a cheap Android phone the entire first screen is one
document. If they push further — the Play listing, the JSON-LD, the share card, the About page —
the claim *widens in the wrong direction*: it stops being narrower and becomes the mechanism
("AI Career Platform", "with an AI assistant that helps you get hired", "CV inayokupa ajira — kwa
AI"). So the product is simultaneously **too narrow about what it does** (CV, not the application
and everything around it) **and too vague about how it does it** (AI, a mechanism nobody was
asking about), which is the worst of both.

**Does that match what it actually does? No — but neither does the wide alternative.** Measured
against tonight's capability set, the CV claim is *true and badly incomplete*: the CV builder,
cover letters, business card, formal letters, on-device CV check, application tracking, career
interview and learning all genuinely exist; but the two capabilities that would justify a wider
claim **do not currently work**, and I verified both myself:

- **The jobs feed serves fabricated listings, not real ones.** `POST /api/jobs/feed` on production
  returned rows with `"company":"Kilimanjaro Retail Ltd"`, `"salary":"TZS 800,000 – 1,200,000"` and
  `postedAt` set to *seconds before my request*. The route's own head comment:
  `// Local-first seed … This is placeholder data until a real jobs source is wired.` and
  `let results = [...MOCK_JOBS];` (`apps/web/app/api/jobs/feed/route.ts:12, 104`). **One entry
  attributes a fabricated vacancy and salary to a real named employer — `Vodacom Tanzania`** — and
  every listing carries `postedAt: new Date()`, so it *looks* live forever. A real ingest pipeline
  exists (`lib/jobs/ingest.ts`, `authenticity.ts`, `dedup.ts`) but the public feed does not use it.
- **The tracker and the interview exist but the loop is not closed** — per the committed
  `docs/PRODUCT-DIRECTION-2026-09-20.md` §1.2, native and server tracking use different status
  vocabularies and never sync (D8), and "hired" is not yet a recordable status.

**So the honest verdict is: the product is a genuine multi-document, Tanzania-first application
tool with a jobs section that is currently a mock-up.** It is materially more than "an AI CV
maker", and it is materially less than "a career platform". The correct lead sits between, and the
one thing it must never do is lead with the part that is fake.

---

## 2 · THE CATEGORY, RESEARCHED

Method: `web_extract` is blocked in this environment (`Firecrawl 403`), so every page below was
fetched with `curl` + a desktop User-Agent and parsed locally. **Quotes are the real strings from
those pages.** Where a fetch failed I say so rather than paraphrasing from memory.

### 2.1 Category A — AI CV / resume builders (global)

| Product | URL | One-line positioning (as fetched) | Leads with | Deliberately does NOT say |
|---|---|---|---|---|
| **Resume.io** | https://resume.io/ | meta: *"Join the top 2% with our field-tested templates, easy-to-use resume builder, and powerful career tools."* H1: *"This resume builder gets you [hired]"* | The builder + "top 2%" social proof | No country, no audience, no price on-page; does not lead with "AI" |
| **Novoresume** | https://novoresume.com/ | title: *"Free Online Resume Builder \| Used by 18M+ Job Seekers"*; H1: *"The Best Online Resume Builder by Novoresume"* | **Scale** ("18M+", "86% of job seekers landed a job…") | Never leads with AI — AI is a modifier: *"Build your free AI-powered resume in minutes."* |
| **Enhancv** | https://enhancv.com/ | meta: *"Best ATS-Friendly Online Resume Builder"*; H1: *"Land more interviews with Enhancv's Resume Builder"* | **The interview callback**, i.e. the outcome | Does not lead with its breadth — even though its nav already carries `Job Tracker`, `Job Board`, `Interview Help`, `Learning`, `Cover Letter` |
| **Rezi** | https://www.rezi.ai/ | title: *"The #1 AI Resume Builder – Forbes' Top Pick. Trusted by 4.5M"*; H1: *"Ranked #1 AI Resume Builder by Forbes"* | **Third-party authority + AI**, explicitly | Nothing — this is the one player that does lead with "AI" |
| **Zety** | https://zety.com/ | **FETCH FAILED** — `curl` returned an empty body (bot wall). | *Unverified.* | *Unverified.* |

**The observation that decides this whole document:** **Enhancv has materially the same capability
set as Sumaiya** — resume builder, job tracker, job board, interview practice, learning, cover
letters — **and it still leads with one narrow, concrete promise about one document.** Resume.io,
Novoresume and Enhancv all ship the "wide" product and none of them leads with a category
abstraction. Only Rezi leads with AI, and it does so by borrowing Forbes' authority, not by
explaining a mechanism.

### 2.2 Category B — African / emerging-market career services — **the real competitive set**

| Product | URL | One-line positioning (as fetched) | Leads with | Deliberately does NOT say |
|---|---|---|---|---|
| **CV Chap Chap** (TZ) | https://cvchapchap.com/ | meta: *"AI-powered CV builder for Tanzania & East Africa."* H1: *"Find the job you want, faster."* | **The job outcome + social proof**: *"18,572 users landed interviews last month"*, *"2,398 Reviews"*, *"66 templates"*, *"Made in Africa"* | Does **not** say "free download". It says *"Free to build"* — download costs a **one-time fee paid by mobile money: M-Pesa, Mixx by Yas, Airtel Money, Azam Pesa** (`/free-cv-builder`). It also does not lead with the word it put in its meta tag: "AI" appears in the tag, never in the H1. |
| **Zoom Tanzania** (jobs) | https://www.zoomtanzania.net/ | title: *"The #1 Jobs and Careers Platform in Tanzania"*; on-page: *"A LEADING CAREER PLATFORM"*; H1: *"Help You Find Jobs in Tanzania"* | **Jobs volume**: *"4,608+ Jobs"*. AI is a nav menu: `AI Tools: AI Cover Letter · Interview Prep · AI CV Assessment` | Does not lead with CV tools at all — they are downstream of the listing |
| **Zoom Tanzania CV maker** (TZ) | https://cv.zoomtanzania.net/ | title: *"Jinsi ya Kutengeneza CV \| Zoom Tanzania Free CV Resume Maker"*; H1: *"Tengeneza CV Bora"* | **Swahili CV-making + zero signup**: *"Hakuna haja ya kuingia au kujisajili"* | Does not mention jobs; does not use the word AI on the CV tool |
| **Jobberman** (NG) | https://www.jobberman.com/ | H1: *"Find your next job opportunity, faster."* | **Jobs + speed.** `AI Career Tool` is a **nav item**, not the headline | Does not lead with CV building or AI |
| **BrighterMonday** (KE) | https://www.brightermonday.co.ke/ | H1: *"Find your next job opportunity, faster."* | **Identical string to Jobberman** (same group). Same nav, incl. `AI Career Tool`, `My Learning` | Same — AI is furniture, never the promise |
| **Fuzu** (KE) | https://www.fuzu.com/kenya | H1: *"Find your dream job in Kenya"*; on-page: *"Built for job seekers. Trusted by career builders and employers. Get accurate job matches, learning pathways and career advice — for free."* | **Matching + free + learning pathways** | Does not lead with AI; does not lead with CV building |
| **Mabumbe** (TZ) | https://mabumbe.com/cv-writing-service-tanzania | H1: *"CV Writing Service!"* | **A human service with a price and longevity**: *"Since the year 2011"*; *"If you have the qualifications and skills but are not getting interviews then your CV could be the problem"* | Does not say free, does not say instant, does not say AI |

### 2.3 Category C — "career intelligence" / "job-search operating system" framing

| Where it is used | URL | The line |
|---|---|---|
| **Q2CareerOS** | https://q2careeros.com/ | *"The Operating System for Careers."* / *"Q2CareerOS — The AI Career Operating System"* |
| **Jobz** (directory listing) | https://platform.tracxn.com/a/d/company/5ae4bcf4e4b0fb0e47359166/jobz | *"AI-powered career intelligence platform enhancing resumes, interviews, and job applications"* |

**Both are English-language, Western, and sell to professionals who already have careers.** I
found **no African player using this framing**, and no player anywhere using it in Swahili.

### 2.4 Category D — WhatsApp-first / mobile-money-first consumer products in East Africa

**Honest gap:** I did not fetch a page for a specifically WhatsApp-first EA product, so I have no
direct quote for this category and I am not going to invent one. What I *can* evidence is the
**mobile-money rail** behaviour of the one direct TZ competitor: CV Chap Chap charges a one-time
download fee through *"M-Pesa, Mixx by Yas, Airtel Money and Azam Pesa"* — i.e. **the local
monetisation norm is "free to build, pay to release the file, by mobile money."** That is the
commercial pattern Sumaiya's "bila malipo, bila akaunti" is deliberately positioned against, and
it is the strongest true thing the product owns (see §3.2 — the Mwanza pass independently named
the scam-fear this rail creates).

### 2.5 The honest category names, and who can claim them

| Category name | Who occupies it | Can Sumaiya claim it today? |
|---|---|---|
| **CV / document builder** | Zety, Novoresume, Resume.io, Canva; locally CV Chap Chap, Zoom TZ CV maker, Mabumbe (human) | **Yes, fully.** Best-tested surface; the one thing a guest can finish with no account. |
| **Job application kit** | *No clean incumbent* — the job is served by a stack (Canva + Jobscan + a letter template) | **Yes.** CV + cover letter + business cards + formal letters + a check are all shipped and reachable. |
| **Job-search operating system / career intelligence** | Q2CareerOS (US), Jobz; Teal/Huntr/Simplify globally | **No — not today.** Requires a live jobs feed (it is mock data), synced tracking (it does not sync), and a recordable "hired" outcome (it is not one yet). |
| **Jobs platform / job board** | BrighterMonday, Zoom Tanzania (4,608+ jobs), Fuzu, JobWebTanzania | **No — emphatically.** The feed serves `MOCK_JOBS`; one row names a real employer with a fabricated salary. |
| **Career services / coaching** | LinkedIn Learning, Coursera; locally Mabumbe's human writers | **No.** Sumaiya's is automated self-assessment, not credentialed guidance. Claiming it borrows trust it has not earned. |
| **Workforce platform / employment OS** | None serving this market at this altitude | **No.** Unpicturable to the buyer and false on the product's own evidence. |

---

## 3 · THE FRAMINGS

Seven passes, each in its own file, each headed with the model that produced it. Claude passes
1–5 (session limit hit after); OpenRouter free-model passes 6–7. Passes were run **one at a time**.

### 3.1 Pass 1 — Category strategist *(Claude)*
`docs/research/rebrand-2026-09-20/pass-1-category-strategist.md`

Assessed six honest categories and ruled three of them lies *today* (jobs platform, career
services, workforce platform) for evidenced reasons. Recommended **"job application kit"** —
*"wider than 'CV builder' in a way that is true today … narrower than 'job-search operating
system' in the one way that matters: it makes no promise about jobs existing in the feed."*
Its diagnosis of the current framing is the sharpest single sentence in the research:

> *"The headline IS the session-length design: it promises one document, so the funnel delivers
> one document, and the person leaves."*

Proposed line: **`Nyaraka zote za kuomba kazi — tayari kutuma.` / `Everything you send to apply — done right, ready to send.`**

### 3.2 Pass 2 — Neema, 24, Mwanza, cheap Android, never paid online *(Claude)*
`docs/research/rebrand-2026-09-20/pass-2-jobseeker-mwanza.md`

- The `` `/ … /` `` notation in the prompt read to her as **broken formatting** — *"When I see
  something that looks half-built, my first thought is 'hii app bado haijakamilika'."* (An artefact
  of my prompt, but a useful lesson about how a half-finished surface reads.)
- **"Bure" is the bait word.** *"Every scam group I've seen on those job WhatsApp groups also says
  'bure' in the first line."* The current reassurance (`bila malipo, bila akaunti`) is exactly what
  the scam posts say; **what is missing is `bila kadi` ("no card") — the thing she has never had and
  the thing every real scam eventually asks for.**
- Her first fear, ranked: the download is held hostage for money → phone number resold to
  "placement" callers → it is *"another site built for Nairobi."*
- **On the five extra features (blunt):** *"right now it reads as more stuff, not more reason to
  trust it … 'which one of these is it actually good at?'"* — **except jobs + tracking**, which she
  says are *"literally the next two steps after the CV"* and belong in **one path**: *ona kazi →
  tengeneza CV inayolingana → tuma → kumbuka umetuma wapi*.
- Flags `Snap-to-Apply` as the one English phrase in a Swahili nav list — *"it reads foreign."*
- Her line: **`Bandika tangazo la kazi, upate CV inayolingana nalo — bure kabisa, bila akaunti, bila kadi.`**

### 3.3 Pass 3 — Hiring manager, mid-size company in Dar *(Claude)*
`docs/research/rebrand-2026-09-20/pass-3-hiring-manager.md`

- A candidate mentioning the app is **mildly negative on its own** (*"neutral-to-slightly-negative
  on the mention alone, because 'I used an app' tells me about the process, not the person"*), but
  the surrounding features (jobs feed, career interview, readability check) are a **real positive**
  versus the median entry-level applicant.
- **On the current claim, the most important correction in the research:**
  > *"'Reaches the employer' is a promise about me … nothing in this product's real feature list
  > touches my side of the pipe. What the claim is really describing is 'a CV that clears automated
  > screening and reads well to a human' — i.e. a readiness claim, not a delivery claim."*
  His rewrite: **`CV inayosomeka, si kutupwa`** — "a CV that gets read, not discarded."
- Failure mode at scale: *"a CV tool that makes everyone legible makes everyone interchangeable"* —
  template polish becomes worthless, and the strong candidates lose the most.
- Advises **not** to chase candidates and employers with one headline.

### 3.4 Pass 4 — Head of Growth, BrighterMonday Tanzania *(Claude)*
`docs/research/rebrand-2026-09-20/pass-4-competitor-growth.md`

Chose the incumbent deliberately: *"a global CV builder is a **feature** competing with Sumaiya's
CV builder. I am the **market** Sumaiya's new jobs feed is trying to enter."*

- Afraid of the free/no-account/offline-tolerant Swahili builder; **dismisses the jobs feed
  outright** (*"an empty jobs feed is not a competitive threat, it's a placeholder"*).
- Three cheap kills: **SEO-fence the Swahili job queries**, bolt a free CV builder onto his own
  listing pages, and push **verified-employer badges** to attack the trust gap.
- Can't copy fast: *"a genuinely free, anonymous, offline-tolerant builder."* Will exploit:
  *"demand-side liquidity."*
- **The counter-intuitive answer, which is the most decision-relevant finding in all seven passes:**
  > *"A wider claim helps me, the incumbent, more than it helps Sumaiya … A wide claim like 'career
  > intelligence platform' drags Sumaiya directly onto **my** turf — jobs, tracking, interviews —
  > where I have the thing that's hard to fake fast … If Sumaiya widens the claim, I would start
  > comparing it publicly … against its own weakest surface ('empty jobs list' screenshots travel
  > well). A narrow claim gives me nothing to point at, because it never promised jobs in the
  > first place."*
- What it should lead with: *"the free, no-account, Swahili-first CV and document builder that
  actually works on a cheap phone."*

### 3.5 Pass 5 — Brand-voice critic, cold read *(Claude)*
`docs/research/rebrand-2026-09-20/pass-5-voice-critic.md`

- **Register: "two registers stitched together, and the seam shows."** The homepage hero is in a
  good plain-spoken, checkable-claim register; *everything else* — root `<title>`, JSON-LD, About,
  Play listing — is US consumer-SaaS growth-marketing register, *"the voice of Rezi, Kickresume,
  Teal, Novoresume."* One About paragraph tips into a third: NGO/donor-report uplift.
- What register it should be: **"oral instruction, not product description — closer to what a
  competent older cousin who has filled in this same form before would tell you standing next to
  you."**
- Named failures: `about/page.tsx` H1 leading with the mechanism; `Shinda roboti` (*"reads as
  literal robots"* in Swahili); donor-speak (*"give everyone the tools that expensive career
  coaches charge for"*); `mshauri wa kazi mfukoni mwako` as an English idiom transplanted whole.
- **On whether "AI" earns its place:** the PWA manifest name
  `Sumaiya — CV & Document Builder` contains no "AI" and is *perfectly legible* — the control case.
  Verdict: dead weight in every surface a human reads; *"marginal, defensible-but-not-load-bearing"*
  only in crawler-only JSON-LD, where the real offender is *"helps you get hired"*, not "AI".
- **Two memorial rules**, both checkable:
  1. *Sumaiya is always the subject of a helping verb, never the object of a selling verb.* Test:
     could the sentence be said about a real person standing next to you? `"Sumaiya: CV & Career
     AI"` fails instantly — *"no one introduces a sister that way."*
  2. *The name never shares a clause with a price, a feature count, a competitor, or the word "AI".*
- Lines proposed: eyebrow `BURE, KWENYE SIMU YAKO` / `FREE, ON YOUR PHONE`; H1
  `Andika CV inayomfikia mwajiri.` / `Write the CV that reaches the employer.`

### 3.6 Pass 6 — East Africa mobile-first operator *(OpenRouter: `nvidia/nemotron-3-ultra-550b-a55b:free`)*
`docs/research/rebrand-2026-09-20/pass-6-east-africa-operator.md`

- **Job-to-be-done: not the CV.** *"the user returns for one thing only: 'Send a proper application
  for the specific vacancy I have right now.' … The CV is the artifact. The job is the application
  event — triggered when a vacancy appears in a WhatsApp group."*
- **Kill the `Ajira` nav item today:** *"An empty 'Ajira' tab on a 2GB RAM phone says 'this app is
  broken' or 'this app lies'. Uninstall follows."* Replace it with **`Tangazo Lako`** ("Your
  Vacancy") — a paste-the-advert surface, so tracking is populated by the user's own history and
  the empty state can never be empty.
- **The missing mechanic:** a **one-tap "Tuma kwa WhatsApp"** export that opens WhatsApp with the
  PDF attached and a pre-filled Swahili message — *"This puts the artifact where the hiring
  decision happens."* Today it is 6+ taps and 2 app switches.
- Direction it recommends: **"The Application Maker"** — `Andika Maombi Yako Kwa Dakika 2` /
  `Write Your Application in 2 Minutes`, leading with *paste advert → tailored CV + cover letter →
  one-tap send*.

### 3.7 Pass 7 — Vision critique of the real share card *(OpenRouter: `nex-agi/nex-n2.5-pro:free`, VISION)*
`docs/research/rebrand-2026-09-20/pass-7-vision-ogcard.md`
Input image: the live `https://sumaiya.app/og-image.png`, 1200×630, fetched and read as pixels.

Transcribed exactly as `Sumaiya` / `CV inayokupa ajira — kwa AI`. Verbatim findings:

- **For whom:** *"Swahili-speaking job seekers who already understand 'CV'"* — and *"clearly not
  for: English-only readers … people who need proof, screenshots, testimonials, or a concrete
  example before trusting a product."*
- **English reader:** *"Almost everything breaks … They do not know whether this is: a CV builder,
  a job board, an AI writing tool, a recruitment service, a paid or free product, Tanzania-specific
  or global. The card gives them no reason, context, or action."*
- **CTA:** *"There is no real CTA … Missing specifically: 'Bure' / 'Free'. 'Anza' / 'Start'. … Any
  indication of speed, ease, or outcome."*
- **Restraint or waste:** *"Mostly wasted impression … this is a first-touch WhatsApp share card.
  On this surface, the product has seconds to explain itself."*
- **On "kwa AI":** *"JUDGEMENT: Not on this surface. 'Kwa AI' is a mechanism, not the user's main
  desire."* Its rewrite: **`Tengeneza CV yako ya ajira kwa dakika 5 — Bure` / `Build your job-ready CV in 5 minutes — Free`**, plus an action line naming WhatsApp.

### 3.8 Reconciliation — where the seven agreed

Four independent framings converged on the same structural claim, from four different directions:

1. **The artefact is not the promise; the application event is.** Pass 1 ("the headline is the
   session-length design"), pass 2 (*"ona kazi → tengeneza CV → tuma → kumbuka"*), pass 3
   ("readiness, not delivery — a claim about behaviour"), pass 6 ("the CV is the artifact; the job
   is the application event") all arrive at the same place.
2. **The current hero over-claims the part it does not control.** Pass 3 (the employer himself),
   pass 5 ("a promise about an outcome the product can't control") and pass 7 (the card promises
   "gets you a job") independently flagged `reaches the employer` / `inayokupa ajira`.
3. **Exactly one thing is structurally un-copyable by the incumbent, and it is already shipped:**
   free, no-account, Swahili-first, offline-tolerant, works on a cheap phone. Pass 4 named it from
   the attacking side; pass 2 named the trust version of it (*"haikuniomba pesa wala namba" is
   itself a recommendation*).
4. **Do not lead with the mechanism.** Pass 5 (register analysis) and pass 7 (pixels) agree, and
   §2 shows every African competitor agrees: AI is a nav item, never a headline.

### 3.9 Reconciliation — where they genuinely disagreed

I am not smoothing these out; they are the live decisions.

| # | Disagreement | Who says what |
|---|---|---|
| 1 | **How wide to go.** | Pass 1: widen *modestly*, to a "job application kit". Pass 6: go **narrower** — not even "CV", but "the application for the vacancy in your hand". **Pass 4: widening actively helps the incumbent and hands him an attack surface.** Pass 3: don't try to please two audiences at once. → *Three of four lean narrow; only pass 1 leans modestly wide.* |
| 2 | **Keep the jobs surface or kill it (direct contradiction).** | Pass 6: *"Kill the 'Ajira' nav item today. It is a trust leak."* Pass 2: jobs + tracking are *"the same job"* and are the **only** two extras worth keeping. → These cannot both be right. The resolution I take is in §4: the *surface* stays, the *lead* goes; and the user's own pasted ad replaces the aggregate feed. |
| 3 | **Is the current hero honest?** | Pass 1: *"not wrong — it is an honest, outcome-framed claim about the one thing it names."* Pass 3, who is the employer: **no** — it is a readiness claim *"wearing a delivery claim."* → I side with pass 3, because he is the only voice who is actually the other end of the sentence. |
| 4 | **Does "AI" stay anywhere?** | Pass 5: dead weight in human surfaces, *marginally* defensible in crawler-only JSON-LD. Pass 7: does not earn its place on the card. Pass 1 and 6: never lead with it. Nobody defended it as a lead. → Consensus: not in the lead; the JSON-LD question is a genuine open call for the owner (there is real search demand — `ai cv assistant`, `msaidizi wa CV AI` are in the live keyword lists). |
| 5 | **Register: imperative or fear-naming?** | Pass 5 wants imperative + spoken Swahili (`Andika CV inayomfikia mwajiri`). Pass 2 wants the *fear* answered by name (`bila kadi`). Pass 7 wants speed + "Bure". → Not exclusive; §4 takes all three. |
| 6 | **Does document breadth attract or repel?** | Pass 1 recommends *"Nyaraka zote za kuomba kazi"* (all documents). Pass 2 called business cards and PDF tools *"concepts the target reader has no use for"*. → **Genuine conflict.** Resolution: breadth belongs on the second screen, not in the headline. |

---

## 4 · THE PROPOSITION — three directions

Frame: **Africa, Tanzania first.** Audience: **a first-time jobseeker on a cheap Android phone who
has never paid for a service online.** Constraints honoured in all three: the name Sumaiya is a
memorial and is fixed; no colour changes; no logo changes; Swahili first; sell the outcome, never
the mechanism; do not name the model provider.

---

### Direction A — **The application you are sending today**

> **One-line promise:** Paste the job advert you already have, and walk away with a complete
> application ready to send.

| | |
|---|---|
| **Headline (SW)** | **`Maombi yako, tayari kutuma.`** |
| **Headline (EN)** | **`Your application, ready to send.`** |
| **Subhead (SW)** | `Bandika tangazo la kazi. Sumaiya anakusaidia kuandika CV, barua ya maombi na barua nyingine yoyote unayohitaji — kwa Kiswahili, kwenye simu yako, bila malipo, bila akaunti, bila kadi.` |
| **Subhead (EN)** | `Paste the job advert. Sumaiya helps you write the CV, the cover letter and any other letter you need — in Swahili, on your phone, free, no account, no card.` |
| **Eyebrow (SW / EN)** | `KWA WATAFUTA KAZI — TANZANIA` / `FOR JOB SEEKERS — TANZANIA` *(kept — it is already correct)* |
| **CTA** | `Anza na tangazo lako — Bure` / `Start with your advert — free` |
| **Leads with** | The *event*: a real advert the user already holds. Then the CV, the cover letter, the check, the send. |
| **Deliberately stops saying** | `AI` anywhere above the fold · "CV maker" as the category · `reaches the employer` / `inayokupa ajira` (delivery claims) · anything implying the product has jobs for you · `career workspace`, `career platform`, `jukwaa`, `operating system`. |
| **Attracts** | People with a vacancy **in hand right now** — highest intent, deadline pressure, the exact person who forwards a link in a WhatsApp group. Also absorbs pass 2's `ona kazi → tengeneza CV → tuma → kumbuka` path and pass 1's "kit" without claiming a platform. |
| **Loses** | The passive "I should update my CV someday" browser, and the student with no target role. Pass 6 names this loss explicitly. Mitigation: the secondary CTA stays for exactly that person. |
| **Honest floor** | Every claim above is true today: CV + cover letter + letters + the on-device check + export all ship. **No promise about jobs, tracking sync, or outcomes.** |

---

### Direction B — **Everything you send to apply**

> **One-line promise:** Every document your application needs — CV, cover letter, business card,
> formal letter — made properly, in your language, on your phone, for free.

| | |
|---|---|
| **Headline (SW)** | **`Nyaraka zote za kuomba kazi — mahali pamoja.`** |
| **Headline (EN)** | **`Everything your application needs, in one place.`** |
| **Subhead (SW)** | `CV, barua ya maombi, kadi ya biashara, barua rasmi — vyote kwa mwonekano mmoja, kwa Kiswahili, bila malipo.` |
| **Subhead (EN)** | `CV, cover letter, business card, formal letters — one consistent look, in Swahili, free.` |
| **Leads with** | The **inventory**: four document types + ~47 templates + 12 PDF tools + the on-device check. |
| **Deliberately stops saying** | `AI` as the lead · `reaches the employer` · jobs (no jobs claim at all) · interview prep · "career". |
| **Attracts** | Breadth shoppers: the informal worker, the freelancer, the trader needing an official letter, the student needing an internship letter — people pass 2 predicted would find business cards *"no use for"*. Good for SEO surface area (`kadi ya biashara`, `barua rasmi` are already live keywords). |
| **Loses** | **Urgency.** A person with an advert closing tomorrow does not want a document catalogue — they want the application. This is the direction pass 1 recommended and pass 2 quietly rejected; I am recording that I read both and that they conflict. |
| **Honest floor** | True today. But it is the direction whose headline most resembles a *table of contents*, and pass 3 warned it is the framing that makes CVs feel commoditised. |

---

### Direction C — **Careful — this one cannot ship yet**

> **One-line promise:** Your whole job hunt in one place — find the work, apply, get ready, get
> better.

| | |
|---|---|
| **Headline (SW)** | **`Kazi yako, hatua kwa hatua.`** |
| **Headline (EN)** | **`Your career, step by step.`** |
| **Subhead (SW)** | `Tafuta nafasi, tuma maombi, jipange kwa usaili, jifunze ujuzi unaohitajika — zote mahali pamoja.` |
| **Leads with** | **Jobs first**, then CV, tracking, interview, learning. |
| **Deliberately stops saying** | Nothing much — that is the problem. It is close to what the goal of "wider" would produce. |
| **Attracts** | Vaguely, everyone. |
| **Loses** | Credibility, on the first tap, permanently. |
| **Honest floor — and this is the point of listing it** | **It is not shippable today, and leading with it would be a lie.** `POST /api/jobs/feed` returns `MOCK_JOBS`: *"Kilimanjaro Retail Ltd"*, *"TZS 800,000 – 1,200,000"*, `postedAt: new Date()`, with the route's own comment saying *"This is placeholder data until a real jobs source is wired."* One row attributes a fabricated vacancy and salary to **Vodacom Tanzania**, a real company. Tracking does not sync native↔server; "hired" is not a recordable status. Pass 4 said it outright: a wide claim *"drags Sumaiya directly onto my turf … where I have the thing that's hard to fake fast."* And leading with jobs while serving fabricated listings to a user who then cannot apply is not a positioning error — it is the exact scam pattern pass 2 described being burned by. |

---

### 4.1 Recommendation: **Direction A**, with Direction B as the second screen

**Why A, on the evidence:**

1. **Four of the seven framings converge on it independently** (§3.8), and the two that lean wider
   (pass 1) or narrower (pass 6) both land inside A: A is pass 1's "job application kit" *triggered
   the way pass 6 says the user actually arrives* — advert in hand, deadline tomorrow.
2. **It is the only direction that is true today and still wider than "CV maker".** It promises the
   CV *plus* the cover letter *plus* the letters *plus* the check — four shipped things, no jobs
   claim, no sync claim, no outcome claim. Direction B is also true, but it advertises a catalogue
   rather than a moment; both pass 3 and pass 6 say the moment is what converts.
3. **It defuses the competitor's cheapest kill.** Pass 4 said the wide claim is what gives him a
   public comparison on jobs. A makes no jobs promise, so there is nothing to screenshot.
4. **It answers pass 2's real fear.** Her words: *"Say the thing I'm scared of, by name, and deny
   it."* A's subhead adds **`bila kadi`** — the specific denial the current copy omits, and the
   single highest-leverage three syllables in this whole document.
5. **It survives the memorial rules.** Sumaiya stays the subject of a helping verb
   (`Sumaiya anakusaidia kuandika…`); the name never shares a clause with a price, a feature count,
   a competitor, or "AI". Sumaiya is not renamed, not coloured, not logoed, not optimised.
6. **It gives the wide capability set a home without putting it in the headline.** Jobs, tracking,
   the career interview, learning and the PDF tools move to screens two and three, reached *after*
   the first application is sent — which is also what pass 6 asked for.

**What A must be paired with, or it will not hold:** the `Ajira` nav item must not promise listings
it cannot deliver. Pass 2 and pass 6 contradict each other on this, and the resolution I take is
**keep the surface, change its promise**: relabel it around the user's own advert (**`Tangazo Lako`**,
"Your vacancy") so the tab is never empty and never lies, and add pass 6's
**one-tap "Tuma kwa WhatsApp"** export — which is the only proposed change in this document that
the user can feel on their first successful run. **JUDGEMENT.**

### 4.2 The single decision that matters most

> **Lead with the thing the user already has (a job advert, and a deadline), not with the
> inventory of things the product contains.**

Every other choice in this document is downstream of that one. If it is taken, the hero, the
`<title>`, the share card, the Play listing and the About page all resolve the same way, and the
"we lead with AI CV maker" complaint disappears as a side effect rather than as a task. If it is
not taken — if the lead stays an inventory, whether the inventory says "CV", "documents", or
"career platform" — then the product will keep describing itself and the user will keep leaving
after one document, which is what pass 1 said the current headline already causes.

**One corollary the owner should decide at the same time, because it is not a copy question:** no
led-with claim may name a surface that is currently placeholder. Today that rules out jobs and
rules out anything called a platform. It stops ruling them out the moment the feed serves real
Tanzanian listings.

---

## 5 · THE COST OF THE CHANGE

Everything below is a string, page or metadata field that moves for each direction, with
`file:line` at the audit snapshot (§0.3). **Every count is a count of what I actually grep'd, not
an estimate** — and because the tree is being edited concurrently, treat each row as "as at
`HEAD 8d2f2a6` + dirty tree" and re-grep before editing.

### 5.1 Direction A — the recommended one

| File | Lines | What changes | Items |
|---|---|---|---|
| `apps/web/app/[locale]/(marketing)/home-page-client.tsx` | 474, 487, 494-496, 512-513 | eyebrow *(keep)*, **H1**, subhead, primary CTA | **3 strings × 2 langs = 6** |
| `apps/web/app/[locale]/(marketing)/layout.tsx` | 21-22, 24-25, 27-28, 60 | `<title>`, meta description, keywords, og alt | **4 × 2 = 8** |
| `apps/web/app/[locale]/layout.tsx` | 95-96, 97-99, 101-102, 122, 166, 185 | root title, description, keywords, og alt, **both JSON-LD blocks** | **6 × 2 = 12** |
| `apps/web/app/(app)/layout.tsx` | 71-72, 74-75, 77-78, 98, 137, 156 | **byte-identical duplicate of the above** — must move in lockstep | **6 × 2 = 12** |
| `apps/web/public/og-image.png` | — | **binary asset, text baked in.** No generator script in repo → needs the design source | **1 asset** |
| `apps/web/public/manifest.json` | 2, 3 | PWA name + description | **2** |
| `apps/web/components/ui/footer.tsx` | 50 | strapline — this is where Direction A's wide half can live | **1** |
| `apps/web/app/(app)/(auth)/sign-in/sign-in-form.tsx` | 234, 237-240 | pitch heading + 4 bullets | **5 × 2 = 10** |
| `apps/web/app/[locale]/(marketing)/about/page.tsx` | 15-16, 22, 28, 68, 72-73 | description, values card, H1, body | **6 × 2 = 12** |
| `apps/web/app/[locale]/(marketing)/templates/page.tsx` | 25 | og alt | **1** |
| `apps/web/app/[locale]/(marketing)/templates/[slug]/page.tsx` | 85 | "with an AI assistant to help you get hired" | **1** |
| `apps/web/app/[locale]/(marketing)/tools/tools-client.tsx` | 622-623 | closing band | **1 × 2 = 2** |
| `apps/web/app/[locale]/(marketing)/tools/[slug]/page.tsx` | 172-173 | closing band | **1 × 2 = 2** |
| `apps/web/app/[locale]/(marketing)/preview/page.tsx` + `components/marketing/ai-copilot-landing.tsx` | 11-15 + 385 | the live noindexed "AI Career Copilot" landing — either rewrite or **delete the route** | **3 × 2 = 6** |
| `apps/native/src/screens/app/home-screen.tsx` | 392 (+ 348-400 band) | home hero CTA | **~2 × 2 = 4** |
| `apps/native/src/screens/onboarding-screen.tsx` | 41, 194 | first-run pitch — the **most important native string**, since a first-timer sees this before anything | **2 × 2 = 4** |
| `apps/native/src/screens/app/help-faq-screen.tsx` | 64-65 | premium FAQ | **1 × 2 = 2** |
| `docs/aso-play-store.md` | 9, 14, 19 + body | app name (30 chars), short desc (80), full desc (4000) | **3 + body** |
| `apps/native/app.json` | `name` | **no change** — "Sumaiya" is correct | 0 |

**Direction A total: ~40 strings, ~19 files, 1 binary asset.** Of those, **the highest-impact six**
are: the OG card (1 asset), the root `<title>` × 2 locales, the JSON-LD × 2 duplicates, the hero H1
× 2 locales, the native onboarding × 2 locales, and the Play app name.

**Two mechanical facts that make this cheaper than it looks, and one that makes it riskier:**
- **Cheaper:** the i18n key-parity test (`apps/web/lib/i18n/translations.test.ts`) *forces* you to
  do both languages, so a Swahili-first rewrite cannot silently ship English-only.
- **Riskier:** the root metadata + JSON-LD block is **duplicated verbatim** in two files
  (`[locale]/layout.tsx` and `(app)/layout.tsx`). A one-file edit ships an inconsistent product —
  marketing pages would say one thing and the signed-in app another. This is the single most likely
  place for a system-wide rebrand to half-land.

### 5.2 Direction B — everything you send

Same as A **plus** the homepage restructure: the product grid (`home-page-client.tsx:786-830`),
the CV designs grid (`:831-871`), the PDF tools band (`:872-914`) and the documents section
(`:792-796`) must move **above** how-it-works and the phone section, and the templates gallery
becomes the hero visual instead of the CV card stack (`:577-616`).

**Direction B total: ~40 strings + a section reorder of ~5 blocks in one 981-line file.** The
strings are a subset of A's; the *structural* cost is higher than A's by roughly a day of work and
a regression pass over the marketing page — **JUDGEMENT, since I did not attempt the reorder.**

### 5.3 Direction C — the wide platform claim

**Everything in A and B, plus claims the product cannot honour.** Concretely, shipping C means
first shipping:

| Prerequisite | Current state (measured) | Where |
|---|---|---|
| A jobs feed with real Tanzanian listings | serves `MOCK_JOBS`; *"placeholder data until a real jobs source is wired"* | `apps/web/app/api/jobs/feed/route.ts:12, 104` |
| No fabricated vacancy attributed to a real employer | `"company": "Vodacom Tanzania"` at `route.ts:57`, with a fabricated salary and `postedAt: new Date()` | `apps/web/app/api/jobs/feed/route.ts` |
| Native↔server tracking sync | different status vocabularies, never sync (D8) | `docs/PRODUCT-DIRECTION-2026-09-20.md` §1.2 |
| A recordable "hired" outcome | not a legal status yet | same, §3.2 |
| Outcome volume past `SMALL_SAMPLE_N = 10` | not met | same, §2.2 F3 |

**Direction C total: ~40 strings + restructure + 4 product prerequisites.** I am not pricing the
engineering, because I did not attempt it and a number would be invented.

### 5.4 What every direction costs, regardless

1. **The OG card must be re-made** — it is a binary with text baked in and **no generator script
   exists in the repo** (`find scripts apps/web/scripts -name '*og*'` → nothing). Whoever owns the
   design source must be involved, and the owner's rule is that the mark and palette do not change:
   only the words on the card. **This is the one item on the critical path that is not a text edit.**
2. **Both duplicated metadata blocks must change together**, or the product contradicts itself
   between marketing and the signed-in app.
3. **Every keyword list is a judgement call, not a copy edit** — `AI CV assistant` and
   `msaidizi wa CV AI` are in three live keyword arrays and represent *real search demand*. Removing
   them from the **page copy** is right; removing them from **crawler-only keywords** may cost
   ranking. Pass 5 called this "marginal but defensible"; I am flagging it as an **owner decision**
   rather than deciding it, because I did not measure search volume and will not guess it.

---

## 6 · WHAT I COULD NOT VERIFY

Stated plainly, because smoothing these over would make the rest of the document read as more
certain than it is.

**Blocked or failed:**
1. **Zety's homepage** — `curl` returned an empty body (bot wall); `web_extract` is blocked entirely
   in this environment (Firecrawl `403`). So one of the six AI-CV-builders named in the brief is
   *unverified*, and I said so in §2.1 rather than paraphrasing it from memory.
2. **Browser screenshots** — the browser backend timed out twice (420 s each). **Consequence: the
   vision pass ran on the real OG PNG (a genuine product asset, fetched live and read as pixels),
   not on the app's live screens.** So there is still no pixel-level judgement of the actual
   homepage, the phone UI, or the APK. That gap survives this document.
3. **A specifically WhatsApp-first East African product page** — I found no page I could fetch and
   quote, so §2.4 rests on CV Chap Chap's mobile-money rails (M-Pesa, Mixx by Yas, Airtel Money,
   Azam Pesa) and nothing else.

**Not measurable by me:**
4. **No competitor traffic, revenue or user count is reported anywhere in this document.** The
   numbers I quote (`18M+`, `4,608+ jobs`, `18,572 users landed interviews last month`, `2,398
   Reviews`) are **the competitors' own on-page marketing claims, transcribed, not verified.**
   `18,572 users landed interviews last month` is almost certainly unverifiable by anyone outside
   that company. I used it only to show *what they choose to lead with*, which is an observation
   about framing, not a fact about their size.
5. **Whether the AI surfaces all work** — `/api/ai/status` says `{"configured":true,"provider":
   "deepseek"}` and `/api/ai/tailor-cv` validated and returned a Zod 400, but I did not complete an
   authenticated AI call end-to-end, so "configured" is not "every AI route returns 200 for every
   user". The brief's claim that AI is *off* is refuted; the stronger claim that it is *fully
   working* is not proven by me either.
6. **The Play Store's actual listing** — `docs/aso-play-store.md` is labelled *"Draft copy for the
   Play Console"*. I have no Play Console access, so I cannot say what is **published**; I can only
   say what the committed draft says.
7. **The discrepancy in the jobs feed.** An earlier committed doc measured
   `{"success":true,"data":[]}`; **I measured non-empty `MOCK_JOBS`** on `POST /api/jobs/feed`
   (a `GET` returns `405`). Either the mock was added after that measurement or the two calls hit
   different code paths. **I could not reconcile it**, and the honest statement is: *as of
   2026-09-20 the public feed serves fabricated rows with current timestamps.* This makes the
   Direction C finding **stronger**, not weaker — it is not an empty feed, it is a fictional one.
8. **Google's index** — `/preview` declares `robots: { index: false, follow: false }`
   (`preview/page.tsx:16`). I did not verify it is actually absent from Google's index.
9. **Swahili correctness of anything I propose.** I am not a native Swahili speaker.
   `docs/SWAHILI-STANDARD-2026-09-20.md` exists and the owner must correct every proposed string
   above. Specifically worth his eye: `tayari kutuma` ("ready to send"), `Tangazo Lako`
   ("your vacancy") as a nav label, and whether `Maombi yako, tayari kutuma.` reads as a sentence a
   person would say. **Pass 2 was an English-language performance of a Tanzanian user, not a
   Tanzanian user** — that is a real limitation on the strongest evidence in §3.2, and I am naming it.
10. **Pricing / payments behaviour** — `PAYMENTS_ENABLED = false` (`apps/web/lib/features.ts:8`),
    confirmed by reading the file. I did not test any payment path and there is none to test.

**One thing I want to flag as *not* a verification gap but a governance one:** because 71 files
were dirty and another agent edited the very strings I was auditing **during** the audit, no
`file:line` table in this document can be trusted as current for more than a few minutes. §0.4's
recommendation — one canonical copy table that every edit diffs against — is the mitigation, and it
is the first thing I would do, before any hero is rewritten.

---

## Appendix · Files produced by this research

| File | Produced by | Content |
|---|---|---|
| `docs/REBRAND-POSITIONING-2026-09-20.md` | me | **This document** |
| `docs/research/rebrand-2026-09-20/CONTEXT-BRIEF.md` | me | Brief handed to every pass |
| `…/prompt-1..5-*.md` | me | The five Claude framing prompts |
| `…/pass-1-category-strategist.md` | Claude | Category strategist |
| `…/pass-2-jobseeker-mwanza.md` | Claude | Jobseeker, Mwanza |
| `…/pass-3-hiring-manager.md` | Claude | Hiring manager |
| `…/pass-4-competitor-growth.md` | Claude | Competitor head of growth |
| `…/pass-5-voice-critic.md` | Claude | Brand-voice critic |
| `…/pass-6-east-africa-operator.md` | `nvidia/nemotron-3-ultra-550b-a55b:free` | EA mobile-first operator |
| `…/pass-7-vision-ogcard.md` | `nex-agi/nex-n2.5-pro:free` (vision) | Critique of the real share card |
| `…/prompt-7-vision.txt`, `openrouter_pass.py`, `run-openrouter-passes.py`, `run-vision.py` | me | Free-model harness (`:free` asserted, key read at runtime, never committed) |
| `…/run-passes.sh`, `RUNLOG.txt` | me | Sequential Claude runner + exit-code log |
| `…/og-image-live.png` | fetched from production | The real share card, as analysed |
