# Template design judgement — the seven paid flagships (+ `console`)

**Date:** 2026-09-21 · **Author:** design-review pass, delegated · **Scope:** judgement only. No template
or engine file was edited by this pass; a sibling agent owns the mechanical fixes.

**The complaint being answered:** *"focus on the templates themselves they are not good and render poor I
feel check them."*

**The verdict up front: he is right, and the problem is worse than "renders poor".** Two of the seven
things the product charges for are the *same file in a different colour* as two others, and four of the
seven leave between a quarter and a third of the page blank. `malachite` is a free-tier layout being sold
as a flagship, and `kioo`'s headline feature is invisible in the state the sample ships in. The clearest
single sentence: **a user who paid for seven designs got five, and bought two of them twice.**

---

## 0. What I looked at, and the limits of this pass

**The sample: 8 renders out of 47 offered templates.** `rift`, `zahabu`, `nuru`, `pemba`, `malachite`,
`coral`, `kioo` (the seven `PREMIUM_TEMPLATE_IDS` in `apps/web/lib/templates/curation.ts:37-39`) plus
`console`. Captured by `scripts/template-render-probe.mjs` from the live site at `/en/templates/<id>`,
2× device scale. **Nothing in this report generalises to the other 39** — 8 of 47 is a sample, and it is
deliberately a biased one (it is the paid tier, not a random draw).

Two facts about the sample that change how the renders must be read:

1. **Every render is in the no-photo fallback state.** `apps/web/lib/sample-cv.ts:35` sets `photo: ""`
   deliberately (*"No photo is included on purpose"*, line 19). So all eight renders show the initials
   placeholder, and several of these designs are built around a portrait. This is the single largest
   blind spot in the pass, and it is stated again in §5.
2. **The sheet in each PNG is 760 × 1076 px, not 794 × 1123**, and it is not a uniform downscale — the
   renders are `SmartFit`-magnified (see §3, R1). I measured the consequences rather than assuming them.

**How I measured the page fill** (used throughout, and repeatable): the PNG is opened with Pillow, and
for each row I find the row's own modal colour, then count pixels differing from it. The lowest row with
≥4 such pixels is the last row of ink, as a fraction of the full sheet height. Rows below the sheet
(uniform background) register no ink. Light-background templates were checked with a luminance rule as a
cross-check; the two methods agree on the templates where both apply.

**What I refused to do.** Anything quotable is grepped out of `apps/web/components/templates/*.tsx`, never
read off a 760px-wide image where the body text is ~10px tall. No spelling, wording or label is reported
as a defect from pixels anywhere in this document. Where I name a label, it is a source citation.

---

## 1. Per-template verdict

### `rift` — premium, sidebar · **68% of the sheet filled**

**Trying to be:** the safe "designed résumé" — a deep colour rail carrying the portrait, contact, skill
bars and languages, with a calm white document column that does the reading. It is the most conventional
idea in the set and the one closest to what a Tanzanian user will have seen in a good Word template.

**Does it succeed?** Partly, and only as a free template. It is the most *legible* of the seven and the
accent is used honestly (rail, section dashes, bullets, date pills all take `primaryColor`). The name is
the largest thing on the page and the job title sits in an accent pill beneath it — a clear, competent
opening.

**The single biggest thing wrong:** there is no typographic hierarchy below the job title, so the whole
lower half of the page is one grey texture. Source, `rift.tsx`: the profile paragraph is 11px, the company
line 11px, the education degree 11px, the certification line 11px, the bullets 10.5px, the dates 9.5px. The
gap between *a bullet* and *a date* is 1px; between *a job title* and *a bullet* it is 2px. Seven of the
eight sizes in the file sit inside a 9.5–12.5px band. A reader cannot skim this document; they have to read
it. This is the reverse view of the 9px measurement: the fault is not only that the smallest text is small,
it is that **nothing is large** — there is no second tier between 12.5 and 9.5.

