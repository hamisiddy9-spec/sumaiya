# Sumaiya — Screen & Motion Redesign Proposal · 2026-09-20

**What this is.** A proposal, not a change. It improves what exists, using the fixed palette and the
fixed logo, and it delivers mockups the owner can open and look at. **No source file was modified.**

**Owner's brief (verbatim).**
> mabadiliko ya jinsi ya kuboresha tulichonacho sio kuongeza features but latest ways and attractive
> ways and screens designs na implementations etcc ... no touching colours or logo but feel free to
> redesign everythings annimations chatbox and its features everthing

**Fixed, and not touched by this document:** the palette, the logo (`SumaiyaMark`), the product name
(Sumaiya — a memorial, not a brand asset), the product AI (DeepSeek), Swahili-first, and the rule that
the app sells the outcome and never the mechanism.

**Target the whole thing is judged against:** a first-time jobseeker in Tanzania, on a Tecno/Infinix/
Redmi-class Android phone with 1–3 GB RAM, on metered mobile data, mostly on 3G.

---

## 0 · Provenance — what was done, and by what

| Step | Instrument | Outcome |
| --- | --- | --- |
| Read the existing standards | `docs/MOTION-STANDARD-2026-09-20.md`, `RESPONSIVE-STANDARD-2026-09-20.md`, `AREAS-AND-PARITY-2026-09-20.md`, `UX-DEFECT-HUNT-2026-09-20.md`, `PHOTO-CAPTURE-SPEC-2026-09-20.md` | Built on, not repeated |
| Screen inventory | direct reads of the tree (counts below) | 99 surfaces, 51 + 21 + 27 |
| Design-system critique | **Claude CLI**, one pass, `_claude-pass1.md` | completed before the CLI hit its session limit |
| 2026 pattern research | real web search + extraction | 20 sources cited in §2 |
| Mockups | generated HTML, `_mockup.css` + `_build_*.py`, inlined CSS | 8 phone frames + 2 long-form pages |
| Pixel judging | headless Chrome → PNG → **free OpenRouter vision model** | 8 frames judged; verdicts in `_vision/verdicts.jsonl` |
| Contrast | computed, not eyeballed | 16 pairs; 4 below AA 4.5:1 |

**Claude became unavailable partway through** — `claude -p` returned
*"You've hit your session limit · resets 1:40am (Africa/Nairobi)"*. The design-system pass had already
completed; everything after it was done with web research plus the OpenRouter vision models.
**Which model judged which frame is recorded per line** in `_vision/verdicts.jsonl`.

**On the vision transcripts.** They are impressions, not evidence. One model misread `UZOEFU` as
`UZOFU`, and blended a phrase from my own prompt into its description of an image. Every string-level
claim below was therefore **grepped back into the file** before it was written down; where a model
claimed overlap or a missing element that I could not reproduce in the HTML, it is recorded in §6 as a
model error rather than passed on as a defect.

---

## 1 · Screen inventory — 99 surfaces, 99 covered

Counts are exact, from the tree:

| Platform | Surface class | Count | Path root |
| --- | --- | --- | --- |
| Android (the product) | screen files | **27** | `apps/native/src/screens/**/*.tsx` |
| Web | routable `page.tsx` | **51** | `apps/web/app/**/page.tsx` |
| Web | route-level special states | **21** | `loading` / `error` / `not-found` / `global-error` / `template` / `layout` |
| | **total** | **99** | |

By area, the 51 web pages are: **18 marketing**, **22 app/dashboard**, **7 admin**, **4 auth**.

Where a line number is marked **(audit)** it is taken from the audit table in
`docs/MOTION-STANDARD-2026-09-20.md` §8, not re-verified by me; unmarked line numbers I read from the
file. Other agents were editing this tree while I read it, so a line number may have drifted by a few
lines.

### 1.1 · Native screens — 27 of 27

#### Auth & first run (5)

| # | Screen | `file:line` | What it is for | Renders | Biggest current weakness |
| --- | --- | --- | --- | --- | --- |
| N1 | Splash | `splash-screen.tsx:1–107` | hand off to the first real screen | mark + wordmark + tagline, bounded 2-cycle breath | the breath and the mark's `withRepeat` had no `cancelAnimation`, which is what produced 291 `RetryableMountingLayerException` in one cold start **(audit N1)** — `splash-screen.tsx:60` now cancels, so this is fixed in flight |
| N2 | Onboarding | `onboarding-screen.tsx:1–436`; slides `:30–71` | explain the product before auth | 4 slides + art, Skip `:374`, Next/Start `:417` | four sequential explanatory slides stand between install and sign-in for an audience that already knows what a CV app is; nothing on any slide is interactive, so nothing is learned by doing |
| N3 | Sign-in | `auth/sign-in-screen.tsx:1–307` | get the user in | email → code flow, validators `:1–40` | it is a two-phase form with no visible progress; the code phase `:("Enter your code")` has no "we sent it" confirm step of what to do if it does not arrive |
| N4 | Auth error banner | `auth/auth-error-banner.tsx` | report a failed sign-in | inline banner | correct already (reference, not defect, per the motion audit) |
| N5 | Google button | `auth/google-button.tsx` | alternative entry | branded button | no weak point found |

#### First-run onboarding (1)

| # | Screen | `file:line` | What it is for | Renders | Biggest current weakness |
| --- | --- | --- | --- | --- | --- |
| N6 | First run | `first-run-screen.tsx:1–621`; steps `:45,146–149` | build the profile from zero | 8 steps: `intro, name, photo, fields, experience, skills, recent, look`; step body `:276–485`; meta `:487–518`; step transition `:553`; CTA label `:590` | the `photo` step `:300–339` is explicitly optional (*"Si lazima kabisa"*, `:336`) yet costs a whole step with the same Continue button as required steps, and the identical picker already exists in the editor at `cv-editor-screen.tsx:537` |

#### Core app (7)

| # | Screen | `file:line` | What it is for | Renders | Biggest current weakness |
| --- | --- | --- | --- | --- | --- |
| N7 | Home | `app/home-screen.tsx:1–594` | the "what do I do next" dashboard | greeting `:48–69,300`; rotating hint `:181–265,304–363`; CV tiles `:366–398`; quick actions `:283–296,401–428`; job recs `:431–463`; recent CVs `:466–583` | the first card can be a TemplateHub advertisement rather than a job: the hint rotation mixes a genuine signal with a hardcoded promo `:220–234`, so a first-run user's first read is "Miundo 224 kwa kila nyaraka" before they have made one CV |
| N8 | CV list | `app/cv-list-screen.tsx:1–219` | find, open, export, delete a CV | count badge `:99–101`; storage note `:108–115`; loading `:117–118`; error `:119–130`; empty `:131–142`; list `:143–216` | **Delete is an equal-width, equal-weight third button** beside Edit and Download `:179–212`, distinguished only by icon tint — on a small screen that is a fast three-tap mis-hit on the one irreversible action |
| N9 | CV editor | `cv-editor-screen.tsx:1–656` | write the CV | `Section` disclosure `:26–73`; unsaved-work guards `:100–169`; `loadingCv` `:174`; header pills `:499–507`; photo picker `:537` | five collapsible cards with **no way to jump** — `Section` (`:26`) is a disclosure, not navigation, so on a 5″ screen with the keyboard up the reachable area is about four rows |
| N10 | Jobs | `jobs-screen.tsx:1–197` | find and tailor to a job | `MatchBadge` `:14–23`; `JobCard` `:25–65`; expired filter `:82–83`; loading `:120–122`; error `:122–129`; empty `:130–137`; profile nudge `:157–179`; `rest.slice(0,40)` `:185` | `MatchBadge` `:14–23` renders **pixel-identically** to the ATS-score badge (same pill, same `>=60/>=35` tone thresholds), so "82%" means job fit on one screen and parsability on another |
| N11 | Applications | `applications-screen.tsx:1–119` | track what was applied for | loading skeletons inlined by hand `:58` **(audit N3)** | the skeleton and the list swap in one frame — the watched slot blanks (sev H) |
| N12 | Application detail | `application-detail-screen.tsx` | one application | status, notes, delete dialog | `:("This removes it from your phone. It can't be undone.")` — accurate, but the screen offers no way to see what would be lost before confirming |
| N13 | Chat (Sumaiya) | `sumaiya-chat-screen.tsx:1–531` | the conversation is the product | quick-action chips + composer + floating build-bar `:463` | the empty state puts a **grid of parallel chips** in front of a user who has not spoken yet, next to a composer that already affords free typing — the screen reads as a menu |

#### Tailoring & documents (4)

| # | Screen | `file:line` | What it is for | Renders | Biggest current weakness |
| --- | --- | --- | --- | --- | --- |
| N14 | Job apply / tailor | `job-apply-screen.tsx:1–308` | produce a targeted CV or letter | cv/letter/both toggle, result | error and count are two inline texts swapping in place with no transition `:294–299` **(audit N13)** |
| N15 | ATS check | `ats-checker-screen.tsx:1–420` | is this CV machine-readable | score + findings | **the worst loading state in the app, in both senses** — a bare `<Text>Loading your CVs…</Text>` `:125` that hard-swaps to the whole analysis **(audit N8)** |
| N16 | PDF tools | `pdf-tools-screen.tsx:1–149` | merge/reorder/share a PDF | action list, result | no progress affordance between "PDF tayari" and the OS share sheet |
| N17 | Template gallery | `components/cv/template-gallery.tsx` | pick a design | searchable virtualised grid | opens as a modal over Home with no indication of which design new CVs will use |

#### Capture (2)

| # | Screen | `file:line` | What it is for | Renders | Biggest current weakness |
| --- | --- | --- | --- | --- | --- |
| N18 | Scan | `app/scan-screen.tsx` | photograph a document | camera + gallery fallback + permission states | permission-denied state is a dead end except for "Open Settings" `:("Fungua Mipangilio")` |
| N19 | Scan processing | `app/scan-processing-screen.tsx` | read the photo | progress, retry, failure | failure copy *"Sikuweza kusoma picha hii. Jaribu tena."* gives no hint about **what** made the photo unreadable (blur, glare, crop) |

#### Learning & growth (3)

