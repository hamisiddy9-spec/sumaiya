# Pass 5 — Brand-voice critique (cold read)

## 1. What register is this, and what should it be

This copy is written in two registers stitched together, and the seam shows.

The homepage hero (`home-page-client.tsx`) is in a **plain-spoken, second-person, checkable-claim** register: "No account. No card. Nothing to pay." That register is good — it reads like a person telling you what will happen, not a company describing a category.

Everything else — the root `<title>`, the JSON-LD, the About page, the Play Store listing — is in **US consumer-SaaS growth-marketing register**: "AI Career Platform," "career workspace," "recruiter-friendly," "grounded in your real profile." This is the voice of Rezi, Kickresume, Teal, Novoresume — English-language, subscription, desktop-first resume tools selling to people who already have a job and are optimizing a career, not people applying for their first one. One line in the About mission paragraph ("give everyone the tools that expensive career coaches charge for") tips into a third, unrelated register: NGO/edtech-for-development uplift narrative, the kind of sentence that belongs in a donor report, not a button's neighbor.

JUDGEMENT: for a first-time jobseeker in Tanzania on a cheap phone, the register should be **oral instruction, not product description** — closer to what a competent older cousin who has filled in this same form before would tell you standing next to you. Short imperative sentences, second person, no category nouns ("platform," "workspace," "assistant" as a noun class), no claims that require the reader to already know what "ATS" or "AI" mean. The homepage hero has found this register by accident, in places, under the pressure of an internal "stranger-read pass" (visible in the code comments). The rest of the site was apparently never put through the same pass.

## 2. Lines that fail, with file:line

**`apps/web/app/[locale]/(marketing)/about/page.tsx:68-69`**
> SW: "Hati za kitaalamu, pamoja na msaidizi wa AI"
> EN: "Professional documents, with an AI assistant"

This is the page's own H1, and it leads with the mechanism in the first four words — in direct violation of the product's own house rule ("sell the outcome, never the mechanism").

**`about/page.tsx:72-73`**
> SW: "...muundo unaoidhinishwa na waajiri..."
> EN: "...Sumaiya gives you recruiter-friendly templates... get past the screening software that reads your CV first."

"Employer-approved design" and "get past the screening software" both promise something the product cannot control — no template is approved by any specific employer, and no vendor can guarantee it beats a screening system it has never seen.

**`about/page.tsx:22-25`**
> SW: "Msaidizi wa AI upande wako" / "...kama mshauri wa kazi mfukoni mwako, bila malipo."
> EN: "An AI assistant on your side" / "...like a career coach in your pocket, for free."

Mechanism-first heading again, and "mfukoni mwako" ("in your pocket") is an English idiom transplanted whole — it is not how Swahili reaches for "accessible," it is a translator's calque.

**`about/page.tsx:28-31`**
> SW: "Shinda roboti" — "Beat the robots"

Cute in English pitch-deck slang, meaningless in Swahili: "roboti" reads as literal robots, not applicant-tracking software, so the line requires the reader to already know the English joke it's translating.

**`about/page.tsx:94-95`**
> SW: "...kumpa kila mtu zana ambazo washauri wa kazi hutoza pesa, kwa njia ambayo ni ya haraka, nafuu na inayosaidiwa na AI."
> EN: "...give everyone the tools that expensive career coaches charge for, in a form that's fast, affordable and guided by AI."

Donor-speak ("give everyone the tools that X charges for" is an access/equity pitch, not a product benefit) stacked on mechanism-first ("guided by AI"), and the Swahili is visibly built by translating the English clause order rather than composing a Swahili sentence — "kwa njia ambayo ni..." is not how anyone speaks.

**`apps/web/app/[locale]/layout.tsx:95-96`**
> SW: "Jukwaa la Ajira lenye AI — Tengeneza CV Bila Malipo | Sumaiya"
> EN: "Sumaiya — AI Career Platform: CV, Job Match & Interview Prep"

"Jukwaa" (platform) is a government/NGO-program word, not something a jobseeker searches for or wants to be handed. "Interview Prep" is also a promise the brief's own capability list doesn't clearly back — the product has a "career interview" that *builds a profile*, which is not the same claim as coaching someone for a job interview.

**`layout.tsx:166`**
> "Create ATS-optimized CVs, cover letters, business cards and professional letters with an AI assistant that helps you get hired."

This is the naked one: "helps you get hired" is an outcome promise the product cannot make good on, and it directly contradicts the site's own FAQ answer a few files away — "We cannot promise that an employer will reply; no tool can promise that." The product argues with itself.

**`layout.tsx:185`**
> "Professional document builder with an AI assistant — CVs, cover letters, business cards and formal letters."

Sterile B2B catalog copy — no country, no person, no audience, could describe any SaaS tool anywhere.

**`docs/aso-play-store.md:19`**
> "Sumaiya is your career workspace — not just a CV maker."

"Career workspace" is Notion/Asana vocabulary aimed at professionals who already organize their careers as a system. And the sentence is a defensive negation — arguing against a claim ("just a CV maker") that nobody in the target audience was making, which spends the first sentence of an app description on rebuttal instead of a benefit.