**Second fault, same root:** the rail stacks Skills (bars), Languages (5 dots) and Interests (a paragraph),
all at 10–10.5px in the same colour, separated only by a 10px letterspaced label. Three lists, one texture.

### `zahabu` — premium, sidebar · **78% rail / 65% document column**

**Trying to be:** the bold brand résumé — a fixed charcoal rail under a single swappable accent, with that
accent doing all the work: icon-badge section headers, accent skill bars, an accent timeline spine with
circular nodes down the experience column. High-contrast and confident. `zahabu` puts the *name in the
rail*, so the document column starts straight at content.

**Does it succeed?** Yes — this is the most consistently *designed* of the four rail templates. The badge
headers (`zahabu.tsx:34-43`), the accent bars and the timeline read as one system rather than three
decorations, and the timeline is the only place in the set where experience is given a shape instead of a
list.

**The single biggest thing wrong:** the rail and the timeline both stop long before the page does, so the
page ends by fizzling out. Measured: the rail's last text (Interests) reaches 78% of the sheet; the
document column's last text (Certifications) reaches **65%** — a third of the reading column is blank white
below the last line, and the accent timeline spine visibly terminates in mid-air above that white space.
It reads as an unfinished page, not as a deliberate margin. Compounding it, the badge system does not
distinguish: **the Profile badge and the Certifications badge carry the same icon** (`IcoStar`, lines 122
and 174), so the one graphic device that is supposed to orient the reader repeats itself immediately.

### `nuru` — premium · **85% (the best-filled of the seven)**

**Trying to be:** the infographic CV — a dark two-tone header carrying a derived stat strip, skills as SVG
donut gauges, experience down an accent timeline. This is the only one of the seven with a real *graphic*
idea rather than a layout idea, and it is the one the previous audit also singled out as the only executed
concept.

**Does it succeed?** As a piece of design, yes — the stat strip and the rings are the most memorable thing
in the whole sample, and it is the best-filled of the paid set (85%). It is also the most dangerous.

**The single biggest thing wrong:** **the graphics are decoration pretending to be information.** Two
concrete cases, both from `nuru.tsx`:

- The rings show a percentage that the user never entered. `nuru.tsx:18` computes
  `pct = Math.round((level / 5) * 100)`, so a skill stored as level 4 is printed as **80**, and level 5 as
  **100** — an invented 0–100 precision bolted onto a soft 1–5 self-assessment. The render shows `100`,
  `100`, `80`, `80`, `60`. A recruiter will read those as measured scores.
- The stat strip prints counts as CV facts, with hardcoded plural labels (`nuru.tsx:48-50`: `"Roles"`,
  `"Certs"`). With one certification in the data it renders **"1 CERTS"** — a broken word *and* a metric
  that tells a recruiter nothing. `"2 ROLES"` and `"5 SKILLS"` are equally empty.

A CV's one unforgivable sin is claiming something the user did not say. `nuru` does it four times in the
top fifth of the page — which is the part a reader sees first.

### `pemba` — premium · **81% filled · the best-designed document of the eight**

**Trying to be:** editorial — a magazine opening spread. Oversized serif name, a mono kicker over every
section, a full-width drop-cap lead paragraph, then a disciplined two-column grid split by a hairline rule.
Its own header comment (`pemba.tsx:11-16`) says it is for people whose taste is part of the pitch, and it
is the only template in the sample where **typography** — a serif face, an italic job title, small
letterspaced mono caps — is doing the work instead of colour and widgets.

**Does it succeed?** Yes, clearly. `pemba` is the one of the eight that a designer would defend in a
portfolio, and the only one where the constraints (one accent, no fills, no icons) are visibly a choice
rather than a shortage.

**The single biggest thing wrong:** the right-hand rail is a junk drawer, and it buries the contact
details. Source order in the right column (`pemba.tsx:120, 133, 143, 154, 165`): Education → Expertise →
**Contact** → Languages → Interests. The four things a recruiter scans for first — email, phone,
languages — sit in the third, fourth and fifth slots, partway down the page at 11–11.5px, underneath a
skills list. Every other template in the sample puts contact in the first block. It also leaves the two
columns visibly unbalanced: the rail ends up shorter than the left column and the vertical rule between
them dies in white space (left column last text 79.5%, right 80.9% — both well above the fold of the page's
bottom third).

