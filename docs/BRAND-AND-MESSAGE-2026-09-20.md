# Sumaiya — what it is, and what the landing page must say

**Date:** 2026-09-20 · **Repo:** `C:\Users\hamis\projects\sumaiya` (`main`) · **Live:** https://sumaiya.app
**Brief, verbatim:** *"focus on africa and rethink the whole branding ang landing page message like whats is
sumaiya research with claude"*

**Method.** Four headless Claude CLI research passes, run sequentially, each writing its own file with a
required-citation instruction and an explicit "write NO SOURCE FOUND rather than estimating a number" rule:

| Pass | Question | Output | Bytes |
|---|---|---|---|
| A | The African career/jobtech market in 2026 — who serves it, what they do badly, where an offline-first Swahili-first product fits | `docs/research/brand-2026-09-20/pass-a-market.out.md` | 26,902 |
| B | How best-in-class products answer "what are you?" in one line — the *structure*, not the tone | `docs/research/brand-2026-09-20/pass-b-structure.out.md` | 20,790 |
| C | The current landing page read cold, as a 24-year-old in Dar es Salaam | `docs/research/brand-2026-09-20/pass-c-stranger-read.out.md` | 10,091 |
| D | African-market brand voice; and how a memorial should shape a voice | `docs/research/brand-2026-09-20/pass-d-voice.out.md` | 29,020 |

Prompts are committed beside the outputs as `pass-*.md`. Everything below that comes from those four files
carries the source URL they cite. Everything that is my reasoning is labelled **JUDGEMENT**. Anything I could
not establish is labelled **UNVERIFIED** and collected in §8 rather than smoothed over.

**One process note, recorded because it cost time:** the first launch ran all four passes concurrently. Claude
Code's OAuth token was mid-refresh at that moment and all four processes raced the same credential lock; three
died and one wrote a 401 to its output file. Re-run **sequentially**, all four exited 0 with the byte counts
above. Any future multi-pass Claude dispatch in this repo should be sequential, and every output file must be
checked for the string `Failed to authenticate` before it is treated as research.

---

## 1 · WHAT SUMAIYA IS

### The sentence a person could repeat to a friend

> **SW:** *Sumaiya ni msaidizi wa kazi kwenye simu yako — anakusaidia kuandika CV inayofaa kazi unayoomba na
> kuituma, kwa Kiswahili, bure.*
>
> **EN:** *Sumaiya is a career helper on your phone — it helps you write a CV that fits the job you're
> applying for, and get it sent, in Swahili, for free.*

Note what that sentence does *not* contain: no "AI", no "platform", no "ATS", no "empower", no template count,
no user count. It names a helper, a phone, a CV, a real job advert, Swahili, and free. Seven ideas a stranger
can repeat without paraphrasing.

### The same answer at three lengths

| Length | Swahili (first) | English |
|---|---|---|
| **One word** | **Msaidizi.** | **Assistant.** |
| **One line** | **CV inayokufikisha kwa mwajiri.** | **The CV that reaches the employer.** |
| **One paragraph** | Sumaiya ni msaidizi wa kazi kwenye simu yako. Unaanza na tangazo halisi la kazi: unaandika CV yako, Sumaiya anaipanga ili ilingane na tangazo hilo, unaipakua kama PDF, na kuituma. Kila kitu kwa Kiswahili, bure, na hakuna akaunti inayohitajika kabla ya kupata faili lako. | Sumaiya is a career helper on your phone. You start from a real job advert: you write your CV, Sumaiya shapes it to match that advert, you download it as a PDF, and you send it. All of it in Swahili, all of it free, and no account is required before you have your file. |

**The one-word answer is a compression, not the answer.** Swahili has no single word for "career helper", and
`msaidizi` alone tells a stranger nothing about the job market. It is included because the brief asked for it,
and because it is the honest shortest true label — but the **one-line answer is the one that ships**, on the
hero, on the app-store listing and in the WhatsApp forward. **JUDGEMENT.**

---

## 2 · WHAT IT IS NOT