| # | Screen | `file:line` | What it is for | Renders | Biggest current weakness |
| --- | --- | --- | --- | --- | --- |
| N20 | Learning hub | `learning-hub-screen.tsx:1–602` | close a skill gap | courses, gap cards, toast `:350`, skeletons `:358` **(audit M/N7,N12)** | the success toast enters with `FadeIn` and has no `exiting`, so it vanishes instantly |
| N21 | Guide | `guide-screen.tsx:1–84` | one free guide | article + Premium gate `:("Sehemu iliyobaki ni Premium")` | the paywall is a wall with no preview of what is behind it |
| N22 | Career profile | `career-profile-screen.tsx:1–223` | the data matching uses | skills/experience/goals form | it is the input to every match score and the app never says so on this screen |

#### Account & support (6)

| # | Screen | `file:line` | What it is for | Renders | Biggest current weakness |
| --- | --- | --- | --- | --- | --- |
| N23 | Profile | `app/profile-screen.tsx:1–474` | settings | header `:237–278`; details `:278–291`; appearance `:293–338`; notifications `:339–360`; invite `:361–377`; premium `:378–394`; account `:395–449`; danger `:450` | destructive actions are split across two kinds of place — "Clear offline data" sits in the neutral Account group `:401` while delete-account gets its own Danger zone — so severity does not read as a gradient |
| N24 | Memory | `app/memory-screen.tsx` | what the AI remembers | list + delete-all | the screen exists (good faith) but is reachable only from Profile, so the user most affected never finds it |
| N25 | Privacy & terms | `app/privacy-screen.tsx` | disclosure | "Kwa ufupi" + policy | a correct screen with no weak point; it names the wrong support target per `AREAS-AND-PARITY` §12 |
| N26 | Support | `app/support-screen.tsx` | reach a human | email, bug report | copy for the mailto points at the wrong company (`AREAS-AND-PARITY-2026-09-20.md` §12) |
| N27 | Help / FAQ | `app/help-faq-screen.tsx` | self-serve answers | accordion `:96–113` | pre-fix, the answer appeared in one frame and pushed every card below it instantly, with the chevron swapping `down→up` with no in-between **(audit N9, sev H)** — fixed in flight; the lesson is that this was an inconsistency, not a missing capability |
| N28 | Invite | `invite-screen.tsx:1–158` | referral | link + copy | `{loading ? spinner : !data ? text : content}` — three hard swaps, and only the third animates `:84` **(audit N14)** |

*(N-rows total 28 because the auth sub-components N4/N5 are rendered inside N3 and are not separately routable; the 27 screen *files* are N1–N28 minus those two composite-only files counted once each. The file count of 27 is what `find` reports and is the number to hold me to.)*

### 1.2 · Web routes — 51 of 51

#### Marketing (18)

| # | Route | `file` | For | Weakness |
| --- | --- | --- | --- | --- |
| W1 | `/` (locale) | `[locale]/(marketing)/page.tsx` | first impression | live at 390px this is `ai-copilot-landing.tsx`; the row at `:317` is `minWidth: "max-content"` with a marquee — **verified intentional**, so the wide row I saw in the screenshot is by design, not overflow |
| W2 | `/pato-kazi` | `pata-kazi/page.tsx` | Swahili job-landing | renders ~17 KB — the thinnest route in the set. (It is NOT thin because the feed is empty: the live device shows real listings. It is thin for its own reasons, unmeasured.) |
| W3 | `/snap-to-apply` | `snap-to-apply/page.tsx` | the photo→apply pitch | the largest marketing page (~395 KB screenshot); the value is real but the page is the heaviest a metered user will load |
| W4 | `/templates` | `templates/page.tsx` | browse 224 designs | no indication of which designs are free |
| W5 | `/templates/[slug]` | `templates/[slug]/page.tsx` | one design | |
| W6 | `/tools` | `tools/page.tsx` | tool index | |
| W7 | `/tools/[slug]` | `tools/[slug]/page.tsx` | one tool | |
| W8 | `/ats-checker` | `ats-checker/page.tsx` | ATS pitch | duplicates the app's ATS surface with different framing |
| W9 | `/jobs` | `jobs/page.tsx` | job SEO landing | |
| W10 | `/pro` | `pro/page.tsx` | premium | the free/paid line is undefined per `AREAS-AND-PARITY` §8 |
| W11 | `/preview` | `preview/page.tsx` | try before signup | |
| W12 | `/about` | `about/page.tsx` | trust | |
| W13 | `/contact` | `contact/page.tsx` | support | points at the same wrong target as N26 |
| W14 | `/blog` | `blog/page.tsx` | SEO | |
| W15 | `/blog/[slug]` | `blog/[slug]/page.tsx` | one post | |
| W16 | `/privacy` | `privacy/page.tsx` | legal | |
| W17 | `/terms` | `terms/page.tsx` | legal | |
| W18 | `/cookies` | `cookies/page.tsx` | legal | |

#### Auth (4)

| # | Route | `file` | For | Weakness |
| --- | --- | --- | --- | --- |
| W19 | `/sign-in` | `(auth)/sign-in/page.tsx`, `sign-in-form.tsx` | sign in | |
| W20 | `/sign-up` | `(auth)/sign-up/page.tsx` | register | |
| W21 | `/verify` | `(auth)/verify/page.tsx` | verify email/code | no resend affordance visible in the page shell |
| W22 | `/reset-password` | `(auth)/reset-password/page.tsx` | recover | |

#### App / dashboard (22)

| # | Route | `file` | For | Weakness |
| --- | --- | --- | --- | --- |
| W23 | `/dashboard` | `(dashboard)/dashboard/page.tsx:1–704` | web home | **up to seven near-identical banner blocks** can render above the tab content in one load: DB error, create-failed, pipeline hero `:478–537`, daily brief `:342–369`, up to 3 signals, confirmations, pre-application nudge `:435–462`, then four `h2` sections `:608–680`; each is its own `!dbError && …` block |
| W24 | `/editor/cv/[id]` | `editor/cv/[id]/page.tsx` → `cv-editor-client.tsx` | write the CV | **five independent AI panels** (`AtsPanel`, `AtsExplain`, `WhatChanged`, `AuthenticWritingPanel`, `JobTargetPanel`) compete with Save/Export/Share/Template for the same header space |
| W25 | `/editor/cover-letter/[id]` | `editor/cover-letter/[id]/page.tsx` | write a letter | shares the same shell problem |
| W26 | `/editor/letter/[id]` | `editor/letter/[id]/page.tsx` | write a letter | |
| W27 | `/editor/business-card/[id]` | `editor/business-card/[id]/page.tsx` | card | |
| W28 | `/editor/cv/try` | `editor/cv/try/page.tsx` | guest editor | `template-selection-modal.tsx:132` — spinner vanishes, whole grid appears **(audit W2)** |
| W29 | `/editor/cover-letter/try` | route | guest | |
| W30 | `/editor/letter/try` | route | guest | |
| W31 | `/editor/business-card/try` | route | guest | |
| W32 | `/applications/[id]` | `applications/[id]/page.tsx` | one application | |
| W33 | `/brief` | `brief/page.tsx` | daily brief | a whole route for content the dashboard also renders — two homes for one thing |
| W34 | `/career-interview` | `career-interview/page.tsx` | interview prep | |
| W35 | `/interview` | `interview/page.tsx` | interview | **two routes for the same job** (with W34) |
| W36 | `/assistant` | `assistant/page.tsx` | chat | duplicates N13 on a different platform |
| W37 | `/voice` | `voice/page.tsx` | voice | |
| W38 | `/snap` | `snap/page.tsx` | photo capture | the score count-up is the **one sanctioned exception** to "don't animate numbers" |
| W39 | `/snap/share/[token]` | route | share a snap | |
| W40 | `/studio/[id]` | `studio/[id]/page.tsx` | studio | |
| W41 | `/import-cv` | `import-cv/page.tsx` | import | |
| W42 | `/settings` | `settings/page.tsx` | settings | `career-profile-card.tsx:139` — `animate-pulse` text hard-swaps to chips **(audit W4)** |
| W43 | `/cv/[slug]` | `cv/[slug]/page.tsx` | public CV | has both `loading.tsx` and `not-found.tsx` — the only route with both |
| W44 | `/migrate-guest` | `migrate-guest/page.tsx` | claim guest work | |

#### Admin (7)

| # | Route | For | Weakness |
| --- | --- | --- | --- |
| W45 | `/admin` | admin home | |
| W46 | `/admin/users` | users | |
| W47 | `/admin/jobs` | job data | the surface that shows feed freshness — the live device shows real listings, so freshness, not emptiness, is the question |
| W48 | `/admin/templates` | templates | |
| W49 | `/admin/campaigns` | campaigns | has real rows (per `AREAS-AND-PARITY` appendix) |
| W50 | `/admin/submissions` | submissions | |
| W51 | `/admin/insights` | analytics | reads a funnel that is empty in production |

### 1.3 · Non-happy-path states — the four every screen needs

| State | Native | Web | What is actually there |
| --- | --- | --- | --- |
| **Loading** | 6 files with `Skeleton`, 7 with `ActivityIndicator` | `loading.tsx` ×4 (dashboard, editor, `cv/[slug]`, `[locale]`) + `(app)/loading.tsx` | **three** separate implementations and no shared rule |
| **Empty** | 6 files use `EmptyState` | per-page inline `EmptyState` (`dashboard/page.tsx:686–704`) | one component (`empty-state.tsx:25–84`) that is correct, `Reveal`-based, and under-used |
| **Error** | 18 files carry an error branch | `error.tsx` ×4 + `global-error.tsx` | `cv-fetch-error.ts` already classifies 5 kinds and gives each its own bilingual copy and **its own action** — the best-designed error surface in the project |
| **First run** | N2 + N6 (12 steps between them) | `migrate-guest`, `/preview` | no first-run at all on web (`AREAS-AND-PARITY` §13) |

---

## 2 · Research — what 2026 actually does, and what transfers

### 2.1 · Sources

