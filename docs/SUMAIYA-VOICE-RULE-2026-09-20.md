# Sumaiya's voice — the rule, the inventory, and the fix

**Date:** 2026-09-20 · **Repo:** `C:\Users\hamis\projects\sumaiya` (`main`) · **Live:** https://sumaiya.app
**Brief, verbatim:** *"look backwards kwenye personifications of the app the Mimi, mfano kuna sehemu AI ya kazi
that is like the app telling you about something else. zungumza nami ai Sumaiya AI na logo sijui but its just
off"*

Builds on `docs/BRAND-AND-MESSAGE-2026-09-20.md` §6 and
`docs/research/brand-2026-09-20/pass-c-stranger-read.out.md` (a first-time Swahili visitor could not tell
whether Sumaiya was a person or a program) and `pass-d-voice.out.md` (§4, the enforceable voice rules). It does
not restart that research; it turns it into one rule and applies it.

---

## 1 · THE RULE, IN TWO SENTENCES

> **Sumaiya speaks for herself in the first person.** Everywhere the product reaches the user as her — her
> replies, her status and error lines, the buttons and labels that open or continue a conversation with her,
> and any card holding what she just produced — she says **"Mimi ni Sumaiya", "ninaweza", "nitaandikia",
> "niambie", "nami", "nina shughuli nyingi", "nimeyaongeza mimi"**; her name is a brand and her mark is the
> badge that says *who is speaking*, so the two of them sit beside words that are hers, never beside a sentence
> someone else wrote about her. **Where the company speaks instead — marketing pages, About, Privacy, Terms,
> page titles, the footer, the FAQ — it may name her "Sumaiya" in the third person, but the word "AI" is gone
> from every Swahili string a user can see**: no more `AI ya kazi`, `Msaidizi wa AI`, `Zungumza na AI`,
> `Boresha na AI` or `Sumaiya AI` — in Swahili she is `msaidizi wa kazi`, named for what she does, and the
> English copy loses the same labels so the two languages stay a matched pair.

### The four clauses, stated separately so each is checkable

| # | Clause | How you check it |
|---|---|---|
| 1 | **First person on every voice surface.** Her replies, status lines, errors, and the labels that start or continue a conversation with her are written as her speech. | No user-facing string on a voice surface has `Sumaiya` (or `AI`) as the subject of a verb. |
| 2 | **Her name is a brand, never a speaker.** `Sumaiya` appears as a title, tab, footer link or the company's third-person subject on a brand surface — not as a sentence inside her own voice. | `grep -rn "Sumaiya a[a-z]\|Sumaiya h[a-z]\|Sumaiya i[a-z]"` returns only brand surfaces, legal pages and code comments. |
| 3 | **"AI" does not survive in Swahili user-facing copy.** She is `msaidizi wa kazi`. English loses the same labels in the same places. | `grep -rn "wa AI\|na AI\|kwa AI\|ya AI\|AI ya"` over both apps' copy directories returns only the legal AI-processor disclosure and invisible meta keywords. |
| 4 | **The mark means "she is speaking".** Her logo/avatar sits beside first-person copy. Where a marketing sentence carries her name as its subject, the mark is a name badge on that sentence — it is never placed on generic copy that is not about her. | By inspection: every `SumaiyaMark` in a sentence next to copy that names her as the actor. |

**Deliberately NOT part of the rule:** the third person is not banned on marketing pages. A landing page has to
introduce a stranger to a product, and the company doing that in the third person is normal brand practice in
this market (`pass-d-voice.out.md` §1: every winning consumer page in the sample is transactional and
concrete). What the owner caught — and what clause 1 bans — is the third person appearing *inside her own
voice*: a status line, a button, an error, a card, a feature tile. That is where the register flipped.

---

## 2 · THE INVENTORY

Machine-built (`grep`-class scan of every non-test `.ts`/`.tsx`/`.json` under
`apps/web/{lib,app,components}` and `apps/native/src`, matched against ten pattern classes: `Sumaiya+verb`
third person, `Sumaiya AI`, `AI ya kazi`, `Msaidizi wa AI`, `Zungumza na AI`, `niambie`, `Mimi`, `ninaweza`,
`nami`/`naye`, and every line containing `AI`).

| Class | Candidate lines | Real user-facing strings after removing comments and code |
|---|---|---|
| Every line containing `AI` anywhere in the two apps' copy dirs | 532 | 96 |
| `Sumaiya` used as the subject of a verb (third-person self-reference) | 37 | 14 |
| `Msaidizi wa AI` / `Msaidizi wako wa AI` / `Msaidizi wa Kazi wa AI` | 14 | 11 |
| `Zungumza na AI` / `ongea na AI` / `kuzungumza na AI` | 8 | 6 |
| `Mimi` / `ninaweza` / `niko` (already first person — unchanged) | 19 | 19 |
| `niambie` / `niam...` | 20 | 8 |
| `nami` / `naye` (first person address) | 26 | 20 |
| `AI ya kazi` / `Career AI` | 1 | 1 (the native home-screen tile — the string the owner quoted) |
| `Sumaiya AI` | 4 | 0 (all four are code comments) |
| **Distinct user-facing strings in scope** | — | **157** |
| **Distinct files touched** | — | **44** |

### The exemplar, and its siblings

Tonight's QA changed the busy line `Sumaiya ana shughuli nyingi sasa hivi` → `Nina shughuli nyingi` in
`apps/native/src/lib/app-errors.ts:156`. Its direct siblings, all found and fixed here:

| sibling | file:line (before) | was |
|---|---|---|
| the web import-CV busy line | `apps/web/components/pdf-tools/import-cv-client.tsx:109` | `AI ina shughuli nyingi kwa sasa.` |
| the native CV-list server error | `apps/native/src/lib/cv-fetch-error.ts:61` | `Sumaiya ina hitilafu` |
| the native CV-list auth error | `apps/native/src/lib/cv-fetch-error.ts:55` | `Sumaiya haikuweza kufungua CV zako` |
| the native memory-withdraw alert | `apps/native/src/screens/app/memory-screen.tsx:67` | `Sumaiya ataacha kujifunza kukuhusu` |
| the web brief trust footer | `apps/web/app/(app)/(dashboard)/brief/page.tsx:255` | `Sumaiya haitumi kitu peke yake.` |
| the web dashboard facts card | `apps/web/app/(app)/(dashboard)/dashboard/page.tsx:417` | `Sumaiya aliziandika kutokana na mazungumzo yenu` |
| the web facts signal | `apps/web/lib/assistant/signals.ts:136` | `Sumaiya alikwambia taarifa N` |
| the web editor banner | `apps/web/components/editor/cv-editor-client.tsx:2019` | `Acha Sumaiya aandike CV yako` |
| the web editor hint | `apps/web/components/editor/cv-editor-client.tsx:2023` | `naye anaandika kila sehemu` |
| the how-it-works step | `apps/web/app/[locale]/(marketing)/home-page-client.tsx:646` | `jibu maswali ya Sumaiya naye anaandika` |

---

## 3 · BEFORE → AFTER

Every row was applied by exact-string replacement with a count check (`apply.py`, `fix2.py`, `fix3.py`,
`fix4.py` in the working notes). 157 rows, 44 source files, plus 3 test files whose assertions quoted a changed string.