### `malachite` — premium, header · **65% filled — the emptiest page in the set**

**Trying to be:** the clean modern two-column résumé — name and inline contact row at the top under a 2px
accent rule, a ringed portrait on the right of the header, then experience/education wide on the left with
a rail of accent skill chips, languages, certifications and interests on the right. Chips are its
signature.

**Does it succeed?** Element by element, nothing is wrong: the header rule, the chip rail and the italic
accents are all tidy and correctly aligned. As a *page*, it fails.

**The single biggest thing wrong:** **it does not read as premium, and it is the emptiest template
measured.** Text stops at **65% of the sheet** — over a third of the page is blank white, more than any
other render in the sample. Nothing is wrong with the last 35%; there is simply nothing there. Its only
signature is a 10px chip, and the chip rail wraps into three short rows that leave the right column
ragged. Set beside `pemba` or `nuru`, this page looks like the template a competitor gives away — which
makes it a commercial problem, not just an aesthetic one, because it is one of the seven the product
charges for.

### `coral` — premium, sidebar · **72% filled**

**Trying to be:** colour-forward and friendly — every section in both columns is introduced by a filled
accent bar with an icon (`coral.tsx:41-47`), tying a photo rail and a timelined document column together
under one bright hue. This is the look of the big consumer CV builders.

**Does it succeed?** It is unmistakably bright, the bar system is applied with total consistency, and
nothing is misaligned. It is also the loudest and the least useful of the seven.

**The single biggest thing wrong:** **the bars are the design and they out-shout the content.** Nine filled
accent bars (`coral.tsx:57, 68, 84, 100, 110, 117, 144, 161, 175`) at 11.5px uppercase white on
full-saturation colour, plus an accent disc behind the avatar. A recruiter's eye lands nine times on
section *headings* and never establishes a reading path through the prose between them; the page reads as a
dashboard. **And the iconography is pure noise:** `IcoUser` labels Contact, Profile *and* Referees; `IcoStar`
labels Skills, Languages *and* Certifications. Six of the nine badges are a duplicate of an unrelated
badge, so the one graphic device the user is invited to navigate by carries no information at all.

### `kioo` — premium, sidebar · **75% rail / 69% document column — the worst in the set as shipped**

**Trying to be:** photo-forward. Its own comment (`kioo.tsx:28-32`) is explicit: *"A real edge-to-edge
portrait fills the top of a full-height left column... The bold photo column is the signature — no other
template lets the portrait own the page like this."*

**Does it succeed?** The name plate is the nicest *thing* in the sample: a bordered box with a 6px accent
left edge and an uppercase letterspaced title (`kioo.tsx:119-122`). Taken as a whole, no — and for a
reason the template cannot control.

**The single biggest thing wrong:** **in the state the sample ships in, its signature feature is a large
empty rectangle.** With no photo (`kioo.tsx:58-67`) the full-bleed portrait area becomes a flat block of
the accent colour `height: 300` in a 272px column — that is **27% of the sheet in one flat colour**, the
largest uninterrupted area of any render here, holding nothing but the initials at 72px. A first-time user
with no photo does not see a photo-forward design; they see a navy hole at the top of their CV. The rest of
the file is the second problem: **it is `rift` with the palette swapped** — see §2.

### `console` — curated free, contemporary · **89% filled — the most coherent concept of the eight**

**Trying to be:** a terminal session as a résumé, for developers: window chrome with traffic lights, the
name printed after a `#` prompt, contact rendered as variable declarations, `//` comments for dates,
`##` for section headings, ASCII block meters for skills. It documents that it ignores the user's font
choice on purpose (`console.tsx:32`).

**Does it succeed?** As a concept, better than any of the seven paid ones: every element belongs to the
same idea, it is the best filled of the sample (89%), and it is the only template where an invisible
section header (`## skills`) still works as a header.

