# Agent F — CV / AI career tool competitor teardown (2026)

## Western incumbents (price = $/mo unless noted)

| Tool | What it is now | Pricing | Wedge | Top complaint |
|---|---|---|---|---|
| **Teal** | "Job-search OS" — free builder + Kanban tracker + clip-from-40-boards extension + JD match + AI bullets/cover letters + analytics | Free tier real; Teal+ **$13/wk, $29/mo, $79/qtr** (no annual; ~$676/yr weekly) | free tracker = acquisition engine | real writing/matching all behind paywall; AI suggests same phrases regardless of JD; expensive. ~4.1/5 |
| **Rezi** | ATS-format-as-you-type, Rezi Score (section grading), JD keywords, AI writer, 1 free human review/mo, "Rezi Apply" | Free; **Pro $29/mo**; lifetime add-on | "the ATS resume builder," Forbes-endorsed, 4.3M users | "free"-marketing + billing friction; once shipped invisible-keyword-stuffing; generic AI; never applies for you |
| **Kickresume** | GPT-4.1 writer, AI cover letters, ATS checker (20+ tests), 40+ templates, 20k phrases, 1500 examples, site builder | Free (4 templates); **Premium $24/mo, $54/qtr, $96/yr** | design + huge phrase library for blank-page anxiety | AI writer Premium-only; hallucination; complex templates break ATS parse. 4.2/5 |
| **Enhancv** | Design-forward, real-time content coach that scores + nudges specificity, AI rewrite, ATS check | **Pro $19.99/mo, $39.99/qtr**, + **$24.99 weekly auto-renew trial**; PDF only, no Word | personality + polish + hands-on coaching (creative/senior) | expensive; no Word export; free-tier watermark; billing complaints |
| **Resume.io** | 30+ recruiter-tested templates, Recruiter-AI, cover letters, basic tracker, lossless template swap | **$2.95 7-day trial → $29.95/4wks**; $49.95/qtr; $75/yr | scale + SEO, 55k Trustpilot @ 4.3 | dark-pattern trial: surprise charges, no receipts, hard cancel |
| **Careerflow.ai** | **LinkedIn Profile Optimizer** (hero), AI resume + ATS score + LinkedIn→resume, cover letters, CRM tracker, networking tracker, AI mock interview, extension + autofill | Free ($0: 1 resume, 10 jobs); **Premium $23.99/mo (~$14.41 annual); Plus $44.99/mo** | LinkedIn optimization as front door | bugs in paid LinkedIn optimizer; generic on specialized roles; free tier too thin |
| **Huntr** | Best-crafted Kanban tracker + Job Clipper (4.8★), map view, contacts, autofill, AI resume gen + tailoring, scoring | Free (~100 jobs); **Pro $40/mo**, $90/qtr, $160/biannual | the benchmark pure tracker | autofill hit-or-miss; **$40/mo highest tracker price**; never applies |
| **Simplify** | Copilot extension: free **unlimited** autofill + tracking; **Simplify+ $39.99/mo** adds AI answers + deeper tailoring | free core unlimited | best free autofill, 500k users, 4.9★ Chrome | autofill **Workday ~70%, Taleo ~40%**; Simplify+ no trial/refund; privacy policy 5yr stale; Trustpilot 3.0 |
| **Jobscan** | Match rate + missing keywords, only tool tuned to **named ATSs** (Workday/Greenhouse/Taleo/iCIMS), format flags, 1-click AI optimize, LinkedIn optimizer, builder, tracker; added semantic matching 2025-26 | Free = **5 scans/mo**; **$49.95/mo, $29.98/mo qtr** | "we know how real ATSs work" | pricey for "feedback"; hiring managers dispute the model; charges-after-cancel |
| **Final Round AI** | Real-time interview Copilot (live transcription + suggested answers ~1–1.5s lag), "Stealth Mode," AI mock interviews, accent-tuned ASR | trial only; **$149/mo, $299/qtr, $500/yr** — most expensive in category | "win the live interview" | Copilot freezes mid-interview; auto-renew complaints; **detection → rescinded offers** |

## 2025–26 AI-native breakouts
- **Jobright.ai** — AI sources + tailors + (beta) auto-submits. Turbo **~$39.99/mo** (raised from $29.99), ~$17.99/wk, ~$20/mo annual. Good tech-role matching; complaints: auto-apply "beta," routes through aggregators not company ATS, invented resume details, ghost listings.
- **AIApply / LazyApply / JobCopilot / FlashFire / LoopCV** — high-volume auto-apply. Category rep: spray-and-pray, low reply quality, ToS-risky. "Score-fit-then-apply-only-if-confident" is the defensible version.
- **Cluely** (ex-Columbia, "Cheat on Everything") — $5.3M seed → **$15M a16z Series A @ $120M** June 2025, ~$5M ARR in 3mo, repositioned to neutral "meeting assistant." Signal: undisclosed real-time assist is VC-fundable but not enterprise-defensible; expect detection + backlash.