| # | file | before | after |
|---|---|---|---|
| W01 | `apps/web/components/pdf-tools/import-cv-client.tsx` | "Huduma ya AI haipatikani kwa sasa. Jaribu tena baadaye." | "Siwezi kufanya hivi kwa sasa. Jaribu tena baadaye." |
| W02 | `apps/web/components/pdf-tools/import-cv-client.tsx` | "The AI service is unavailable right now. Please try again later." | "I can't do this right now. Please try again later." |
| W03 | `apps/web/components/pdf-tools/import-cv-client.tsx` | "AI ina shughuli nyingi kwa sasa. Subiri dakika moja kisha ujaribu tena." | "Nina shughuli nyingi kwa sasa. Subiri dakika moja kisha ujaribu tena." |
| W04 | `apps/web/components/pdf-tools/import-cv-client.tsx` | "The AI is busy right now. Wait a minute and try again." | "I'm busy right now. Wait a minute and try again." |
| W05 | `apps/web/components/pdf-tools/import-cv-client.tsx` | ["Pakia PDF", "AI inasoma", "Hariri & pakua"] | ["Pakia PDF", "Ninasoma", "Hariri & pakua"] |
| W06 | `apps/web/components/pdf-tools/import-cv-client.tsx` | ["Upload PDF", "AI reads it", "Edit & export"] | ["Upload PDF", "I read it", "Edit & export"] |
| W07 | `apps/web/components/editor/create-entry-options.tsx` | { label: "Chat with AI", hint: "Easiest — answer a few questions" } | { label: "Chat with me", hint: "Easiest — answer a few questions" } |
| W08 | `apps/web/components/editor/create-entry-options.tsx` | { label: "Zungumza na AI", hint: "Rahisi zaidi — jibu maswali machache" } | { label: "Zungumza nami", hint: "Rahisi zaidi — jibu maswali machache" } |
| W09 | `apps/web/app/(app)/(dashboard)/dashboard/page.tsx` | {lang === "sw" ? "Msaidizi wa AI" : "AI Assistant"} | {lang === "sw" ? "Sumaiya" : "Sumaiya"} |
| W10 | `apps/web/app/(app)/(dashboard)/dashboard/page.tsx` | {lang === "sw" ? "Unda CV kwa kuzungumza na AI" : "Build a CV by chatting with AI"} | {lang === "sw" ? "Unda CV kwa kuzungumza nami" : "Build a CV by chatting with me"} |
| W11 | `apps/web/app/(app)/(dashboard)/dashboard/page.tsx` | "Sumaiya aliziandika kutokana na mazungumzo yenu — thibitisha ziwe rasmi, au uziondoe." | "Niliziandika kutokana na mazungumzo yetu — thibitisha ziwe rasmi, au uziondoe." |
| W12 | `apps/web/app/(app)/(dashboard)/dashboard/page.tsx` | "Sumaiya drafted these from your chat — confirm them to make them official, or remove them." | "I drafted these from our chat — confirm them to make them official, or remove them." |
| W13 | `apps/web/app/(app)/(dashboard)/brief/page.tsx` | ? "Briefi hii inajengwa kutoka kwa data yako halisi pekee — hakuna nafasi au alama inayobuniwa. Kila hatua inahitaji kubofya kwako; Sumaiya haitumi kitu peke yake." | ? "Briefi hii inajengwa kutoka kwa data yako halisi pekee — hakuna nafasi au alama inayobuniwa. Kila hatua inahitaji kubofya kwako; situmi kitu peke yangu." |
| W14 | `apps/web/app/(app)/(dashboard)/brief/page.tsx` | : "This brief is built from your real data only — no job, match or score is invented. Every action needs your tap; Sumaiya never sends anything on her own." | : "This brief is built from your real data only — no job, match or score is invented. Every action needs your tap; I never send anything on my own." |
| W15 | `apps/web/lib/assistant/signals.ts` | sw: `Sumaiya alikwambia taarifa ${context.unconfirmed.length} kutokana na mazungumzo — thibitisha kila moja ziwe rasmi.`, | sw: `Nilikwambia taarifa ${context.unconfirmed.length} kutokana na mazungumzo yetu — thibitisha kila moja ziwe rasmi.`, |
| W16 | `apps/web/lib/assistant/signals.ts` | en: `Sumaiya drafted ${context.unconfirmed.length} ${context.unconfirmed.length === 1 ? "fact" : "facts"} from your chat — confirm each to make them official.`, | en: `I drafted ${context.unconfirmed.length} ${context.unconfirmed.length === 1 ? "fact" : "facts"} from our chat — confirm each to make them official.`, |
| W17 | `apps/web/components/editor/cv-editor-client.tsx` | "Pata upakuaji wa PDF bila kikomo, miundo yote, na maboresho ya AI." | "Pata upakuaji wa PDF bila kikomo, miundo yote, na msaada wa kuboresha maandishi yako." |
| W18 | `apps/web/components/editor/cv-editor-client.tsx` | "Get unlimited PDF downloads, every look, and AI-powered enhancements." | "Get unlimited PDF downloads, every look, and help with your wording." |
| W19 | `apps/web/components/editor/cv-editor-client.tsx` | "Uboreshaji wa maudhui kwa AI" | "Uboreshaji wa maudhui" |
| W20 | `apps/web/components/editor/cv-editor-client.tsx` | "AI content enhancement" | "Content enhancement" |
| W21 | `apps/web/components/editor/cv-editor-client.tsx` | "Ongeza cheo cha kazi, uzoefu au ujuzi kwanza — kisha AI itaandika muhtasari wako." | "Ongeza cheo cha kazi, uzoefu au ujuzi kwanza — kisha nitaandika muhtasari wako." |
| W22 | `apps/web/components/editor/cv-editor-client.tsx` | "Add a job title, some experience or skills first — then AI can write your summary." | "Add a job title, some experience or skills first — then I can write your summary." |
| W23 | `apps/web/components/editor/cv-editor-client.tsx` | {uiLang === "sw" ? "Boresha na AI" : "Enhance with AI"} | {uiLang === "sw" ? "Boresha" : "Improve"} |
| W24 | `apps/web/components/editor/cv-editor-client.tsx` | {uiLang === "sw" ? "Boresha na AI" : "Improve with AI"} | {uiLang === "sw" ? "Boresha" : "Improve"} |
| W25 | `apps/web/components/editor/cv-editor-client.tsx` | ? (uiLang === "sw" ? "Pendekezo la AI" : "AI suggestion") | ? (uiLang === "sw" ? "Pendekezo langu" : "My suggestion") |
| W26 | `apps/web/components/editor/cv-editor-client.tsx` | ? "AI haipatikani kwa sasa, kwa hivyo tumefanya usafi mdogo wa maandishi tu. Kagua kisha uweke ukipenda." | ? "Siwezi kuandika upya kwa sasa, kwa hivyo nimefanya usafi mdogo wa maandishi tu. Kagua kisha uweke ukipenda." |
| W27 | `apps/web/components/editor/cv-editor-client.tsx` | ? "AI is unavailable right now, so this is a light tidy-up only — not an AI rewrite. Review, then apply if you like it." | ? "I can't rewrite right now, so this is a light tidy-up only — not a full rewrite. Review, then apply if you like it." |
| W28 | `apps/web/components/editor/cv-editor-client.tsx` | ? "AI imeandika upya maandishi yako yawe wazi na yenye nguvu zaidi. Kagua kisha uweke ukipenda." | ? "Nimeandika upya maandishi yako yawe wazi na yenye nguvu zaidi. Kagua kisha uweke ukipenda." |
| W29 | `apps/web/components/editor/cv-editor-client.tsx` | ? "AI rewrote your text to be clearer and more impactful. Review, then apply if you like it." | ? "I rewrote your text to be clearer and more impactful. Review, then apply if you like it." |
| W30 | `apps/web/components/editor/cv-editor-client.tsx` | "Boresha muhtasari wako na AI" | "Nitakuandikia muhtasari wako upya" |
| W31 | `apps/web/components/editor/cv-editor-client.tsx` | "Improve your summary with AI" | "I'll rewrite your summary" |
| W32 | `apps/web/components/editor/cv-editor-client.tsx` | {uiLang === "sw" ? "Zana za AI" : "AI Tools"} | {uiLang === "sw" ? "Nikusaidie nini?" : "What can I help with?"} |
| W33 | `apps/web/components/editor/cv-editor-client.tsx` | desc: { sw: "AI iandike upya muhtasari wako", en: "Let AI rewrite your summary" } | desc: { sw: "Niandike upya muhtasari wako", en: "Let me rewrite your summary" } |
| W34 | `apps/web/components/editor/cv-editor-client.tsx` | ? "Kidokezo: kila sehemu (Muhtasari, Uzoefu) ina kitufe chake cha AI kwenye kichupo cha Yaliyomo." | ? "Kidokezo: kila sehemu (Muhtasari, Uzoefu) ina kitufe changu kwenye kichupo cha Yaliyomo." |
| W35 | `apps/web/components/editor/cv-editor-client.tsx` | : "Tip: each section (Summary, Experience) has its own AI button in the Content tab." | : "Tip: each section (Summary, Experience) has my button in the Content tab." |
| W36 | `apps/web/components/editor/cv-editor-client.tsx` | {uiLang === "sw" ? "Msaidizi wa AI" : "AI Assistant"} | {uiLang === "sw" ? "Sumaiya" : "Sumaiya"} |
| W37 | `apps/web/components/editor/cv-editor-client.tsx` | {uiLang === "sw" ? "Hutaki kujaza fomu? Acha Sumaiya aandike CV yako" : "Don't want to fill in a form? Let Sumaiya write your CV"} | {uiLang === "sw" ? "Hutaki kujaza fomu? Niambie na ninaandika CV yako" : "Don't want to fill in a form? Tell me and I'll write your CV"} |
| W38 | `apps/web/components/editor/cv-editor-client.tsx` | ? "Jibu maswali machache kwa maneno yako mwenyewe — naye anaandika kila sehemu. Unarudi hapa kuhariri." | ? "Jibu maswali machache kwa maneno yako mwenyewe — nami ninaandika kila sehemu. Unarudi hapa kuhariri." |
| W39 | `apps/web/components/editor/cv-editor-client.tsx` | : "Answer a few questions in your own words — she writes every section. You come back here to edit." | : "Answer a few questions in your own words — I write every section. You come back here to edit." |
| W40 | `apps/web/components/editor/cv-editor-client.tsx` | {uiLang === "sw" ? "Anza na Sumaiya" : "Start with Sumaiya"} | {uiLang === "sw" ? "Anza nami" : "Start with me"} |
| W41 | `apps/web/components/editor/job-target-panel.tsx` | "Imeshindwa kuendesha ulinganishaji wa AI. Tunaonyesha ulinganishaji wa haraka." | "Imeshindwa kuendesha ulinganishaji. Tunaonyesha ulinganishaji wa haraka." |
| W42 | `apps/web/components/editor/job-target-panel.tsx` | "Couldn't run the AI match. Showing the quick match instead." | "Couldn't run the smart match. Showing the quick match instead." |
| W43 | `apps/web/components/editor/job-target-panel.tsx` | (sw ? "Linganisha kwa AI" : "Smart match") | (sw ? "Linganisha" : "Smart match") |
| W44 | `apps/web/components/editor/job-target-panel.tsx` | ? "AI itaandika upya muhtasari wako na sehemu za uzoefu kuangazia yanayolingana na kazi hii — kwa ukweli, kutoka ulichonacho. Haitatunga uongo." | ? "Nitaandika upya muhtasari wako na sehemu za uzoefu kuangazia yanayolingana na kazi hii — kwa ukweli, kutoka ulichonacho. Sitabuni kitu." |
| W45 | `apps/web/components/editor/job-target-panel.tsx` | : "AI rewrites your summary and experience bullets to match this job — truthfully, from what you already have. It invents nothing." | : "I rewrite your summary and experience bullets to match this job — truthfully, from what you already have. I invent nothing." |
| W46 | `apps/web/components/editor/job-target-panel.tsx` | {sw ? "Haya hayapo kwenye CV yako — yameongezwa na AI. Thibitisha kama ni kweli:" : "These aren't in your CV — AI added them. Confirm if true:"} | {sw ? "Haya hayapo kwenye CV yako — nimeyaongeza mimi. Thibitisha kama ni kweli:" : "These aren't in your CV — I added them. Confirm if true:"} |
| W47 | `apps/web/components/editor/job-target-panel.tsx` | {sw ? "Boresha muhtasari kwa AI" : "Tailor summary with AI"} | {sw ? "Boresha muhtasari" : "Tailor summary"} |
| W48 | `apps/web/components/editor/job-target-panel.tsx` | <p className="text-[10px] text-text-muted">{sw ? "Andika muhtasari wa kitaalamu kwanza, kisha AI itauandika upya kulenga kazi hii." : "Write a professional summary first, then AI can rewrite it to target this job."}</p> | <p className="text-[10px] text-text-muted">{sw ? "Andika muhtasari wa kitaalamu kwanza, kisha nitaandika upya kulenga kazi hii." : "Write a professional summary first, then I can rewrite it to target this job."}</p> |
| W49 | `apps/web/components/dashboard/application-workspace.tsx` | "Imeshindwa kuendesha ulinganishaji wa AI. Tunaonyesha ulinganishaji wa haraka." | "Imeshindwa kuendesha ulinganishaji. Tunaonyesha ulinganishaji wa haraka." |
| W50 | `apps/web/components/dashboard/application-workspace.tsx` | "Couldn't run the AI match. Showing the quick match instead." | "Couldn't run the smart match. Showing the quick match instead." |
| W51 | `apps/web/components/dashboard/application-workspace.tsx` | {aiLoading ? (sw ? "Inachambua…" : "Analyzing…") : (sw ? "Linganisha kwa AI" : "Smart match (AI)")} | {aiLoading ? (sw ? "Inachambua…" : "Analyzing…") : (sw ? "Linganisha" : "Smart match")} |
| W52 | `apps/web/components/editor/cover-letter-editor-client.tsx` | subtitle: sw ? "AI imeandika upya barua yako iwe wazi na yenye nguvu zaidi." : "AI rewrote your letter to be clearer and more impactful.", | subtitle: sw ? "Nimeandika upya barua yako iwe wazi na yenye nguvu zaidi." : "I rewrote your letter to be clearer and more impactful.", |
| W53 | `apps/web/components/editor/cover-letter-editor-client.tsx` | subtitle: sw ? "AI imeboresha barua kulenga kazi hii." : "AI tailored your letter to this job.", | subtitle: sw ? "Nimeiboresha barua hii iilenge kazi hii." : "I tailored your letter to this job.", |
| W54 | `apps/web/components/editor/cover-letter-editor-client.tsx` | subtitle: sw ? "AI imetengeneza rasimu mpya kutokana na maelezo yako." : "AI wrote a fresh draft from your details.", | subtitle: sw ? "Nimetengeneza rasimu mpya kutokana na maelezo yako." : "I wrote a fresh draft from your details.", |
| W55 | `apps/web/components/editor/cover-letter-editor-client.tsx` | "Barua yako itaonekana hapa.\n\nBonyeza “Tengeneza kwa AI” au anza kuandika." | "Barua yako itaonekana hapa.\n\nBonyeza “Niandikie” au anza kuandika." |
| W56 | `apps/web/components/editor/cover-letter-editor-client.tsx` | {isGenerating ? (sw ? "Inatengeneza…" : "Generating…") : (sw ? "Tengeneza kwa AI" : "AI Generate")} | {isGenerating ? (sw ? "Inatengeneza…" : "Generating…") : (sw ? "Niandikie" : "Write it for me")} |
| W57 | `apps/web/components/editor/cover-letter-editor-client.tsx` | {isEnhancing ? (sw ? "Inaboresha…" : "Enhancing…") : (sw ? "Boresha kwa AI" : "AI Enhance")} | {isEnhancing ? (sw ? "Inaboresha…" : "Enhancing…") : (sw ? "Boresha" : "Improve")} |
| W58 | `apps/web/components/editor/cover-letter-editor-client.tsx` | ? "Mstari mtupu = aya mpya. “Tengeneza kwa AI” huandaa rasimu kutoka jina, nafasi na kampuni yako." | ? "Mstari mtupu = aya mpya. “Niandikie” huandaa rasimu kutoka jina, nafasi na kampuni yako." |
| W59 | `apps/web/components/editor/cover-letter-editor-client.tsx` | : "Blank line = new paragraph. AI Generate drafts from your name, role & company; add notes to the body to guide it." | : "Blank line = new paragraph. \"Write it for me\" drafts from your name, role & company; add notes to the body to guide it." |
| W60 | `apps/web/components/editor/letter-editor-client.tsx` | {isEnhancing ? (sw ? "Inaboresha…" : "Enhancing…") : (sw ? "Boresha kwa AI" : "AI Enhance")} | {isEnhancing ? (sw ? "Inaboresha…" : "Enhancing…") : (sw ? "Boresha" : "Improve")} |
| W61 | `apps/web/components/editor/letter-editor-client.tsx` | subtitle={sw ? "AI imeandika upya barua yako iwe wazi na yenye nguvu zaidi." : "AI rewrote your letter to be clearer and more impactful."} | subtitle={sw ? "Nimeandika upya barua yako iwe wazi na yenye nguvu zaidi." : "I rewrote your letter to be clearer and more impactful."} |
| W62 | `apps/web/components/assistant/cv-assistant-client.tsx` | {sw ? "Haya hayapo kwenye CV yako — yameongezwa na AI. Thibitisha kama ni kweli:" : "These aren't in your CV — AI added them. Confirm if true:"} | {sw ? "Haya hayapo kwenye CV yako — nimeyaongeza mimi. Thibitisha kama ni kweli:" : "These aren't in your CV — I added them. Confirm if true:"} |
| W63 | `apps/web/components/assistant/cv-assistant-client.tsx` | {sw ? "Pendekezo la mpango wa kujifunza (AI)" : "Suggested learning plan (AI recommendation)"} | {sw ? "Pendekezo la mpango wa kujifunza" : "Suggested learning plan"} |
| W64 | `apps/web/lib/i18n/translations.ts` | "Paste the job advert. Sumaiya helps you write the CV that matches it, in Swahili, on your phone — free, with no account." | "Paste the job advert. I'm Sumaiya — I'll write the CV that matches it, in Swahili, on your phone, free, with no account." |
| W65 | `apps/web/lib/i18n/translations.ts` | "Bandika tangazo la kazi. Sumaiya anakusaidia kuandika CV inayolingana nalo, kwa Kiswahili, kwenye simu yako — bila malipo, bila akaunti." | "Bandika tangazo la kazi. Mimi ni Sumaiya — nitakuandikia CV inayolingana nalo, kwa Kiswahili, kwenye simu yako, bila malipo, bila akaunti." |
| W66 | `apps/web/lib/i18n/translations.ts` | "Unlock PDF downloads, every look, and AI enhancement" | "Unlock PDF downloads, every look, and help with your wording" |
| W67 | `apps/web/lib/i18n/translations.ts` | "Fungua upakuaji wa PDF, miundo yote, na uboreshaji wa AI" | "Fungua upakuaji wa PDF, miundo yote, na msaada wa kuboresha maandishi yako" |
| W68 | `apps/web/lib/i18n/translations.ts` | a scan or a photo has no text to pull — the AI Assistant reads those. | a scan or a photo has no text to pull — I read those. |
| W69 | `apps/web/lib/i18n/translations.ts` | skani au picha haina maandishi ya kuvuta — Msaidizi wa AI husoma hizo. | skani au picha haina maandishi ya kuvuta — hizo ninazisoma mimi. |
| W70 | `apps/web/lib/i18n/translations.ts` | scans and photos are read by the AI Assistant. | scans and photos are read by me. |
| W71 | `apps/web/lib/i18n/translations.ts` | skani na picha husomwa na Msaidizi wa AI. | skani na picha ninazisoma mimi. |
| W72 | `apps/web/lib/snap-strings.ts` | aiOffline: "Uandishi wa AI haupatikani kwa sasa", | aiOffline: "Siwezi kuandika kwa sasa", |
| W73 | `apps/web/lib/snap-strings.ts` | aiOffline: "AI writing is temporarily unavailable", | aiOffline: "I can't write right now", |
| W74 | `apps/web/lib/pdf-tools.ts` | the AI Assistant can read a photo of a CV for you. | I can read a photo of a CV for you. |
| W75 | `apps/web/lib/pdf-tools.ts` | Msaidizi wa AI anaweza kukusomea picha ya CV. | Mimi naweza kukusomea picha ya CV. |
| W76 | `apps/web/lib/pdf-tools.ts` | you can send it straight to our AI importer and get an editable, ready-to-format CV. | you can send it straight to me and get an editable, ready-to-format CV. |
| W77 | `apps/web/lib/pdf-tools.ts` | unaweza kuyatuma moja kwa moja kwa kiingizaji chetu cha AI na kupata CV inayohaririwa, tayari kupangwa. | unaweza kuyatuma moja kwa moja kwangu na kupata CV inayohaririwa, tayari kupangwa. |
| W78 | `apps/web/lib/api/snap-apply.ts` | ? "Huduma ya AI haipatikani kwa sasa — alama ya CV yako na mpangilio wa CV lengwa ziko hapa, lakini uandishi wa AI umekosekana. Jaribu tena baada ya dakika chache." | ? "Siwezi kuandika kwa sasa — alama ya CV yako na mpangilio wa CV lengwa ziko hapa, lakini sehemu nilizokuwa nikiandika hazipo. Jaribu tena baada ya dakika chache." |
| W79 | `apps/web/lib/api/snap-apply.ts` | : "AI writing is temporarily unavailable — your ATS score and reordered CV are here, but the AI-drafted parts couldn't be generated. Please try again in a few minutes."; | : "I can't write right now — your ATS score and reordered CV are here, but the parts I draft couldn't be generated. Please try again in a few minutes."; |
| W80 | `apps/web/lib/api/snap-apply.ts` | ? "Sehemu moja ya AI haikufanikiwa — angalia matokeo yaliyopo na jaribu tena kama kuna kitu kinakosekana." | ? "Sehemu moja haikufanikiwa — angalia matokeo yaliyopo na jaribu tena kama kuna kitu kinakosekana." |
| W81 | `apps/web/lib/api/snap-apply.ts` | : "One part of the AI output didn't come through — check what's here and retry if something is missing."; | : "One part didn't come through — check what's here and retry if something is missing."; |
| W82 | `apps/web/app/(app)/assistant/page.tsx` | title: lang === "sw" ? "Sumaiya — Msaidizi wako wa AI wa Kazi" : "Sumaiya — Your AI Career Assistant", | Sumaiya — Msaidizi wako wa Kazi |
| W83 | `apps/web/app/(app)/layout.tsx` | ? "Jukwaa la Ajira lenye AI — Tengeneza CV Bila Malipo \| Sumaiya" | ? "Jukwaa la Ajira — Tengeneza CV Bila Malipo \| Sumaiya" |
| W84 | `apps/web/app/(app)/layout.tsx` | ? "Tengeneza CV ya kitaalamu na barua za maombi ya kazi kwa dakika chache ukiwa na Sumaiya, msaidizi wako wa AI — miundo mizuri, upakuaji bila malipo, na kikagua CV. Lengo moja: kupata ajira." | ? "Tengeneza CV ya kitaalamu na barua za maombi ya kazi kwa dakika chache ukiwa na Sumaiya, msaidizi wako wa kazi — miundo mizuri, upakuaji bila malipo, na kikagua CV. Lengo moja: kupata ajira." |
| W85 | `apps/web/app/(app)/layout.tsx` | : "Meet Sumaiya, your AI career assistant. Create a recruiter-ready CV and cover letters in minutes, run a free ATS check, and get matched to jobs. Free CV & resume builder for East Africa."; | : "Meet Sumaiya, your career assistant. Create a recruiter-ready CV and cover letters in minutes, run a free ATS check, and get matched to jobs. Free CV & resume builder for East Africa."; |
| W86 | `apps/web/app/[locale]/(marketing)/about/page.tsx` | ? "Sumaiya huwasaidia watafuta-ajira kujenga CV za kitaalamu zinazopita vichujio vya waajiri, barua za maombi, kadi za biashara na barua rasmi — kwa dakika, kwa msaidizi wa AI, kwa Kiingereza au Kiswahili." | ? "Sumaiya huwasaidia watafuta-ajira kujenga CV za kitaalamu zinazopita vichujio vya waajiri, barua za maombi, kadi za biashara na barua rasmi — kwa dakika, kwa msaidizi wa kazi, kwa Kiingereza au Kiswahili." |
| W87 | `apps/web/app/[locale]/(marketing)/about/page.tsx` | : "Sumaiya helps job seekers build professional, ATS-ready CVs, cover letters, business cards and formal letters — in minutes, with an AI assistant, in English or Kiswahili.", | : "Sumaiya helps job seekers build professional, ATS-ready CVs, cover letters, business cards and formal letters — in minutes, with a career assistant, in English or Kiswahili.", |
| W88 | `apps/web/app/[locale]/(marketing)/about/page.tsx` | title: sw ? "Msaidizi wa AI upande wako" : "An AI assistant on your side", | title: sw ? "Msaidizi wa kazi upande wako" : "A career assistant on your side", |
| W89 | `apps/web/app/[locale]/(marketing)/about/page.tsx` | {sw ? "Hati za kitaalamu, pamoja na msaidizi wa AI" : "Professional documents, with an AI assistant"} | {sw ? "Hati za kitaalamu, pamoja na msaidizi wa kazi" : "Professional documents, with a career assistant"} |
| W90 | `apps/web/app/[locale]/(marketing)/about/page.tsx` | msaidizi wa kuandika wa AI na uhamishaji wa PDF kwa mguso mmoja | msaidizi wa kuandika na uhamishaji wa PDF kwa mguso mmoja |
| W91 | `apps/web/app/[locale]/(marketing)/preview/page.tsx` | title: sw ? "Msaidizi wa Kazi wa AI" : "AI Career Copilot", | title: sw ? "Msaidizi wa Kazi" : "Career Copilot", |
| W92 | `apps/web/app/[locale]/(marketing)/pro/page.tsx` | ? "Chagua kutoka miundo 260+ ya CV, kisha Sumaiya — msaidizi wa AI — anaandika kila sehemu na kukupatia PDF inayopita ATS. Pakua bure kwa Android, kwa Kiswahili au Kiingereza." | ? "Chagua kutoka miundo 260+ ya CV, kisha Sumaiya anakusaidia kuandika kila sehemu na kukupatia PDF inayosomeka kwa mifumo ya kuajiri. Pakua bure kwa Android, kwa Kiswahili au Kiingereza." |
| W93 | `apps/web/app/[locale]/(marketing)/pro/page.tsx` | ? "Miundo ya CV iliyoundwa kwa zama za AI. Chagua muundo, Sumaiya anaandika, pakua PDF." | ? "Chagua muundo, Sumaiya anakusaidia kuandika, nawe unapakua PDF yako." |
| W94 | `apps/web/app/[locale]/(marketing)/tools/tools-client.tsx` | {lang === "sw" ? "Inaendeshwa na AI" : "AI-powered"} | {lang === "sw" ? "Naifanya mimi" : "I do this one"} |
| W95 | `apps/web/app/[locale]/(marketing)/tools/tools-client.tsx` | ? "Miundo ya kitaalamu inayopita ATS, pamoja na msaidizi wa AI." | ? "Miundo ya kitaalamu inayopita vichujio vya waajiri, pamoja na msaidizi wa kazi." |
| W96 | `apps/web/app/[locale]/(marketing)/tools/[slug]/page.tsx` | ? "Template 260+ zinazopita vichujio vya waajiri, kikagua alama papo hapo, na msaidizi wa AI anayekuandikia. Pakua PDF au Word." | ? "Template 260+ zinazopita vichujio vya waajiri, kikagua alama papo hapo, na msaidizi anayekuandikia. Pakua PDF au Word." |
| W98 | `apps/web/components/ui/footer.tsx` | label: "Sumaiya (AI assistant)", labelSw: "Sumaiya (msaidizi wa AI)" | label: "Sumaiya", labelSw: "Sumaiya" |
| W99 | `apps/web/components/ui/footer.tsx` | ? "Msaidizi wako wa kazi wa AI — CV, barua za maombi, ajira na ushauri, mahali pamoja." | ? "Msaidizi wako wa kazi — CV, barua za maombi, ajira na ushauri, mahali pamoja." |
| W100 | `apps/web/components/ui/footer.tsx` | : "Your AI career assistant — CVs, cover letters, jobs and advice in one place." | : "Your career assistant — CVs, cover letters, jobs and advice in one place." |
| W101 | `apps/web/app/(app)/(auth)/sign-in/sign-in-form.tsx` | {sw ? "Msaada wa AI kwa muhtasari na uzoefu" : "AI writing help for your summary & experience"} | {sw ? "Msaada wa kuandika muhtasari na uzoefu" : "Writing help for your summary & experience"} |
| W102 | `apps/web/app/[locale]/(marketing)/home-page-client.tsx` | ? "Bandika tangazo la kazi. Sumaiya anakusaidia kuandika CV inayolingana nalo, kwa Kiswahili — kwenye simu yako, bila malipo, bila akaunti." | ? "Bandika tangazo la kazi. Mimi ni Sumaiya — nitakuandikia CV inayolingana nalo, kwa Kiswahili, kwenye simu yako, bila malipo, bila akaunti." |
| W103 | `apps/web/app/[locale]/(marketing)/home-page-client.tsx` | : "Paste the job advert. Sumaiya helps you write the CV that matches it, in Swahili — on your phone, free, with no account." | : "Paste the job advert. I'm Sumaiya — I'll write the CV that matches it, in Swahili, on your phone, free, with no account." |
| W104 | `apps/web/app/[locale]/(marketing)/home-page-client.tsx` | {lang === "sw" ? "au ongea na Sumaiya" : "or talk to Sumaiya"} | {lang === "sw" ? "au ongea nami" : "or talk to me"} |
| W105 | `apps/web/app/[locale]/(marketing)/home-page-client.tsx` | sw: { t: "2. Jaza maelezo yako", d: "Andika mwenyewe, au jibu maswali ya Sumaiya naye anaandika kila sehemu. Huhitaji maneno ya kitaalamu ili kuanza." }, | sw: { t: "2. Jaza maelezo yako", d: "Andika mwenyewe, au jibu maswali yangu nami ninaandika kila sehemu. Huhitaji maneno ya kitaalamu ili kuanza." }, |
| W106 | `apps/web/app/[locale]/(marketing)/home-page-client.tsx` | en: { t: "2. Fill in your details", d: "Type them in, or answer Sumaiya's questions and she writes each section for you. You do not need professional wording to start." }, | en: { t: "2. Fill in your details", d: "Type them in, or answer my questions and I write each section for you. You do not need professional wording to start." }, |
| W107 | `apps/web/app/[locale]/(marketing)/layout.tsx` | ? "Andika CV yako kwa Kiswahili, kwenye simu yako, bila malipo. Bandika tangazo la kazi na Sumaiya anakusaidia kuandika CV inayolingana nalo — kisha pakua PDF yako bila akaunti." | ? "Andika CV yako kwa Kiswahili, kwenye simu yako, bila malipo. Bandika tangazo la kazi nami nitakuandikia CV inayolingana nalo — kisha pakua PDF yako bila akaunti." |
| W108 | `apps/web/app/[locale]/(marketing)/layout.tsx` | : "Write your CV in Swahili or English, on your phone, free. Paste the job advert and Sumaiya helps you write the CV that matches it — then download your PDF with no account."; | : "Write your CV in Swahili or English, on your phone, free. Paste the job advert and I'll write the CV that matches it — then download your PDF with no account."; |
| N01 | `apps/native/src/screens/app/home-screen.tsx` | { icon: "sumaiya", label: t("Career AI", "AI ya kazi"), tint: c.accent, onPress: () => navigation.navigate("SumaiyaTab") }, | { icon: "sumaiya", label: t("Sumaiya", "Sumaiya"), tint: c.accent, onPress: () => navigation.navigate("SumaiyaTab") }, |
| N02 | `apps/native/src/lib/cv-fetch-error.ts` | en: "Your session has expired, so Sumaiya couldn't open your CVs. Sign in again and they'll be here.", | en: "Your session has expired, so I couldn't open your CVs. Sign in again and they'll be here.", |
| N03 | `apps/native/src/lib/cv-fetch-error.ts` | sw: "Kipindi chako kimeisha, hivyo Sumaiya haikuweza kufungua CV zako. Ingia tena na zitakuwa hapa.", | sw: "Kipindi chako kimeisha, hivyo sikuweza kufungua CV zako. Ingia tena na zitakuwa hapa.", |
| N04 | `apps/native/src/lib/cv-fetch-error.ts` | title: { en: "Sumaiya is having trouble", sw: "Sumaiya ina hitilafu" }, | title: { en: "I'm having trouble", sw: "Nina hitilafu" }, |
| N05 | `apps/native/src/screens/app/memory-screen.tsx` | t("What Sumaiya knows", "Anachojua Sumaiya") | t("What I know about you", "Ninachokujua") |
| N06 | `apps/native/src/screens/app/memory-screen.tsx` | "Sumaiya will stop learning about you, and everything she has noted so far will be permanently deleted. She will still work — she just won't remember between visits.", | "I will stop learning about you, and everything I have noted so far will be permanently deleted. I will still work — I just won't remember between visits.", |
| N07 | `apps/native/src/screens/app/memory-screen.tsx` | "Sumaiya ataacha kujifunza kukuhusu, na kila alichokumbuka kufikia sasa kitafutwa kabisa. Ataendelea kufanya kazi — hatawahi kukumbuka kati ya ziara.", | "Nitaacha kujifunza kukuhusu, na kila nilichokumbuka kufikia sasa kitafutwa kabisa. Nitaendelea kufanya kazi — sitakumbuka kati ya ziara.", |
| N08 | `apps/native/src/screens/app/memory-screen.tsx` | "So she can help you better over time, Sumaiya keeps short notes about your activity and draws conclusions from them. Everything below is stored on this phone, is never sold, and is never used for advertising. She only advises — t | "So I can help you better over time, I keep short notes about your activity and draw conclusions from them. Everything below is stored on this phone, is never sold, and is never used for advertising. I only advise — the decisions  |
| N09 | `apps/native/src/screens/app/memory-screen.tsx` | "Ili akusaidie zaidi kadiri muda unavyopita, Sumaiya anaweka kumbukumbu fupi za matumizi yako na kutoa hitimisho kutoka humo. Kila kitu hapa chini kimehifadhiwa kwenye simu hii, hakiuza, na hakitumiki kwa matangazo. Anashauri tu — | "Ili nikusaidie zaidi kadiri muda unavyopita, ninaweka kumbukumbu fupi za matumizi yako na kutoa hitimisho kutoka humo. Kila kitu hapa chini kimehifadhiwa kwenye simu hii, hakiuza, na hakitumiki kwa matangazo. Nashauri tu — maamuz |
| N10 | `apps/native/src/screens/app/profile-screen.tsx` | "Not available yet — this version of Sumaiya can't send alerts to your phone.",                     "Bado haipatikani — toleo hili la Sumaiya haliwezi kutuma arifa kwenye simu yako.", | "Not available yet — this version can't send alerts to your phone.",                     "Bado haipatikani — toleo hili haliwezi kutuma arifa kwenye simu yako.", |
| N11 | `apps/native/src/screens/app/help-faq-screen.tsx` | sw: "Premium inafungua miundo ya hali ya juu ya CV, miongozo ya kina ya kazi na usaidizi zaidi wa AI. Kila kitu muhimu — kuandaa, kurekebisha na kuhamisha CV yako — kinabaki bure.", | sw: "Premium inafungua miundo ya hali ya juu ya CV, miongozo ya kina ya kazi na usaidizi zaidi wa kuandika. Kila kitu muhimu — kuandaa, kurekebisha na kuhamisha CV yako — kinabaki bure.", |
| N12 | `apps/native/src/screens/app/help-faq-screen.tsx` | en: "Premium unlocks advanced CV templates, deep career guides and more tailored AI help. Everything essential — building, tailoring and exporting your CV — stays free.", | en: "Premium unlocks advanced CV templates, deep career guides and more tailored writing help. Everything essential — building, tailoring and exporting your CV — stays free.", |
| N13 | `apps/native/src/screens/ats-checker-screen.tsx` | "Deterministic checks — the same ones a real ATS runs. No AI, nothing sent anywhere.",                       "Ukaguzi wa uhakika — sawa na mifumo halisi ya kuajiri. Hakuna AI, hakuna kinachotumwa popote.", | "Deterministic checks — the same ones a real ATS runs. Nothing is sent anywhere.",                       "Ukaguzi wa uhakika — sawa na mifumo halisi ya kuajiri. Hakuna kinachotumwa popote.", |
| N14 | `apps/native/src/screens/learning-hub-screen.tsx` | accessibilityLabel={t("Ask Sumaiya anything", "Muulize Sumaiya chochote")} | accessibilityLabel={t("Ask me anything", "Niulize chochote")} |
| N15 | `apps/native/src/screens/learning-hub-screen.tsx` | {t("Ask Sumaiya anything", "Muulize Sumaiya chochote")} → | {t("Ask me anything", "Niulize chochote")} → |
| X01 | `apps/web/app/[locale]/(marketing)/about/page.tsx` | kwa njia ambayo ni ya haraka, nafuu na inayosaidiwa na AI. | kwa njia ambayo ni ya haraka, nafuu na yenye msaada wa kuandika. |
| X02 | `apps/web/app/[locale]/(marketing)/about/page.tsx` | in a form that’s fast, affordable and guided by AI. | in a form that’s fast, affordable and comes with writing help. |
| X03 | `apps/web/app/[locale]/(marketing)/pro/page.tsx` | TemplateHub Pro — miundo ya CV iliyoundwa kwa zama za AI | TemplateHub Pro — miundo ya CV ya kitaalamu |
| X04 | `apps/web/app/[locale]/(marketing)/pro/page.tsx` | TemplateHub Pro — CV designs built for the age of AI | TemplateHub Pro — professional CV designs |
| X05 | `apps/web/app/[locale]/(marketing)/pro/page.tsx` | Choose from 260+ CV designs, then Sumaiya — your AI assistant — writes every section and hands you an ATS-ready PDF. | Choose from 260+ CV designs, then Sumaiya writes every section and hands you an ATS-ready PDF. |
| X06 | `apps/web/app/[locale]/(marketing)/pro/page.tsx` | CV designs built for the age of AI. Pick a design, Sumaiya writes it, download the PDF. | Professional CV designs. Pick a design, Sumaiya writes it, download the PDF. |
| X07 | `apps/web/components/marketing/templatehub-pro-landing.tsx` | Miundo ya CV iliyoundwa kwa / zama za AI. | Miundo ya CV iliyoundwa kwa / uangalifu mkubwa. |
| X08 | `apps/web/components/marketing/templatehub-pro-landing.tsx` | CV designs built for / the age of AI. | CV designs built with / real care. |
| X09 | `apps/web/app/[locale]/(marketing)/tools/[slug]/page.tsx` | ukitumia muundo rafiki kwa waajiri na msaidizi wa AI. | ukitumia muundo rafiki kwa waajiri na msaidizi wa kazi. |
| X10 | `apps/web/components/assistant/cv-assistant-client.tsx` | aria-label={sw ? "Kiwango cha uchambuzi wa AI" : "AI thinking effort"} | aria-label={sw ? "Kiwango cha uchambuzi" : "Thinking effort"} |
| X11 | `apps/web/components/editor/ai-suggestion-modal.tsx` | {sw ? "Pendekezo la AI" : "AI suggestion"} | {sw ? "Pendekezo langu" : "My suggestion"} |
| X12 | `apps/web/lib/api/routes/mobile.ts` | "Sumaiya is taking too long to respond. Try again." | "I'm taking too long to respond. Try again." |
| X13 | `apps/web/lib/api/routes/mobile.ts` | "Sumaiya is taking too long. Try again." | "I'm taking too long. Try again." |
| Y01 | `apps/web/components/pdf-tools/import-cv-client.tsx` | AI inaelewa CV yako… / AI is understanding your CV… | Ninaichambua CV yako… / Working out what is in your CV… |
| Y02 | `apps/web/components/editor/editor-profile-menu.tsx` | AI inasoma… / AI is reading… | Ninasoma… / I'm reading… |
| Y03 | `apps/web/app/api/[[...route]]/route.ts` | AI rate limit exceeded. Try again in a minute. | I can't take any more requests right now. Try again in a minute. |
| Y04 | `apps/web/lib/api/routes/ai.ts` | The AI took too long to read this CV. Please try again. | I ran out of time reading that CV. Please try again. |
| Y05 | `apps/web/lib/api/routes/ai.ts` | The AI took too long. Please try again. | I ran out of time. Please try again. |
| AA1 | `apps/web/lib/email.ts` | with 11 stunning templates, AI-powered content suggestions, and one-click PDF export. | with 11 stunning templates, writing help, and one-click PDF export. |
| AA2 | `apps/web/lib/email.ts` | Fill in your details — or let AI help you | Fill in your details — or let me help you |
| AA3 | `apps/web/app/[locale]/(marketing)/preview/page.tsx` | Mwambie AI unachohitaji. Inaongoza kutoka hapo | Niambie unachohitaji. Nitaongoza kutoka hapo |
| AA4 | `apps/web/app/[locale]/(marketing)/preview/page.tsx` | Tell the AI what you need. It leads from there | Tell me what you need. I will lead from there |
| AA5 | `apps/web/lib/api/routes/ai.ts` | …You are a highly capable professional on the user's side.` | …the user's side. + the VOICE clause (first person, no third person about herself, no 'AI' in Swahili) |
| AA6 | `apps/web/lib/api/routes/mobile.ts` | …Stop on the one goal they came with; don't drift to a side topic.` | …side topic. + the same VOICE clause |
| AA7 | `apps/web/lib/ai/prompts.ts` | assistant.system@v2.0 / assistant.mobile@v1.1 | assistant.system@v2.1 / assistant.mobile@v1.2 (version ledger bumped) |
| AA8 | `apps/web/app/[locale]/(marketing)/templates/[slug]/page.tsx` | ✓ AI writing help for your summary &amp; experience | ✓ Writing help for your summary &amp; experience |
| AA9 | `apps/web/app/[locale]/(marketing)/tools/tools-client.tsx` | Professional ATS-optimized templates with an AI assistant. | Professional ATS-optimized templates with a writing assistant. |
| AA10 | `apps/web/app/[locale]/(marketing)/tools/[slug]/page.tsx` | an AI assistant that writes it with you / and an AI assistant. | a writing assistant that works on it with you / and a writing assistant. |
| AA11 | `apps/web/app/[locale]/(marketing)/templates/page.tsx` | alt: … with an AI assistant | alt: … with a career-writing assistant |
| AA12 | `apps/web/app/(app)/layout.tsx + apps/web/app/[locale]/layout.tsx` | Sumaiya — AI Career Platform: CV, Job Match & Interview Prep | Sumaiya — Career Platform: CV, Job Match & Interview Prep |
| AA13 | `apps/web/components/dashboard/application-workspace.tsx` | …uppercase tracking-wide">AI</span>} | …uppercase tracking-wide">Sumaiya</span>} |
| AA14 | `apps/web/components/editor/job-target-panel.tsx` | …uppercase tracking-wide">AI</span> | …uppercase tracking-wide">Sumaiya</span> |
| AA15 | `apps/web/components/assistant/cv-assistant-client.tsx` | title: `AI: ${toolName} (…` | title: `Sumaiya: ${toolName} (…` |
| AA16 | `apps/web/app/[locale]/(marketing)/about/page.tsx` | an AI writing assistant and one-tap PDF export | a writing assistant and one-tap PDF export |
| AA17 | `apps/web/app/(app)/layout.tsx + apps/web/app/[locale]/layout.tsx` | with an AI assistant (og alt + JSON-LD x4) | with a career-writing assistant (og alt + JSON-LD x4) |

