# Research Pass B — The Structure of a Great "What Are You?" Answer

## Part 1: Verified hero text

| Product | Headline (verbatim) | Subhead (verbatim) | URL | Status |
|---|---|---|---|---|
| Stripe | "Financial infrastructure to grow your revenue." | "Accept payments, offer financial services, and implement custom revenue models—from your first transaction to your billionth." | stripe.com | Read successfully |
| Linear | "The product development system for teams and agents" | "Purpose-built for planning and building products. Designed for the AI era." | linear.app | Read successfully (page repeated the headline 3x in the fetch, likely an animated/rotating DOM element — treating the single clean sentence as canonical) |
| Notion | "Where teams and agents Think together." | "Capture context, find answers, and automate tasks with AI built for your team." | notion.com (redirected from notion.so) | Read successfully |
| Figma | "The intelligent canvas for infinite creativity" | "One workspace for your entire product development process." | figma.com | Read via fetch (200 OK) — could not independently corroborate via search; see caveat below |
| Wise | "Send money globally for less" | "Move your money where it matters. Save on international transfers in over 50 currencies, without any hidden fees." | wise.com | Read successfully |
| Shopify | "Be the next AI all-star" | "Dream big and build fast on Shopify. The world's best commerce platform." | shopify.com | Read via fetch (200 OK) — could not independently corroborate; see caveat below |
| Grammarly | "Think big. We'll take care of the details." | "Work with an AI partner that helps turn your thoughts into writing that's clear, credible, and impossible to ignore." | grammarly.com | Read successfully |
| Moniepoint | "Financial happiness for every African, everywhere" | "Moniepoint provides an all-in-one payments, banking and operations platform for businesses and their customers." | moniepoint.com | Read successfully |
| OPay | "We are Beyond Banking" | "OPay offers secure, easy, and affordable financial solutions. Enjoy fast transactions, incentives, and a reliable debit card. Simplify your finances and payments, all on one efficient platform." | opayweb.com | Read successfully |
| PiggyVest | "The better way to save & invest." | "Piggyvest helps over 6 million customers achieve their financial goals by helping them save and invest with ease." | piggyvest.com | Read successfully |
| Airtel Money | (No isolated H1 captured — nearest hero-adjacent sentence:) "Airtel Money now connects more than 54 million active customers to an inclusive digital financial ecosystem that supports everyday payments and access to essential services." | — | airtel.africa | Partial — likely a body/stat line, not a clean H1+subhead pair; flagged low-confidence |