The current docs are muddled about this, and the muddle is visible on the live page. These are exclusions, not
nuances — each one is a real thing the product is currently mistaken for, with the evidence:

| Sumaiya is NOT | Why this needs saying | Evidence |
|---|---|---|
| **Not an ATS tool.** | The homepage currently ships a trust row reading *"Passes employer screening (ATS)"*, a FAQ question *"Are your CVs ATS-friendly?"*, and a nav item whose Swahili label is literally *"Kagua ATS"* — while the product's own hard rule is to sell the outcome and never the mechanism in Swahili. | `apps/web/app/[locale]/(marketing)/home-page-client.tsx:558` (before this change); `docs/PRODUCT-DIRECTION-2026-09-20.md` §4.3 records 11 further live Swahili "ATS" occurrences |
| **Not a job board.** | The jobs feed is `{"success":true,"data":[]}` — measured empty, twice, on 2026-09-20 (`docs/PRODUCT-DIRECTION-2026-09-20.md` §1.2 step 8). A product with zero rows cannot sell browsing. The honest floor: it *watches* sources and it helps you *apply*, and it says so. | same document, §1.2 D5; pass A confirms the incumbent (Zoom Tanzania) inherited BrighterMonday Tanzania's listings and carries 10,000+ — a scale fight we cannot win by out-listing |
| **Not "AI".** | "AI" is currently in the eyebrow pill, the subhead, the hero CTA and the page title. Pass B: of ten best-in-class homepages, **none** uses AI as its category noun — Grammarly says "AI partner", Notion says "AI built for your team", Linear says "designed for the AI era" — AI is a modifier, never the answer to "what are you?" And the AI is **dark in production**: `curl /api/ai/status` → `{"configured":false,"provider":null}` (live, 2026-09-20). | pass B §7 ("No claim of being 'an AI platform'"); live probe |
| **Not a TemplateHub feature.** | `docs/DECISIONS.md` D1 is unambiguous: *"Sumaiya is fully independent. No TemplateHub integration."* The integration never ran in production and cost three duplicated fixes. | `docs/DECISIONS.md` D1–D3 |
| **Not a document factory.** | Four document types (CV, cover letter, business card, formal letter) plus twelve PDF utilities are on the homepage. A business card is not a job outcome. Leading with the document catalogue is how the page became generic. | pass C §5: `Kadi za Biashara` and `Zana zote za PDF` are flagged as concepts the target reader has no use for |
| **Not a CV-writing agency.** | The real competitor in Tanzania is a human writer at **TZS 24,000–180,000** per CV (Mabumbe TZS 30,000–180,000; MyDreamCV TZS 24,000–200,000). Sumaiya is not cheaper *human writing* — it is a tool the person keeps. | pass A §1; `docs/RESEARCH-2026-09-20.md` §1b |
| **Not a payments product (yet).** | `PAYMENTS_ENABLED = false` and the file is explicit that this was a **removal, not a pause**. The homepage currently advertises *"48-hour money-back guarantee · Cancel anytime"* on a free product — a claim with no product behind it. | `apps/web/lib/features.ts:8`; `docs/PRODUCT-DIRECTION-2026-09-20.md` §5 |
| **Not a Gulf relocation service.** | See §5. Degree attestation is a 4–8 week paper process; software cannot finish that journey. | pass A §1c; `docs/RESEARCH-2026-09-20.md` §1c |

---

## 3 · WHO IT IS FOR

> **Swahili first, because that is the reader.**

**Neema, 24. She lives in Mwanza and is saving to move to Dar es Salaam.** She finished a diploma at a VETA
college in 2024 — office administration, a certificate she is proud of. She has never had a job with a
contract. She has done four months at a shop in the market and helped her uncle keep records for his
hardware business, and she would not think to put either on a CV because nobody told her they count.

**What she has**

- An Android phone worth roughly TZS 250,000. **41.8% of Tanzanian phone owners had a smartphone in December
  2025** — she is in that minority, and she knows her phone is her whole connection to formal work
  (TCRA via TanzaniaInvest Q4 2025, cited in pass A §5).