---

## 4 · WHAT WAS DELIBERATELY LEFT

| Left as-is | Where | Why |
|---|---|---|
| Third-person marketing narration | `apps/web/app/[locale]/(marketing)/{home-page-client,about,pro,pata-kazi,layout}.tsx`, `apps/web/components/marketing/templatehub-pro-landing.tsx` | Brand surface. The company speaking about her to a stranger is the normal register (rule clause 2). `AI` was removed from every one of them. |
| Legal AI disclosure | `apps/native/src/screens/app/privacy-screen.tsx:34,69,72`; `apps/web/app/[locale]/(marketing)/privacy/page.tsx` | The privacy policy must name third-party AI processors and warn that some content is AI-generated. Removing those words would be a truth regression, not a voice fix. |
| `"AI is not configured."` (14 sites) | `apps/web/lib/api/routes/ai.ts:*` | Reachable in production today (`/api/ai/status` → `{"configured":false}`) and the only on-wire signal a developer gets that the provider is off. English, so it does not break the Swahili rule. **Flagged for a follow-up**: it should be localised, and reworded, once the AI is switched on. |
| Swahili meta keywords | `apps/web/app/(app)/layout.tsx:77`, `apps/web/app/[locale]/layout.tsx:101` | Invisible to users; `msaidizi wa CV AI` and `AI ya kutengeneza CV` are strings Tanzanians may actually search. |
| Admin dashboard label `AI calls` | `apps/web/app/(app)/admin/page.tsx:68` | Internal operator surface, not user copy. |
| `Sumaiya` in the model system prompt | `apps/web/lib/api/routes/ai.ts:670` | Prompt text, never rendered to a user. |
| `MIMI` / `MSAIDIZI` role labels | `apps/web/components/assistant/cv-assistant-client.tsx:1112` | Transcript roles sent to the model, not displayed. |
| `Kuhusu Mimi` ("About Me") | `apps/web/components/templates/haven.tsx:62` | That is a CV template's section heading, i.e. the **user's** first person, not the app's. |
| `Kazi zinazofanana na mimi` ("Jobs matching me") | `apps/web/components/assistant/cv-assistant-client.tsx:2735` | Ambiguous ownership; read as the user's voice ("jobs matching me"), and changing it would be a guess. Flagged. |
| Onboarding strings | `apps/native/src/screens/onboarding-screen.tsx` | Owned by the sibling agent working on new-vs-returning onboarding. Already reads correctly in the first person (`Karibu — mimi ni Sumaiya`, `Ninatengeneza kila kitu`, `Bandika ajira nami nabadilisha CV yako`). Not touched. |
| Chat composer / job-picker components | `apps/native/src/components/chat/*`, the chat job picker | Owned by the sibling agent (b). Strings only were eligible here; none needed changing. |