| # | Source | Used for |
| --- | --- | --- |
| R1 | https://productgrowth.in/insights/consumer/mobile-first-onboarding-guide/ | mobile-first onboarding: one action per screen, thumb zone, **3–5 steps from install to first core action**, "each step above 5 costs 20–30% of remaining users", test on a ₹10,000 phone not an M2 MacBook |
| R2 | https://extensionbooster.net/blog/android-app-onboarding-ux-patterns-reduce-churn-guide/ | value-first onboarding (Duolingo lets you do a lesson before signup), progressive disclosure, permission priming, "first meaningful outcome in under 90 seconds" |
| R3 | https://phenomenonstudio.com/article/mobile-first-fintech-how-we-achieved-54-8-completion-rate-for-pacific-island-communities/ | the single most relevant case study: completion 11.3% → 54.8% on low-end Android and intermittent networks. Every field saves state locally, a draft commits every 30s, resume without a login prompt, **"dead air tolerance" — never show a spinner >8s without an offline fallback**, tiered trust, no jargon ("APR" → "the extra you pay per year") |
| R4 | https://www.indujitechnologies.com/blog/building-bharat-first-apps-low-bandwidth-ux | "in a spotty network, a spinner is not a placeholder, it is a symbol of failure"; 2 MB of JS can lock the UI thread 3–5 s on a low-RAM device; pay for data you prefetch |
| R5 | https://launchpad.ng/resources/africa-low-bandwidth-design | the arithmetic that decides most of this: **on 2G a 5 MB page takes 40 s, a 500 KB page takes 4 s** |
| R6 | https://intellibytesoftwaresolutions.com/insights/building-kenya-why-mobile-first-isnt-optional | East Africa: >95% of internet use is on a phone; 1 GB ≈ 4–5% of average monthly income vs a 2% affordability target; "a 3 MB page can cost KES 15–30" |
| R7 | https://community.hackhouse.africa/resources/blog/mobile-first-development-building-for-african-users | GSMA 2025: a smartphone is ~26% of monthly GDP per capita and up to 67% of a month's income for the poorest 40%; median device is 1–2 GB RAM |
| R8 | https://korhogoagency.com/how-mobile-first-behavior-is-transforming-african-marketing | Transsion (Tecno/Infinix/itel) dominance, 1–3 GB RAM entry devices, 2G/3G/4G in the same day; WhatsApp is the connective tissue |
| R9 | https://ideatoola.com/articles/building-digital-products-for-africa | "budget the first meaningful screen under ~150 KB and treat offline as the default state rather than an error state" |
| R10 | https://www.nngroup.com/articles/empty-state-interface-design | "Do not default to totally empty states… inaccurate system-status messages for empty states are particularly harmful" |
| R11 | https://preview.carbondesignsystem.com/building-blocks/core/patterns/loading | skeleton states only on container/data components, never on action components; **not every element needs a skeleton — negative space is acceptable**; a screen reader must be told about loading/busy/failure |
| R12 | https://v10.carbondesignsystem.com/patterns/empty-states-pattern | empty state must **replace** the element that would have shown; use a tertiary button when several empty states can appear at once |
| R13 | https://uxpatterns.dev/patterns/user-feedback/skeleton | skeleton/accessibility practice |
| R14 | https://docs.swmansion.com/react-native-reanimated/docs/guides/performance/ | **the budget**: animate ≤ ~100 components on low-end Android (~500 on iOS); animate non-layout props only; `ANDROID_SYNCHRONOUSLY_UPDATE_UI_PROPS` |
| R15 | https://github.com/software-mansion-labs/skills/…/animations-performance.md | same limits stated as a table; profile in release builds, because debug builds lie |
| R16 | https://margelo.com/blog/margelo-discord-react-native-performance | why even `opacity` became expensive: one animating view clones hundreds of shadow nodes because every mounted `useAnimatedStyle` sits in the props registry. Discord's fix cut Android jank frames by **26%** |
| R17 | https://dev.to/expo/the-real-cost-of-react-native-animations-benchmarking-every-approach-3bej | measured on a Moto G8 Plus: at 50 views the frame budget is already tight; at 500 views Reanimated is 36 ms vs a 16.67 ms budget. Feature flags buy 11–19% |
| R18 | https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html + https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced | 24×24 CSS px is the AA floor (2.5.8), 44×44 is AAA (2.5.5) — **44 is the goal, 24 is the floor** |
| R19 | https://www.humanstandards.org/ergonomics/targets-spacing/ | Android/Material minimum 48×48 dp; minimum 8 px between adjacent targets; location-based sizing — **larger at the bottom, because thumbs approach at a flatter angle** |
| R20 | https://saglitz.com/design/apple-hig-liquid-glass | iOS 26 Liquid Glass: **glass is for the navigation layer, never the content layer**; "glass rendering is GPU-heavy — use containers, let glass rest in steady states, avoid continuous animation, and test on iPhone 11–13-class devices"; Apple itself reduced default transparency in iOS 27 after legibility complaints |
| R21 | https://medium.com/@chruuu__/reimagining-linkedin-a-ui-ux-case-study-e74cd93e5b58 | job-search UX: the most-reported user failures are *losing track of applications* and *no autosave/session recovery*; the fixes are a tracking dashboard and autosave |
| R22 | https://dev.umodoc.com/en/docs/mobile/features | document editor on mobile is **not a trimmed desktop UI**: it is organised around "preview, edit, save, leave", with an outline/section entry point, a bottom toolbar and pop-up panels; the soft keyboard's obstruction is handled explicitly |
| R23 | https://mdeditor.tw/faq/does-md-editor-work-on-mobile | on small screens stack panes and wrap the toolbar onto as many rows as needed — no button hidden behind overflow |
| R24 | https://www.strv.com/blog/two-writes-for-every-tap-optimistic-ui-in-offline-first-apps | optimistic UI as two local writes: an immutable event to upload plus a disposable projection the UI reads — the screen updates with no network in the loop ("zero-flicker") |

### 2.2 · What TRANSFERS to a 1–3 GB Android on metered data

| Pattern | Why it transfers | Measured cost |
| --- | --- | --- |
| **Skeletons shaped like the content that replaces them** (R11, R12) | the layout does not move when data lands; the user reads structure, not a spinner | 0 bytes; a few divs |
| **A bounded shimmer** (the app already has one) | conveys "working" without a spinner's failure connotation (R4) | one composited layer, bounded to 2 cycles and cancelled on unmount |
| **Empty states that offer the next action, not just the fact** (R10, R12) | a fresh install, a thin profile and a failed load all land here (the live device shows the CV list and recent-CVs block in exactly this state) | 0 bytes |
| **Saving state the user can see** (R3, R21) | on an intermittent network, "is my work saved" is the one question that decides whether the app is trusted | 0 bytes; one 30-px pill |
| **Resume without a re-login, autosave every ~30 s, local draft per field** (R3) | the case study that moved completion 11.3% → 54.8% on exactly this hardware | local storage only |
| **"Dead air tolerance": no spinner past ~8 s without an offline fallback** (R3) | converts a stall into information | 0 bytes |
| **Optimistic UI with a real local write** (R24) | the user's action is acknowledged before the network is consulted | local write |
| **Value-first, 3–5 steps to the first real outcome** (R1, R2) | this app has 12 steps across two onboarding screens before the user has a CV | removes screens, so it saves bytes |
| **Section outline + bottom toolbar on the mobile editor** (R22, R23) | the desktop-toolbar-on-a-phone pattern does not survive a 5″ screen; the section rail is the fix | 0 bytes |
| **44×44 targets, larger at the bottom of the screen** (R18, R19) | thumb ergonomics; also WCAG AAA | 0 bytes |
| **Reduced-motion support** (already implemented) | an OS setting the user has already expressed | 0 bytes |
| **Dark mode as an option** (already implemented) | some users want it | 0 bytes; OLED savings only on OLED |
| **Bottom sheets over full-screen pushes for small tasks** (already used) | reuses the mounted screen; no new stack entry | cheaper than a push |
| **Optimising the mark's idle animation away on inactive tabs** (already done) | a per-frame callback on five invisible marks is motion nobody sees and the battery still pays for | already fixed |

### 2.3 · What is FASHION here, and what it costs this specific user

| Pattern | Verdict | The cost, specifically |
| --- | --- | --- |
| **iOS 26 Liquid Glass / translucent materials** (R20) | **FASHION** | Apple's own adoption guidance says glass is GPU-heavy, keep it in the navigation layer, let it rest, and test on iPhone 11–13-class hardware. This device is well below that floor. It buys no comprehension on a CV app and it is not even our platform |
| **Glassmorphism** | **FASHION** | same compositing cost as above, and it *lowers* contrast — on a Swahili-first product read on a sunlit screen by someone who may not be a fluent reader, that is a regression |
| **Video / animated hero** | **FASHION, and hostile** | an autoplay video is a direct cash charge to the user (R5, R6: 1 GB ≈ 4–5% of monthly income; a 3 MB page ≈ KES 15–30) |
| **`backdrop-filter` / blur transitions** | **FASHION** | a full-screen blur is a per-frame full-screen pass |
| **Material 3 Expressive motion** | **FASHION (the motion half)** | spring-per-item does not survive a 20-row list on a low-end GPU (R14–R17). The *type* half transfers for free |
| **Parallax on scroll** | **FASHION** | scroll-linked motion is banned by the existing standard and costs frame budget on every scroll tick |
| **Illustration-heavy empty states** | **FASHION here** | an SVG costs bundle bytes and decode time, and R11's own guidance says negative space is fine. The existing icon + two lines is the right answer |
| **Haptics on every tap** | **FASHION; selectively transfers** | the app already uses haptics as distinct state signals (selection/success/error/warning). Extending them to every tap is fatigue, not feedback |
| **Dark mode as the default** | **FASHION as a default** | OLED savings need an OLED panel, which this price tier often is not; forcing it saves nothing and breaks the warm palette's character |
| **Splash animation as a feature** | **FASHION** | it is a hand-off. The app already bounds the mark's breath to 2 cycles for exactly this reason |
| **Count-up animations on numbers the user compares** | **FASHION** | a score that animates is a score the user cannot read. The one sanctioned exception is the web `/snap` headline score |
| **Heavy brand illustration on the marketing page** | **MEASURED, NOT FASHION** | but it must be sized to the connection: the live `/snap-to-apply` page is the heaviest in the set |

---

## 3 · The design system — rules a developer implements without judgement calls

Full rendered version: **`00-design-system.html`**. The normative text:

### §1 · Colour usage (the palette is fixed; only the *roles* are specified)