**The single biggest thing wrong:** **the ASCII meters are not legible as data, and they are reused for two
different lists.** A level is drawn as 10 block characters (`console.tsx:37-45`), so at page size the
"gauge" is a smear of green with no readable resolution — a 3 and a 4 differ by one character of a solid
run. The same widget carries skills *and* languages (`console.tsx:114, 147`), so the two lists are visually
identical again, exactly as in the four rail templates. Secondary: on the one template where a developer
would most want their own monospace, the font picker silently does nothing.

---

## 2. The commercial question, answered directly

**Are the seven premium templates genuinely seven different designs, or the same layout recoloured?**

**Not three layouts in seven palettes — but four of the seven are two layouts run twice.** There are five
skeletons in the paid set; two of them are shipped twice.

**Family A — full-height colour rail, name in the document column: `rift` and `kioo`.**
These are one design in two palettes, and the evidence is not impressionistic:

| | `rift` | `kioo` |
|---|---|---|
| Rail width | 270px (`rift.tsx:47`) | 272px (`kioo.tsx:57`) |
| Rail sections, in order | Contact, Skills, Languages, Interests | Contact, Skills, Languages, Interests |
| Rail widget per section | bars / 5 dots / paragraph | bars / text with `—` / paragraph |
| Document-column type sizes | 9.5, 10, 10.5, 11, 11.5, 12, 12.5 | 9.5, 10, 10.5, 11, 11.5, 12.5, 13 |
| Role title / company / bullets / dates | 12.5 / 11 / 10.5 / 9.5 | 12.5 / 11 / 10.5 / 9.5 |
| Section-header device | 16px dash + 12px caps | 22px dash + 13px caps |
| Bullet glyph | `▸` | `▪` |
| Name treatment | 33px plain + accent pill | 30px boxed name plate |
| Real difference | ringed 116px portrait · date pills | 300px full-bleed portrait · plain dates |

Seven of the eight document-column type sizes are **byte-identical between the two files**, the rail is 2px
different in width, and the rail's four sections appear in the same order with the same widget vocabulary.
The genuine differences are the portrait treatment and the date styling. **One layout, two palettes.**

**Family B — full-height rail with the name in the rail: `zahabu` and `coral`.**
Both move the name into the rail and both send the document column to a bespoke accent header device:
`zahabu` uses colour icon badges three times per column, `coral` uses filled accent bars nine times. Both
run skill bars plus a language meter in the rail. The differences are real but they are variations within
one system: `zahabu` is fixed charcoal (rail order Skills → Languages → Contact → Interests, `zahabu.tsx:70, 86, 101, 111`),
`coral` is warm light with accent fills (Contact → Skills → Languages → Interests, `coral.tsx:57, 68, 84, 100`),
and `zahabu` alone adds the experience timeline. **One system, two palettes, two rail orders.**

**Genuinely distinct:**

- **`pemba`** — the only true original. Editorial serif, drop cap, mono kickers, full-width lead then two
  columns. Nothing else in the sample shares its skeleton, and it is the only one where constraint reads as
  taste.
- **`nuru`** — distinct skeleton (dark header band + stat strip + donut gauges), even though the graphic
  claims it makes are not defensible (§1).
- **`malachite`** — a distinct skeleton, but not a *premium* one: a header rule, two columns and chips is
  the default free-builder layout, and it is the emptiest page measured (65%). Distinctness is not the
  problem here; the paid-tier promise is.

**So, plainly:** a user who paid for all seven received **three genuinely different documents, plus two
design systems each shipped in two colourways** — five designs, two of which they bought twice. The
comment in `apps/web/lib/templates/curation.ts:35-36` calls these *"the 7 premium flagships (most visually
distinctive layouts)"*. On this sample, four of them defeat that sentence. That is the commercial finding,
and it is independent of whether any individual template is well executed.

---

## 3. Recurring weaknesses — fix once, not eight times