- A prepaid bundle. **Average Tanzanian mobile data consumption is 1.6 GB per month (~55 MB/day)**, against
  Kenya's 14.6 GB in the same period — roughly a tenth (The Chanzo, 15 May 2026, citing TCRA Q2 2025, cited
  in pass A §5).
- WhatsApp, and several "jobs" groups on it. She reads them every morning. Some of them are scams: Tanzanian
  police and TCRA arrested two people in Iringa in April 2026 over a syndicate that took TZS 600,000–4,000,000
  each from 75 young people in fake "registration fees" (The Citizen, cited in pass A §4).
- A CV a cousin typed for her two years ago in Word. She cannot open it properly on her phone, and she does
  not know if it is any good.
- Spoken Swahili as her confident language, and school English she reads slowly.

**What she does not have**

- A laptop, a printer, or a bank card.
- A LinkedIn profile worth having — and it would not help: **LinkedIn reach in Tanzania is 1.70 million
  members, 2.4% of the population, or 4.7% of adults** — the lowest of Tanzania, Kenya, Nigeria and Ghana
  (DataReportal Digital 2026: Tanzania, cited in pass A §2).
- Data to spare for a page that shows her video, or for a download she has to repeat.
- Any reason to believe a website is for her. Every CV example she has ever been shown — this product's
  included — has a Nairobi phone number on it.

**JUDGEMENT:** she is often *employed and searching*, not unemployed and searching. ILO-modelled Tanzanian
youth unemployment is 2.38% for 2025 because most Tanzanian work is informal
(`docs/PRODUCT-DIRECTION-2026-09-20.md` §1.3). So the product must be worth opening both by the person who
wants a *different* job and by the person who has never had one. A page written only for "the unemployed"
misses most of its own market.

**What is measurable about the market, and what is not.** Data cost is measured: 1 GB out-of-bundle cost
**40.1% of average monthly income**, or 8.8–9.3% at discounted bundle rates — and **63.6% for a rural woman**
(The Chanzo, 15 May 2026, cited in pass A §5). Handset cost, not data cost, is the single biggest barrier to
mobile internet adoption in Sub-Saharan Africa — **44% of monthly income for the poorest 20%, rising to 76% in
Sub-Saharan Africa** (GSMA, cited in pass A §5). What is **UNVERIFIED**: no source found measuring how much
Tanzanians spend on data specifically while job-hunting, and no Tanzanian study of job-search behaviour on
WhatsApp — pass A searched for both and reported *no study found* rather than substituting a neighbouring
market's numbers.

---

## 4 · THE PROMISE

**The outcome, stated as an outcome:**

> **SW:** *Utatoka na CV inayofaa kazi unayoomba — na faili lako mkononi mwako, bila kulipa kitu.*
>
> **EN:** *You will walk away with a CV that fits the job you're applying for — and your file in your hand,
> without paying anything.*

Three things make that honest, and each is a thing the product can actually demonstrate today:

1. **A real CV.** Not a preview, not a watermark, not a template picture. A finished document with her name
   in it.
2. **A real PDF she owns.** Generated in the browser on her own phone, so it does not need the network to
   produce, and it is not held hostage behind a card or an account.
3. **Shaped to a real advert.** She pastes the actual job advert; the CV is oriented to that advert.
   `POST /api/ai/tailor-cv` and the deterministic coverage/gap engine behind it (`lib/job-match.ts`,
   24 tests; `lib/targeted-cv.ts`, 13) are where this comes from.

**What the promise must NOT say.** No "get hired", no "callbacks in two weeks", no "passes" as a guarantee.
`Inapita vichujio vya waajiri` currently states a certainty no CV tool on earth can back — it is a claim that
becomes a lie the first time she does not hear back, and she is applying in a market where silence is the norm.
The honest form names the *work*: a CV that is readable, complete, and aimed at that advert. That is a thing
we control. Whether an employer replies is not.