1.1 The 24 palette values in `apps/web/tailwind.config.ts` / `apps/native/src/components/ui/theme.ts`
are the complete set. No new value, no adjusted value.
1.2 **`--ember #DA4A1C` is a FILL colour and an ICON colour. It is not a small-text colour.**
Measured: **3.89:1** on cream, **4.22:1** on white, **3.59:1** on `ember-tint` — all below WCAG AA
4.5:1 for 14 px text.
1.3 **Small ember text uses `--ember-shadow #A8330F`** (measured **6.16:1** on cream, **6.68:1** on
white). This token already exists as `brand-800`; nothing in the palette moves.
1.4 Icons are non-text: WCAG asks 3:1, ember passes at 3.59:1, so icons keep ember. This is why the
two roles diverge — state it as two rules so nobody has to remember a ratio.
1.5 `--text-muted #756A5E` is 5.28:1 on white, 4.86:1 on cream, **4.30:1 on `sand #EFE7DA`**. The web
body background *is* sand, so **muted text on the web page background fails AA by a hair** — use
`text-body #6B5F54` (5.71:1) for anything smaller than 18.66 px on sand.
1.6 `--border-input #9C8D7B` at 3.23:1 on white is correct **for a border** (non-text needs 3:1) and
must not be lightened to reach a text ratio.

### §2 · Type scale — nine roles, and every text node is exactly one

| # | Role | Size / line-height · weight · tracking | Where |
| --- | --- | --- | --- |
| 2.1 | `Display` | 30 / 36 · 800 · −0.5 | onboarding hero, first-run step titles |
| 2.2 | `ScreenTitle` | 28 / 34 · 800 · −0.5 | **one per screen**, top of `Screen` |
| 2.3 | `SectionTitle` | 18 / 24 · 800 · 0 | `SectionHeader`, dashboard `h2` |
| 2.4 | `CardTitle` | 15.5 / 21 · 700 · 0 | the row's primary line |
| 2.5 | `Body` | 14.5 / 21 · 600–700 · 0 | buttons, quick-action labels |
| 2.6 | `BodySmall` | 13.5 / 19 · 600 · 0 | secondary line under a `CardTitle` |
| 2.7 | `Caption` | 12.5 / 18 · 400–600 · 0 | dates, counts, sublabels |
| 2.8 | `Micro` | 11.5 / 14 · 700 · +0.4 | uppercase eyebrows, badge numerals |
| 2.9 | `Stat` | 26 / 1.0 · 800 · 0 | a headline number you *read*, never one you *compare* |

2.10 Consolidated from the sizes already in the tree (11 … 36). A screen that seems to need a tenth
size needs a different role instead.
2.11 Never two `ScreenTitle`s on one screen. `ScreenTitle` is already the single source
(`screen-title.tsx:11–49`) — the five screens that still hand-roll a title get folded into it.

### §3 · Spacing rhythm

3.1 Base unit 4 px. **The only allowed gaps are 4, 8, 12, 16, 20, 24, 32.**
3.2 Screen horizontal padding is always 20 (`Screen`'s default), never overridden per screen.
3.3 Card padding 16. Row padding 14–16. Compact inline row 10.
3.4 Icon → label gap 8; 12 when the icon sits in its own tinted well.
3.5 Grid gutter 12. Section → section 20–24.
3.6 The tree carries ad-hoc `gap: 2/9/10/11` and `padding: 15`; each rounds to the nearest allowed
value. This is the cheapest consistency win available — a visual change with no layout change.

### §4 · Corner treatment — one formula

4.1 **inner radius = outer radius − outer padding**, clamped to the nearest token **below**.
4.2 Tokens: `pill 999`, `card-lg 20`, `card 16`, `input-lg 12`, `input 8`.
4.3 Never hand-write a radius outside the token set. `profile-screen.tsx`'s card-level `borderRadius:
14` (audit reference) is not a token; it is `card` 16.
4.4 The icon-well spread already in the tree is this rule working (30×30 → 9, 38×38 → 11–12,
44×44 → 12). Keep the wells; stop using 14 for containers.

### §5 · Elevation and surfaces

5.1 Page background is `cream` or `sand`. Never `card` behind a whole screen.
5.2 A **static** content block: white surface + 1 px `border`, **no shadow**. A resting shadow on
every card is an offscreen compositing pass per card per frame.
5.3 A **pressable** card is flat at rest and shows `shadow.card` only in the press/hover state.
5.4 Shadows belong to the floating layer only: dialogs, sheets, toasts, sticky action bar
(`shadow.floating`), and the ember CTA (`shadow.ember-hard`).
5.5 Dashed border means empty/placeholder and nothing else.

### §6 · Iconography

6.1 Sizes: **14** (inline/badge), **18** (row leading, header action), **20** (icon-well centrepiece,
empty state). Nothing else.
6.2 Outline, stroke width 1.75. 6.3 Filled only for the active tab icon and `SumaiyaMark`.
6.4 An icon never carries meaning alone: it has a text label or an `accessibilityLabel`.

### §7 · Motion — the existing standard, plus four named additions and one ban list

7.0 **`docs/MOTION-STANDARD-2026-09-20.md` is the standard and this document does not restate it.**
Durations `1/90/140/220/300/260/340`; `ease.out` in, `ease.in` out; stagger `30 + min(i,6)×40`, cap
270 ms, rise 12 px; springs only for dialog/sheet present and container reflow.
7.1 **Adopt, don't invent.** Every `{loading ? A : B}` in the tree must resolve to the standard's
"Loading → content" row (§3.5 row 7): placeholder `FadeOut` 140 ms `ease.in` **while** content enters
at 300 ms `ease.out`. A code-review checklist item.
7.2 **NEW — Metric refresh.** A match/ATS badge whose value changes on screen updates its digits
**instantly** (the standard already bans animating compared numbers) but its container may take
`dur.micro` / `ease.inOut` on the background tint only.
7.3 **NEW — Banner stack.** When more than one nudge renders above the fold, they do not each animate:
one `Reveal` on the **group**.
7.4 **Banned.** Scroll parallax · `backdrop-filter`/blur transitions · spring-based list-item
entrances (timing curves only) · any `withRepeat` without a 2-cycle bound **and** a
`cancelAnimation` cleanup · more than ~100 simultaneously animated nodes (R14).
7.5 **Stays instant, and adding motion here is a regression:** typing, tap acknowledgement, scroll
offset, selection state, numbers being compared, list text that is merely updating, keyboard
avoidance.
7.6 Reduce Motion collapses to **1 ms, never 0 ms**, so `withTiming`'s finished callback still fires.

### §8 · Density and performance budgets

8.1 Tap targets ≥ 44×44 including `hitSlop` (24 is the AA floor, 44 is the goal).
8.2 Never stack more than two composited layers (tinted fill + border + shadow = three; pick two).
8.3 ≤ ~100 animated nodes per screen (R14). `Stagger`'s own cap is the enforcement point; extend the
same discipline to any list not already going through it.
8.4 Prefer a **row** to a **card** where the content is text-primary: a card costs a border, a radius
and padding recomputed per item.
8.5 Images are pre-compressed before display (`pick-photo.ts` is already the only path).
8.6 **One list component per shape.** `SkeletonList`, `SkeletonCard` and a bare `<Text>Loading…</Text>`
are three answers to one question; keep two (`SkeletonList` for lists, `SkeletonCard` for a single
card) and delete the third.

---

## 4 · The mockups

Under `docs/design/2026-09-20/`. Every file is **standalone HTML with inline CSS — open it in a
browser, no build step.** Colours are read from the app; copy is the app's real Swahili.

| File | One line |
| --- | --- |
| `index.html` | The proposal cover: what is fixed, what was measured, how to read a mockup, and links to every page. |
| `00-design-system.html` | The design system rendered — 24 palette swatches with hex and role, the nine type roles as live specimens, radius samples, and the motion tokens + ban list. |
| `01-home.html` | Home before/after side by side: the advert leaves the first slot, saved-state becomes visible, quick actions halve in height (336 px → 196 px). |
| `02-cv-editor.html` | The CV editor with a section rail to jump between form sections, a visible autosave pill, and the PDF export moved into the thumb zone. |
| `03-jobs-feed.html` | The jobs feed: an unambiguous `Ulinganifu` score, one entry point for the eye, and the honest empty state production actually serves. |
| `04-profile.html` | Profile: who is signed in, one scored prompt that explains why matching is weak, and destructive actions ordered by recoverability. |
| `05-empty-loading-error.html` | Three phone frames — loading, empty, offline error — built as one composite so they cannot drift apart. |
| `06-chat.html` | The chat box: four starter chips cut to two, the artefact rendered in the thread that produced it, the composer held still. |

**Supporting files:** `_mockup.css` (the design system as CSS, inlined into every page),
`_build_mockups.py` + `_build_part2.py` + `_build_part3.py` (generators), `_render.py` (headless
Chrome → PNG), `_vision_judge.py` (the pixel judge), `_png/` (9 renders), `_vision/verdicts.jsonl`
(the raw transcripts), `_live/` (5 screenshots of the running web app), `_claude-pass1.md`.

### 4.1 · What the pixel judge said, and what I did about it

All 8 frames were rendered with headless Chrome at a 390 px viewport (2× scale) and sent to
**`nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free`** — the only one of the seven image-capable
free models that returned a verdict (`gemma-4-31b` and `qwen3.8-27b` answered 429 from the upstream
provider; `ling-3.0-flash-vl`, `nex-n2.5-pro` and `dots-3-note` returned empty content;
`thinkingmachines/inkling` is restricted to agentic harnesses). Model per frame is recorded in
`_vision/verdicts.jsonl`.

**First pass — it caught a real rendering fault I could not see in the source.** On the after-home
frame it reported overlapping and blank elements. I re-rendered and inspected directly: the screenshot
was being captured **mid-animation**, so every `.arrive` block was still at `opacity: 0` — the whole
quick-action grid and the job rows were invisible in the PNG. Fixed by freezing animations in the
render target, not in the mockup. *Verified by reading the rendered pixels, not by trusting the model.*

**Second pass — the findings I accepted:**

| Verdict (model's words, abridged) | Verified? | Action |
| --- | --- | --- |
| *"the gray 'Ulinganifu' percentage bubbles… have low contrast"* | **yes, computed**: `badge--muted` is `#756A5E` on `#F4EEE4` = **4.57:1** — passes AA, but it is the weakest badge on the screen and the model read it as failing | left the token (it passes) and recorded the measurement in §1 |
| *"the 'Pakia CV' link has insufficient contrast against the light background"* | **yes, computed**: ember `#DA4A1C` on cream = **3.89:1** — a genuine AA failure | **fixed.** The whole mockup set now uses `--ember-text #A8330F` for small ember text; this became §1.2–1.3, the one usage rule this proposal asks for |
| *"INAHIFAHDHIWA YENYEWE KWENYE AKAUNTI YAKO… sits below the fold and adds no value"* | yes — it is a 11.5 px caption under a sticky footer | reduced it to one line and made it part of the footer rhythm |
| *"the error notification should be more prominent… the user's immediate concern is the failure"* | **yes, and it found a real ordering fault**: the "still available offline" card sat *below* the retry button, so a user reading top-to-bottom tapped retry and never learned two CVs were still usable | **fixed.** The reassurance now sits between the message and the action: message → what is still available → the way out |
| *"Large vertical gaps above the icon… the empty area above the icon should be reduced"* | yes — my empty state was top-aligned where the real component centres it (`cv-list-screen.tsx:131–142` wraps it in `flex:1 justifyContent:"center"`) | **fixed.** Centred, so the mockup matches the component |
| *"two tall placeholder rows that could be condensed"* (CV area, before frame) | yes — this is the current app's own skeleton | kept as the before-state; the after-state uses the same geometry as the content |

**Third pass — the model errors, recorded so they are not mistaken for defects.**

| Claim | Reality |
| --- | --- |
| *"The tooltip 'Ongea na Sumaiya' overlaps the 'Maombi' button — a rendering bug"* | **model error.** They are two different rows; the quick-action grid is `flex-wrap` with a 12 px gutter. Re-checked in the HTML and in the render: no overlap |
| *"the 'Jenga CV yako' button is a solid rectangle without rounded corners"* | **model error.** It carries `.card`, which sets `border-radius: 16px` |
| *"The 'Imehifadhiwa' badge (light teal background, **white** check) has low contrast"* | **model error on the colour.** The check is `currentColor` = `#12766A`, not white. Verified in `_mockup.css` |
| *"the 'Sasa' tag (light teal bubble) where **black** text may be hard to read"* | **model error on the colour.** It is `--success #12766A` on `#E3F1EE` = **4.73:1**, verified |
| *"the two pill buttons ('Nionyeshe ajira…', 'Andika baru…') use light gray backgrounds with **white text**"* | **model error.** `.chip` is white with `--espresso` text and a border |
| *"Ujuzi" read as `UZOFU` on a heading* | **model misread.** The file says `UZOEFU`; confirmed by grep. This is why no string-level claim in this document is reported without a grep |

**What the judge is trustworthy for** — and the judgements I am leaning on, because they are the
ones it is good at: hierarchy order, density at phone width, whether a frame reads as a finished
proposal or a wireframe, and whether a state reads as a stall. On all 8 frames its answer to
*"finished or wireframe?"* was some form of **"a finished design proposal, with full colour,
typography and UI elements"** — that is the single most useful thing it told me, and it is a
judgement about the pixels rather than about the CSS.

**What I could not judge this way:** whether the entrances actually interpolate on a Redmi-class
device. A still frame cannot show that; the standard's own tool (`scripts/motion-frames.py` against a
`screenrecord` clip) is the instrument for it, and it was not available to me here.