Ranked by what they cost the user. Line references are to the files I read; the shared engine path is
`apps/web/components/templates/engine/`.

**Before the list, a structural fact that decides where every fix belongs:** the seven premium templates
and `console` are **100% hand-written and outside the shared engine**. `grep -c "engine" rift.tsx kioo.tsx
zahabu.tsx coral.tsx nuru.tsx pemba.tsx malachite.tsx console.tsx` returns **0 for all eight**, while 220 of
the 269 files in `components/templates/` import `engine/tokens`, `engine/layouts` or
`engine/document-engine`. The engine already offers `SidebarLayout` with a `sidebarWidth` config,
`SectionStyle` per column, `skillDisplay`, `experienceVariant`, `hobbiesDisplay` and a density mode
(`engine/layouts.tsx:34-51`) — everything `rift`/`kioo` hand-roll. **So "fix it once in the engine" does not
currently reach the paid tier at all.** Every recommendation below says which of the two it is.

**R1 — The paid tier does not fill the page (highest cost).**
Measured from these renders, with the repo's own sample CV: text stops at **65%** (`malachite`), **68%**
(`rift`), **69%** (`kioo` document column), **72%** (`coral`), **78%** (`zahabu` rail / 65% document
column), **81%** (`pemba`) and **85%** (`nuru`) of the sheet height. **Average for the seven: ~75% — a
quarter of a page that the user paid for, blank.** This is the defect the owner's eye caught; it is the
first thing a recruiter sees and it makes a CV look like an unfilled form.
What makes it worse is that it is not for want of trying: these renders are already `SmartFit`-magnified to
its ceiling. `rift`'s coded 270px rail measures **301 logical px** in the render (288px of a 760px-wide
sheet = 37.9% of the width, against a designed 34%), which is a 1.12× magnification — and 1.12 is the top of
`FIT_BAND` in `engine/fit.tsx:44-48`. **The engine has magnified these templates as far as it is allowed to
and they are still a quarter empty.** Raising the band is not the fix: because the magnification is applied
by laying the design out at a *narrower width* and scaling up (`engine/fit.tsx:26-33`), the sheet the user
sees is **not laid out at 794px** — the rail is 12% wider than authored and the text column 12% narrower,
so every line breaks differently from the design. These four rail layouts need vertical rhythm that
*absorbs* height (a rail that stretches with the page, section spacing that expands into the remainder)
instead of a fixed `minHeight: 1123` with everything huddled at the top.
Where: `engine/fit.tsx` (the signal and the band) **and** the four rail templates (the rhythm).

**R2 — One type size for everything below the job title.**
In all four rail templates the profile prose, the bullets, the company, the degree, the certification line,
the contact rows and the dates all sit inside a **9.5–11px** band. `rift` and `kioo` between them use
exactly the same seven sizes — 9.5, 10, 10.5, 11, 11.5, 12, 12.5 — for every piece of text that is not the
name. Consecutive levels are 0.5px apart, which is invisible at A4 arm's length, so the page presents
one visual weight for "the company I worked for", "what I did there" and "the month it started".
Where: `engine/tokens.ts` — the `font` scale has no floor and no enforced step; the four rail templates
must be brought onto it (they currently use none of it).

**R3 — The rail's three lists are the same list three times.**
Skills (bars), Languages (dots or a leader line), Interests (a paragraph) are stacked in one column at
10–10.5px in the same colour, separated only by a 10px letterspaced label (`rift.tsx:57-103` is the pattern;
`kioo`, `zahabu` and `coral` repeat it with different widgets). Cover the three labels and you cannot tell
which block is which — and the bottom third of every rail is a wall of one-size text.
Where: `engine/sections.tsx` — `skillDisplay` already exists as a per-template switch, so a rail renderer
that gives each list a distinct *shape* (bar rows / a compact leader line / a quiet sentence) is one fix,
not four.