---

## 5 · HOW IT WAS REVIEWED

* **Claude CLI — attempted, unusable.** The owner's paid tool is session-limited until 01:40 EAT: one
  invocation returned exit 1 with `You've hit your session limit · resets 1:40am (Africa/Nairobi)` (64 bytes).
  Not retried in a loop.
* **OpenRouter — used instead, `:free` models only.** All 123 string entries were sent in four sequential chunks to
  `inclusionai/ling-3.0-flash-vl:free` (the model verified working; rotation list on 429 was not needed — no
  429 occurred). **123 of 123 carried a model verdict.** 19 further rows were added AFTER that review, by grep sweeps run on the applied tree to catch leftover `AI`
  labels the first inventory missed: the import/upload progress lines (`AI inasoma…` → `Ninasoma…`,
  `AI inaelewa CV yako…` → `Ninaichambua CV yako…`), the two tools-API photo errors (`attach it in the AI
  Assistant` → `attach it in my chat`), the API timeout and rate-limit errors, the `AI suggestion` modal title,
  and the TemplateHub Pro `age of AI` headlines. Those 19 carry no model verdict and were applied on my own
  judgement; every one is listed in the table above.
* **Three corrections the judge caught were adopted:** `mimi huzisoma` → the `hu-` habitual is wrong with
  `mimi`; `mimi naweza` needs a capital at sentence start; and `Msaidizi wako wa Kazi wa Ajira` was redundant
  → `Msaidizi wako wa Kazi`.