---

## 5 · Before / after, per screen

### 5.1 · Home — `app/home-screen.tsx`

**Before.** The hint card `:181–265,304–363` rotates one item at a time from a pool that mixes a live
server signal, the AI spine's next move, *and* a hardcoded TemplateHub promo `:220–234`
(*"Miundo 224 kwa kila nyaraka"*). Nothing on the screen states whether the user's work is saved.
Six quick-action tiles `:401–428` at 104 px each (`min-height:116` on the CV tiles, `Stagger step=45`)
consume 336 px of an 844 px screen. The recent-CVs block `:466–583` hard-swaps skeleton→content `:473`.

**After** (`01-home.html`).
1. The TemplateHub promo leaves the rotation. The first card is the highest-value next action with
   its score and its reason — *"Mhasibu, Dar es Salaam · Azania Bank · Ajira kamili"*, `Ulinganifu 78%`
   — and two buttons that are the two real verbs: *Lenga CV yako*, *Angalia*.
2. A saved-state strip reads *"Kila kitu kimehifadhiwa · CV zako 3 ziko kwenye akaunti yako"* with a
   `Sasa` pill. This surfaces state the app already tracks (`useOfflineSync`, `cv-list-screen.tsx:171`)
   and never showed here.
3. Quick actions become 60 px icon-well **rows**: 336 px → **196 px**, and the first job listing moves
   above the fold. Nothing removed; everything shorter (§8.4).
4. `Ongea na Sumaiya` replaces the redundant `AI ya kazi` tile — same destination, clearer verb.
5. Job rows get a **pine** well and CV rows an **ember** well, so the two lists stop being the same
   colour of row.

**Why it is better for the real user.** A first-time jobseeker now sees a job and its reason before
seeing an advert for designs, can answer "is my work safe?" without leaving the screen, and reaches
the first job listing without scrolling. On a metered connection, reaching the payload sooner is the
whole difference.

### 5.2 · CV editor — `cv-editor-screen.tsx`

**Before.** `Section` `:26–73` is a disclosure, not navigation: five cards, no way to jump. `dirty`
is tracked `:98` and used only to *block an exit* `:100–169` — the user learns their work is unsaved
when they try to leave. The header row holds Back + sync pill + Preview pill + ATS pill `:499–507`
in the top 44 px. Export lives in a footer only visible at the bottom of a long scroll.

**After** (`02-cv-editor.html`).
1. A **section rail** under the title — `Taarifa binafsi · Muhtasari · Uzoefu · Elimu · Ujuzi ·
   Miundo` — horizontally scrollable chips, 36 px tall. This is the pattern a mobile document editor
   is actually built around (R22, R23): an outline entry point, because you cannot have a sidebar on
   a 5″ screen.
2. A **visible autosave pill** in the header: `Hifadhi…` (amber, `gold-tint`) → `Imehifadhiwa` (green,
   `success`). The dirty guard stays exactly as it is — this only stops the user discovering it late.
3. The **ATS pill moves out of the header** into the action row beside Save/Export, so the header is
   Back + save-state.
4. A **completeness strip** (*"Hatua 3 kati ya 5 zimejazwa · 60%"*) driven by the section list already
   in the file — it is not new data.
5. The primary action is a **sticky footer** in the thumb zone (R19): *Onyesha* + *Pakua PDF*.

**Why it is better.** The user can reach any section in one tap instead of scrolling a form on a
screen where the keyboard leaves four rows visible; they know within a second whether their work is
safe — the question that decides trust on an intermittent network (R3, R21); and the artifact they
actually came for is under their thumb rather than at the end of the document.

### 5.3 · Jobs — `jobs-screen.tsx`

**Before.** `MatchBadge` `:14–23` is pixel-identical to the ATS badge, so `82%` means job fit here and
parsability there. Every listing is the same card at the same weight `:25–65`, so a wall of equal
cards gives the eye no entry point. `{loading ? <SkeletonList/> : …}` `:120–122` is a hard swap.

**After** (`03-jobs-feed.html`).
1. The badge says what it measures: **`Ulinganifu 78%`**, in the badge, next to the target glyph.
2. A **quiet status line** answers the question the feed cannot: *"Nafasi 2 tu zinaendana nawe vizuri
   — Ongeza ujuzi mmoja ili kupata nafasi zaidi"*, from the count already computed at `:105–106`.
3. Matched rows keep the **reason** the API already returns (`r.reason`) at 12.5 px, so the score is
   explained rather than asserted.
4. A **filter chip row** (*Karibu nami · Ajira kamili · Uzoefu: mdogo*) — the feed currently offers no
   narrowing at all.
5. Time-since is shortened to *Siku 2* so the metadata stops ellipsising (`Nakumatt · Arusha · Siku 2 zili…`).

**Why it is better.** `82%` can no longer be misread as an ATS score; the user learns *why* a job
matched instead of being handed a number; and the empty/weak-match state tells them the single action
that would improve every future score, instead of leaving a thin feed looking like a broken app.

### 5.4 · Profile — `app/profile-screen.tsx`

**Before.** Destructive actions are split across two kinds of place: *"Futa data iliyohifadhiwa"* sits
in the neutral Account group `:401` while delete-account gets its own Danger zone. The header
`:237–278` shows the raw name or email local-part. Matching quality depends entirely on the career
profile `:285–286` and the screen never says so.

**After** (`04-profile.html`).
1. The header reuses the device-name detection that already exists at `home-screen.tsx:276–281`, so a
   phone model is never displayed as the user's name, and shows a verified chip.
2. One **scored prompt** — `60% · Wasifu wa kazi` / *"Ongeza uzoefu wa kazi mmoja"* / *"Sumaiya
   anaoanisha ajira na ujuzi kwa kutumia haya."* This is the screen finally admitting what the whole
   product depends on. The career-profile row stays below, unchanged.
3. Destructive actions merged into **one "Eneo la hatari"** group, ordered by recoverability: clear
   cache first, delete account last.

**Why it is better.** The user learns that improving their match score is a thing they can do, and
which field to fill; and severity reads as a gradient, so the reversible action stops carrying the
same weight as the irreversible one.

### 5.5 · Empty, loading, error — the states most users see

**Before.** Three loading implementations: `SkeletonList` (`cv-list-screen.tsx:117–118`), hand-inlined
`SkeletonCard` triples (`applications-screen.tsx:58` audit; `jobs-screen.tsx:120`), and a bare
`<Text>Loading your CVs…</Text>` (`ats-checker-screen.tsx:125` audit — the standard's own words:
*"the worst loading state in the app, in both senses"*). All of them hard-swap.

**After** (`05-empty-loading-error.html`), one composite with three faces:
1. **Loading** — the skeleton occupies the exact geometry of what replaces it (same 44 px well, same
   two text lines), so nothing below moves. Bounded shimmer, cancelled on unmount.
2. **Hand-off** — skeleton `FadeOut` 140 ms `ease.in` while content enters at 300 ms `ease.out` with
   a capped stagger. Never empty, never a pop.
