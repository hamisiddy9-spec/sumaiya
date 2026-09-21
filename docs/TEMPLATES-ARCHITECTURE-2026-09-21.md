# TEMPLATES — the architecture, measured

2026-09-21. Four parallel audits + external research. Every number carries a file:line or URL.
Where a claim rests on a subagent's static reading rather than a run, that is said explicitly.

## 1. The finding that matters most: the two surfaces offer DIFFERENT catalogues

| | web | phone |
|---|---|---|
| registered templates | **266** (`lib/templates/registry.ts`) | **218** (`apps/native/src/lib/templates/registry.ts`) |
| the **offered** set | **47 curated** (`curation.ts:16`) | the 218 wrappers |
| how the offered set is built | **41 of the 47 are hand-written `.tsx`**, mean **251 lines** each — **10,291 lines**; only **6** are engine wrappers (`meridian, narrative, grid, stripe, serif-cv, mono-cv`) | **218 generated engine wrappers**, mean **19 lines**, no bespoke JSX in any of them |
| the 7 declared premium designs | all 7 exist as web `.tsx` (163–207 lines) and are registered | **0 of 7 renderable** — they sit in `BESPOKE_IDS` (48 ids, "still need a hand-written renderer") |
| tier values | premium/core/legacy via `getCvTemplateTier()` | **219 × `tier: "free"`** — no premium exists |

**So the phone cannot show the designs the web offers.** The 41 hand-authored curated designs —
including every premium one — are web-only React. And the phone's 218 are the *long tail*: 11 of
them are only 5 designs (`athens`/`dublin`/`toronto` differ in 6 of 18 lines — header colours;
`dubai`/`prague`, `montreal`/`warsaw` likewise; `cosmos`/`lunar` and `orbit`/`stellar` differ in
2 lines each, just the export name).

That is the "both versions" problem in its starkest form, and it predates every visual defect
found today: **the two clients do not share a catalogue.**

## 2. The engine is duplicated, and the duplicate is the smaller half

```
web     engine/  = 1,760 lines across 7 files   (fit 260, layouts 533, sections 700,
                document-engine 81, presets 43, tokens 105, typography 38)
native  cv-engine/ = 3,045 lines across 12 files (sections 937, layouts 630, view 285,
                render 153, document 109, tokens 98, fit 72, html 123, icons 72, photo 81)

same five layouts, implemented twice:
  web   SidebarLayout 53, HeaderLayout 170, MinimalLayout 286, TwoColumnLayout 371, AccentBandLayout 471
  phone sidebarLayout 73, headerLayout 211, minimalLayout 332, twoColumnLayout 418, accentBandLayout 540
```

The phone's engine emits **HTML strings**, not RN views — `render.ts:120-153` builds one
self-contained document; `cv-preview-card.tsx:261,379` shows it in a WebView and
`pdf-export.ts:66` hands it to `expo-print`. So both surfaces consume the same *shape* of output
and the same token vocabulary, written twice in two languages.

**Parity is not verified.** `registry-sync.test.ts` hardcodes `218` and the five layout names and
**never reads the web app** — it asserts the native side is internally consistent, not that it
matches. No test compares the two renderers' output. Real drift is documented deliberately
(`render.ts:56-71` system font stacks vs web fonts; `fit.ts:59` CSS scale vs React `AutoFitPage`).

## 3. The design space is small; the catalogue is not

- **5 layouts** × **49 personality tuples actually used** (of a 300 ceiling: density 3 ×
  experienceVariant 5 × skillDisplay 5 × showTimeline 2 × hobbiesDisplay 2) × **23 token-override
  sets** (144 of 218 wrappers override nothing), plus **205 distinct hand-tuned layout configs**,
  193 of them single-use.
- Of the 47 curated, **45 are genuinely distinct designs** — only `stripe`/`serif-cv`/`mono-cv`
  are one design at three settings (source similarity 0.94–0.96). The other curated pairs score
  0.15–0.59, i.e. real differences. **The curated set is not padded; the long tail is.**