**R4 — Seven templates, seven section-header idioms.**
Dash + caps (`rift`, `kioo`), colour icon badge (`zahabu`), filled accent bar (`coral`), plain accent caps
(`malachite`, `nuru`), mono kicker (`pemba`), `##` (`console`). Each is individually defensible; together
they mean the catalogue has no voice and a user switching templates feels they changed products.
Where: `engine/sections.tsx` + `engine/layouts.tsx` — `SectionStyle` is already the parameter.

**R5 — Icons reused across unrelated sections, so they carry no information.**
`coral`: `IcoUser` on Contact, Profile and Referees; `IcoStar` on Skills, Languages and Certifications —
six of nine badges duplicate another badge. `zahabu`: `IcoStar` on both Profile and Certifications. The
badge is the device the reader is meant to navigate by; a duplicate badge is worse than no badge.
Where: `engine/sections.tsx` (a section→icon map owned by the engine, not per template).

**R6 — The photo-first designs are shipped, and judged, in their no-photo state — where the fallback is a
large flat block.** `kioo` is the extreme: 300px × 34% of the page width in one flat colour = 27% of the
sheet. Since the product's own sample ships without a photo, that flat block *is* the default first
impression of the paid tier.
Where: `kioo.tsx` for the sizing, `engine/sections.tsx` / `engine/layouts.tsx` for a shared fallback
treatment that does something with the space (a monogram panel that earns its height, or a narrower
placeholder that lets content rise).

**R7 — Graphics that invent certainty.**
`nuru` prints a stored 1–5 level as a percentage (`nuru.tsx:18`) and counts certifications as a stat with
hardcoded plurals (`nuru.tsx:48-50`), producing "1 CERTS". A CV must never claim more precision than the
user supplied.
Where: `nuru.tsx` (the graphic) and the shared i18n/pluralisation layer (the labelling rule).

**R8 — Large solid-ink areas on a document that gets printed.**
`zahabu` rail and `kioo` rail are `#1E1A16`; `console` is `#0D1117` across the whole sheet; `rift` and
`nuru` carry large dark blocks. A CV is printed at a bureau, per page. This is a real cost and a real
quality risk (muddy dark fills on an office laser), but I could not print anything, so this is flagged from
ink coverage in the render, **not measured on paper**.
Where: print-safe defaults in `engine/tokens.ts` / `engine/presets.ts`.

---

## 4. Ranked change list — the top five

### 1. Make the paid seven fill the page, and fix the signal that decides when they have

**What to change.** Two halves, one outcome. (a) Give the four rail layouts vertical rhythm that absorbs the
remaining height — a rail that spans the page with its content distributed, section gaps that expand into
the leftover space — instead of `minHeight: 1123` with everything huddled at the top. (b) Re-examine the
fill signal that `SmartFit` closes its loop on, because in these renders it let a 65%-full page through
while reporting itself satisfied.
**Where.** `apps/web/components/templates/engine/fit.tsx` (the measurement and `FIT_BAND`,
`fit.tsx:44-48`) plus the four templates — and the four templates have to be brought onto the engine's
layout system first, because they are hand-rolled (`grep -c engine rift.tsx` → `0`).
**How a reviewer knows it worked.** Measure the PNGs, not the JSON: the last row of text in `malachite`,
`coral`, `rift` and `kioo` should pass ~85% of the sheet height (today: 65, 72, 68, 69) — and the design
should be laid out at 794px, so `rift`'s rail should measure ~34% of the sheet width in the render, not the
37.9% it measures now.
**Why not just raise `FIT_BAND`:** because the magnifier changes the layout width, so pushing it further
buys fill by re-flowing the design away from what was authored (the rail is already 12% wider than coded).

### 2. Put a floor under the body scale, and open a real second tier