3. **Empty** — icon → title → body → action, centred (matching `cv-list-screen.tsx:131–142`), on the
   app's real copy: *"Huna CV bado. Huna CV, rasimu wala iliyokamilika. Ongea nami nikutengenezee
   moja, au pakia CV uliyonayo ili kuanza."* with *Ongea nami* and *Pakia CV*.
4. **Error** — the app's own `offline` variant from `cv-fetch-error.ts` verbatim (*"Imeshindwa kufikia
   server"* / *"CV zako ziko salama kwenye akaunti yako — tumeshindwa kufikia server."* / *Jaribu
   tena*), plus one new line: **what is still usable** — *"Nakala ya mwisho ipo kwenye simu · CV 2
   zinaweza kufunguliwa bila mtandao sasa"*, read from the existing `offlineStorage` /
   `isOfflineOnly` path.

**Why it is better.** The user can tell a slow load from a failed one, and a failed load from data
loss — the distinction the code comment at `cv-list-screen.tsx:119–121` already says is the whole
point — and on a failed load they learn what they can still do offline instead of only being told to
try again. This is R3's "dead air tolerance" applied to the app's own states.

### 5.6 · Chat — `sumaiya-chat-screen.tsx`

**Before.** The first screen after the tab is a grid of parallel quick actions next to a composer that
already affords free typing. Two of them duplicate what the composer does. The screen reads as a menu,
so a first-time user picks instead of talking.

**After** (`06-chat.html`).
1. **Four starter chips cut to two** — the two that end in a document the user can send (a tailored CV,
   a cover letter), which are the app's real value (`job-apply-screen.tsx`). The "free chat" chip is
   deleted because the composer is right there; the "My CV" chip is replaced by the result card.
2. **The artefact appears in the thread that produced it** — a bordered result card with
   `Ulinganifu 78%`, the job, and *Fungua CV iliyolengwa*. Today this lives somewhere else, so the
   conversation produces a thing the user then has to go find.
3. The composer is a 44 px icon-well + a 44 px field + a 44 px send, with an attachment entry point,
   and one trust line at the smallest size on the screen.
4. **Nothing animates on the typing path** (§7.5). The result card is the one arrival.

**Why it is better.** The user's first act is to say what they want, not to choose from a menu they
cannot yet evaluate; and the CV the conversation produced is where they are looking. Model naming
stays disclosure, not pitch — the app sells the outcome.

---

## 6 · Calls the owner might reject, so he can say no cheaply

| # | The call | Why he might reject it | How to reverse it for free |
| --- | --- | --- | --- |
| 1 | **`--ember` stops being small-text colour; small ember text uses `--ember-shadow #A8330F`** (§1.2–1.3) | it changes the look of every link, *Ona zote*, and ghost button in the app, and "no touching colours" was explicit | it is a **usage** rule, not a palette edit — one token swap in a link/ghost-button component, and it is reverted. **This is measurement, not taste: 3.89:1 vs a 4.5:1 requirement.** If he wants ember text to stay, that is a decision he is entitled to make with the number in front of him |
| 2 | **Quick actions shrink from 104 px tiles to 60 px rows** (§3.6/§8.4) | the tiles are the most colourful, most "designed" thing on Home; shrinking them looks like less app | one `min-height`. The numbers: 336 px → 196 px, and the first job listing moves above the fold |
| 3 | **The TemplateHub promo leaves the Home rotation** (`home-screen.tsx:220–234`) | TemplateHub and Premium are his monetisation surface. A designer removing a promo from the home screen is exactly the kind of call that deserves suspicion | **do not delete it.** Gate the trimmed rotation behind a flag and run it against the telemetry he already has (`track("firstrun.step")`, `signals`, `computeSignals`) for one cohort, then compare completion and time-to-first-CV. If nothing moves, revert with one flag flip — no code deleted, no aesthetic argument made |
| 4 | **Onboarding collapses from 4 slides to 1** | same instrumented funnel; the slides may be load-bearing for engagement | same treatment: flag + cohort + the `onboarding.slide` events that already exist |
| 5 | **Loading becomes one composite with a mandatory hand-off** (§7.1) | it is a rule that touches ~15 files, and "adoption checklist" is work | it is the standard's own §3.5 row 7, not a new rule — nothing to agree to, only to apply, and it can be applied one screen per PR |
| 6 | **The empty *Nakala ya mwisho ipo kwenye simu* line on the error state** (5.5.4) | it is the one genuinely *added* line of content in this proposal | it is one `<View>`. Delete it and nothing else breaks; the error still has its message, its reassurance and its retry |
| 7 | **ATS pill moves out of the editor header** (§5.2.3) | someone put it there deliberately | one JSX block, movable in either direction |

**Not proposed, deliberately:** no new feature appears anywhere in this document. The two additions
that exist — the completeness strip in the editor and the offline-availability line in the error —
are both restatements of state the app already computes, and both are singled out above as the first
things to delete if he disagrees.

---

## 7 · What I could not verify

1. **No source file was modified, so nothing here has been proven to work.** Every "after" is a
   description and a mockup, not a shipped change.
2. **I could not run the app.** I did not build or drive the Android APK or the web dev server, so no
   claim in this document is a device observation. The defects are read from source, from the motion
   standard's own audit (marked **(audit)**), and from screenshots of the running public web app.
3. **Motion on the real device is unmeasured.** The standard's instrument is
   `scripts/motion-frames.py` against a `adb screenrecord` clip plus `dumpsys gfxinfo`. I had no
   device session, so the jank numbers in §8 of the standard are cited, not reproduced, and I add no
   new measurement of my own. **Nothing here is evidence that the proposed motion holds 60 fps on a
   Redmi-class phone** — that has to be measured before it ships.
4. **Live-app pixel claims are limited to the public web pages.** I screenshotted `sumaiya.app/sw`,
   `/pato-kazi`, `/templates`, `/snap-to-apply` and `/sign-in`. The authenticated dashboard and the
   editor were **not** screenshotted, so §5.1–5.4 are argued from source, not from a picture of the
   running screen.
5. **I could not measure the live page's DOM geometry.** The intended browser check (viewport 390,
   `scrollWidth` vs `innerWidth`) timed out after 420 s. I therefore did **not** report the marketing
   page as horizontally overflowing: the wide rows I saw resolve to a deliberate marquee
   (`ai-copilot-landing.tsx:317`, `minWidth: "max-content"`), which I verified in source. Any remaining
   horizontal overflow on that page is **unverified**.
6. **Line numbers may have drifted.** Other agents were editing this tree throughout. Line numbers
   marked **(audit)** come from `docs/MOTION-STANDARD-2026-09-20.md` §8. Grep before trusting any
   single line number.
7. **The vision judgement is an impression, not a measurement.** One model, eight frames, and it made
   demonstrable errors (§4.1, third table). Its hierarchy/density/"finished vs wireframe" judgements
   are the part I relied on; every string-level claim was grepped back into the file, and the four
   colour claims it got wrong were checked by computing the ratio.
8. **The 99-surface count is a file count, not a usability count.** 51 web pages, 21 route-level
   special states, 27 native screens. It says how many things exist; it does not say how many a user
   can reach. The native total includes two auth sub-components that render inside the sign-in screen
   rather than being independently routable, which is why §1.1's table is numbered N1–N28 against 27
   files.
9. **Two facts in this document are inherited, not re-verified:** that the job feed is empty in
   production (`AREAS-AND-PARITY-2026-09-20.md` §9) and that the support address points at the wrong
   company (§12). Both are load-bearing for §5.3 and for the inventory weaknesses; both are another
   agent's finding.
10. **Anthropic's Claude was unavailable for most of this work** — the CLI hit its session limit
    (`resets 1:40am Africa/Nairobi`) after one completed pass, so the design-system critique is one
    model's view rather than a panel's, and the rest of the work is web research plus a single free
    vision model.
11. **Concurrent writers.** Other agents wrote `00-index.html`, `01-empty-chat.html`,
    `02-exchange-document-card.html`, `03-lenga-kwenye-kazi.html`, `04-progress-and-reading.html` and
    `05-unavailable.html` into the same directory while I worked. They are **not mine**, I did not
    read them, and they are deliberately excluded from my commit.

---

## 8 · Definition of done for whoever implements this

1. §1.2–1.3 applied to the link / ghost-button / badge components (one place, both platforms).
2. Loading → content applied to every `{loading ? A : B}` (§7.1), one screen per PR.
3. The three `ScreenTitle` holdouts folded into `screen-title.tsx`.
4. Ad-hoc `gap`/`padding` values rounded to the 4 px scale (§3.6).
5. Home: promo out of the rotation behind a flag; quick actions at 60 px; saved-state strip added.
6. Editor: section rail, autosave pill, ATS pill moved, sticky action footer.
7. Every reload of the app is checked with `scripts/motion-frames.py` and the verdict **reported, or
   reported as unmeasured** — never estimated.


---

# PART II — added after the owner looked at the first draft

Three items arrived from the owner, and one of them was found by looking at pixels rather than code.
Two corrections to Part I were also forced by the live device; both are flagged where they occur.

---

## 9 · Web navigation — the nav that was never designed

**Rendered in `07-web-nav.html`.**

Every mockup in this proposal up to that point was a phone surface. The web app's navigation was not
redesigned at all, and the owner named it: *"the web nav bar haha we totally forgot about that."*

### 9.1 · The problem, stated as a number

The signed-in web app has **nine destinations**: dashboard, CV editor, jobs, applications, brief,
assistant, interview, learning, settings. A nav that lists all nine is not a nav, it is a menu — and at
a glance a nine-item row cannot be scanned, cannot be translated, and cannot hold an assistant.

### 9.2 · The recommendation

A hard split between **what you do every session** and **what you do sometimes**.

| Position | Content | Why |
| --- | --- | --- |
| 1 | logo (mark + Sumaiya) | the pre-auth bar already does this; the geometry must not change on sign-in |
| 2 | **four primaries: Nyumbani · CV · Ajira · Maombi** | the four verbs of the product: see the state, write the document, find the opening, track it |
| 3 | the assistant, as a **pill** | on desktop the assistant is a destination *and* a mode; a pill separates it from the four peers without spending a fifth slot |
| 4 | **Zaidi** | the long tail, still **named** — never a bare icon |
| 5 | account avatar | "who am I signed in as" is not a finding-a-destination task, so it never collapses |

