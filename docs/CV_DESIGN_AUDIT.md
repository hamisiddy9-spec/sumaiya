# CV Design Audit — is the template set world-class?

**Answer: no.** The set is **adequate** — nothing is broken, nothing is unreadable, and the
ATS promise genuinely holds — but it is not world-class and large parts of it are not even
good. The single biggest defect is that **the layouts do not fill the page**: a normal
two-role CV occupies only **52–71% of the A4 sheet**, and a new graduate's CV occupies
**45%**. Half the page is blank white (or blank colour) on almost every template, and
**0 of 267** template components use the SmartFit engine that already exists in the repo to
prevent exactly that.

Everything below is from looking at rendered pixels, not from reading template source.
Where I did read source, it is labelled as corroboration of something I first saw.

---

## 1. How I rendered it

No script in the repo renders a single template headlessly to an image, so I wrote a
**throwaway toolchain outside the repo** at
`C:\Users\hamis\AppData\Local\Temp\cvaudit\` (nowhere in the repo is modified). It renders
the **real web template components** — the same ones the editor, gallery and marketing
pages use — with the **repo's own sample CV** (`apps/web/lib/sample-cv.ts`), at production
props (`fontFamily="Inter"`, `primaryColor` taken from `@/types`).

```bash
cd "$LOCALAPPDATA/Temp/cvaudit"

# 0. one-time: let the temp scripts resolve the repo's node_modules without a 924 MB copy
powershell -NoProfile -Command "New-Item -ItemType Junction -Path \
  'C:\Users\hamis\AppData\Local\Temp\cvaudit\node_modules' -Target \
  'C:\Users\hamis\projects\sumaiya\node_modules'"

# 1. render the real React template components to static HTML (esbuild + react-dom/server)
./node_modules/@esbuild/win32-x64/esbuild.exe render.tsx --bundle --platform=node \
  --format=cjs --jsx=automatic \
  --tsconfig=C:/Users/hamis/projects/sumaiya/apps/web/tsconfig.json --outfile=render.cjs
node render.cjs                      # -> out/<name>.html  + data/<name>.json

# 2. rasterise: 794x1123 viewport (= A4 at 96dpi) -> PNG, and measure the real content box
node raster.cjs                      # -> png/*.png, pdf/*.pdf, measure.json

# 3. the REAL product export path (lib/pdf.ts: html2canvas -> jsPDF -> invisible ATS text layer)
./node_modules/@esbuild/win32-x64/esbuild.exe cvpdf.ts --bundle --platform=browser \
  --format=iife --supported:dynamic-import=false \
  --tsconfig=C:/Users/hamis/projects/sumaiya/apps/web/tsconfig.json --outfile=cvpdf.js
node exportpdf.cjs                   # -> pdf-export/*.pdf   (the shipped artifact)

# 4. ATS test
pdftotext pdf-export/01-fam-sidebar-nakuru.pdf -