- Competitors: Kickresume 40+, Resume.io 20–30+, Zety 15–20+ (its own gallery prints "773/773",
  which is palettes and sectors, not designs), Novoresume 15+, Enhancv 4 free.
- **No evidence that a bigger count converts better.** The strongest measurable signal is the
  opposite: Ladders' eye-tracking study — 7.4s average initial screen, cluttered multi-column
  layouts performing worst.

## 4. What the industry does (external)

| pattern | what it is | cost |
|---|---|---|
| schema + theme-as-code (**JSON Resume**, ~40 themes on npm) | one schema; themes share plumbing but each supplies its own layout | N × layout code, no fidelity guarantee |
| templates-as-components, one engine (**Reactive Resume**, 15) | each template is a component over one data model; colour/font/spacing are data | a designer cannot add one without coding |
| document-as-data, one engine (**Canva**, **Figma**) | the template is published *data* with named fields; one renderer fleet | you must own the engine and keep editor/export parity |
| HTML/CSS→PDF (**Puppeteer**, WeasyPrint) | exact web parity, full CSS | 100–400MB Chromium, 2–5s, headless `@page` and font-metric non-determinism |
| layout engine (**Typst**, LaTeX, react-pdf) | deterministic, 20–50ms, tiny | no migration path from HTML; the web preview stops matching the PDF — two representations |
| paged-media polyfill (**Paged.js**) | one HTML source, paginated client-side | rewrites the DOM; late font loads shift breaks |

**Verdict from that work: declarative specs are the norm; two layout implementations are the
outlier.** Every comparable product keeps N templates on one layout engine *per surface*.

Watch-outs it surfaced for the phone specifically — `expo-print` ignores width/height on Android
and drops page breaks on iOS, adds trailing blank pages, and older Android WebViews lack CSS
`var()`. That last one matters in this market: the engine already replaces an `@accent` sentinel
at render time rather than using a CSS variable, which is the right call — keep it that way.

## 5. A landmine to not step on

`scripts/gen-native-templates.mjs` has **no Swahili source** (`:34-41`) while the on-disk files
hold real translated blurbs, and it **skips existing files unless `--force`** (`:330-340`).
So `--check` would likely report all 218 as stale, and `--force` would **clobber the Swahili
copy**. Do not run it either way until the generator reads translations from somewhere real.
(Static reading, not a run — the audit was read-only by instruction.)

## 6. Recommendation

1. **Do not grow the catalogue.** ~45 distinct designs is competitive; the gap to competitors is
   packaging, not design. Prune the long tail instead: 11 files are 5 designs, and 193 of 205
   configs are single-use.
2. **Close the catalogue asymmetry before touching the renderer.** The phone cannot render the 41
   curated designs or any premium one. That is the defect a user feels — a gallery that promises
   designs the phone cannot deliver (and one the premium sheet already got caught promising).
3. **Then unify the layout implementation, not the host.** One shared TS function —
   `spec + content → one self-contained A4 HTML document` — imported by Next.js *and* by
   `expo-print`. React stays for editor chrome only; the A4 page stops being React. This deletes
   one of two 5-layout implementations and the drift between them.
4. **Make parity a test, not a hope.** Reuse golden fixtures and the produced HTML: one CV + one
   spec rendered on both sides, compared. Drift should fail CI, not reach a user. This also fixes
   `registry-sync.test.ts`, whose hardcoded 218 cannot notice a web-side change.
5. **Keep the spec as the contract** — it is already data (`layout` + `personality` +
   `tokenOverrides`), which is exactly the form another product can supply. That is the estate
   boundary working in this product's favour: schemas ship, React components do not.

**Whether to duplicate:** today, marginally cheaper to keep two renderers — merging is real work
and the WebView quirks persist either way. That holds only while the template count is frozen. At
218 and growing it becomes two implementations plus two verification passes per design, and that
is the term that compounds.