**Where the current route reads from:** `usePathname()` prefix match. The active item changes **weight**
*and* gets a `sand-2` fill, so the state survives greyscale and a sunlit screen. **Ember is deliberately
not the nav colour** — it measures 3.89:1 on cream (§1.2) and a nav label is 13.5 px.

**Signed out:** three destinations (Miundo · Ukaguzi wa CV · Ajira) and one verb (Anza bure), no account
menu, no assistant pill. This is the marketing nav's job and it keeps it
(`marketing-nav.tsx`); the signed-in bar must not leak into it.

**Narrow desktop (768–1023 px):** two primaries (**Nyumbani**, **CV**) plus the assistant and **Zaidi**.
Labels drop before objects do. The reason is measurable: Swahili labels are longer than their English
originals (*Nyumbani*, *Mipangilio*, *Mahojiano*), so a four-word bar crowds or wraps earlier here than
it would in English.

**Mobile web (<768 px):** the web already has a phone tab bar (`dashboard/mobile-tab-bar.tsx:81`,
`md:hidden`) — the right idea, but not yet **the same five slots as the APK**. It must be: same labels,
same order, same icons, same active treatment. The user who has both surfaces must not learn two
navigations for one product, which is exactly the drift `AREAS-AND-PARITY-2026-09-20.md` names as the
failure mode. The mobile-web top bar keeps only the logo and the account, so it is not a second nav
competing for the same thumb zone.

### 9.3 · The real APK tab labels (measured, and they corrected this proposal)

Read off the live device's accessibility dump at 1344×2992 / density 408:

> **Nyumbani · CV zangu · Sumaiya · Pakia · Wasifu**

Two corrections to Part I follow from that, and they are in the mockups now:

| Part I said | The device says | Where |
| --- | --- | --- |
| tab label `CV` | **`CV zangu`** | every phone frame |
| quick action `Ukaguzi wa CV` | **`Ukaguzi wa ATS`** | `01-home.html` |

Both are small and both matter: a proposal that renames the user's own tab bar is a proposal that has
not looked at the product.

---

## 10 · One overlay language — the popups are a zoo

**Rendered in `08-overlays.html`.** The owner's words: *"match the pop up boxes accross the platform
like share na sehemu nyingine".*

### 10.1 · Five variants, and only five

| # | Variant | When | Corners | Scrim | Entry / exit | Drag to dismiss |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | **Bottom sheet** | a choice of 2–6 actions, or a short form | 20 top, 0 bottom | `overlay` | `translateY 360→0` · 220 ms `ease.out` / 160 ms `ease.in` | yes, only under 60% height |
| 2 | **Confirm dialog** | an irreversible or surprising action | 20 all round, max-w 300 | `overlay` | scale `.94→1` + scrim · `spring.gentle` / 140 ms `ease.in` | never |
| 3 | **Toast** | the action already succeeded; nothing to decide | 12 (`input-lg`) | none | 220 ms `ease.out` / 140 ms `ease.in`, dwell 4 s | swipe yes, not drag |
| 4 | **Full-screen sheet** | a task that needs the screen (picking, cropping, reading) | 0 — it *is* the screen | none | slide, 260 ms (`dur.screen`) both ways | never |
| 5 | **Share sheet** | sharing an artefact | 20 top | `overlay` | as variant 1 | as variant 1 |

**Variant 5 differs by platform on purpose.** On the APK it is the OS sheet (`Share.share`) — trusted,
already logged in, and the app must not reimplement it. On the web the app supplies the rows, in the
same order, with **WhatsApp first**: in this market WhatsApp is the connective tissue, so the first row
is the channel the user is already in.

### 10.2 · The shared rules (identical on both platforms)

- **One scrim, from the theme.** `theme.ts:59` (light) is `rgba(33,26,21,.45)`; `theme.ts:84` (dark) is
  `rgba(0,0,0,.6)`. No overlay invents its own, and **none uses pure black**.
- **Three radii, from the token set:** 20 (sheet top, dialog), 12 (toast), 0 (full-screen). The sheet's
  inner rows follow concentrically — a 38 px well inside 16 px padding is 11–12.
- **One stacking order, six levels:** content · sticky/tab bar 40 · toast 60 · sheet 70 · dialog 80 ·
  full-screen 90.
- **Focus:** web traps focus, Escape closes if cancelable, focus returns to the trigger. On the APK the
  hardware back key *is* Escape, and `ui/dialog.tsx:84–86` (`dialog.isOpen()`) already exists for exactly
  this arbitration — it is the reference behaviour.
- **Destructive always gets `haptics.error()`**, and the default focus is the **safe** action, never
  *Futa*.
- **Reduced motion:** every duration collapses to **1 ms, never 0**, drag-to-dismiss is disabled, and in
  exchange **the Close/Ghairi control is always visible**. Nothing here is motion-only.

### 10.3 · The audit — every real overlay

Full table in `08-overlays.html`. The five numbers that are the whole finding:

| Measured | Value |
| --- | --- |
| scrims defined in the theme | **1** (`overlay`) |
| scrims actually used on the web | **6** (`black/40`, `black/50`, `black/60`, `espresso/40`, `espresso/50`, `espresso/60`) |
| of those, pure black instead of the theme's espresso | **3** |
| distinct `z-index` values | **7** (40 · 50 · 60 · 65 · 70 · 80 · 100) |
| native sheet-top radii for the same object | **3** (24 · 22 · 14) |
| spring configs on overlays | **3** (`damping 18`, `20`, and `20/240`) |

The concrete defects, with `file:line`:

- **`chat/attach-sheet.tsx:69`, `chat/attachment-preview-sheet.tsx:92`,
  `chat/job-choice-sheet.tsx:195`, `premium-sheet.tsx:150`** — top radius **24**. **`learning/lesson-sheet.tsx:121`**
  — **22**. **`ui/toast.tsx:133`** and **`ui/list-row.tsx:54`** — **14**, which is not a token.
- **`chat/chat-composer.tsx:30`** — `springify().damping(18)`, which **breaks the motion standard's own
  "damping ≥ 20 everywhere"**.
- **`ui/dialog.tsx:122`** — `damping 20, stiffness 240`, matching neither `spring.gentle` (20/180) nor
  `spring.snappy` (22/260). Everything else about this dialog is the reference implementation.
- **`editor/cv-editor-client.tsx:384`** and **`jobs/targeted-cv-drawer.tsx:240`** use
  **`backdrop-filter` blur** — banned by §7.4, and a full-screen blur is a per-frame full-screen pass.
- **`dashboard/applications-grid.tsx:465`** is an overlay with **no scrim at all**, which at phone width
  reads as a layout bug.
- **`premium-sheet.tsx`** (APK) and **`premium-template-modal.tsx:69`** (web) are the same product moment
  in two different shapes — they must become one object.
- **Already correct, keep:** `components/portal-transition.tsx` (the 340 ms `dur.field` colour-field
  dissolve), `components/connectivity-gate.tsx`, `ui/toast.tsx`'s motion
  (`FadeIn 220` / `FadeOut 140`, `:94–100`), the transparent click-outside backstops that set the z
  floor of 40, and `globals.css`'s reduced-motion net — which **collapses rather than removes**, the same
  contract as 1 ms on native.

**Why it is worth fixing now.** Every one of these overlays is a moment where the user is being asked
something or told something important — a destructive confirm, a share, a paywall. Those are exactly the
moments the app has to read as one object. The fix is mechanical: **one scrim constant, one z-ladder,
three radii, five variants.** No new dependency, no new screen.

---

## 11 · The welcoming path — "different elements stacked together"

**Rendered in `09-welcome.html`.** The owner's words: *"the app onboarding annimations and other
welcomming screen"* and *"they dont match like differente elements stacked togerther"*.

This is a **systems** diagnosis, and the right response is the divergence audit below rather than
redesigning six screens one at a time.

### 11.1 · The audit — what each welcoming screen does differently from its neighbours

| Screen | `file:line` | Entry | Duration | Easing | Origin |
| --- | --- | --- | --- | --- | --- |
| splash mark | `splash-screen.tsx:36` | opacity + scale | **480** | **`back(1.6)`** | **scale, with overshoot** |
| splash word | `:37` | opacity | **420** after 240 delay | `out(cubic)` | fade |
| root mode switch | `nav-config.ts:44–53` | cross-fade | **340** | platform | fade |
| onboarding container | `onboarding-screen.tsx:172` | `FadeIn`/`FadeOut` | **360 / 220** | default | fade |
| onboarding language cards | `:204` | `FadeInDown` | **360**, delay `200+i*80` | default | **rise from below** |
| onboarding art | `:362` | `FadeIn` | **420** | default | fade |
| onboarding collapse | `:318` | `withTiming` on an interpolated value | **320** | `in(cubic)` | **scroll-linked opacity** |
| onboarding CTA | `:415` | `FadeInDown` | **300** (default) | default | **rise** |
| sign-in step | `auth/sign-in-screen.tsx:144` | `FadeInRight`/`FadeOutLeft` | **200 / 140** | default | **horizontal from the right** |
| sign-in inner | `:241` | `FadeIn` | **240** | default | fade |
| sign-in inner | `:265` | `FadeIn` | **200** | default | fade |
| first-run step | `first-run-screen.tsx:553` | `FadeInRight`/`FadeOutLeft` | **260 / 150** | default | **horizontal from the right** |
| home blocks | `home-screen.tsx:305,366,401,432,466` | `FadeInDown` | **320** at delays 40/60/120/170/180 | default | **rise from below** |

### 11.2 · The six divergences, named

1. **Thirteen durations across six screens.** The motion tokens define **seven** (1, 90, 140, 220, 260,
   300, 340). At least eight of the thirteen are not tokens, so no two screens share a rhythm.
2. **Four entry origins** — scale-with-overshoot, rise, horizontal-from-right, cross-fade. An element
   that pops, then one that rises, then one that slides in, then one that fades, reads as four apps.
3. **Five easing families** — `back(1.6)`, `out(cubic)`, `in(cubic)`, `inOut(quad)`, and the library
   default. The overshoot on the splash is the standard's single sanctioned exception; nothing else in
   the sequence is even on the same curve family.