## Africa / emerging-market players (the important ones)
- **Careergo** (careergo.co) — AI ATS resume + cover letter, localised KE/UG/MW/ZA. **~KES 30 (~$0.20) via M-Pesa for 1 HOUR of full access**; pay-per-use in KES/UGX/TZS/RWF via M-Pesa/Airtel/MTN. **Closest existing analogue to Sumaiya's idea.**
- **SwiftKazi** (swiftkazi.co.ke) — AI scans 34+ boards q6h, ATS-optimises CV, writes cover letters, **auto-applies at KES 60 (~$0.45)/application via M-Pesa, no subscription** — "pay only when you apply."
- **Fuzu** (Finnish-owned; KE/UG/NG) — matching + guidance + skills assessments + learning; Fuzu Pro sub for seekers; **2025: first white-label EU deployment → pivoting to B2B/employer SaaS, away from consumer.**
- **BrighterMonday** (KE, Ringier/African Talent Co) — mainstream board + added AI ("generated my CV, cover letter and negotiated salary scale"). Free to seekers, monetises employers.
- **MyJobMag** (NG + KE) — board + free CV builder + training + advice; all seeker services free, employer-funded.
- **Mintor** (Cape Town, WhatsApp-native recruitment, SAB Foundation) — **300k+ people into work, ~90% lower cost-to-apply, up to 10× recruitment rate.** Employer-paid, English.
- **CareerLead AI** (Ghana) — AI career guidance for West Africa.
- Adjacent WhatsApp-workforce funding: **Jem (SA) $8.4M Series A (Quona)**; AskMandla formalising domestic work via WhatsApp. 96%+ SA smartphone users on WhatsApp.
- **India pattern**: ResumeGyani (₹299/7 days, tuned to Naukri's ATS, 100k+ users), Resumly.in, StylingCV ("11 AI agents," 60-sec resume), Rojgar Suvidha (free, govt-exam). = hyper-local ATS tuning + rupee micro-pricing + campus-placement framing.

## Synthesis

### Table-stakes (can't launch without)
1. ATS-safe builder — single-column, parseable, **PDF + Word**, multi-version
2. JD↔resume match score + missing keywords (now w/ synonym/semantic, not just exact)
3. JD-aware AI bullet + summary writer + cover-letter generator
4. Job tracker (Kanban/list) + clip-from-any-board capture
5. One-click autofill for standard web forms
Fast-becoming-expected: LinkedIn optimizer, section-graded resume score, mock-interview practice

### The openings (nobody does these well)
1. **Tailoring that's actually specific** — every incumbent injects generic phrases + invents facts. Tailor *only from real history*, visibly refuse to fabricate. **= exactly Sumaiya's anti-fabrication/provenance layer.**
2. **Autofill that survives Workday/Taleo/iCIMS** — Simplify drops to 40–70% there. Whoever nails enterprise-ATS completion wins "apply."
3. **Outcome accountability** — nobody ties price to getting hired; all $29–$150/mo + "never applies / never gets you the interview" + dark-pattern billing. Pay-per-outcome / pay-per-application is a clean contrast (SwiftKazi KES 60, Careergo KES 30).
4. **Non-desktop, non-English, low-data delivery** — every incumbent is a desktop web app + Chrome extension in English. Nobody serious does WhatsApp-native building, voice input, sub-$1 mobile-money pricing. Mintor proves the demand (300k) but is employer-side + English.
5. **Local ATS + local format truth** — ResumeGyani's whole wedge is "tuned to Naukri." Nobody's done "tuned to BrighterMonday / Fuzu / MyJobMag / Kenyan PSC forms."

### Pricing reality
- Western tools $19–49/mo w/ weekly-billing dark patterns; effective ARPU inflated by forgot-to-cancel.
- Africa/India: **free (employer-funded) OR micro-transaction — KES 30–60 (~$0.20–0.45)/action via M-Pesa/Airtel/MTN, no subscription.**
- EA seekers won't hold a $29/mo card sub; card penetration low. Viable shapes: (1) free to seeker, employers/partners pay (Mintor, BrighterMonday, Fuzu-for-employers, Ajira/Mastercard-Foundation grants); (2) M-Pesa micro-payments per outcome (KES 20–50 tailored CV, KES 50–100 per submitted application, airtime top-ups); (3) hybrid: free CV, pay to apply / pay for WhatsApp coaching. **Avoid recurring subscriptions as the primary model.**

### Copy vs do differently (Swahili-first, WhatsApp, get-hired)
**Copy:** the table-stakes engine; Teal's free-tracker-as-acquisition; Jobscan's named-ATS specificity (pointed at BrighterMonday/Fuzu/MyJobMag + Workday for Nairobi multinationals/NGOs); Careerflow's LinkedIn optimizer (matters for NGO/corporate/remote); SwiftKazi/Careergo M-Pesa pay-per-action; mock interview as WhatsApp voice-note Q&A.
**Differently:** WhatsApp-first (voice notes + doc delivery), not a Chrome extension; Swahili-first UX + coaching, output CV in English (translation + register-shift is a real feature); **anti-fabrication as the headline** ("haitaongeza uwongo kwenye CV yako") — straight at Rezi/Jobright's invented-bullets rep; **no subscriptions**, KES micro-payments + employer/partner-funded free access (Ajira Digital, county govts, Mastercard Foundation, TVET); **outcome not documents** as the North Star — close the loop, feed reply data back into tailoring; **local job supply built in** (ingest BrighterMonday/MyJobMag/Fuzu/Ajira/LinkedIn → find→tailor→apply in one WhatsApp thread); low-data/low-end discipline (server-side PDF, assume 2G + KES 20 bundle); **skip** undisclosed real-time interview copilots (detection risk, wrong for a get-hired-with-integrity brand).
