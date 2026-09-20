# Themed pairs — CV + matching cover letter

**Question (owner's words, verbatim):** *"also is there are cover leters and cvs and we offer themes
packs like cvs and cover letter to match research this too and find best case"*

**Date:** 2026-09-20 · **Branch:** `release/1.6.25` · **Type:** RESEARCH — proposal and
recommendation only. Nothing was built.

**Answer in one line:** the pairing already exists in the code and is already promised in the copy;
it is *wrong* in 12 of 26 places and *never reaches the phone*, so the work is not "build themed
packs" — it is "make the pair we already claim actually true, then say so in one sentence".

Every number below was counted from the tree today. Labelled: **OBSERVED** (read in the code or on
the page), **INFERENCE** (my judgement), **CLAIM** (a vendor's own number, unverified).

---

## 1 · What exists today

### 1.1 The data model — four sibling documents, each owning its own look

| Table | Look fields it owns | Notes |
|---|---|---|
| `cv` | `templateId` (default `"nakuru"`), `templateHistory` (jsonb string[]), `primaryColor` (`#2563EB`), `fontFamily` (`"Inter"`) | `apps/web/lib/db/schema.ts:43-70` (fields at `:47,:52,:53,:54`) |
| `cover_letter` | `cvId` → `cv.id` (`onDelete: "set null"`), `templateId` (`"classic"`), `primaryColor` (`#2563EB`), `fontFamily` (**`"Georgia, serif"`**), `content` TEXT | `schema.ts:74-91` (fields at `:77,:79,:80,:81,:82`) |
| `letter` (formal letters, incl. `application`) | `templateId` (`"formal"`), `primaryColor` (`#1e293b`), `data` jsonb | `schema.ts:157-171` |
| `business_card` | `templateId` (`"classic"`), `primaryColor` (`#1e293b`) | `schema.ts:140-153` |

`document_version` is **per document**, not per set: `documentId` + `documentType`
(`"cv" | "cover-letter" | "letter" | "business-card"`) and a jsonb snapshot that mirrors
`templateId / primaryColor / fontFamily` (`schema.ts:284`; `apps/web/lib/api/routes/versions.ts:22-28`).
There is no set-level version, and no table joins two documents as a set.

**So the "pair" today is exactly two things:**

1. a nullable `cover_letter.cv_id` foreign key, and
2. a **copy** of two of the three theme fields made once, at creation time.

There is no shared theme descriptor. The look is duplicated per row on four tables, which is the
whole answer to §3's "what breaks when they drift".

### 1.2 What gets copied at creation, and what does not

Two call sites create a cover letter *from* a CV, and both copy `templateId` + `primaryColor`:

- `apps/web/components/editor/cv-editor-client.tsx:1120-1128` — the post-export "Generate a matching
  cover letter" action. Comment in the code: *"Carry the kit across: match the cover-letter template +
  accent to the CV's."*
- `apps/web/components/dashboard/application-workspace.tsx:144-160` — the same action from the
  application tracker, guarded on the loaded CV still being the attached one.

**Neither passes `fontFamily`.** So a paired letter is born with the letter's own default,
`"Georgia, serif"` (`schema.ts:81`, `apps/web/lib/api/routes/cover-letter.ts:73`), while a CV defaults
to `"Inter"` (`schema.ts:54`). Colour carries; typography does not. That is a one-line class of bug
sitting under the product's own promise.

### 1.3 Template inventories — the counts

| Surface | Count | Evidence |
|---|---|---|
| CV templates (components + registry entries) | **266** | `apps/web/lib/templates/registry.ts`, 266 `"<id>": {` entries, **all** with `"category": "cv"` (zero `cover-letter` entries); `apps/web/components/templates/*.tsx` = 268 files, 2 of them shared infra (`template-canvas.tsx`, `template-utils.tsx`) |
| Cover-letter templates (web) | **27** | `CoverLetterTemplateId` union = 27, `COVER_LETTER_TEMPLATES` = 27, `COVER_LETTER_COMPONENTS` = 27 — all in one 2,451-line file, `apps/web/components/templates/cover-letter/index.tsx:2096` and `:2419` |
| CV templates offered to a user (curated) | **47** (7 premium + 40 free) | `apps/web/lib/templates/curation.ts:16-33`, `:38-40`; `docs/RESEARCH-2026-09-20.md` §2 |
| Native (APK) template registry entries | **216** | `apps/native/src/lib/templates/registry.ts:225` (`TEMPLATE_REGISTRY`) |
| Native templates the picker offers | **224** (`ALL_TEMPLATES` = 6 hand-built + 218 engine) | `apps/native/src/lib/cv-html.ts:34,66`; gallery counts them: `apps/native/src/components/cv/template-gallery.tsx:289,312` |
| Native templates drawn by how many layouts | **5** | `docs/PRODUCT-DIRECTION-2026-09-20.md:555-561` (Sidebar 70, Minimal 59, Header 59, TwoColumn 15, AccentBand 15) |

**Do the two visual systems match? No — they are unrelated code.** The CV side has a token engine
(`apps/web/components/templates/engine/{tokens,layouts,sections,presets,fit,document-engine}` — 219 of
268 files import it; `athens.tsx` is a 16-line config over `makeTokens(primaryColor, fontFamily, …)`).
The cover-letter side has **no engine at all**: 27 hand-written components with inline styles,
`primaryColor` interpolated in 87 places and `fontFamily` in 53. Every letter is a bespoke page.

### 1.4 "Can a user today pick the same theme for both?" — Yes, and it is already automatic

`apps/web/lib/template-families.ts` is a live pairing module. Header comment: *"Template Family
Pairings — CV ↔ Cover Letter ↔ Business Card … This lets users build a cohesive 'application kit'
with one aesthetic."*

- `TEMPLATE_FAMILIES` — 8 named families covering **88** CV ids (`:14-78`)
- `FLAGSHIP_KIT` — **13** CV ids with a hand-picked letter + card (`:89-103`)
- `STYLE_KIT` — 5 buckets keyed on the CV's `style` token (`:110-116`)
- `getCoverLetterForCv()` (`:123-129`), `getBusinessCardForCv()` (`:132-138`),
  `getPairingTip()` (`:149-163`)

It is wired: `cv-editor-client.tsx:59,941,1123` and `application-workspace.tsx:12,144-160`.

And the promise is already in the copy, in three places:

- all **27/27** cover-letter descriptions say *"Pairs with <X> CV"* — e.g.
  `{ id: "modern", name: "Kilimanjaro Letter", description: "Pairs with Kilimanjaro CV · formal tone" }`
- `apps/web/components/editor/cross-sell-banner.tsx:72,77` — *"Generate Matching Cover Letter"* /
  *"…for a complete application kit"*
- `apps/web/app/[locale]/(marketing)/templates/[slug]/page.tsx:88` — *"✓ Matching cover letter &
  business card in the same style"*

### 1.5 Where the existing pairing is wrong — counted

For each of the 47 offered CV templates I evaluated `getCoverLetterForCv()` and compared it with the
tip the picker card shows (`getPairingTip`, `cv-editor-client.tsx:941`).

| Route to a letter | CVs | Notes |
|---|---|---|
| `FLAGSHIP_KIT` (hand-picked) | **13** | resolves to only **6** distinct letters: `zahabu-cl`×4, `vibe-cl`×3, `rift-cl`×2, `riso-cl`×2, `zege-cl`×1, `classic`×1 (pemba) |
| `STYLE_KIT` (5 buckets) | **34** | `classic` 8, `minimal-cl` 8, `creative-cl` 7, `sidebar-cl` 6, `modern` 5 |
| **Total** | **47** | → **10 distinct letters of 27** |

Consequences, all counted:

1. **17 of 27 cover-letter templates can never be reached from a CV.** They exist only if the user
   hand-picks them in the letter editor. (`executive-cl, bold-cl, startup-cl, academic-cl, tech-cl,
   clean-cl, contemporary-cl, traditional-cl, magazine-cl, compact-cl, color-block-cl, stripe-cl,
   elegant-cl, gradient-cl, signature-cl, timeline-cl, header-split-cl`.)
2. **12 of the 26 cards that show a pairing tip name a letter the product does not create.** The tip
   reads the *family*; the create action reads the *style bucket* first. Examples:
   - `nakuru` — card says **"pairs well with Modern cover letter"**; the product creates **`sidebar-cl`**
     (Serengeti Letter).
   - `serengeti`, `nairobi` — card says **Classic**; product creates **`modern`** (Kilimanjaro Letter).
   - `monarch`, `oxford`, `titan` — card says **Executive**; product creates **`classic`**
     (Nakuru Letter).
   - also `vertex`, `nordic-minimal`, `nova`, `aurora-edge`, `metro`, `meridian`.
   The other 14 match.
3. **8 offered CVs have neither a family nor a flagship pairing** (`regent, marlowe, cavendish, haven,
   atlas, eclipse, grid, serif-cv`) — they get a style-bucket letter and no tip.
4. **A letter named for one CV is handed to many.** `minimal-cl` is *"Savanna Letter · Pairs with
   Savanna CV"* and is handed to 8 different CVs (`haven, grid, serif-cv, sahara, berlin,
   nordic-minimal, stripe, mono-cv`). `modern` is *"Kilimanjaro Letter · Pairs with Kilimanjaro CV"*
   and is handed to 5 CVs — **not** Kilimanjaro, which gets `classic` (Nakuru Letter).
5. **The pair is invisible after creation.** `cover-letter-editor-client.tsx` contains **zero**
   references to `cvId` or the linked CV (grep: 0 hits). Once created, nothing on screen says which CV
   this letter belonged to, and nothing re-checks whether they still match.

### 1.6 A second, dead "families" file — the concept exists twice

`apps/web/lib/templates/families.ts` (177 lines) opens with *"IMPORTANT: This is a STUB showing the
pattern"* and TODOs *"Group into 30-50 families / Define matching cover letters for each family"*. Its
template ids (`simple-cv`, `professional-cv`, …) do not exist in the registry. It is **imported by
nothing** (only cited in `apps/web/TEMPLATE_IMPLEMENTATION_CHECKLIST.md:318`).
`docs/FEATURE-INVENTORY.md:203-209` already flags this and notes that `docs/DECISIONS.md` blesses the
provider layer, which is why the stub is easy to mistake for the engine.

### 1.7 The phone — the pair cannot ship there today

- **The APK has no cover-letter document.** `apps/native/src/lib/letter-html.ts:43-63` renders a fixed
  Georgia-serif page with a heading (`jobTitle || "Cover letter"`), a company line and body
  paragraphs — no template parameter, no colour, no font. It is called at
  `apps/native/src/screens/job-apply-screen.tsx:121`. A comment beside it (≈`:128`) states the file has
  no stored row and the title is its only identity — **the phone's letter is never saved as a
  document**. There is no `CoverLetterTemplate`/`COVER_LETTER` anywhere under `apps/native/src`
  (grep: 0 hits).
- **Only 6 of the 47 offered CV templates have a native renderer.** `BESPOKE_IDS`
  (`apps/native/src/lib/templates/registry.ts:447`) names **48** ids that *"still need a hand-written
  renderer"*; that list contains all 7 premium flagships and 11 of the 13 flagship-kit CVs. Counted:
  of the 47 curated ids, **41 are absent from the native registry** — including every id with a
  hand-picked flagship letter.
- **The two surfaces offer different catalogues.** Web: 47. Phone: 224 (`template-gallery.tsx:312`
  literally prints *"224 designs"*). Their intersection on the curated names is **6**.

**INFERENCE:** the mismatch the owner is asking about is worst on the product that matters most. On the
web a user *can* get a matching pair — often the wrong one. On the phone there is no pair to get, and
in 41 of 47 cases not even the CV template the web led them to pick.

---

## 2 · What the market does

### 2.1 The global builders

| Product | Matching sets | Paid, free, or absent? | What the user actually gets | Source |
|---|---|---|---|---|
| **Canva** | Yes, but only for some designs | Free + premium designs; the *limit is selection*, not payment | **Literally identical** styling — a "matching set" is one design with multiple pages, so there are no tokens to drift | OBSERVED — third-party review: *"We opted for a resume template with a matching cover letter template. There are some matching sets on Canva, which will display multiple pages"*, and its weakness list includes *"Limited number of matching resume and cover letter templates"* — [resumegenius.com/reviews/canva-reviews](https://resumegenius.com/reviews/canva-reviews) |
| **Novoresume** | Yes — "Matching Cover Letter Templates: *Pair your resume with matching cover letter templates*" | **PAID.** "Cover letter builder … [is] Premium-only"; free tier = one 1-page document, 8 templates | Same design language: *"automatically pairs your cover letter template with your CV template. Same colours, same fonts, same header layout"* | Vendor homepage (OBSERVED — search result text, [novoresume.com](https://novoresume.com/)); premium gating from [toolchase.com/tool/novoresume](https://toolchase.com/tool/novoresume); the "same colours/fonts/header" wording is a review's description — CLAIM |
| **Resume.io** | Yes — *"all of resume.io's 30+ resume templates come with matching cover letter styles"* | Bundled; **usable free** (one resume + one cover letter on the single free template, PDF out) | Compatible styling, chosen separately in the letter's own template selector, plus AI generation from the resume inside the resume builder | OBSERVED — [help.resume.io/en/articles/3785024](https://help.resume.io/en/articles/3785024) (search-result text; the page itself 403s a non-browser client today); free-tier detail from [resumefast.io/blog/zety-vs-resume-io](https://www.resumefast.io/blog/zety-vs-resume-io) |
| **Zety** | Yes — CTA *"Generate a matching cover letter"* | Matching is **effectively paid**: free downloads are TXT only; Pro $1.95/14 days → $25.95 per 4 weeks; annual $71.40 | **Two separate builders.** The letter builder is its own 3-step wizard whose step 1 is *"Select a template from our library"* — the user re-picks, so "matching" is a suggestion, not a mechanism | OBSERVED — [zety.com](https://zety.com/) and [builder.zety.com/letter](https://builder.zety.com/letter) |
| **Enhancv** | Yes — *"Match a cover letter to the template you picked"*; **12** cover-letter templates that "mirror every résumé theme in the library" | Trial → paid | Current-template carry: *"the AI cover letter generator writes a tailored letter … in a design that matches the template you chose"* | OBSERVED — [enhancv.com/resume-templates](https://enhancv.com/resume-templates), [enhancv.com/cover-letter-templates](https://enhancv.com/cover-letter-templates); the "12 mirror every theme" count from [grammarwaves.com](https://grammarwaves.com/compare-top-online-cover-letter-builders) |

**The pattern:** nobody sells "packs" as a noun. They sell *the letter that goes with your CV*, and the
only ones where it is guaranteed (Canva) get it for free by construction because there is one canvas.

### 2.2 African and Tanzanian players

| Player | What they do | Source |
|---|---|---|
| **CV Chap Chap** (Tanzania) | *"Get an AI-written cover letter tailored to the job, **designed to match your CV** and sound like you."* Free to build and preview; **TZS 5,000 by mobile money to download**; English + Swahili | OBSERVED — [cvchapchap.com/tanzania](https://www.cvchapchap.com/tanzania) |
| **Zoom Tanzania** free CV maker | Swahili page, no-signup, ATS claim, PDF download. **No cover letter in the builder**; the board lets employers ask for one as an upload | OBSERVED — [cv.zoomtanzania.net](https://cv.zoomtanzania.net/), [zoomtanzania.net](https://www.zoomtanzania.net/article/how-to-apply-jobs-on-zoom-tanzania/) |
| **Mabumbe** (human CV writers, TZ) | **The cover letter is a separate line item: TZS 30,000**, quoted apart from the CV (TZS 30,000–180,000) | OBSERVED — direct, per `docs/RESEARCH-2026-09-20.md` §1b ([mabumbe.com](https://mabumbe.com/cv-writing-service-tanzania)) |
| **BrighterMonday Kenya** | "AI Career Tool" bundling AI resume builder + **cover-letter generator** + interview prep, KES 390/week | OBSERVED — research run, `docs/RESEARCH-2026-09-20.md` §1b (login-gated; not re-confirmed first-hand) |
| **Careergo** (19 African markets incl. TZ) | TZS 600/hour, mobile money live; Swahili page leads with ATS-friendly CV. No matching claim found | OBSERVED — direct, `docs/RESEARCH-2026-09-20.md` §1b |

**INFERENCE — and it changes the pitch:** in this market the cover letter is either *sold separately*
(Mabumbe), *claimed free as a match* (CV Chap Chap), or *absent* (Zoom). A Tanzanian competitor already
advertises the exact thing the owner is asking about, and gives the build away, charging only TZS 5,000
at download. So a **paid** "themed pack" would be priced against a free claim — the pack is not a
revenue idea here, it is a **correctness and trust** idea.

### 2.3 The production question: how the good ones stay consistent, and what breaks

Three architectures exist, and only one of them can drift:

1. **One canvas** (Canva). The CV and letter are pages of one design. Drift is impossible.
2. **One generator** (Resume.io, Enhancv, Sumaiya). The letter is generated *from* the resume and
   inherits the theme at birth. Drift is possible afterwards — which is what §1.2 measures.
3. **Two builders** (Zety). The letter has its own template step. Drift is the default.

What the sources say actually breaks when they drift:

- **Visual mismatch is read as carelessness.** A vendor-led summary of hiring-manager research puts it
  as: *"When the cover letter looks like it was formatted in Calibri and the resume in Times New Roman
  with different spacing, the mismatch signals a lack of intentionality"* — and pairs it with claimed
  survey numbers (94% of hiring managers say cover letters influence decisions; 45% read the letter
  first). Those survey figures are **CLAIM** — third-party, not verified here, and I did not reproduce
  the underlying survey. ([resumeoptimizerpro.com](https://resumeoptimizerpro.com/blog/cover-letter-and-resume-template))
- **The "matched documents get more replies" number is marketing.** MyLiveCV reports an internal test
  of 30 candidates where matched documents got *"41% more recruiter replies"*. That is a vendor's own
  un-peer-reviewed test with no published method. **CLAIM.** I would not put this number in front of a
  user, and it should not be quoted as evidence. ([mylivecv.com](https://mylivecv.com/blog/cover-letter-with-resume-package))
- **Over-matching is the real hazard, not under-matching.** *"The biggest mistake is not failing to
  match. It is copying a CV layout into a cover letter when that layout does not suit a letter in the
  first place. Many CV templates use sidebars, icon rows, text boxes, colour blocks, or split columns.
  Those features can already create parsing issues in a CV."* What should match: header style, accent
  colour, body typeface, section-header style, margins. What should **not**: the layout, the section
  structure, "or even the exact template (just the visual language)".
  ([learnist.org](https://learnist.org/cover-letter-match-cv-design),
  [mylivecv.com](https://mylivecv.com/blog/cover-letter-with-resume-package))

**INFERENCE:** this is the single most useful finding in the research. It says the target is **not** a
paired template per CV — it is a small, shared theme (one accent, one body typeface, one header
treatment) that both documents read, while the letter stays a single-column letter. That is a *cheaper*
target than a paired-template library, and it is the one the sources say actually helps.

---

## 3 · What it would take here — honestly

### 3.1 What is already effectively a shared theme descriptor (cheap)

`(templateId, primaryColor, fontFamily)` already exists **as columns on both tables**
(`schema.ts:47,53,54` and `:79,80,81`). A "theme descriptor" therefore needs **no migration** — the
type already exists in the data. And `cover_letter.cv_id` already exists, so the pair needs no new
table either. The distance from here to "the pair is real" is *correctness*, not architecture.

### 3.2 Cost of each plausible option (all estimates are INFERENCE)

| Option | What it means | Cost | Honest note |
|---|---|---|---|
| **0 — leave it** | nothing | 0 | 47/47 offered CVs already produce *a* letter; the product already says so. The only defect is that it says the wrong name. |
| **B — make the existing pair true and visible** | one source of truth for pairings; carry `fontFamily` on create (2 call sites); show the link in the letter editor with one "use the CV's look" action; a drift line when they differ | **1–2 days** (web + copy, both languages) | No new templates, no new table, no renderer work. Uses the existing `PATCH /api/cover-letter/:id` (`cover-letter.ts:21-30`), which already accepts `templateId/primaryColor/fontFamily`. |
| **C — author real paired letter designs for the 5 CV layouts** | port the 27 letter components onto `engine/tokens.ts` so a letter can genuinely echo its CV's header/accent | **3–5 days, web only** | `components/templates/cover-letter/index.tsx` is 2,451 lines of hand-written JSX with no token engine. This is the expensive half, and §2.3 says the payoff is small — visual language, not layout. |
| **D — a live-synced "pack"** (change the CV, the letter restyles) | a set object, sync on write, set-level versions | **weeks** | See 3.4 — I judge this a trap. |
| **E — the pack on the phone** | a native cover-letter document (table row, template, colour) + letters for the 41 missing CV templates | **months** | Blocked twice over: the APK has no letter document at all (`letter-html.ts:43-63`), and 41 of 47 offered CV templates have no native renderer (`BESPOKE_IDS`, `registry.ts:447`). |

### 3.3 What is cheap, what is expensive, what is a trap

**Cheap:** carrying `fontFamily` at creation; fixing the 12 wrong tips and the 27 "pairs with" claims so
the copy matches the code; deleting the dead stub (`lib/templates/families.ts`) so there is one source
of truth; showing the pair in the letter editor; an "apply this look to both" button on the existing
PATCH route. **Cheap because the theme already exists as three columns and the metadata is data, not
code.**

**Expensive:** a genuinely paired set of letter designs for the 5 CV layouts (the letter side has no
token engine); and anything on the phone.

**The traps:**

1. **"Pairs" as a noun.** It is a mechanism word. The owner's own rule is to sell the outcome — a
   Tanzanian jobseeker does not want a "pack", they want their two documents to look like one
   professional sent them. Also, the local comparator already gives the *claim* away free.
2. **Live sync.** Making the letter restyle when the CV changes would be the only live cross-document
   link in the product, it would fire while the user is offline with a queued sync on a phone-first
   app, and it would silently restyle a letter the user may already have tailored and sent. The letter
   editor deliberately exposes its own colour and font controls
   (`cover-letter-editor-client.tsx:574-597`) — that is a user decision, not drift.
3. **Over-matching.** Copying a CV's sidebar or two-column layout into a letter is the failure the
   sources name first, and it is what a naive "pair the templates" implementation would do: the letter
   inherits the CV's look *and* its structure. The letter must stay prose.
4. **A second families implementation.** The repo already has a live pairing module
   (`lib/template-families.ts`) and a dead stub with the same name (`lib/templates/families.ts`).
   Adding a third "pairs" concept without deleting one of these is how this stays wrong.

### 3.4 Is "pairs" even the right framing for a Tanzanian jobseeker? (judgement)

**I judge no — and the evidence points one way.** Every product researched generates the letter *from*
the CV; none offers a symmetric set. In the local market the letter is either a separate purchase
(Mabumbe, TZS 30,000) or a free claim (CV Chap Chap). The observable need is one-directional and much
smaller than a "set": **the CV is chosen once, and the letter should not look like it came from a
different app.** That is one theme, read by two documents, plus a way to apply it in one tap — which is
option B. A "pack" is the noun the *owner* would use to describe the outcome; it should not become the
feature name on screen.

---

## 4 · Recommendation

**Do option B. Do not build a pack. Do not touch the phone on this.**

Reasons, in the owner's arithmetic:

- **47 of 47** offered CV templates already produce a cover letter. The feature exists; it is
  *misreported*. **12 of 26** cards advertise a letter the product does not create, and **17 of 27**
  letter templates are unreachable from any CV. Fixing that is data and copy — the cheapest work in
  the product — and it removes a claim a user can catch the app lying about.
- **A paired design library is 3–5 days for a payoff the research says is small** (§2.3: match the
  visual language, not the layout). The letter file has no token engine, so this is renderer work, not
  data work.
- **The pack cannot ship on the phone** — the letter document does not exist there and 41 of 47 offered
  CV templates have no native renderer. Selling "packs" while the APK cannot render the CV half would
  break the three-surfaces-feel-like-one-product rule.
- **Payments are off** (`apps/web/lib/features.ts` → `PAYMENTS_ENABLED = false`, per
  `docs/RESEARCH-2026-09-20.md` §2), so a paid pack has no rail anyway — while CV Chap Chap already
  claims the match free and charges TZS 5,000 at download.

**The single decision that matters most:** *does the pair own the theme, or does each document own it?*

**Recommendation: the document owns it; the pair is a suggestion you can apply in one tap.** Concretely
— the letter says *"This matches your <CV name>"*, and offers **"Use the CV's look"**; if the user has
changed one side, the app says so in one plain sentence and offers the fix, instead of moving anything
by itself. Reasons: the letter is tailored per job; the user can legitimately want a different font in
a letter than in a CV; and the app is offline-first, so a "live" link would be a promise the phone
cannot keep.

**Copy shape, if it is built** (subject to the owner's Swahili, per house rules): say the outcome, name
the object in full, no mechanism word. English: *"Your CV and cover letter will look like one person
sent them."* Swahili: built on `barua ya maombi` (never `barua ya kazi` — it is a lint-banned string)
and `muonekano`/`rangi` — **owner to approve the wording; I do not choose his nouns.**

### What we would measure to know

Nothing here is invented — these are the measurements that exist or are one query away:

1. **Do the letters get used at all?** `recordExport` already fires on a cover-letter download
   (`cover-letter.ts:131-138`), and `app_event` / `tool_invocation` / `document_version` already exist.
   Count cover letters created vs exported. **If letters are barely used, the pair is the wrong
   investment and the real problem is the letter's existence, not its look.** I have not measured this;
   nobody has.
2. **Drift rate, with no new schema:** of letters created with a `cvId`, the share whose
   `(templateId, primaryColor, fontFamily)` differ from the linked CV's. That single number decides
   apply-once vs sync — and today I expect it to be high for one provable reason: `fontFamily` is never
   copied, so **every** paired letter starts on `"Georgia, serif"` against a CV on `"Inter"`.
3. **Does correctness move the outcome?** After B ships, the share of paired letters exported within 7
   days of creation. If it does not move, the look is not the blocker and C should not be started.
4. **The falsifiable one-week check:** re-run the §1.5 comparison and assert **0** mismatches between
   the tip a card shows and the letter the product creates, and **0** remaining "Pairs with <CV>" claims
   on letters that no CV can reach.

---

## 5 · What I am unsure about

- **The 47 → 47 mapping in §1.5 is my computation from the source, not a run of the app.** I
  re-implemented `getCoverLetterForCv()` in a script and evaluated all 47 curated ids. The logic is 6
  lines and unambiguous, but I did not click through the editor, so the 12 mismatches are
  **computed, not render-verified**.
- **Whether a user ever *sees* those wrong tips** depends on the picker card rendering that 8px
  truncated line (`cv-editor-client.tsx:941`) at the real width. The string is computed; whether it is
  legible on a phone-sized card is unverified.
- **Novoresume's "same colours, same fonts, same header layout"** is a third-party review's
  description. `novoresume.com` blocked non-browser extraction in this session, so I could not read the
  vendor's own wording. Treat as **CLAIM**.
- **Resume.io's help page** (matching cover letter styles) also 403s a non-browser client today; the
  sentence quoted comes from the search index, not a page I loaded. **OBSERVED — search result text.**
- **BrighterMonday Kenya's bundle price** and **Careergo's TZS rates** are carried from
  `docs/RESEARCH-2026-09-20.md`, which marks them research-run sourced; I did not re-fetch them.
- **The 41%-more-replies and 94%/45% survey figures are vendor or third-party claims.** I did not
  reproduce the underlying tests or surveys, and I would not cite them to a user. They are recorded
  here only because they exist and someone will otherwise find them.
- **Judgement calls, labelled:** that "pairs" is the wrong noun and "same look" is the right one; that
  documents (not pairs) should own the theme; that 1–2 days / 3–5 days are the right size for B and C;
  and that the phone work is months rather than weeks. These are my estimates, stated as numbers so
  they can be argued with.
- **Not measured, and it is the one that matters:** whether Sumaiya's users create and send cover
  letters at all. Everything in §4 is conditional on that number, and I do not have it.

---

## Appendix · Evidence index

| Claim | Where |
|---|---|
| Theme fields duplicated on four tables | `apps/web/lib/db/schema.ts:43-70, 74-91, 140-153, 157-171` |
| `cover_letter.cv_id` FK, nullable | `apps/web/lib/db/schema.ts:77` |
| Different default fonts on CV vs letter | `apps/web/lib/db/schema.ts:54` vs `:81`; `apps/web/lib/api/routes/cover-letter.ts:73` |
| `fontFamily` not carried on create | `apps/web/components/editor/cv-editor-client.tsx:1120-1128`; `apps/web/components/dashboard/application-workspace.tsx:146-157` |
| 266 CV templates, all `category: "cv"` | `apps/web/lib/templates/registry.ts` (counted) |
| 27 cover-letter templates + components | `apps/web/components/templates/cover-letter/index.tsx:2096` (list), `:2419` (map), `:21-48` (union) |
| 47 curated, 7 premium | `apps/web/lib/templates/curation.ts:16-33, 38-40` |
| Pairing module (8 families / 13 flagship / 5 buckets) | `apps/web/lib/template-families.ts:14-78, 89-103, 110-116, 123-129, 149-163` |
| Pairing wired into the editor | `apps/web/components/editor/cv-editor-client.tsx:59, 941, 1123` |
| "application kit" copy | `apps/web/components/editor/cross-sell-banner.tsx:72,77`; `apps/web/app/[locale]/(marketing)/templates/[slug]/page.tsx:88` |
| Dead families stub | `apps/web/lib/templates/families.ts:13-16`; flagged at `docs/FEATURE-INVENTORY.md:203-209` |
| Letter editor shows no linked CV | `apps/web/components/editor/cover-letter-editor-client.tsx` (0 `cvId` hits); colour/font controls at `:574-597` |
| Cover-letter PATCH accepts the three theme fields | `apps/web/lib/api/routes/cover-letter.ts:21-30` |
| Export ledger fires on letter download | `apps/web/lib/api/routes/cover-letter.ts:131-138` |
| Native letter is a fixed serif page | `apps/native/src/lib/letter-html.ts:43-63`; called at `apps/native/src/screens/job-apply-screen.tsx:121` |
| Native has no cover-letter template | `apps/native/src` (0 hits for `CoverLetterTemplate`/`COVER_LETTER`) |
| 48 ids "still need a hand-written renderer" | `apps/native/src/lib/templates/registry.ts:447` |
| Native offers 224, prints the count | `apps/native/src/lib/cv-html.ts:34,66`; `apps/native/src/components/cv/template-gallery.tsx:289,312` |
| 218 native templates = 5 layouts | `docs/PRODUCT-DIRECTION-2026-09-20.md:555-561` |
| Versions are per document | `apps/web/lib/db/schema.ts:284`; `apps/web/lib/api/routes/versions.ts:22-28` |
| Payments off | `docs/RESEARCH-2026-09-20.md` §2 (`apps/web/lib/features.ts`) |