# 5. how much of the sheet each template actually fills
node fill.cjs                        # -> fill.json
```

Notes on method, stated so the reader can weigh it:

* `pdftoppm` is **not installed on this machine** (only `pdftotext` is on PATH), contrary to
  the brief. I therefore inspected the *exported* PDFs by opening them in Chrome's own PDF
  viewer via Playwright and screenshotting (see `shipped-*.png`); the HTML renders were
  inspected as PNGs from step 2.
* Playwright's bundled browser was not downloaded; I drove the machine's real
  `chrome.exe` (`C:/Program Files/Google/Chrome/Application/chrome.exe`).
* Chrome is the same engine family the product targets, so the render is representative.

**20 renders looked at, one at a time:** one per family + all 7 premium flagships + 2 Swahili
runs + long-CV and short-CV stress tests on two different layouts.

### What the "7 layout families" actually are

Worth stating because it changes the conclusion: the registry's own layout taxonomy is **five
`style` values**, not seven (`apps/web/types/index.ts:815`), distributed across the 266
presentation entries as: **minimal 79, sidebar 67, header 58, creative 52, classic 11**. The
"7 families" in `curation.ts` are seven merchandising groups. Three of them — *Classic/serif*,
*Creative/editorial* and *Timeless/professional* — produce **the same layout** (see §4).

Every id lives twice: a hand-written React component in
`apps/web/components/templates/` (267 `.tsx`) plus a generated metadata entry. The components
are **not** engine-driven; `components/templates/engine/` (5 layouts, `fit.tsx`, `tokens.ts`)
is effectively dead code for them (`grep -rl "AutoFitPage" components/templates/*.tsx` → **0
files**).

---

## 2. Per-template findings (what I actually saw)

`fill%` = bottom of the lowest element containing visible text ÷ page height, measured in the
browser (`fill.json`). Page is 794×1123 px = exactly A4.

| # | render | template | style | fill | pages | verdict |
|---|--------|----------|-------|------|-------|---------|
| 01 | `01-fam-sidebar-nakuru` | nakuru | sidebar | **55%** | 1 | loud, half-empty |
| 02 | `02-fam-header-serengeti` | serengeti | header | 69% | 1 | bland |
| 03 | `03-fam-minimal-sahara` | sahara | minimal | **83%** | 1 | genuinely good |
| 04 | `04-fam-classic-kilimanjaro` | kilimanjaro | classic | 81% | 1 | good, executive |
| 05 | `05-fam-creative-zanzibar` | zanzibar | creative | 62% | 1 | loud, dead left column |
| 06 | `06-fam-contemporary-bento` | bento | creative | 64% | 1 | flyer, not a CV |
| 07 | `07-fam-timeless-regent` | regent | classic | **52%** | 1 | handsome header, half-blank sheet |
| 08 | `08-prem-rift` | rift ★ | sidebar | 56% | 1 | recoloured sidebar |
| 09 | `09-prem-nuru` | nuru ★ | creative | 71% | 1 | the only real "infographic" |
| 10 | `10-prem-malachite` | malachite ★ | header | **52%** | 1 | clean but not premium |
| 11 | `11-sw-nakuru` | nakuru (sw) | sidebar | 55% | 1 | Swahili OK, mixed-language bugs |
| 12 | `12-sw-sahara` | sahara (sw) | minimal | 85% | 1 | headings still English |
| 13 | `13-long-nakuru` | nakuru + 6 roles | sidebar | 98% | **2** | 152 px spill |
| 14 | `14-short-nakuru` | nakuru + graduate | sidebar | **45%** | 1 | looks unfinished |
| 15 | `15-long-serengeti` | serengeti + 6 roles | header | 95% | **2** | 269 px spill |
| 16 | `16-short-serengeti` | serengeti + graduate | header | 48% | 1 | looks unfinished |
| 17 | `17-prem-zahabu` | zahabu ★ | sidebar | 67% | 1 | prints badly (solid dark) |
| 18 | `18-prem-pemba` | pemba ★ | creative | 64% | 1 | **best of the set** |
| 19 | `19-prem-coral` | coral ★ | sidebar | 62% | 1 | orange bars everywhere |
| 20 | `20-prem-kioo` | kioo ★ | sidebar | 66% | 1 | **worst**; 30% solid black |

### 01 · Nakuru (sidebar, curated, free)
Full-bleed saturated orange sidebar running the entire 1123 px, white name, monogram "AO",
dot meters for skills. Section headings are uppercase orange with a 2 px rule under each —
five of them, so the page reads as stripes. Typography inside each block is fine and the
bullet rhythm is consistent. **But the main column stops at y≈620 of 1123.** With a two-role
CV you get a 500 px blank white rectangle next to a 500 px blank orange rectangle.
Recruiter verdict: **yes, it looks like a real CV — a Canva one.** Not a serious one.

### 02 · Serengeti (header, curated, free)
Single column, blue uppercase headings, no rules, tiny grey middot bullets. The **summary
paragraph has no heading at all** while every other section does — it reads as a stray
paragraph. Dates sit right, nothing clips. 69% fill.
Recruiter verdict: **serious but forgettable**; it looks like an unfinished default.

### 03 · Sahara (minimal, curated, free) — good
Centred serif name in wide caps, short gold rule, letterspaced small-caps subtitle — this is
the only non-premium template with a **real masthead**. Restrained gold "|" section markers,
serif body, 83–85% fill: the best-filled page of the entire set. Bullets are run together
into one paragraph with "·" separators rather than one achievement per line, which loses the
rhythm slightly. Recruiter verdict: **yes — this looks like a careful, adult CV.**

### 04 · Kilimanjaro (classic, curated, free) — good
Dark charcoal header band, white serif name, serif body, two-column skills/languages block
with black meter bars, 81% fill. Reads executive. One real flaw: **the meter bars are not a
fixed width**, so each row's track ends at a different x — the bars cannot be compared row to
row, which is the only thing a meter is for. Recruiter verdict: **yes.**

### 05 · Zanzibar (creative, curated, free)
140 px orange header band, two columns, orange date pills, short orange rules under headings.
Problems: the body text renders noticeably **heavy/bold** and the left column is completely
empty from y≈490 to 1123 while the right column also stops early. 62% fill.
Recruiter verdict: **borderline — it looks like a flyer with a CV inside it.**

### 06 · Bento (contemporary, curated, free)
Genuinely distinct: rounded lavender cards on lavender ground, indigo section labels, indigo
date pills. But it reads as an **app screen, not a document**; the EDUCATION card contains two
lines inside a bordered box floating above ~150 px of empty card, and the whole grid stops at
y≈735 (64% fill). Indigo is a developer colour for a Tanzanian employer audience.
Recruiter verdict: **risky.** Some employers will find it unserious.

### 07 · Regent (timeless, curated, free)
Navy header, serif name, **short gold rule under the headline** — a genuinely nice executive
device. Two columns. Then **the content stops at y≈581: 52% fill, the worst blank page of the
seven family picks.** Recruiter verdict: **the top third is the best-looking header in the
free set; the bottom half makes it look unfinished.**

### 08 · Rift (premium, sidebar)
Deep green sidebar, gold-ringed monogram, gold skill bars, dark-green section dashes. The
gold-on-green palette is handsome. Structurally it is **Nakuru re-skinned** — same sidebar,
same section order, same bar meters — and 56% fill, so the emptiness is identical. Being a
"premium flagship" it does not visibly deliver more than a free sidebar.
Recruiter verdict: serious-looking, but **not worth paying for.**

### 09 · Nuru (premium, creative) — the only executed concept
Dark header band, then a **stat strip** (9+ YEARS / 2 ROLES / 5 SKILLS / **1 CERTS**), then
five donut **skill rings** with percentages, then an orange **timeline** down the experience
column. This is the one template that attempts something structural. But: "**1 CERTS**" is a
grammar bug; the ring colours are **arbitrary** (React/Next.js orange, Node.js black,
TypeScript gold, PostgreSQL orange, AWS/GCP black) so the rings look accidental; the rings eat
~350 px for five skills, which is why 29% of the page is still blank; the stat strip counts
"ROLES" which is not a thing.
Recruiter verdict: **interesting, faintly gimmicky; a recruiter would notice "1 CERTS".**

### 10 · Malachite (premium, header)
The cleanest page in the set: serif name, teal ring monogram top-right, icon contact row, one
hairline rule, two columns, teal chip skills. And then **52% fill — the bottom half of the
sheet is empty white.** It is well executed and completely unremarkable; nothing about it says
premium.
Recruiter verdict: **yes, but it looks like a free clean template, not a paid flagship.**

### 11 · Nakuru in Swahili
Heading translation **works**: MAWASILIANO, UJUZI, LUGHA, MUHTASARI, UZOEFU WA KAZI, ELIMU,
VYETI, MAPENDELEO all correct. **Nothing overflowed, wrapped badly or got truncated** — the
longer Swahili strings fit. Two visible mixed-language bugs though: **"Grade: Daraja la
Kwanza"** and **"Shahada ya Kwanza (B.Sc.) *in* Sayansi ya Kompyuta"** — the labels and the
connector are hard-coded English (`nakuru.tsx:257`, and ` in ${edu.field}`).

### 12 · Sahara in Swahili — localisation failure
The **content** is Swahili and the centred subtitle translated, but every section heading is
still English: **SUMMARY / EXPERIENCE / EDUCATION / SKILLS / LANGUAGES / CERTIFICATIONS /
INTERESTS**. The template never reads the `lang` prop.
Corroboration: **18 of the 47 curated templates contain zero `lang === "sw"` branches**
(metro, meridian, atlas, eclipse, horizon, nova, monarch, oxford, titan, canvas-magazine,
vertex, muse, narrative, berlin, grid, stripe, serif-cv, mono-cv). Swahili mode is a
coin-flip.

### 13 / 14 · Content fit, Nakuru
* **Long (6 roles, 2 degrees, 9 skills, 2 referees):** 1275 px → **2 pages**, with page 2
  holding only ~152 px (the tail of Referees plus the INTERESTS chips). The layout itself does
  not break, nothing overlaps, and the sidebar stretches to the full height. 98% fill.
* **Short (graduate, 1 part-time job, 2 skills):** **45% fill.** Content ends at y≈503. Two
  thirds of the sheet is a blank white rectangle beside a blank orange rectangle. It looks
  like a mistake, not a design.

### 15 / 16 · Content fit, Serengeti
Same story, worse: 1392 px for the long CV (2 pages, the break lands inside Languages /
Certifications), 48% fill for the graduate CV — a plain white sheet with content in the top
half.

### 17 · Zahabu (premium, sidebar)
Charcoal sidebar, gold bars, gold rounded-square section icons (briefcase / cap / star), gold
timeline. Distinctive. But **the sidebar is near-black over 30% of the sheet**, and the icons
repeat: PROFILE and CERTIFICATIONS use the same star. 67% fill.
Recruiter verdict: **flashy; the star icons make it feel like a packaged template.**

### 18 · Pemba (premium, creative) — **the best template in the set**
A real editorial masthead: `CURRICULUM VITAE` / `NAIROBI, KENYA` in tiny gold letterspaced
caps across a heavy black rule; the **largest name of any template**; a gold rule and italic
headline; a working **drop cap** on the summary; gold small-caps section labels; experience
headed by **company** with the role as italic subtitle and italic dates; achievements as
paragraphs, no bullets. ~95% black-on-white, so it prints beautifully on the cheapest
printer. 64% fill is its one weakness.
Recruiter verdict: **yes — this is the only template where typography, rather than colour
blocks, is doing the work. It looks like a designed document.**

### 19 · Coral (premium, sidebar)
Every section heading is a **filled full-width orange bar** with a white icon inside — five of
them in the main column, four more in the sidebar. It reads as a web dashboard, not a CV. The
sidebar skill bars have a nearly invisible track so 5/5 and 4/5 look the same. 62% fill.
Recruiter verdict: **no. This is the crudest template in the paid tier.**

### 20 · Kioo (premium, sidebar) — **the worst template in the set**
The left column is split: navy on top, **solid black** below. With no photo — which is the
default, and what most users will have — the "full-height photo column" degrades into a
**giant "AO" monogram floating in a large empty navy slab**. The name is boxed in a heavy black
rectangle. 66% fill, so it also wastes the space it takes. And 30% of the sheet is solid black:
at a Tanzanian print shop, charged per copy, that is a page of toner with white text that can
smear or ghost on cheap machines.
Recruiter verdict: **no. It looks like a broken image placeholder on top of a black slab.**

---

## 3. ATS viability — tested, and the core promise holds

The product does **not** print HTML to PDF. It rasterises with **html2canvas** into a JPEG,
draws it into **jsPDF**, then paints an **invisible text layer** (`renderingMode: "invisible"`)
underneath. That is a good architecture — but it means an ATS sees only whatever that text
layer contains, so it had to be tested rather than assumed.

I ran the **real export code** (`apps/web/lib/pdf.ts` → `renderElementToPdfBlob` +
`buildCvText`) in Chrome and extracted the result with poppler:

```console
$ pdftotext pdf-export/01-fam-sidebar-nakuru.pdf -
Amara Osei Software Engineer amara.osei@gmail.com | +254 722 987 654 | Nairobi, Kenya | linkedin.com/in/amaraosei | amaraosei.dev
PROFESSIONAL SUMMARY Software engineer with 6+ years building and shipping scalable web applications for fintech and telecoms. ...
EXPERIENCE Software Engineer | Zuri Fintech, Nairobi, Kenya | 2020-05 - Present Shipped key features for a nationwide mobile-money platform ...
Full-Stack Developer | Kito Labs, Remote | 2017-08 - 2020-04 Built React frontends and Node.js APIs for enterprise SaaS clients ...
EDUCATION B.Sc. Computer Science | University of Nairobi | 2013-09 - 2017-06 | First Class Honours
SKILLS React / Next.js, Node.js, TypeScript, PostgreSQL, AWS / GCP
LANGUAGES English (Native), Swahili (Native)
CERTIFICATIONS AWS Solutions Architect | Amazon Web Services | 2023-04
INTERESTS Open source, mentoring, chess, trail running
```

* **Works.** Real, selectable, ordered, sectioned text. Extracted character counts: **1111 /
  1111 / ... (English, all templates)**, 1245 (Swahili), 2083 (long), 534 (short) — i.e. the
  body content of every template, not a boilerplate stub. This is the product's single best
  feature and it is genuinely delivered.
* Page size is **exactly A4**: `/MediaBox [0 0 595.28 841.89]` in the shipped PDF, and
  794×1123 px in the DOM.
* Multi-page works: the long CVs export as real 2-page PDFs with sensible breaks.

### Two ATS defects found

1. **Projects and Referees never reach the text layer.** `buildCvText` emits name, title,
   contacts, summary, experience, education, skills, languages, certifications and hobbies —
   and stops. On the long CV the two referees are **visible in the PDF but absent from the
   extracted text**:
   ```console
   $ pdftotext pdf-export/13-long-nakuru.pdf - | grep -c "Joseph Mkapa"
   0
   ```
   A recruiter's ATS literally cannot see a candidate's referees or projects.
2. **The text layer is always English.** For a Swahili CV the visible page says `UZOEFU WA KAZI`
   while the invisible text says `EXPERIENCE`. The ATS sees a different document than the
   human.

---

## 4. Family comparison — measured against the renders, not the code

I put the seven family picks side by side in one image and looked at them at thumbnail size,
which is how a user browses the gallery.

**Four of the seven are visibly different layouts:**

* **sidebar** (nakuru) — colour column down the left.
* **minimal** (sahara) — centred serif masthead, single column, lots of air.
* **bento** (bento) — rounded card grid.
* **single-column plain** (serengeti) — no colour block, headings only.

**Three of the seven are the same layout in three colours:**

* **kilimanjaro** (classic) — coloured header band + heavy rule + two-column body.
* **zanzibar** (creative) — coloured header band + rule + two-column body.
* **regent** (timeless) — coloured header band + gold rule + two-column body.

Strip the colour and these three are the same page. Their `style` metadata is
`classic / creative / classic` — i.e. the "families" are not even the taxonomy the registry
records. The same collapse repeats in the **paid** tier: of the 7 premium flagships, **rift,
zahabu, coral and kioo are four sidebar layouts** differing mainly in colour and decoration;
only **nuru** (infographic) and **pemba** (editorial serif) are structurally distinct, and
**malachite** is a plain two-column page that does not read as premium at all.

So the honest count of distinct designs in the curated 47 is far below 47 — my renders suggest
something like **eight to ten**, of which four are sidebars.

---

## 5. Verdict, and what to keep

**Overall: ADEQUATE — not world-class, and not even "good" as a whole.** The engineering
underneath is careful (correct A4, working text layer, clean page breaks, working Swahili in
most templates). The **design** work is what is missing: the pages are half-empty, no template
adapts to the amount of content it is given, a third of the "families" are one layout
recoloured, 18 curated templates ignore Swahili, and four of seven paid flagships are the same
sidebar layout. "World-class, well-integrated, elevates platform UX" is not what these renders
show. **None of it is broken; a lot of it is thin.**

### Family ranking (best → worst), from the renders

| rank | family (pick) | what I saw | keep / retire |
|---|---|---|---|
| 1 | **Minimal/ATS** (sahara) | best fill in the whole set (83–85%), masthead, restrained gold, prints clean | **keep** |
| 2 | **Classic/serif** (kilimanjaro) | 81% fill, confident dark header, executive serif body | **keep** |
| 3 | **Creative/editorial** (zanzibar) | bold header + date pills, but heavy body and a dead left column | keep 1–2, cull the rest |
| 4 | **Header/two-column** (serengeti) | clean and correct, no rules, unlabelled summary, monotone | keep as the safe default, redesign it |
| 5 | **Contemporary/experimental** (bento) | genuinely different, but it is a flyer; empty EDUCATION card | keep one, retire the rest |
| 6 | **Sidebar** (nakuru) | loudest colour, 1123 px of orange for two jobs, 55% fill | **redesign** — this is the family with 4 paid clones |
| 7 | **Timeless/professional** (regent) | best header of the free set, then a 52% page | **redesign** |

### Premium tier (paid) ranking, best → worst

**pemba** (distinct, editorial) → **nuru** (distinct, but gimmicky + "1 CERTS") →
**malachite** (clean, not premium) → **rift / zahabu** (recoloured sidebars) →
**coral** (orange bar dashboard) → **kioo** (broken placeholder + 30% solid black).

Four of seven paid flagships — rift, zahabu, coral, kioo — are sidebar layouts. **Charging for
those is the weakest commercial point in the asset.**

### Single best template

**`pemba`** (premium, creative). The only template in 20 renders where typography does the
work: real masthead, biggest name, working drop cap, gold small caps, company-led entries,
no bullets, and ~95% black-on-white so it prints well on anything. Honourable mention:
**`sahara`** (free) — the best-filled page and the best free design.

### Single worst template

**`kioo`** (premium, sidebar). Its headline feature — a full-height photo column — collapses
into a giant "AO" hovering in an empty navy slab whenever the user has no photo (the default),
the name is boxed in a heavy black rectangle, 34% of the page is blank, and ~30% of the sheet
is solid black, which is a real cost and quality problem at a print shop. Runner-up:
**`coral`**, whose five full-width orange heading bars make a CV look like a dashboard.

---

## 6. Highest-impact fixes, in order

1. **Wire the SmartFit engine you already have around the hand-written templates.**
   `components/templates/engine/fit.tsx` implements exactly the 3-tier tighten-then-scale
   strategy needed, and **0 of 267** templates use it. This single change fixes the 45–55%
   empty pages *and* the 152 px page-2 spill, and it is the difference between "adequate" and
   "good".
2. **Add `projects` and `referees` to `buildCvText`.** They are visible in the PDF and
   invisible to every ATS today. Highest-impact correctness bug in the product.
3. **Make the invisible text layer follow `lang`,** so the machine-readable document matches
   the visible one.
4. **Offer a "fill the page" / density control at export.** Half of these templates look
   unfinished only because the content sits at the top of a fixed-height sheet. Even
   vertical distribution of section spacing (or the AutoFit's `spacingFactor`) would remove the
   void on a short CV.
5. **Load the font you are asking for.** Templates are handed `fontFamily="Inter"` but the app
   only self-hosts Bricolage Grotesque / Hanken Grotesk / JetBrains Mono; no `@font-face` for
   Inter exists and `document.fonts` is **empty** in a rendered page, so every CV falls back to
   Arial/Helvetica. Either load Inter or pass a stack that is actually shipped — Hanken
   Grotesk is right there.
6. **Finish the Swahili localisation:** 18 curated templates never read `lang`, and the
   hard-coded `Grade:` label and ` in ` connector appear inside Swahili sections in the
   templates that *do* (`nakuru.tsx:257`).
7. **Cut the paid tier to what is actually distinct.** Keep `pemba` and `nuru`; retire or
   genuinely redesign `rift`, `zahabu`, `coral`, `kioo` — four recolours of a sidebar is not a
   premium tier.
8. **Stop shipping solid-ink backgrounds at this scale.** zahabu (near-black, 30% of sheet),
   kioo (black column), rift and nuru (large dark blocks) are expensive and low-quality on the
   mono printers this audience actually uses. Offer a light variant of each.
9. **Fix the small visible defects seen in the renders:** `nuru`'s "1 CERTS" and its arbitrary
   ring colours, `kilimanjaro`'s inconsistent meter-bar widths, `serengeti`'s unlabelled
   summary, `zanzibar`'s over-bold body.

---

## 7. Things that are genuinely good

1. **The ATS text-layer architecture works.** A raster PDF that still yields clean, structured,
   correctly ordered selectable text is a genuinely thoughtful piece of engineering, and it is
   the product's core promise — verified, not assumed (`pdftotext` output in §3).
2. **Swahili is real, not claimed, in most templates.** 29 of 47 curated templates translate
   their section headings (MUHTASARI, UZOEFU WA KAZI, ELIMU, VYETI, MAPENDELEO), and in the
   renders the longer Swahili strings caused **no overflow, no bad wrap and no truncation**.
   For a Swahili-first market that is a real differentiator.
3. **Print correctness is exact.** Every render is precisely A4 (794×1123 px; shipped PDF
   `MediaBox [0 0 595.28 841.89]`), nothing is clipped, and no template overflowed horizontally
   (widest content 766 px of 794). Long CVs paginate into real second pages.
4. **`pemba` is a genuinely designed document** — masthead, drop cap, editorial hierarchy — and
   it proves the team can produce world-class typography when it stops relying on colour blocks.
5. **The page-break "clean cut" logic** (`findCleanCut` in `lib/pdf.ts`, which nudges a page
   break to a text-free row so a line is never sheared) is the kind of detail most products skip.
6. **Zero render failures across 20 templates.** Nothing crashed, nothing overlapped, nothing
   was unreadable at 9–10 px. The baseline is solid; the ambition is what is missing.

---

## 8. What I could NOT verify

* **The native Android app's output.** `apps/native/src/lib/cv-engine` (5 layouts: sidebar 70,
  minimal 59, header 59, twoColumn 15, accentBand 15) is a *separate renderer* from the web
  components; I did not build or run the RN app or `expo-print`, and there is no device or
  emulator here. **All findings above are about the web component templates** — which is what
  the web editor, gallery, marketing pages and the API-rendered documents use. Native parity is
  untested.
* **Photo-bearing templates.** The repo's sample CV has `photo: ""`, so the photo circle, ring
  and "full-height photo column" treatments were only seen in their *no-photo* state (which is
  the common case — and where `kioo` fails).
* **3+ page documents.** Only 1-page and 2-page exports were exercised.
* **Real ATS parsers.** I tested extraction with `pdftotext`. I did not run Workable, Taleo,
  Greenhouse or a resume parser to see how they score these documents.
* **Physical print output.** No printer here. The toner/contrast/ghosting points for zahabu,
  kioo, rift and nuru are inferred from ink coverage in the renders, not measured on paper.
* **Low-end Android rendering.** The html2canvas OOM-retry path (`resolveExportScale`,
  `deviceMemory`) was not exercised — I exported from desktop Chrome.
* **`pdftoppm` rasterisation**, contrary to the brief it is not installed here; exported PDFs
  were inspected in Chrome's PDF viewer instead (§1).
* **The other ~240 templates.** I sampled 20 deliberately — one per family, all 7 premium
  flagships, 2 Swahili runs and 4 content-fit runs. The 18 English-only templates listed in §2
  were identified by code inspection corroborating the render, not by rendering all of them.
* **`.docx` / HTML / plain-text export paths**, and the cover-letter and business-card
  templates.

### Artifacts (outside the repo, `C:\Users\hamis\AppData\Local\Temp\cvaudit\`)

`png/*.png` (20 HTML renders at 794 px), `pdf-export/*.pdf` (the shipped html2canvas+jsPDF
artifact), `shipped-*.png` (exported PDFs opened in Chrome), `sheet-families.png`,
`sheet-premium.png`, `sheet-contentfit.png` (family comparison sheets), `measure.json`,
`fill.json`, and the throwaway scripts `render.tsx`, `raster.cjs`, `exportpdf.cjs`, `fill.cjs`,
`sheet.cjs`, `pdfshot.cjs`.