* **One judge edit was rejected:** on the tools meta description it rewrote `bila malipo` as `bila malipi`
  (a typo). The AI removal from that line was applied by hand instead; the pre-existing `muundo rafiki kwa
  waajiri` (a calque of "employer-friendly") was not touched, because that is a Swahili-naturalness question
  outside this change's scope and is flagged below.

---

## 5b · THE PROMPT GAP — where the rule was NOT, until now

A string inventory cannot see the model's own output. The two conversational system prompts that define how
Sumaiya speaks imposed a warm-human persona and banned English canned phrases (`"As an AI"`, `"I'm happy to
help"`) — but **neither forbade the third person about herself and neither forbade the word `AI` in Swahili**.
So a model could have answered *"Sumaiya anakusaidia kuandika CV"* or *"Mimi ni msaidizi wa AI"* and been
compliant with its instructions while off-register with every string in the app.

| what | where | was |
|---|---|---|
| `assistant.system` (web `/assistant-turn`) | `apps/web/lib/api/routes/ai.ts:670` | persona + English canned-phrase ban, no rule about the third person or `AI` in Swahili |
| `assistant.mobile` (native `/chat`) | `apps/web/lib/api/routes/mobile.ts:136` | same gap |
| prompt version ledger | `apps/web/lib/ai/prompts.ts` | `assistant.system@v2.0`, `assistant.mobile@v1.1` — no voice rule recorded |