**What to change.** In one place: a minimum body size of 10.5px (meta) / 11px (bullets) / 11.5px (prose)
and a **minimum 2px step** between consecutive levels in the same column, with `roleTitle` clearly above
body. Today `rift` and `kioo` run 7 sizes between 9.5 and 12.5 with 0.5px steps, so the reader gets no help
distinguishing a bullet from a date.
**Where.** `apps/web/components/templates/engine/tokens.ts` — the `font` scale (`font.meta`, `font.body`,
`font.roleTitle`) — plus getting `rift`, `kioo`, `zahabu` and `coral` onto it. Note the engine already has
the right shape; the paid eight simply do not use it.
**How a reviewer knows it worked.** At 100% zoom, a reader names the page's three type levels without
reading a word. Mechanically: `scripts/template-render-probe.mjs`'s `minTextPx` for the seven paid
templates reads ≥10.5, and the smallest-text offender is no longer a date or the contact line.

### 3. Give the rail's Skills / Languages / Interests three different shapes

**What to change.** Skills → one row per skill, name + a bar, the tallest of the three. Languages → a
compact single-line-per-language form with **no bar** (name + proficiency word, or name + dots only).
Interests → one wrapped sentence in a quieter colour and a smaller measure. Three different heights,
weights and widgets — not three labels over the same layout.
**Where.** `apps/web/components/templates/engine/sections.tsx` (`skillDisplay` is the existing hook; the
rail needs a whole-section renderer, and it has to actually be used by the four rail templates).
**How a reviewer knows it worked.** In the render, cover the three section labels — the three blocks are
still distinguishable, and they are visibly different heights. If they only differ by their labels, it did
not work.

### 4. One section-header system for the whole catalogue, with named exceptions

**What to change.** Pick a single header idiom and let templates vary only its colour and case. My
recommendation is `zahabu`'s small accent badge: it survives greyscale printing, it reads at gallery
thumbnail size, and it is the only one of the seven devices that works in both a rail and a wide column.
`console` (`##`) and `pemba` (mono kicker) keep theirs as **documented exceptions**, because in both cases
the header device *is* the concept.
**Where.** `engine/sections.tsx` + `engine/layouts.tsx` (`SectionStyle` already exists as the parameter) —
and the paid eight need to consume it.
**How a reviewer knows it worked.** Eight renders laid side by side show recognisably the same header
system; the two that depart can each be justified in one sentence.

### 5. Decide the paid tier's shape: five designs, not seven

**What to change.** `rift`/`kioo` and `zahabu`/`coral` are two layouts shipped twice (§2). Either (a) fold
each pair into one premium design and offer the second colourway as a preset — which is the honest way to
ship "the same layout in your brand's colour" — leaving **five** paid designs; or (b) keep seven and
redesign two of the four so the pairs stop being pairs. Either way, fix the comment at
`curation.ts:35-36` that calls the seven *"the most visually distinctive layouts"*.
**Where.** `apps/web/lib/templates/curation.ts` (`PREMIUM_TEMPLATE_IDS`) and
`engine/presets.ts` (`ENGINE_PRESETS` is already the right home for a colourway preset).
**How a reviewer knows it worked.** `PREMIUM_TEMPLATE_IDS.size` is 5 — or it is still 7 and a user who
owns the tier can name seven differences without mentioning a colour. Today they can name four.

---

## 5. What I could not judge from these renders

Stated plainly, because several of these are the states real users live in:

1. **Anything quotable.** No spelling, wording, label or string in this document comes from the pixels. The
   renders are 760px wide for a 1123-tall sheet, so body text is ~10px tall; nothing here rests on reading
   small type. Labels I name are source citations with line numbers.
2. **Every render is the no-photo state.** `lib/sample-cv.ts:35` sets `photo: ""` deliberately, so all
   eight show initials instead of a portrait. I therefore **cannot judge how `kioo`, `coral`, `zahabu`,
   `nuru` or `malachite` look with a real photo** — the state most users with a photo will see, and the
   state several of these designs are built around. `kioo` with a real photograph could plausibly be the
   best template of the seven; the render I was given cannot tell me, and I am not going to guess.
3. **Swahili.** All eight renders are `/en`. The Swahili labels are longer (`Uzoefu wa Kazi`,
   `Mawasiliano`, `Mapendeleo`) and the four rail templates use fixed 250–272px rails with uppercase
   0.14–0.16em letterspacing — the exact combination that wraps or clips at the rail edge. I can see the
   setup, not the outcome. The Swahili sample render is not in this set.