**And the reason it can be free, said plainly on the page:** payments are off (`PAYMENTS_ENABLED = false`).
The footer already says *"Bure kwa sasa — hakuna malipo."* That is the honest version and the landing page
should match it (§7, the FAQ).

---

## 5 · THE AFRICA FRAME

### What the existing docs say, and the conflict I am flagging rather than resolving

Two committed documents lean on the Gulf:

- `docs/RESEARCH-2026-09-20.md` §1c treats Gulf platforms (Bayt, Naukrigulf, GulfTalent, Dubizzle, Tanqeeb)
  as **Tier C — "the stated expansion"**, and §4 item 5 says Gulf compliance fields should be built "only when
  there is a real Gulf employer relationship".
- `docs/PHOTO-CAPTURE-SPEC-2026-09-20.md:172` heads a section **"1.5 The Gulf — where the photo is expected
  (the growth path)"** and builds the photo-capture feature around a Gulf CV convention (a professional
  headshot being standard in GCC markets).

**The conflict, stated plainly: the photo spec calls the Gulf "the growth path"; this brief makes Africa the
frame. Those are two different roadmaps and the owner should decide which one binds.** I am not rewriting
either document — one is another agent's **historical record of what was measured**, and the other is an
active spec whose photo-capture decision has already shipped on native. Silently reversing them would destroy
evidence. Instead, here is what actually changes and what does not:

| | Changes | Does NOT change |
|---|---|---|
| **Landing page** | The hero, the eyebrow, the proof section and the FAQ frame Tanzania first and name East Africa and Africa as the direction. "Everywhere in the world" as a claim goes. | The product still works for anyone; the templates, the Gulf-friendly layouts and the international formats stay exactly as they are |
| **The photo feature** | Nothing is removed. The photo stays optional, and the note that it is never required stays. | `docs/PHOTO-CAPTURE-SPEC-2026-09-20.md` is **not** edited — it is a record of a real Gulf convention and it remains true |
| **Where effort goes** | Africa-first ordering: Tanzanian persona in the examples, Swahili depth, offline honesty, WhatsApp-shaped re-engagement | The reason the Gulf was deprioritised does not change — degree attestation is a **4–8 week paper process** (home notarisation → home MOFA → UAE embassy → in-UAE MOFA) that no software completes. That argument holds whether or not Africa is the frame |
| **Payments** | Unchanged. Mobile money, when it comes, is M-Pesa/Tigo Pesa/Airtel Money — a rail that serves Africa. Stripe cannot charge TZS and cannot charge these markets at all | The deferral itself is untouched |

**The one thing that does change and should be recorded as a decision:** if Africa is the frame, then **the
photo expectation is a Gulf-specific requirement and must never harden into a product default.** The spec
already says this ("Gulf countries often expect one, but it is never required of you"). Africa-first makes that
sentence load-bearing rather than courteous. **JUDGEMENT**, flagged for the owner.

### Africa is a continent, not a market — the order, and the guess

Ranked by evidence, not enthusiasm:

1. **Tanzania — first, and this is not a guess.** It is the home market, Swahili is the product's primary
   language, and the evidence says it is the least-served of the four countries examined: LinkedIn reach
   **4.7% of adults** (lowest measured), **1.6 GB/month** average data consumption against Kenya's 14.6 GB,
   **41.8%** smartphone penetration among phone owners. Pass A's own conclusion: *"a large share of the
   addressable market has never been served in its working language by any existing tool."* The strongest
   incumbents are weaker here than in any neighbouring market — BrighterMonday Tanzania **shut down on 30
   November 2020** and its domain now 301s to an unrelated company (techmoran.com, 20 Nov 2020; re-confirmed
   live in `docs/RESEARCH-2026-09-20.md`).