**Fixed here.** One `VOICE` clause was appended to both prompts, and both versions bumped
(`assistant.system` → `v2.1`, `assistant.mobile` → `v1.2`, per the registry's own "bump on any wording change"
rule). The clause, verbatim as it now sits in both prompts:

> `VOICE — you are ONE person and you speak for yourself (non-negotiable): always use the FIRST PERSON about`
> `yourself and your own actions — "ninaweza", "nitaandikia", "niambie", "nami", "nimeandika", "Mimi ni`
> `Sumaiya". NEVER talk about yourself in the third person ("Sumaiya anaandika", "Sumaiya itakusaidia", "the`
> `app can…") and never describe yourself as a feature or a product. In Swahili, NEVER use the word "AI" about`
> `yourself or about anything the user can see — not "AI", not "Msaidizi wa AI", not "AI ya kazi", not`
> `"Sumaiya AI". In Swahili you are "msaidizi wako wa kazi", and you always name what you DO, never what you`
> `are made of. If the user calls you "AI", answer warmly as a person and move on — never adopt the label.`

**Still in the prompt and deliberately so:** the opening line of both prompts calls her "the warm **AI**
companion" / "a real, warm person behind the screen". That is an instruction addressed to the model, never
text a user sees, and it is the sentence that tells the model *what it is* so it can behave like a person. It
is not user-facing copy and the rule does not reach it.