4. **Print.** No printer, no paper. The ink-coverage and tonality points for `zahabu`, `kioo` and `console`
   are inferred from large solid areas in the render, not measured.
5. **CVs longer than the sample.** All eight carry ~1,350 characters (1,332–1,497). How these designs behave
   with four roles and fifteen years — and whether `SmartFit` then hits its other wall, the tier-3 clamp —
   is invisible here.
6. **The shipped PDF.** These PNGs are screenshots of the preview page, not `lib/pdf.ts` output. Whether the
   export reproduces the ~709px layout and the 1.12× magnification I measured in the preview, I did not
   verify.
7. **The other 39 offered templates.** 8 of 47, and deliberately the paid ones. Nothing here generalises to
   the set; your own small-type and overflow measurements are the findings that do, and I have not
   re-measured them.
8. **Which of the two fill numbers is wrong.** I measured the PNGs directly (text ends at 65–85% of the
   sheet) and I can read that `docs/template-renders/probe.json` reports `usedFraction ≥ 1.000` for **all
   47** templates with a median of 1.120 and a minimum of exactly 1.000. Those two cannot both describe the
   same pages. I am reporting the disagreement, not diagnosing it: what I know is that a metric reading
   "≥100% full" for 47 pages of visibly different lengths is not a believable description of them, and that
   the renders show the magnifier pinned at `FIT_BAND`'s ceiling while a quarter of the sheet stays empty.
9. **Interaction and editor states.** Density modes, hidden-section toggles, the no-certifications case,
   thumbnail rendering at card size, hover — none of these are in the eight renders.

---

## Appendix — the measurements behind this document

Page fill = fraction of the 1123px sheet height reached by the lowest text, measured per column from the
PNG. Where the two columns differ, both are given; the higher is the page's fill.

| Template | Tier | Rail | Document column | Page fill | Smallest text |
|---|---|---|---|---|---|
| `malachite` | premium | — (full-width) | — | **65%** | 9.5px (contact row) |
| `rift` | premium | 64.9% | **68.1%** | 68% | 9.5px (date) |
| `kioo` | premium | 75.3% | **69.4%** | 75% | 9.5px (date) |
| `coral` | premium | **72.1%** | 60.9% | 72% | 9.5px (date) |
| `zahabu` | premium | **77.7%** | 64.7% | 78% | 9.5px (date) |
| `pemba` | premium | 79.2% | **80.9%** | 81% | 10px (mono kicker) |
| `nuru` | premium | **84.8%** | 79.0% | 85% | 9.5px (stat label) |
| `console` | free (curated) | — (full-width) | — | 89% | 9.5px (comment line) |

Premium-seven mean fill: **~75%** — a quarter of the page blank, on the templates the product charges for.

Type-size inventories (`grep -o "fontSize: [0-9.]*"`), which is how "the same scale" in §2 was established:

- `rift.tsx` main column: 33, 12.5, 12, 11.5, 11, 10.5, 10, 9.5 — seven of the eight inside 9.5–12.5.
- `kioo.tsx` main column: 30, 13, 12.5, 12, 11.5, 11, 10.5, 10, 9.5 (plus 72 for the initials) — the
  same seven inside 9.5–12.5.

Sources read for this pass: `rift.tsx`, `kioo.tsx`, `zahabu.tsx`, `coral.tsx`, `nuru.tsx`, `pemba.tsx`,
`malachite.tsx`, `console.tsx`, `engine/tokens.ts`, `engine/layouts.tsx`, `engine/presets.ts`,
`engine/fit.tsx`, `template-canvas.tsx`, `lib/templates/curation.ts`, `lib/sample-cv.ts`,
`app/[locale]/(marketing)/templates/[slug]/page.tsx`, `scripts/template-render-probe.mjs`,
`docs/template-renders/probe.json`, and the 8 PNGs in `docs/template-renders/`.