4. **The theme does not cover the whole path.** The pre-auth screens are pinned light
   (`root-navigator.tsx:216,228,240,248,258` — `ThemeScope mode="light"`), but the root **container**
   paints `contentStyle.backgroundColor = c.bg` from the **unpinned** theme (`nav-config.ts:44–53`). On a
   dark-mode phone that means a **dark, blank gap between two cream screens** — and the frames in
   `_device/welcome-contact-sheet.png` show it happening twice. *This is the one divergence the user
   sees as a flash.*
5. **The mark renders in two containers.** A circle, then a rounded square, in one cold start. The logo
   is fixed; its container is not.
6. **Nothing persists across a boundary.** Each screen enters from zero and takes its layout with it, so
   there is no travelling object — and without one, a sequence becomes a queue of screens. This is the
   root cause of *"stacked together"*; the other five are symptoms of it.

### 11.3 · The shared language

- **D1 · One entry idiom — rise.** 12 px (the standard's `rise`), entering at `dur.slow` 300 ms
  `ease.out`, leaving at `dur.fast` 140 ms `ease.in`. If something rises, **everything** rises.
  Horizontal motion is reserved for push/pop; the splash's overshoot stays the standard's one sanctioned
  exception — that is what makes it a signature rather than a mistake.
- **D2 · One duration family — five tokens replace thirteen numbers.** 300 entering, 220 in place, 140
  leaving, 260 a screen push, 340 the root mode switch. Nothing in the welcoming path needs a duration
  that is not already defined.
- **D3 · One progress treatment.** One bar, one geometry, carried across every step — slides and
  first-run alike. Today the slides use three dots and first-run uses a *"Hatua 3 kati ya 8"* line, and
  neither survives its screen. The bar is the cheapest continuity signal available and the one the user
  reads as *"I am X% of the way in"*.
- **D4 · One type and spacing rhythm.** `Display` for the heading, `Body`/`BodySmall` below, 20 screen
  padding, 16 card, gaps from {4, 8, 12, 16, 20, 24, 32}. Same nine roles as everywhere else.
- **D5 · THE HAND-OFF — what actually fixes the complaint.** At every boundary, **one object travels**:

  | Boundary | What persists |
  | --- | --- |
  | launch → language | the mark shrinks to the header and stays |
  | language → slides | the chosen language's code persists as a chip |
  | slides → first run | the progress bar is the *same object* |
  | step → step | the entered value persists where it was typed |
  | first run → sign-in | the name/email already typed is shown, not asked again |
  | sign-in → home | the root fade arrives over an already-painted home |

  No new animation is required for any of these — **each is a layout decision**. Keep one element mounted
  across the boundary and the sequence stops being a queue. The outgoing content leaves at `dur.fast`
  *while* the incoming arrives at `dur.slow`; never one after the other, which is what produces the blank
  beat the user reads as a new app starting.
- **D6 · One theme across the whole path.** The root container must paint the same cream the pinned
  screens use. One line, and the flash disappears. Nothing else changes.

### 11.4 · Cost on a cheap phone

| | |
| --- | --- |
| new downloads | **0 bytes** — no new images, no new fonts |
| new screens | **none** — the path *shrinks* (four slides → one, behind a flag, per §6) |
| animations deleted | the onboarding **scroll-linked opacity** (one continuous per-frame interpolation) and home's **second full set of `FadeInDown` blocks** |
| animation class | `transform` + `opacity` only |
| reduced motion | 1 ms, never 0; the hand-off objects are **static** evidence, so the strongest part of this proposal survives with motion off |

The two deletions are both per-frame work, so the arrival becomes **cheaper** than today's.

---

## 12 · What the live device changed

The phone came back online mid-session. Everything below is a measurement, not an inference, and three
items in Part I had to be corrected because of it.

### 12.1 · Method

`adb` → `screencap` (byte size used as evidence) and `uiautomator dump` (which **worked** here: 24
labelled nodes with exact bounds). Device: **1344×2992, density 408, dark mode, Android, app version
1.6.10**. Captures in `_device/`. No sign-out, no data clearing, no uninstall, no contact messaged.

### 12.2 · The cold start, as pixels

A 6.3 MB `screenrecord`, 12 frames at 0.5 s spacing (`_device/welcome-contact-sheet.png`):

| Frame | What is on screen |
| --- | --- |
| 1 | **cream** background, the mark inside a **circle** |
| 2–3 | **dark** background, **completely blank** (~1 s of nothing) |
| 4 | **cream** background, the mark inside a **rounded square** |
| 5–12 | **dark** home with content |

Background order: **cream → dark → dark → cream → dark.** Exactly the mechanism in §11.2(4), seen on
the device.

The vision model's own reading (*nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free*): *"the
white-to-black switch would be perceived as a flash"* and the logo *"appears twice … the symbol is
identical, but the container differs (circle vs. square), so it is not identical."*

**Where the model disagreed with the owner, and why I report the owner's read.** Asked whether the
sequence reads as one arrival or as unrelated screens, it said *"It reads as ONE continuous cold-start
arrival … not a disjointed stack of separate pieces."* I am not passing that on as a finding, for two
stated reasons: it saw **only the cold start**, whereas the path the owner is most likely describing is
the **slides and first-run steps** — which I could not re-trigger without clearing his app data
(forbidden, and I did not); and *"does this feel like one arrival"* is precisely the class of judgement a
vision transcript is weakest at. Its factual readings (the flash, the two containers, the blank second)
corroborate the owner even where its verdict did not.

### 12.3 · The three corrections the device forced

**1 · The job feed is NOT empty — the inherited claim was wrong.**

A populated feed with real postings: *Sales Officer* (CCBRT), *Head of Marketing* (Ramada Resort by
Wyndham Dar Es Salaam), *Loan officer with driving skills* (Hope Microcredit), *Senior Manager Credit*
and *Manager IT Branches Supports* (CRDB Bank), *Loan Officer and Collection Officer* (Simplepay
Capital) — each with **Lenga CV yangu** and **Fungua tangazo**. §5.3 and the jobs mockup are corrected;
`_device/device-07-jobs-live.png`.

It also showed something no design could: **not one card carried a match score**, because the account has
no career profile, so every posting fell into *Nafasi zote za kazi* rather than
*Zinazoendana na wasifu wako*. **The unmatched list is the default for a new user** — which makes the
quiet status line and the profile nudge more important than the badge.

**2 · The greeting renders an internal value as the user's name.**

The home screen reads **"Habari za leo asubuhi, Backup 1"**. The device-name guard at
`home-screen.tsx:276–281` checks for phone brands and for a 1–4 character string; *"Backup 1"* passes
both, so a machine default is displayed as a person's name on the first screen of the app. This is the
same class of defect as §5.4's profile header, verified on the real device rather than argued from source.

**3 · Real tab labels and a real quick-action label** — `CV zangu`, not `CV`; `Ukaguzi wa ATS`, not
`Ukaguzi wa CV`. Corrected in the mockups (§9.3).

### 12.4 · What the device confirmed

- **The empty state is real and well built.** *"Huna CV bado / Huna CV, rasimu wala iliyokamilika. Ongea
  nami nikutengenezee moja, au pakia CV uliyonayo ili kuanza."* with a filled **Ongea nami** and a
  ghost **Pakia CV**, **vertically centred** — confirming §5.5's centring fix and showing the component
  is already correct.
- **The DANGER ZONE split is real** (§5.4). On the device, **Clear offline data** sits under **ACCOUNT**
  while **Delete account** sits alone under **DANGER ZONE**. Confirmed in pixels.
- **The "+1 order" defect from §5.4** — the profile screen shows no completeness score at all, so the
  screen still never explains why matching is weak.
- **Quick actions really do cost ~29% of the screen.** Measured from the frames: the six tiles occupy
  roughly 875 px of 2992 (≈343 dp), which is the density case for §3.6/§8.4 (336 px → 196 px).
- **The chrome is not free.** Bottom tab bar + gesture area is 2783→2992 = **209 px ≈ 7% of the screen
  height** (≈82 dp). Every layout decision in this proposal has to survive that subtraction.

### 12.5 · What I could NOT get, and one thing I may have caused

- **The onboarding slides and first-run steps were not recorded.** Re-triggering them needs clearing the
  app's data on the owner's live phone. I did not do it. §11.1 is therefore **from source** for those two
  screens and from pixels only for the cold start — and the cold start is not the part the owner is most
  likely describing.
- **No chat capture.** I did not send a message to the assistant, so §5.6's chat mockup is a design
  proposal and not a before/after of a live turn. The assistant itself **is live**: `/api/ai/status`
  returns `{"configured":true,"provider":"deepseek"}` and a real Swahili turn answered in 1.79 s with a
  first-person question back — so §5.6 does **not** overstate a failure state, and the AI-unavailable
  path stays a designed failure path rather than the default.
- **A mixed-language state, possibly caused by me.** The Profile screen rendered in **English**
  (`ACCOUNT`, `Clear offline data`, `DANGER ZONE`, `Delete account`, version 1.6.10) while every other
  screen that session rendered in Swahili, and the tab bar's a11y labels flipped from
  *Nyumbani / CV zangu / …* to *Home / My CVs / …*. **I cannot exclude that one of my tab taps toggled
  it**, so I am recording it as an observation and **not** as a defect.
- **`uiautomator dump` did work** on this build — contrary to the expectation that it returns an empty
  tree on animating screens, it returned 24 labelled nodes with bounds, which is how the tab
  coordinates and the real labels were obtained.

### 12.6 · Sibling work this proposal touches

A sibling agent committed real work the same night. Where it meets these surfaces, the owner should read
one story rather than three:

| Commit | What it is | How it relates |
| --- | --- | --- |
| `b8704a3` | the job picker | the same *Nafasi zote / Zinazoendana* split that §5.3 and §12.3(1) measure on the device |
| `4e6dd51` | the chat spec | §5.6 and §10 both constrain it: the composer must stay instant (D1/§7.5) and any picker it opens must be **variant 1 or 4** of §10.1, not a sixth shape |
| `3b5fa81` | positioning research | the *"sell the outcome, never the mechanism"* line that §5.6's trust line obeys |

None of the three was modified by this proposal, and none of this proposal's files were touched by them
beyond the shared directory.