**`docs/aso-play-store.md:26`**
> "AI advice grounded in your real profile — never invented experience"

"Grounded" and "never invented experience" are ML-practitioner shorthand for hallucination-avoidance. A first-time jobseeker has no model of what an AI "inventing experience" would even mean; this line is written for an engineer or a journalist, not the user.

**`docs/aso-play-store.md:38-43`**
The "HOW IT WORKS" paragraph is one long English compound sentence — "Talk to Sumaiya... then help you put together a CV that stands out — designed, written and exported in minutes" — followed, after the whole pitch is made, by a single bolted-on Swahili line: "Bure kuanza. Anza kazi yako leo." This is the clearest evidence in the whole repo that Swahili is being handled as an afterthought translation layer — which directly contradicts the homepage's own claim, three files away, that "Kiswahili si tafsiri iliyowekwa juu ya bidhaa ya Kiingereza" ("Swahili is not a translation layer on top of an English product").

**`CONTEXT-BRIEF.md:72` (sign-in pitch, native)**
> SW: "Kila kitu unachohitaji kupata ajira" + "Msaada wa AI kwa muhtasari na uzoefu"

"Everything you need to get a job" is an unverifiable absolute claim — donor-brochure hyperbole — and the bullet under it is mechanism-first and telegraphic in a way that reads machine-translated rather than spoken.

## 3. Is "AI" doing work in the title surfaces?

Look at the three examples side by side. The **PWA manifest name**, "Sumaiya — CV & Document Builder," contains no "AI" at all, and it is perfectly legible — you know exactly what the app does from six words. That's the control case: it proves the product can identify itself without the word and lose nothing.

The **JSON-LD WebSite description** ("...with an AI assistant that helps you get hired") is a different case, because JSON-LD is never rendered to a human — it is read only by crawlers, and the product's own keyword list (`msaidizi wa CV AI`, `AI CV assistant`) shows there is real search demand for that phrase. So in that one surface, "AI" is arguably doing narrow, real SEO-matching work. But that defense doesn't rescue the sentence — the actual offender in it is "helps you get hired," an outcome promise, not the word "AI." Drop "AI" from that sentence and it's still broken; fix "helps you get hired" and the AI mention becomes harmless regardless of whether it stays.

The **Play Store app name**, "Sumaiya: CV & Career AI," is the one place the word is doing active damage rather than neutral SEO work. A Play Store app name is a scarce 30-character budget, read by a human deciding whether to install something, under a house rule that explicitly says never lead with AI. "Career AI" burns twelve of those characters — nearly half — on a mechanism word that (a) the owner has banned as the lead, (b) appears in hundreds of competing app names so it buys no distinctiveness, and (c) tells a first-time Android user nothing concrete, unlike the manifest name's "CV & Document Builder," which spends the identical budget on comprehension instead. If the manifest name can do without it, the app name — which gets far more scrutiny per impression — can too. Verdict: dead weight in the two surfaces a human reads (H1s, app name, short description); marginal, defensible-but-not-load-bearing in the one surface only a crawler reads.

## 4. What the memorial owes the voice

The name is fixed and cannot be used to sell. Two concrete, checkable rules follow from that:

**Rule 1 — Sumaiya is always the subject of a helping verb, never the object of a selling verb.** She "helps you write," "matches jobs to you," "anakusaidia" — always doing something *for* the reader. She is never something you "get," "build with," or "choose" the way you choose a plan or a feature. Test: could the sentence be said about an actual person standing next to you? "Sumaiya: CV & Career AI" fails this test instantly — no one introduces a sister that way.

**Rule 2 — the name never shares a clause with a price, a feature count, a competitor, or the word "AI."** That single rule alone would have blocked "Sumaiya: CV & Career AI," "Msaidizi wako wa AI," and every SEO-keyword string that turns her name into a searchable product category. A memorial doesn't get comparison-shopped; a product does. Keep those two grammatically separate.

## 5. Three lines for the homepage instead

**Eyebrow**
SW: `BURE, KWENYE SIMU YAKO`
EN: `FREE, ON YOUR PHONE`
*Justification:* a stranger's first two questions are "does this cost me money" and "does this work on my phone" — answering both in four words does more trust work than a demographic label like "FOR JOB SEEKERS."

**H1**
SW: `Andika CV inayomfikia mwajiri.`
EN: `Write the CV that reaches the employer.`
*Justification:* swaps the current relative-clause construction ("CV inayokufikisha...") for a direct imperative verb aimed at the reader ("Andika" — write), which is the spoken register a person uses when telling you what to do next, not a product describing itself.

**Subhead**
SW: `Bandika tangazo la kazi, jaza jina lako — Sumaiya anakusaidia kuandika CV inayolingana nalo. Hakuna akaunti, hakuna malipo.`
EN: `Paste the job advert, fill in your name — Sumaiya helps you write the CV that matches it. No account, no payment.`
*Justification:* keeps Sumaiya as the subject of a helping verb (satisfies Rule 1 above), maps two clauses onto two literal taps the reader is about to make, and ends on the verifiable free/no-account fact rather than a feature adjective.