### And the model already does it

Evidence that this rule is describing the product's own behaviour rather than imposing a house style: with the
AI live (`/api/ai/status` → `{"configured":true,"provider":"deepseek"}`) a real Swahili turn was answered in
1.79 s —

> **user:** *"Nisaidie kuandika muhtasari mfupi wa CV ya huduma kwa mteja."*
> **Sumaiya:** *"Nzuri, hiyo ni kazi nzuri. **Niambie** kwanza — unafanya kazi gani kwa sasa au ulifanya mara
> ya mwisho, na kwa kampuni gani?"*

First person, a question rather than a self-description, no `AI`, no third person. The rest of the copy is
being brought up to what the model already does.

---

## 6 · WHAT I COULD NOT VERIFY

* The judge is a free OpenRouter model, **not a native speaker and not a person**. Every Swahili string here
  is a proposal that passed a model review, not a native-speaker sign-off.
* Nothing here has been seen on a phone. The native changes are not visible on the device until the owner
  clears a build; the phone was disconnected for this task and `adb` was not called.
* Nothing has been seen on the live site — the change is committed to `main`, not deployed.
* Two Swahili questions are left open for the owner rather than smoothed over — see §7.

---

## 7 · FLAGGED FOR THE OWNER — Swahili I am not confident a native speaker would endorse