**Caveat on Figma and Shopify:** the fetch tool returned 200 OK and structured text for both, but I could not cross-verify either quote via a second independent read or search (Figma and Shopify both run client-rendered marketing pages that vary by session/A-B test, and search results didn't surface the literal string). Treat these two as **probable, not certain** — flagged again in the "Unverified" section.

---

## Part 2: Classification by claim type

| Product | Type | Claim |
|---|---|---|
| Stripe | Category + outcome | infrastructure ("financial infrastructure") → outcome ("grow your revenue") |
| Linear | Category + audience | naming its category ("product development system") + who it's for ("teams and agents") |
| Notion | Negation-ish / relational | not a feature, a *relationship* ("where teams and agents think together") |
| Figma | Metaphor + outcome | "canvas" (metaphor) + outcome ("infinite creativity") |
| Wise | Verb + outcome | imperative verb ("send") + outcome ("for less") |
| Shopify | Aspirational identity, not category | "Be the next AI all-star" — addresses who the *user becomes*, not what the product is |
| Grammarly | Promise + relief-of-labor | "we'll take care of the details" — outcome framed as delegation |
| Moniepoint | Emotional outcome + geography | "financial happiness" (outcome, reframed as feeling) + scope ("every African, everywhere") |
| OPay | Negation | explicitly refuses the category "banking" ("Beyond Banking") |
| PiggyVest | Comparative outcome | "the better way to save & invest" — comparative claim, verb-anchored |
| Airtel Money | Scale/proof, not identity | leads with a user-count stat, not a self-definition |

Only **one** of eleven (OPay) uses outright negation of category the way "banking is not a place" does. Two (Notion, Linear) name their category plainly. The rest skip category entirely and state an outcome or a becoming.

---

## Part 3: The proposed skeleton — SHAPE + WHO-FOR + OUTCOME

Testing "SHAPE + WHO-FOR + OUTCOME, mechanism absent or subordinate" against each:

| Product | SHAPE | WHO-FOR | OUTCOME | Fits skeleton? |
|---|---|---|---|---|
| Stripe | "financial infrastructure" | (implicit: businesses, via "your") | "grow your revenue" | Yes — all three slots present, mechanism (infra) *is* the shape, not separate |
| Linear | "product development system" | "teams and agents" | *absent from headline*, deferred to subhead ("planning and building products") | Partial — WHO-FOR present, OUTCOME pushed to subhead |
| Notion | *absent* (no noun for what it is) | "teams and agents" | "think together" (relational outcome) | Partial — SHAPE dropped entirely, replaced with a verb-outcome |
| Figma | "canvas" (metaphor stands in for shape) | *absent* | "infinite creativity" | Partial — WHO-FOR omitted, metaphor substitutes for shape |
| Wise | *absent* | *implicit via "your"* | "send money globally for less" | Fails shape slot — this is pure verb+outcome, no shape noun at all |
| Shopify | *absent* | "you" (implicit, 2nd person) | *replaced with identity* ("the next AI all-star") | Breaks the skeleton — outcome slot is occupied by *aspirational self-image*, not a product outcome |
| Grammarly | "AI partner" | "you/your thoughts" | "writing that's clear, credible, and impossible to ignore" | Yes — full fit, mechanism ("AI partner") kept subordinate to outcome |
| Moniepoint | *absent* | "every African, everywhere" | "financial happiness" | Partial — WHO-FOR is unusually explicit and foregrounded; SHAPE entirely absent |
| OPay | negation of shape ("not banking") | *absent* | *implicit* (deferred to subhead) | Fails — shape slot is filled with a refusal, not a claim |
| PiggyVest | *absent* | *implicit* | "save & invest" (comparative) | Partial — no shape noun, verb pair stands in |

**Verdict on the skeleton:** it holds as a *description of the available slots*, but the single most common move across all ten is to **drop SHAPE and lead with OUTCOME or WHO-FOR instead** — seven of ten omit a shape noun from the headline entirely (Notion, Figma, Wise, Shopify, Moniepoint, OPay, PiggyVest). Category naming ("system," "infrastructure," "canvas," "partner") survives only where the category itself is unfamiliar enough to need naming (Linear's "product development system," Stripe's "financial infrastructure," Grammarly's "AI partner" needs the word "partner" because "AI" alone is a modifier, not a noun). Where the category is *already understood by the reader* (money transfer, banking, saving), the shape noun disappears and the page jumps straight to outcome or to a negation of the assumed category. **Refined skeleton: WHO-FOR/SHAPE (pick one, rarely both) + OUTCOME, with mechanism subordinate — and SHAPE is only worth a word if the reader doesn't already have a category for you.**

---

## Part 4: Length and register

| Product | Headline word count | Person | Tense | Concrete nouns vs abstraction |
|---|---|---|---|---|
| Stripe | 7 | 2nd ("your revenue") | present | "infrastructure," "revenue" — abstract-financial |
| Linear | 8 | none (declarative) | present | "system," "teams," "agents" — concrete roles |
| Notion | 6 | none | present | "teams," "agents" concrete; "think together" abstract-relational |
| Figma | 6 | none | present | "canvas" concrete-metaphor; "creativity" abstract |
| Wise | 5 | none (imperative "send") | present/imperative | "money," "globally" — concrete |
| Shopify | 5 | 2nd (imperative "be") | imperative | "AI all-star" — abstract identity, zero product nouns |
| Grammarly | 6 (two sentences) | 2nd ("think big"), then 1st ("we'll") | present/future | "details" — abstract |
| Moniepoint | 6 | 3rd ("every African") | present (implied) | "happiness" abstract; "African" concrete-geographic |
| OPay | 3 | 1st plural ("we are") | present | fully abstract ("banking") |
| PiggyVest | 6 | none | present | "save," "invest" concrete verbs |

**Headline average: 5.8 words.** Every single headline is under 10 words; none exceeds two clauses. Second person ("you/your") appears in 3 of 10 (Stripe, Shopify, Grammarly); first person ("we") in only 1 (OPay); the majority (6 of 10) use **no pronoun at all** — a bare declarative noun phrase or imperative verb. All are present tense; none uses future or past. This confirms the "people overestimate length" premise: these companies are not writing paragraphs, they're writing something closer to a spoken sentence you'd say out loud in three seconds.

---

## Part 5: What the subhead is for

Looking at exactly what each subhead adds beyond the headline:

| Product | Subhead adds |
|---|---|
| Stripe | **Mechanism** — turns "infrastructure" into a concrete list of what you do with it (accept payments, offer financial services) |
| Linear | **Audience narrowing + proof of relevance** — "designed for the AI era" answers "why now" |
| Notion | **Mechanism** — "capture context, find answers, automate tasks" cashes out the vague "think together" into features |
| Figma | **Scope** — narrows "infinite creativity" to a specific workflow ("entire product development process") |
| Wise | **Mechanism + proof + objection relief** — names the "how" (50 currencies) and pre-empts the objection ("without any hidden fees") |
| Shopify | **Category correction** — the headline said nothing about commerce; the subhead is where "commerce platform" finally appears |
| Grammarly | **Mechanism** — "AI partner" is the how; the rest of the sentence is outcome restated with more adjectives |
| Moniepoint | **Mechanism** — cashes "financial happiness" into "payments, banking, operations platform" |
| OPay | **Mechanism, in triplicate** — since the headline was pure negation, the subhead has to do all the defining work alone |
| PiggyVest | **Proof (social proof)** — "6 million customers," the one place a number appears |

**Pattern:** the subhead's job is almost always to supply the **mechanism** — the "how" that the headline deliberately withheld. The exceptions are Shopify (subhead supplies the missing *category*, not just mechanism — an unusual amount of load-bearing for one line) and PiggyVest (subhead supplies *proof*, i.e., a number, rather than mechanism). OPay is the extreme case: because its headline is a pure negation with zero content, the subhead has to carry mechanism, audience, and reassurance all at once — which is why it's also the longest and most feature-list-like subhead in the set. **Lesson: a headline that negates or withholds category pushes proportionally more weight onto the subhead.**

---

## Part 6: The negative space rule

Three examples deliberately refuse a category the reader would assume:

- **OPay** — "We are Beyond Banking" (opayweb.com) refuses "bank," even though OPay is, functionally, a bank-like product. Cost: the headline alone communicates *nothing concrete* — a first-time reader learns only what OPay is *not*. All defining work is deferred to the subhead, which is why that subhead is three clauses long instead of one.
- **Shopify** — "Be the next AI all-star" (shopify.com) refuses "e-commerce platform" entirely, gambling that the reader already knows what Shopify is and would rather be spoken to as an aspiring entrepreneur than reminded of the product category. Cost: for a first-time visitor with zero prior context, the headline is uninterpretable without the subhead — it only works because Shopify's brand recognition is assumed, not earned on this page.
- **Notion** — "Where teams and agents think together" refuses "workspace" or "docs tool," the categories it used to lead with in earlier eras of its own homepage. Cost is lower here because "think together" still gestures at collaboration, so a cold reader can approximate the category even without the noun.

**The rule:** negation/refusal is affordable in direct proportion to how much prior brand recognition the company can assume. OPay and Shopify can refuse category because the reader has heard of them; a page with zero brand recognition (most emerging-market products, most B2B tools) cannot afford this move — refusing the category when the reader has no other source for it leaves them with nothing.

---

## Part 7: What these pages do NOT say

Evidence-based, not assumed:

- **No feature lists above the fold.** Every hero captured is headline + one-sentence subhead — Stripe, Wise, Notion, Grammarly, Moniepoint, PiggyVest all stop at a single sentence before (presumably) moving to sections further down the page, which this fetch didn't need to reach to get the "what is this" answer.
- **No "powerful," "seamless," "revolutionary," "cutting-edge," "innovative," "best-in-class."** None of the ten captured headlines or subheads contain a single one of these words. The closest is Shopify's "world's best commerce platform" — a superlative, but plain ("best"), not jargon.
- **No claim of being "an AI platform."** Even the pages that mention AI (Linear: "designed for the AI era"; Notion: "AI built for your team"; Grammarly: "AI partner"; Shopify: "AI all-star") treat AI as a modifier or feature, never as the product's category-defining noun. None says "we are an AI platform."
- **No team bios, no awards, no press logos** in the hero itself — none of the ten fetches surfaced any of this in the H1/subhead pair, consistent with those elements living further down the page, not in the first thing said.

I did not fetch full-page screenshots, so I can't rule out that logos or awards appear just below the fold — but they are absent from the *first thing said*, which is what the task asked about.

---

## Part 8: The reusable skeleton

For a product whose users are on cheap Android phones with prepaid data, reading Swahili, competing against a human CV writer or a WhatsApp group:

1. **Lead with WHO-FOR or OUTCOME — pick one, not both, and never lead with SHAPE if the category is already familiar.** Moniepoint's "every African, everywhere" and PiggyVest's "save & invest" are the templates: one names the audience, the other names the outcome-verb. Neither wastes the opening clause naming a category ("app," "platform") the reader already understands from lived experience — a Kenyan reader knows what M-Pesa *is* without being told "mobile money platform."

2. **Use a concrete, everyday verb, not an abstract noun.** "Send," "save," "invest," "connect" beat "infrastructure," "canvas," "ecosystem." A prepaid-data reader scanning fast needs a verb they can act on, not a noun they have to unpack.

3. **Keep it to 5–8 words. This does not change.** Every example in this study, global or emerging-market, held to under ten words. If anything, tighten further for a slow-loading, small-screen context — every extra word costs render time and reading time both.

4. **Do NOT negate the category unless brand recognition is already earned.** OPay and Shopify can say "beyond banking" or skip "commerce platform" because the reader already has a mental slot for them. A new entrant competing against a human CV writer or a WhatsApp group has *no* existing mental slot to subvert — refusing the category here isn't clever, it's just confusing. State plainly what it is.

5. **Push mechanism and proof into the subhead, not the headline — this does not change either.** The pattern held in every market: headline states outcome/audience, subhead answers "how" and/or offers a number (PiggyVest's "6 million," Airtel Money's "54 million"). For a skeptical, low-trust reader, a concrete number in the subhead (users, currencies, years operating) does more work than an adjective — this is *more* important in emerging markets, where trust in a faceless app is the binding constraint, not novelty appeal.

6. **What changes: the register drops from aspirational-identity to functional-relief.** Shopify can say "be the next AI all-star" because its reader is already dreaming of scale. A reader whose alternative is a human CV writer or a WhatsApp group is not dreaming of becoming an "all-star" — they want a concrete, near-term relief ("get paid today," "find work this week," "send money home"). Aspiration-framed headlines (Shopify, Grammarly's "think big") assume slack and ambition the target reader may not have bandwidth for. Outcome-framed and relief-framed headlines (Wise's "for less," PiggyVest's "the better way") travel better.

7. **What changes: local geography or identity can BE the differentiator, not just decoration.** Moniepoint's "every African, everywhere" puts geography directly in the outcome clause — this is rare among the global set (none of Stripe/Linear/Notion/Wise/Grammarly name a place) but was the single strongest lever available to Moniepoint precisely because "built for you, specifically" is a trust signal in a market saturated with foreign-feeling fintech apps. For the Swahili-speaking, prepaid-data reader, naming the place or the community (not just the outcome) is worth a slot that a Silicon Valley product would never spend on geography.

8. **What does NOT change: present tense, no filler adjectives, no feature list above the fold.** These are structural, not cultural — they follow from attention economics (short reading time, small screen) that apply at least as much on a cheap Android phone with prepaid data as on a fast fiber connection in San Francisco. If anything, filler adjectives are a *bigger* liability at low bandwidth: every unnecessary word is unnecessary render + read time on a slow connection.

**The one-line recipe, condensed:**
> [Familiar verb naming the outcome] + [audience or place, if it doubles as a trust signal] — no category noun if the reader already has one, no aspirational identity if the reader's problem is immediate and concrete, mechanism and proof deferred to the very next sentence.

---

## Unverified / could not read

- **Duolingo (duolingo.com)** — page returned only the string "Duolingo" with no hero text on two separate fetch attempts; client-side JS rendering the fetch tool could not execute. Not read.
- **Canva (canva.com)** — HTTP 403 Forbidden on two attempts (bot-blocking). Not read.
- **Revolut (revolut.com)** — HTTP 403 Forbidden on two attempts (bot-blocking). Not read.
- **Figma (figma.com)** — technically returned 200 OK with text, but I could not independently corroborate the quoted headline/subhead via a second source (search returned no matching snippet). Reported with caveat, not fully verified.
- **Shopify (shopify.com)** — same caveat as Figma: 200 OK, text returned, but uncorroborated by a second read.
- **M-Pesa (safaricom.co.ke)** — HTTP 403 Forbidden. Not read.
- **M-Pesa (vodacom.co.tz)** — page returned only "Welcome to Vodacom Tanzania" with no further hero content retrievable; likely JS-rendered or a generic landing gate rather than the actual M-Pesa product page. Not usably read.
- **Tala (tala.co)** — connection reset (ECONNRESET) on two attempts. Not read.
- **Branch (branch.co)** — connection reset (ECONNRESET) on two attempts. Not read.
- **Fuzu (fuzu.com / www.fuzu.com)** — HTTP 403 Forbidden. Not read.
- **Airtel Money (airtel.africa)** — page loaded but the fetch could not isolate a clean H1+subhead pair; the sentence quoted looks like a body/stat paragraph rather than the actual hero headline. Reported as low-confidence, not a verified hero quote.

Given these gaps, the emerging-market side of this analysis rests on **three solid reads (Moniepoint, OPay, PiggyVest)** plus one weak partial (Airtel Money) — enough to see a real pattern (outcome/audience-led, geography as trust signal, negation used sparingly) but not enough to claim full market coverage. M-Pesa in particular — arguably the single most important reference point for the brief — could not be read at all, and that gap should be weighted accordingly before this skeleton is treated as final.
