# Context brief — Sumaiya rebrand/positioning passes (2026-09-20)

You are one of several independent expert passes. Read this brief, then answer
ONLY your own framing question. Do not write code. Do not invent numbers. If you
need a fact you do not have, write "NO SOURCE FOUND" rather than estimating.

## The product (established by tonight's QA, not a guess)

Sumaiya — https://sumaiya.app. Two clients: a Next.js web app and an **Android APK
that is the real product for cheap phones**. Owned by one person in Tanzania.

Real, working capability set:
- CV builder + export (PDF + DOCX), ~47 templates
- Cover letters
- Business cards
- Formal letters
- A **Tanzanian jobs feed** (watches sources; measured empty on 2026-09-20 —
  `{"success":true,"data":[]}`)
- An **on-device CV check** ("Kagua CV" / ATS-style readability check)
- **Application tracking** (applications list, follow-up nudges)
- **Career interview** (a structured interview that builds a career profile)
- **Learning** (a learning hub / skills the target role needs)
- PDF tools (12 utilities)
- A chat assistant ("Sumaiya")

## The positioning question the owner raised, verbatim

> "research the whole platform all features and think of rebranding system wide
> right now we still lead with ai cv maker i feel so"

So: the product does far more than make CVs, but it still introduces itself as a
CV maker. This brief is about what it should LEAD WITH, system-wide.

## State of the AI claim (verified live by the passes' own author)

- `GET https://sumaiya.app/api/ai/status` → `{"configured":true,"provider":"deepseek"}`
  (fetched 2026-09-20). The product's model provider is **DeepSeek**.
- One earlier committed document in this repo claims AI is "dark in production"
  (`{"configured":false}`). That claim is **stale/incorrect as of this fetch** —
  production reports DeepSeek configured. Treat "the AI is off" as FALSE. But note
  the honest caveat: a configured provider is not proof every AI surface returns
  200 for every user; the passes' author did **not** exhaustively exercise each AI
  route as an authenticated user.
- HARD RULE from the owner: **never name the model provider to users.** Sell the
  OUTCOME, never the mechanism. The word "AI" itself is the mechanism.

## What is currently on the live site (fetched 2026-09-20)

- `<title>` (Swahili) — `Tengeneza CV Bila Malipo — Kwa Kiswahili | Sumaiya`
- `<title>` (English) — `Sumaiya — write a CV that reaches the employer | Sumaiya`
- H1 (Swahili) — `CV inayokufikisha kwa mwajiri.`
- H1 (English) — `The CV that reaches the employer.`
- Subhead (SW) — `Bandika tangazo la kazi. Sumaiya anakusaidia kuandika CV inayolingana nalo, kwa Kiswahili — kwenye simu yako, bila malipo, bila akaunti.`
- Primary CTA (SW) — `Anza CV yako — Bure`
- Reassurance (SW) — `Hakuna akaunti. Hakuna kadi ya benki. Hakuna malipo.`
- Nav items (SW): `Nyumbani · Miundo · Sumaiya · Ajira · Zana za PDF · Kagua CV · Snap-to-Apply`
- JSON-LD WebSite description — `Create ATS-optimized CVs, cover letters, business
  cards and professional letters with an AI assistant that helps you get hired.`
- JSON-LD Organization description — `Professional document builder with an AI
  assistant — CVs, cover letters, business cards and formal letters.`
- PWA manifest name — `Sumaiya — CV & Document Builder`
- About page (live, SW description) — `Sumaiya huwasaidia watafuta-ajira kujenga CV
  za kitaalamu zinazopita vichujio vwa waajiri, barua za maombi, kadi za biashara
  na barua rasmi — kwa dakika, kwa msaidizi wa AI…`
- Play Store listing draft (`docs/aso-play-store.md`): app name
  `Sumaiya: CV & Career AI`; short description `Build an ATS-ready CV, find
  Tanzanian jobs, and get AI career advice.`; opens with
  `Sumaiya is your career workspace — not just a CV maker.`
- Android app (`apps/native/app.json`): `name: Sumaiya`, version 1.6.25
- Native tab bar titles: `Home · My CVs · Sumaiya · Import · Profile`
- Native home screen quick actions: `Career AI`, `Find jobs`, `ATS check`
- Sign-in pitch (SW) — `Kila kitu unachohitaji kupata ajira` + bullet
  `Msaada wa AI kwa muhtasari na uzoefu`

## Non-negotiable rules for this work

1. The name **Sumaiya** is a memorial — the owner's late sister. It is NOT a brand
   asset to optimise. Never propose renaming. Never propose using the memorial to
   sell.
2. **No colour changes and no logo changes.** The palette and the mark are fixed.
3. **Swahili first** for a Tanzania-first product. Every headline you propose must
   be given in Swahili AND English.
4. Sell the OUTCOME, not the mechanism. Do not lead with "AI". Do not name DeepSeek.
5. The audience is a **first-time jobseeker in Tanzania on a cheap Android phone**
   who has likely never paid for a service online. The frame is **Africa**.
6. No invented statistics. Label judgement as judgement.