1. **`Ninaichambua CV yako…`** (import-CV progress step, was `AI inaelewa CV yako…`).
   `kuchambua` = to analyse/examine. It is correct Swahili but it is slightly technical — a caller at a kiosk
   might say *"Ninaisoma CV yako"* instead, which is plainer but then collides with the step above it
   (`Ninasoma faili…`). **Question for the owner: `Ninaichambua` or `Ninaisoma`?**
2. **`Nikusaidie nini?`** as the label of the three-item tools menu in the CV editor
   (was `Zana za AI` / `AI Tools`). It is deliberately her asking the question rather than a tool shelf —
   which is the rule — but it is a different kind of label from `AI Tools` and the owner may prefer a plain
   noun. **Question: `Nikusaidie nini?` or a noun?**
3. **`Mimi ni Sumaiya — nitakuandikia…`** in the landing hero subhead (was
   `Sumaiya anakusaidia kuandika…`). This is the one brand-surface string changed to the first person, and the
   reason is that the `SumaiyaMark` sits beside it — under rule clause 4 the mark promises that the words are
   hers. It also keeps her name in the hero (the H1 no longer names her) and answers pass C's finding directly.
   **If the owner prefers the hero to stay company-voiced, the alternative is one line: keep the sentence in the
   third person and take the mark off it.**
4. **`muundo rafiki kwa waajiri`** (tools page) — a calque of "employer-friendly". Left untouched, flagged.
5. **`the AI Assistant` in two tools-API error messages** — `apps/web/lib/api/routes/tools.ts:588,639`
   (*"attach it in the AI Assistant (it reads photos on your device)"*, *"which reads photos"*). These ARE
   user-facing and belong in the rule. **Deliberately not changed here**: the test that asserts on them,
   `apps/web/lib/api/routes/tools-extract.test.ts`, is a *sibling agent's uncommitted work* (not in `HEAD`), so
   the message and its test have to change together in that workstream. The change is one line each: the pointer
   becomes *"attach it in my chat (I read photos on your device)"* and *"attach it in my chat — I read photos"*,
   with the test's `/AI Assistant/i` becoming `/my chat/i`. **Note for whoever lands that file.**
6. **Repo state, so it is on the record:** siblings were committing to `main` in this same working tree
   throughout. `HEAD` moved four times while this task ran (`dafa760` → `8d2f2a6` → `4e6dd51` → `b8704a3` →
   `6311136` → `ed6a9e0`), and a sibling's `git add` sweep swept most of this task's uncommitted string edits
   into their own commits. The edits are in `HEAD` (verified: 145 of 149 checked `new` strings present, and the
   remaining 4 are the judged overrides, also present) — but they are spread across sibling commit messages
   rather than sitting in one commit of their own. The prompt clause and this document are the parts that land
   in their own commit.
7. **`ukitumia muundo rafiki kwa waajiri`**, **`inayopita wakaguzi`** (`pata-kazi`) and
   **`kuzungumza na Sumaiya`** (native FAQ) are third-person brand strings that pass under the rule but are
   worth a native read on their own Swahili.