2. **Kenya — second.** Largest East African formal-job market, Swahili is spoken, existing job boards are live
   and monetised (BrighterMonday Kenya's AI bundle at KES 390/week). **The caveat that decides the work:**
   Kenyan Swahili is not Tanzanian Swahili, and pass A found that Swahili content from Kenyan platforms skews
   to English with Swahili blog posts rather than a Swahili product. **JUDGEMENT:** Kenya needs a register
   decision (Kenyan Swahili mixes English and Sheng) before it needs a landing page. Do not assume the current
   string set transfers.
3. **Uganda — third.** Swahili reaches it, the market is smaller, and no source I have separates it from
   Kenya on any axis I measured. **This ranking is close to a guess.**
4. **Nigeria and Ghana — later, and they are not Swahili markets at all.** Both have large, well-funded,
   English-first incumbents: Jobberman (Nigeria/Ghana, ROAM Africa/TATC, 2.4M trained and 600,000+ placements
   claimed in Nigeria with Mastercard Foundation), MyJobMag (Nigeria-only, claims 1M+ monthly uniques). Going
   there means competing in English on someone else's home ground with none of the Swahili advantage.
   **JUDGEMENT: do not lead with them. They are a different product decision, not a translation.**

**What I am plainly guessing, and what would settle it.** The order after Tanzania is a **guess** built from
language reach and payment rails, not from measured demand. Nothing in the four passes measures how many
Tanzanians would pay, or which country converts. The cheapest thing that would replace the guess: the
`app_event`/`outcome_event` tables already in the schema (`lib/db/schema.ts:652`, `:457`) recording where
first sessions and signed-up users actually come from — currently unqueried by me (no production DB access).
**UNVERIFIED and stated as such.**

**One thing Africa-first requires that the current page gets wrong.** Pass C's single strongest finding: the
sample CV on the hero, the template gallery and the product grid is a **Kenyan software engineer** — "Amara
Osei", "Nairobi, Kenya", `+254 722 987 654`, "University of Nairobi", "1M+ users worldwide". A Tanzanian
reader's conclusion, in pass C's words: *"hii app ni ya Kenya, sio ya kwangu."* An Africa frame that keeps
Kenyan sample data is not an Africa frame. Fixed in §6/Part 3.

---

## 6 · THE NAME AND THE VOICE

**Sumaiya is named for the owner's late sister. The product is a memorial.** This is not positioning, and it
must never be treated as brand material to be optimised. It is the fact that explains why the product exists.

### What the research says

Pass D went looking for how other products carry a deceased person's name, and found the disclosure level
tracks one thing — **whether the name itself is personal**:

- **mDoc (Nigeria)** — founded by Nneka Mobisson after her father died of a preventable stroke. The company
  name is *not* personal; the chatbot is named "Kem" (Igbo, "my own"). The grief story appears in a
  third-party profile, **not** on mDoc's own homepage, About page or app-store copy.
- **Charlotte's Web** — the product is literally named for a real child. Disclosure there is maximal and
  repeated, because the name demands an explanation the moment anyone asks "why is it called that?"

**And the consensus check came back negative, which I am reporting rather than papering over:** *no*
professional standard exists for disclosing personal tragedy in consumer brand copy. What exists is a small
number of individually argued pieces that agree in direction — grief should not become a funnel, restraint
over exploitation — and none of them addresses this exact case (a naming decision already made, not an
ongoing grief campaign). Pass D also found **no documented case** of a product named for a deceased relative
that chose to say nothing publicly. **That gap is real.**

### What this means for the voice — the enforceable rules

Restraint is not a mood, it is a set of things you can check. These are the rules, and they apply to every
surface, not only the landing page:

1. **Never use the name to sell.** No "named in memory of" near a CTA, no founder's-grief paragraph above the
   fold, no campaign tying her to a conversion event. Pass D's test, adopted verbatim: *would this sentence
   read the same if the product had no personal history at all?* If a line only works because the reader knows
   about the sister, it is leaning on the memorial instead of earning its place.
2. **Never promise an outcome on her behalf.** No "she would have wanted...", no "in her honour, we will get
   10,000 people hired". The product's claims must stand on their own evidence.
3. **No claim of "changing lives" or "transforming futures".** This is also independently the donor-register
   that fails in this market — pass D lists *empowering, leveraging, unlocking potential, bridging the divide,
   journey, ecosystem, beneficiary, impact* (as a noun applied to a person) as donor-facing vocabulary that no
   working consumer product in the sample uses on its offer copy. Flutterwave's own homepage —
   *"Empowering businesses of all sizes with seamless payment solutions tailored for enterprises, startups, and
   emerging markets"* — is the quoted example of all three red-flag words in one sentence.
4. **Never flippant, never cute, and never jokey — especially under failure.** This is the most concrete link
   between "memorial" and "voice": a product named for someone must not sound flippant in its worst moments.
   No "Oops!", no exclamation marks, no apology theatre. An error says what happened and what to do next.
5. **Celebrate the user's outcome, not the product's role in it.** *"Umepata usaili"* beats *"Tunajivunia
   kukusaidia kufika hapa."* The moment a person gets hired is the closest the product comes to the register a
   memorial implies — and the rule there is still: it is about them.
6. **Plain, warm, spoken Swahili over officialese.** Consistent with `docs/SWAHILI-STANDARD-2026-09-20.md` §4:
   neutral register, second person, plain imperatives. Pass D's finding matches: where real Swahili appears in
   African consumer products it is **short and everyday** — *Lipa Pole Pole* (Sun King Tanzania) — while longer
   formal Swahili (*huduma bunifu*, *kugusa maisha*) shows up in executive press quotes, not in copy aimed at
   users.
7. **Consistency is the dignity.** A solemn About page next to hype-toned CTAs reads as *more* exploitative
   than either register alone. The same plainness must hold on the error state, the FAQ and the marketing page.

### Does it belong on the landing page? My recommendation: **no — and here is the exact wording for where it does belong**

**Recommendation (for the owner to accept, edit or reject — he is the only person who can decide this).**
Keep it **off the homepage**, and put it on the **About page, one click away, named plainly, disclosed briefly,
not decorated.** Reasoning:

- The homepage's job is transactional: what does this do, what does it cost, how fast. Pass D found that is
  what every winning consumer page in this market does — and that African products which use donor/impact
  language keep it **segregated from the transactional copy**, not blended into it.
- The name invites the question (this is the Charlotte's Web case, not the mDoc case), so *fully* unstated
  looks evasive to anyone who searches. The right level is not silence — it is **quiet, one-click
  availability**: present for whoever looks, absent from whoever does not.
- Nobody should have to participate in the founder's mourning in order to look for a job.

**Proposed wording for the About page** (Swahili first, English second — both mine, both needing the owner's
correction):

> **SW:** *Sumaiya amepewa jina la Sumaiya, dada yangu. Alikuwa mtu wa kuwajali wengine na kuwafungulia watu
> milango — na hii ni kazi ya kufungua milango. Hii ni bidhaa ya ajira kwa watu wanaotafuta kazi Tanzania.
> Tunatumaini inalistahi jina lake.*
>
> **EN:** *Sumaiya is named for Sumaiya, my sister. She was someone who cared for other people and opened doors
> for them — and this is work that opens doors. It is a jobs product for people looking for work in Tanzania.
> We hope it does her name credit.*

**Deliberately absent from that wording:** the cause of death, the dates, a eulogy, a photo, any religious
framing, and any link to an action. It is four sentences and it stops. **Two things only the owner can decide:**
(a) whether "dada yangu" / "my sister" is the register he wants publicly, and (b) whether a name and a line is
already enough, in which case the About page should carry nothing at all. I am not the right person to settle
how a family's grief is worded, and a non-native speaker is not the right person to settle its Swahili.

---

## 7 · MESSAGE HIERARCHY

**Swahili first. Every string below exists in both languages and the two must stay in parity
(`apps/web/lib/i18n/translations.test.ts` fails if a key exists in one and not the other).**

### In 5 seconds — the hero

What the visitor must understand: *this is for me, it makes a CV, it is in Swahili, it is free, and I do not
have to sign up first.*

| Slot | Swahili (first) | English |
|---|---|---|
| Eyebrow | `KWA WATAFUTA KAZI — TANZANIA` | `FOR JOB SEEKERS — TANZANIA` |
| **H1** | **`CV inayokufikisha kwa mwajiri.`** | **`The CV that reaches the employer.`** |
| Subhead | `Bandika tangazo la kazi. Sumaiya anakusaidia kuandika CV inayolingana nalo, kwa Kiswahili — kwenye simu yako, bila malipo, bila akaunti.` | `Paste the job advert. Sumaiya helps you write the CV that matches it, in Swahili — on your phone, free, with no account.` |
| Primary CTA | `Anza CV yako — Bure` | `Start your CV — free` |
| Secondary CTA | `Ona jinsi inavyofanya kazi` | `See how it works` |
| Reassurance | `Hakuna akaunti. Hakuna kadi ya benki. Hakuna malipo.` | `No account. No card. Nothing to pay.` |

**JUDGEMENT, and it is the one structural change I would defend hardest:** the primary CTA moves off
`/assistant` and onto the guest CV editor (`/editor/cv/try`). Today "Anza na Sumaiya — Bure" is the biggest
button on the page and it lands on a chat whose model is off in production (`{"configured":false}`) and which
returns 401 to a guest. The product's own non-negotiable is that a guest finishes and downloads a CV before
being asked for anything. The primary action should be the thing that can be proven today. The assistant stays
on the page as a named secondary — Sumaiya is still the product's character, she is just not the strongest
*first tap* while her model is dark.

### In 15 seconds — the three things that decide it

| # | Question in her head | What the page answers | Swahili (first) |
|---|---|---|---|
| 1 | "Will it work on my phone, with my bundle?" | It is built for a phone, nothing to install, and the PDF is made on the device | `Inafanya kazi kwenye simu ya kawaida` + the made-on-your-phone explainer |
| 2 | "Will this cost me money?" | Free, no card, payments are off — stated as a fact about today, not a discount | `Bure. Hakuna kadi. Malipo hayajawashwa.` |
| 3 | "Will it understand my Swahili and my situation?" | Swahili is the default, and the example CV is a Tanzanian one | `Kiswahili ni lugha ya kwanza hapa` + the Tanzanian sample |

Then, in order: **how it works in three steps** → **the honest proof** → **the FAQ**.

### In 1 minute — the full page, in reading order

1. **Hero** (§7, 5 seconds above).
2. **Jinsi inavyofanya kazi** — three steps: paste the advert, write/confirm your details, download the PDF.
   Kept, because pass C ranked it the second-most honest section on the page and the only one it did not
   criticise.
3. **Kwenye simu yako** — the phone-first and offline section. This is **new, and it is the biggest absence on
   the current page**: pass C's §6 lists "works without internet" as the first thing a prepaid-data user wants
   to know and the page never says it. It must be stated with the honest limit (see below).
4. **Ushahidi** — the proof band, replacing the testimonials. Three claims, all verifiable by the visitor in
   the first minute (see below).
5. **Unachoweza kutengeneza** — the document set, demoted and rewritten so each card names an outcome, not a
   count.
6. **Muonekano wa CV** — the template gallery with a **Tanzanian** sample.
7. **Zana za PDF** — kept but demoted below the offer, with one line explaining why a CV product has PDF tools
   at all. **JUDGEMENT:** pass C says delete this band from the homepage. I kept it, because it is the only
   internal link hub to twelve tool pages and deleting it discards search equity. **Owner's call.**
8. **CTA band.**
9. **FAQ** — pass C ranked the FAQ the single best trust-building section on the page. Expanded, not trimmed.

**Deleted outright:** the testimonials band (three fabricated quotes under a heading that asserts they are
real — `lib/testimonials.ts` already carries a warning that said exactly this), the "48-hour money-back
guarantee · Cancel anytime" line (there is nothing to buy), and the word "ATS" from every Swahili string.

### The honest limits this page must state, and the ones it must not claim

**It may say:** free, no account to download, in Swahili, nothing to install, the PDF is produced on your own
phone, and your draft is saved on your own device. All five are true of the web product today.

**It must NOT say "works offline" as a flat claim.** The reason is measured, not cautious:
`docs/FEATURE-INVENTORY.md` §5 records that the on-device offline path has **never been tested in airplane
mode**, and the native app currently has **no guest mode** (`root-navigator.tsx:245` gates everything behind
sign-in), so an "offline-first, works without internet" headline on a page that sends people to an app that
asks for an account first would be the loudest false claim on the site. The page therefore says what is
provable — *the file is made on your phone, your work stays on your phone* — and leaves the app's offline
promise until it has been measured. **When the airplane-mode pass in `docs/RESEARCH-2026-09-20.md` item 8 is
done, the sentence can be strengthened.** Flagged, not quietly written.

---

## 8 · What I could not establish

| Not established | Why it matters | Why it is missing |
|---|---|---|
| Whether the Android app actually works offline | It is the claim the whole Africa frame rests on | `docs/FEATURE-INVENTORY.md` §5: never tested in airplane mode. No device session in this task |
| Any measure of how many Tanzanians would pay, or which country converts | The §5 country order is a guess without it | No production DB access; `app_event`/`outcome_event` exist but were not queried |
| A professional consensus on disclosing a personal tragedy in brand copy | Would make the §6 recommendation authoritative instead of argued | Pass D searched; none exists. Stated as a gap |
| Any documented case of a product named for a deceased relative that discloses nothing | Would test the §6 recommendation | Pass D found none |
| A peer-reviewed or industry study of job-search behaviour on WhatsApp in East Africa | Would decide whether WhatsApp is a channel or *the* channel | Pass A: "no study found" — the 53.3% WhatsApp figure already in the docs is a **political-engagement** study from Busega District, not a job-search one |
| Duolingo, Canva, Revolut, M-Pesa, Tala, Branch, Fuzu homepages | Pass B's comparison set is thinner than asked | 403 / JS-only rendering / connection reset. Pass B labels each failure |
| Any independent jobseeker complaint about employer silence with a URL | The strongest emotional hook available | Pass A §4c: only platform-authored advice content found |
| The exact number of templates Sumaiya *offers* (vs maintains) | The page says "47+"; the About page says "120+" | `docs/RESEARCH-2026-09-20.md` §2 measures **47 curated** (7 premium + 40 free) against 266 registry entries. The About page's "120+" is a second, contradictory number and is **flagged, not fixed** here |

---

## 9 · The four documents this one contradicts, and what to do about each

Stated so nothing is reversed silently:

| Document | Conflict | Action |
|---|---|---|
| `docs/PHOTO-CAPTURE-SPEC-2026-09-20.md:172` | Calls the Gulf "the growth path"; this doc makes Africa the frame | **Flagged for the owner.** Not edited — the photo spec is a record of a real Gulf convention and the feature has shipped. If Africa binds, the decision to record is that the photo stays optional and never becomes a default |
| `docs/RESEARCH-2026-09-20.md` §1c | Treats the Gulf as the stated expansion (Tier C) | **Flagged for the owner.** Not edited — it is another agent's measured snapshot |
| `docs/PRODUCT-DIRECTION-2026-09-20.md` §4.3 | Records 11 live Swahili strings naming "ATS" and says the fix belongs to the Swahili-audit owner | **Partially superseded.** This change removes the ones on the landing page and its metadata; the other surfaces are still that owner's |
| `apps/web/lib/testimonials.ts` | Three quotes under a heading asserting "Real people, real jobs" | **Emptied in this change.** The file's own header already said fabricated testimonials are worse than none |

---

*Written 2026-09-20 in Africa/Nairobi by an agent working under the owner's brief. Market claims carry a URL
and the pass file they came from; repo claims carry a `file:line`; every judgement is labelled; nothing in §8
is smoothed over. The four research passes are committed verbatim beside their prompts so any claim here can
be checked against what the model actually found.*
