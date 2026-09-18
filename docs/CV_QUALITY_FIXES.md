# CV quality fixes — the four defects from `CV_DESIGN_AUDIT.md`

Four defects, fixed and measured on the shipped code. Every number below came out of a
running browser, an exported PDF, or a rendered template — never out of a config value
being "correct now". Where something could not be verified it says **unverified** and why.

Method (all of it outside the repo, under `C:\Users\hamis\AppData\Local\Temp\cvaudit\`):

- **The real app**, not a harness: `npx next dev -p 3112` from `apps/web`, driven in the
  machine's real Chrome by Playwright. `NEXT_PUBLIC_SUPABASE_URL`/
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` were set to dummy values for the dev server only
  (the checkout's `.env.local` has `DATABASE_URL` and nothing else, so client components
  threw on hydration without them). Nothing in the repo was changed for this.
- **The real export path**: `apps/web/lib/pdf.ts` → `renderElementToPdfBlob`
  (html2canvas → jsPDF → invisible ATS text layer), bundled for the browser and run on the
  real template mounted through the real wrapper. The PDFs it produced are in
  `cvaudit/app/*.pdf`.
- **Text extraction**: `pdftotext` (poppler 24.x). **PDF page images**: the DCTDecode (JPEG)
  streams were pulled straight out of the PDF bytes and measured with Pillow — `pdftoppm`
  is still not installed on this machine (confirmed again: `which pdftoppm` → not found).
- **Fonts**: Chrome DevTools Protocol `CSS.getPlatformFontsForNode`, which reports the
  *font actually used to paint* a node (`Arial (glyphs=237)`), not the stack that was
  requested. This is the only honest way to answer "did the font load?".

---

## 1. The fonts never load

### What changed

The app now self-hosts **Inter** — the family every template was already asking for — and
every render site resolves the document's stored font value into a real stack.

| file | change |
|---|---|
| `apps/web/app/[locale]/layout.tsx:52` | `const fontCv = Inter({ subsets:["latin"], weight:[...], variable:"--font-inter", display:"swap", adjustFontFallback:true })` |
| `apps/web/app/[locale]/layout.tsx:151` | `fontCv.variable` added to `<html className>` |
| `apps/web/app/(app)/layout.tsx:38`, `:122` | same two lines for the authed routes (where the editor lives) |
| `apps/web/lib/fonts.ts:23` | `INTER_STACK = "var(--font-inter, 'Inter'), 'Inter', 'Hanken Grotesk', 'Helvetica Neue', Arial, sans-serif"` — was `"'Inter', 'Helvetica Neue', Arial, sans-serif"` |
| `apps/web/lib/fonts.ts:41` | new `resolveFontStack(family)` — maps a bare stored value (`"Inter"`, the default in `lib/db/schema.ts:54`, the editor store and the CV API) onto the real stack; full stacks pass through untouched |
| `components/editor/cv-editor-client.tsx:3079`, `components/public/public-cv-view.tsx:56`, `components/dashboard/dashboard-cv-grid.tsx:118`, `app/[locale]/(marketing)/templates/[slug]/page.tsx:118` | `fontFamily={resolveFontStack(...)}` |
| `components/templates/zanzibar.tsx:54` | was `const font = "'Helvetica Neue', Arial, sans-serif"` — hardcoded, so this template **ignored the prop entirely** |
| `components/templates/mombasa.tsx:54` | was `const interFont = "'Inter', 'Segoe UI', Arial, sans-serif"` — also hardcoded |
| editor thumbnails / gallery / marketing heroes / assistant cards | `fontFamily={INTER_STACK}` instead of the bare string `"Inter"` |

`display: "swap"` (not `"optional"`, which the three UI faces use) is deliberate: with
`optional`, a cold load keeps the metric-adjusted fallback for the whole session — the same
defect with a better-looking Arial — and the exporter waits on `document.fonts.ready`, so a
swap is guaranteed to have landed before anything is rasterized.

### Evidence — what Chrome actually painted

From `node cvaudit/measure-app.cjs` against `http://localhost:3112/en/templates/<id>`:

```
$ --font-inter on <html> : '__Inter_da0e02', '__Inter_Fallback_da0e02'
$ stack templates were handed BEFORE the fix ('Inter', 'Helvetica Neue', Arial, sans-serif)
  → Arial (glyphs=15)
$ the stack they get now (var(--font-inter, 'Inter'), 'Inter', 'Hanken Grotesk', …)
  → Inter (glyphs=15)

template    CV name painted with      CV body painted with
regent      Georgia (design serif)    Inter (glyphs=235)
nakuru      Inter (glyphs=10)         Inter (glyphs=237)
malachite   Inter (glyphs=10)         Inter (glyphs=236)
kioo        Inter (glyphs=10)         Inter (glyphs=236)
sahara      Inter (glyphs=10)         Inter (glyphs=239)
serengeti   Inter (glyphs=10)         Inter (glyphs=238)
nuru        Inter (glyphs=10)         Inter (glyphs=237)
pemba       Georgia (design serif)    Inter (glyphs=237) + 1 Georgia glyph
zanzibar    Inter (glyphs=10)         Inter (glyphs=236)   ← was Arial Black / Arial
mombasa     Inter (glyphs=10)         Inter (glyphs=236)   ← was Segoe UI Black / Segoe UI
```

**Before/after:** the requested family was **Arial** (or Segoe UI, or Arial Black) on every
template; it is now **Inter**, self-hosted from our own origin. The two templates that
hardcoded their own stack were measured before and after their own fix (`Arial Black/Arial`
→ `Inter`, `Segoe UI Black/Segoe UI` → `Inter`). `regent` and `pemba` deliberately set their
masthead in a serif — that is the design, and Georgia is a real installed face, not a
fallback.

Not a claim: the CV's *text layer* is still drawn with jsPDF's built-in font (the page is a
raster image underneath it), so the PDF does not embed Inter as text. Typography is proven
for the rendered page and the rasterized page image, which is what the user sees and prints.

---

## 2. The ATS text layer was incomplete

### What changed — `apps/web/lib/pdf.ts`

| line | change |
|---|---|
| `:432` | `CvTextInput` gains `projects?: Array<{name, role, date, description, url}>` |
| `:434` | `CvTextInput` gains `referees?: Array<{name, title, company, email, phone}>` |
| `:438` | `CvTextInput` gains `hiddenSections?: string[]` |
| `:450` | `buildCvText(cv, lang = "en")` — language-aware headings, project + referee sections, hidden sections excluded |
| `:485` | new `PROJECTS` block (`MIRADI` in Swahili), emitted in the same order the page uses (after experience) |
| `:540` | new `REFEREES` block (`WADHAMINI`), last, after certifications |
| `:550` | `exportCvToText(cv, filename, lang)` — the `.txt` export follows `lang` too |
| `lib/i18n/cv-headings.ts:30,31,35` | `interests`/`hobbies` Swahili aligned to `Mapendeleo` (what the pages already render), new `referees: Wadhamini` |
| call sites | `lib/stores/editor-store.ts:81,272,285` (the editor's Download-PDF path, now takes the UI language), `cv-editor-client.tsx:1629,1613`, `snap-client.tsx:462`, `cv-assistant-client.tsx:1363,1389` |

English output is byte-identical to before (`EXPERIENCE`, `PROFESSIONAL SUMMARY`, …); only
Swahili gained translations. `Present` → `Sasa` on a Swahili CV.

### Evidence — extracted from the exported PDF

A CV with two projects and two referees, exported through the real path, then:

```console
$ pdftotext cvaudit/app/ats-nakuru-shipped.pdf -
Amara Osei Software Engineer amara.osei@gmail.com | +254 722 987 654 | …
PROFESSIONAL SUMMARY Software engineer with 6+ years …
EXPERIENCE Software Engineer | Zuri Fintech, Nairobi, Kenya | 2020-05 - Present …
PROJECTS M-Pesa Reconciliation Tool | Lead Developer | 2022 Reconciliation console that
  clears 40k mobile-money transactions a night for a regional fintech.
  github.com/amaraosei/mpesa-recon Warehouse Bin-Card Digitisation | Project Manager | 2019 …
EDUCATION … SKILLS … LANGUAGES … CERTIFICATIONS …
REFEREES Joseph Mkapa | Regional Director, Pwani Logistics j.mkapa@example.co.tz | +255 754 000 222
  Grace Mbwana | Head of Operations, Mwanza Freight g.mbwana@example.co.tz | +255 715 111 333
INTERESTS Open source, mentoring, chess, trail running

$ # greps, same artifact (and identical on the grid template)
Joseph Mkapa                       1        Warehouse Bin-Card Digitisation    1
Grace Mbwana                       1        PROJECTS                           1
M-Pesa Reconciliation Tool         1        REFEREES                           1
```

**Before**, measured on the pre-fix artifact the audit left behind
(`cvaudit/pdf-export/13-long-nakuru.pdf`, produced by the old `buildCvText`):

```console
$ pdftotext cvaudit/pdf-export/13-long-nakuru.pdf - | grep -c "Joseph Mkapa"      → 0
                                     … "Grace Mbwana"   → 0
                                     … "PROJECTS"       → 0
                                     … "REFEREES"       → 0
```

### Evidence — the Swahili machine copy matches the Swahili page

```console
$ pdftotext cvaudit/app/sw-nakuru-full-shipped.pdf -
Amara Osei Mhandisi wa Programu …
MUHTASARI Mhandisi wa programu mwenye uzoefu wa zaidi ya miaka 6 …
UZOEFU WA KAZI Mhandisi wa Programu | Zuri Fintech, Nairobi, Kenya | 2020-05 - Sasa …
MIRADI Zana ya Usuluhishi wa M-Pesa | Mhandisi Kiongozi | 2022 …
ELIMU Shahada ya Kwanza (B.Sc.) Sayansi ya Kompyuta … | Daraja la Kwanza
UJUZI … LUGHA … VYETI …
WADHAMINI Joseph Mkapa | Mkurugenzi wa Kanda, Pwani Logistics … Grace Mbwana | Mkuu wa Uendeshaji …
MAPENDELEO Programu huria, ulezi, chess, mbio za mlimani
```

```
English headings left in the Swahili text layer:  SUMMARY 0  EXPERIENCE 0  EDUCATION 0
                                                  SKILLS 0  LANGUAGES 0  CERTIFICATIONS 0  PROFESSIONAL 0
Swahili headings present:                         MUHTASARI 1  UZOEFU WA KAZI 1  ELIMU 1  UJUZI 1
                                                  LUGHA 1  VYETI 1  MAPENDELEO 1  MIRADI 1  WADHAMINI 1
```

**Before** (the audit's pre-fix Swahili PDF, `pdf-export/11-sw-nakuru.pdf`): `MUHTASARI 0`,
`UZOEFU 0` while `EXPERIENCE 1`, `SUMMARY 1` — the ATS received an English document
describing a Swahili page.

---

## 3. `lang` was ignored by the curated templates

### What changed

`lib/i18n/cv-headings.ts` already existed with a `cvHeadings(lang)` helper and **nothing
used it**. The headings are now read from it (or from the template's own existing Swahili
branch). 151 English heading literals were replaced across **20 of the 47 curated
templates**:

- **12 templates that never had a `lang` prop at all** — `lang` added to their props (and
  their props type) plus `const L = cvHeadings(lang)`: `metro`, `atlas`, `eclipse`,
  `horizon`, `nova`, `monarch`, `oxford`, `titan`, `canvas-magazine`, `vertex`, `muse`,
  `berlin`. Example, `metro.tsx:16,40,41`: `title="Profile"` → `title={L.profile}`
  (and its `interface Props` gained `lang?: Lang`).
- **8 templates that accepted `lang` but still hardcoded English headings** — `sahara`
  (this is the audit's §2.12 render, `12-sw-sahara`, whose headings were
  `SUMMARY / EXPERIENCE / EDUCATION / …`): `title="Summary"` → `title={L.summary}` etc.;
  plus `serengeti`, `nairobi`, `mombasa`, `zanzibar`, `aurora-edge`, `tokyo-grid`,
  `nordic-minimal`.
- The remaining 27 already translated their headings (`sw ? "Uzoefu wa Kazi" : …`) or are
  engine-backed (`meridian`, `narrative`, `grid`, `stripe`, `serif-cv`, `mono-cv` pass
  `lang` into `engine/layouts.tsx`, which localises through `engine/sections.tsx:30`).

### Evidence — all 47 rendered in both languages

```console
$ cd "$LOCALAPPDATA/Temp/cvaudit"
$ esbuild renderlang.tsx --bundle --platform=node --format=cjs --jsx=automatic \
    --tsconfig=<repo>/apps/web/tsconfig.json --outfile=renderlang.cjs
$ node renderlang.cjs        # 47 templates × {en,sw} → lang/<id>.<lang>.html + manifest.json
wrote 94 renders (47 templates × 2 langs)
```

Checking the **visible text** of every Swahili render for English heading words
(`SUMMARY|EXPERIENCE|EDUCATION|SKILLS|LANGUAGES|CERTIFICATIONS|REFEREES|INTERESTS|CONTACT|
PROFILE|PROJECTS|…`, case-insensitive) and requiring each render to contain Swahili headings
as a positive control:

```
sw renders with English heading words: 0 []
sw renders with NO Swahili heading at all (positive control): []
en renders with an English heading word: 46 / 47
```

The 47th, `mono-cv`, renders **no section headings in either language** — it passes
`sectionStyle: "none"` to the engine, and `engine/sections.tsx:52` returns `null` for that
style. There is no label there to leak English, so the check is vacuous for it rather than
passing it.

A second, stronger check — diffing the short text nodes each template produces in `en` vs
`sw` (strings a reader sees in *both* languages are headings that were not translated, with
the sample CV's own content filtered out) — left exactly one hit before the last fix
(`monarch: "Professional Experience"`, now `{L.experience}`) and none after. The only other
strings that survive in both languages are **not** headings:

* `atlas.tsx:276` — the skill-level word list
  `["", "Beginner", "Basic", "Intermediate", "Advanced", "Expert"]` is hardcoded English
  and stays English on a Swahili CV. **Not fixed** — there is no established Swahili
  vocabulary for these levels anywhere in the repo, and inventing one is not this task.
* `console.tsx:71–75` — `email` / `phone` / `location` / `linkedin` / `web` are the "keys"
  of that template's deliberate terminal/config-file conceit, like the `// date` comments
  around them. Left as designed.

Quoted headings, `sahara` (the audit's named offender), rendered sample CV:

```
EN  … Professional Summary Software engineer with 6+ years … Work Experience Software Eng…
SW  … Muhtasari Mhandisi wa programu mwenye uzoefu wa zaidi ya miaka 6 … Uzoefu wa Kazi …
```

and `metro` (which had no `lang` prop before this change):

```
EN  Amara Osei Software Engineer Contact … Skills React / Next.js … Languages English Native
    … Interests Open source, mentoring, chess … Profile Software engineer with 6+ years …
SW  Amara Osei Mhandisi wa Programu Mawasiliano … Ujuzi React / Next.js … Lugha English Native
    … Mapendeleo Programu huria, ulezi, chess, mbio za mlimani Wasifu Mhandisi wa programu …
```

(The DOM text is `Muhtasari`; the templates uppercases it with `textTransform`, so the page
reads `MUHTASARI` — the same string the ATS text layer writes.)

---

## 4. SmartFit now fills the page

### What changed — `components/templates/engine/fit.tsx`

The engine existed and was used only by the 6 engine-backed templates; it could only
*compress*. It now also *fills*, and every full-page CV render goes through it:

| line | change |
|---|---|
| `:35,36` | `FILL_TARGET = 0.9`, `FILL_TOLERANCE = 0.03` — the loop stops once the page is ≥ 87% full |
| `:39` | `FILL_MAX = 1.5` — magnification cap |
| `:41` | `SHRINK_MIN = 0.84` — the original tier-3 floor, kept |
| `:44` | `ITERATIONS = 7` |
| `:85` | `renderedFill(page)` — bottom of the lowest element containing text ÷ **the page's own rendered height** (so an ancestor scale — the editor preview, the 0.479× marketing preview — cannot distort the measurement) |
| `:116` | `apply(scale)` — lays the design out at `794/scale` px and magnifies it by `scale`, setting the width on the template root too (templates carry their own inline `width: 794px`) |
| `:129` | `run()` — measure at natural size, derive the existing 3-tier compression context from it, then iterate (damped, ±22% per step) toward the fill target, keeping the fullest result that doesn't overflow |
| `:111` | `AutoFitPage({ children, fill })` — `fill={false}` restores the old shrink-only behaviour, which is how "before" was measured on the same page |
| `components/templates/template-canvas.tsx` (new) | `TemplateCanvas` — the wrapper that puts `AutoFitPage` around a template; takes children, so server components can use it |
| wired at | `cv-editor-client.tsx:3078` (the `#cv-preview` element that is **exported**), `app/[locale]/(marketing)/templates/[slug]/page.tsx:114`, `public-cv-view.tsx:55`, `dashboard-cv-grid.tsx:117`, `cv-assistant-client.tsx:2350`, `snap-client.tsx:1062` |

Why magnify rather than grow the margins: the templates set every size and gap inline in px,
so nothing but the rendered layout knows how tall a CV is, and there is no CSS lever to scale
"spacing only" generically. Laying the design out at `794/scale` and magnifying by `scale`
is a true zoom that fills exactly the 794-wide sheet; the loop measures the real result
instead of trusting the arithmetic (text rewraps as the layout box narrows).

Thumbnails are deliberately **not** wrapped: the gallery renders 267 templates and running a
measuring engine on each tile is page-weight for no benefit at 106 px.

### Evidence — fill percentage, before/after

**(a) The real app**, same page, same data, same fonts, one page load; "before" neutralises
the SmartFit scale (natural 794 px width, scale 1) which is the geometry every template had
before, since nothing was wrapped. `node cvaudit/measure-app.cjs`:

| template | audit's number | before (this run) | after | scale applied |
|---|---|---|---|---|
| **regent** | **52%** | **58.7%** | **87.4%** | 1.326 |
| **nakuru** | **55%** | **60.2%** | **87.9%** | 1.264 |
| malachite | 52% | 57.9% | 87.4% | 1.324 |
| kioo | 66% | 71.6% | 88.7% | 1.239 |
| pemba | 64% | 71.2% | 88.4% | 1.183 |
| nuru | 71% | 75.0% | 87.4% | 1.165 |
| serengeti | 69% | 74.9% | 92.1% | 1.151 |
| zanzibar | 62% | 65.3% | 92.1% | 1.213 |
| mombasa | — | 62.3% | 90.2% | 1.261 |
| **sahara** (control) | 83–85% | 89.8% | **89.8%** (untouched) | none |

The "before" column is a bit higher than the audit's because the font fix landed first:
these pages are now set in Inter rather than Arial, and Inter runs slightly taller. The
audit's 52%/55% and my 58.7%/60.2% are the same defect measured either side of the font fix.

**(b) The exported artifact**, through the real export path (raw = the template unwrapped —
literally what every render site did before, since 0 of 267 components were wrapped):

| case | raw (before) | shipped (after) |
|---|---|---|
| nakuru, 2-role CV (dom / raster) | 55.4% | **90.8%** |
| malachite, 2-role CV (dom / raster) | 51.8% / 51.8% | **90.8% / 90.8%** |
| sahara, 2-role CV (dom / raster) | not run (the marketing-page row above is the control) | 87.2% / 86.7% |
| **new-graduate CV** (the audit's 45% case, sahara) | 64.1% / 63.6% | **88.8% / 88.2%** |
| grid, 6-role CV (dom / raster) | — | 95.6% / 95.4% |

The raster figure is the fill measured on the canvas html2canvas produced — the image the
PDF is made of — so the fill survives the export, not just the screen.

**(c) From the PDF bytes themselves** (JPEG streams lifted out of `cvaudit/app/*.pdf`,
measured with Pillow):

```
malachite-raw.pdf        1 image 1588x2246  last ink at 51.9% of the page
malachite-shipped.pdf    1 image 1588x2246  last ink at 90.9%
long-nakuru-raw.pdf      2 images: 1588x2245 + 1588x269   ← page 2 is 269px tall
long-nakuru-shipped.pdf  1 image:  1588x2246              ← one page
```

### The 152 px page-2 spill: gone

The audit's 6-role CV spilled ~152 px onto a second page. Mine (6 roles, 2 degrees, 9
skills, 2 certifications, 2 projects, 2 referees) spills **134 px at 1× (a 269 px-tall page 2
at the 2× export scale) when the template is rendered the old way**, and **0 px when it goes
through SmartFit** — the shipped PDF is one page:

```
long-nakuru-raw      [raw]     pages=2  canvasH=1257  overSpill=134px
long-nakuru-shipped  [shipped] pages=1  canvasH=1123  overSpill=0px
```

(pages counted in the PDF bytes: `/Type /Page` objects; `pdfinfo` is not installed here.)

Design sanity, not just arithmetic: `regent` and `nakuru` were rendered to PNG and looked at
(`cvaudit/app/*-shipped.png`). Both fill the sheet, the body text is comfortably legible
(not blown up), the sidebar stretches to the full height, and nothing is clipped or
overlapping.

---

## Commands

```bash
# --- the app, with dummy Supabase vars so the marketing routes hydrate ---
cd /c/Users/hamis/projects/sumaiya/apps/web
NEXT_PUBLIC_SUPABASE_URL=https://harness.supabase.co \
NEXT_PUBLIC_SUPABASE_ANON_KEY=harness-anon-key npx next dev -p 3112

# --- fill + rendered font on the real app (Playwright + real Chrome + CDP) ---
cd "$LOCALAPPDATA/Temp/cvaudit" && node measure-app.cjs
#   → app/fills.json, app/<template>-shipped.png

# --- the export path (real template → real lib/pdf.ts → PDF) ---
esbuild exportfit.tsx --bundle --platform=browser --format=iife --jsx=automatic \
  --supported:dynamic-import=false \
  --tsconfig=C:/Users/hamis/projects/sumaiya/apps/web/tsconfig.json --outfile=exportfit.js
python -m http.server 3113 --bind 127.0.0.1          # serves the harness + Inter woff2
node run-export.cjs                                   # → app/*.pdf, app/export-summary.json

# --- ATS text layer ---
pdftotext app/ats-nakuru-shipped.pdf -
pdftotext app/sw-nakuru-full-shipped.pdf -
pdftotext ../cvaudit/pdf-export/13-long-nakuru.pdf - | grep -c "Joseph Mkapa"   # pre-fix artifact → 0

# --- lang, all 47 curated templates, both languages (SSR of the real components) ---
esbuild renderlang.tsx --bundle --platform=node --format=cjs --jsx=automatic \
  --tsconfig=C:/Users/hamis/projects/sumaiya/apps/web/tsconfig.json --outfile=renderlang.cjs
node renderlang.cjs                                   # → lang/*.html + lang/manifest.json

# --- the repo's own checks ---
cd /c/Users/hamis/projects/sumaiya/apps/web
npx tsc --noEmit
npx vitest run
```

Test suite: `2053 passed | 3 skipped`, one file failing at first —
`lib/swahili-lint.test.ts`, on `lib/i18n/cv-headings.ts:33`, which was **my own comment**
citing the banned words as the ones *not* to use:

```
Error: "Marejeo" — wrong noun for CV "references"; every CV heading and the pre-filled
referee data use "Wadhamini" … — in lib/i18n/cv-headings.ts:33
```

The guard was right to fire and the copy it guards is correct (`sw: "Wadhamini"`). The
comment was reworded to make the same point without quoting the calques — no
`swahili-lint-ignore`, no widened `skip`, guard untouched.

---

## What I could NOT verify, and why

1. **The editor page itself** (`/editor/cv/…`). It needs a real session; the dev server here
   only has `DATABASE_URL`, and I used dummy Supabase values to get the public routes to
   hydrate. So I never clicked **Download PDF in the editor**. What *is* verified is the
   code path it calls — the same `renderElementToPdfBlob` over the same `TemplateCanvas`
   element that `cv-editor-client.tsx:3078` renders into `#cv-preview`, exercised in the
   browser with the same template, data and wrapper.
2. **The 220 non-curated templates.** The task was the 47 curated ones; the rest still
   render English headings in Swahili mode.
3. **English inside Swahili regardless of `lang`**: month names and `Present` in date ranges
   (`May 2020 – Present`, from `template-utils.tsx`'s `dateRange`/`fmtDate`, which take no
   language), the `Grade:` label / ` in ` connector inside education entries
   (e.g. `sahara.tsx:201`), and `atlas`'s hardcoded skill-level words (see §3). The text
   layer now says `Sasa`, the page still says `Present`.
4. **`lib/docx.ts`** — the Word export builds its own text and was not made language-aware.
5. **Real ATS parsers.** Only `pdftotext` was run — no Greenhouse/Workable/Taleo scoring.
6. **The production build.** Everything was measured on `next dev`. The Inter faces are
   fetched and emitted by next/font at build time (works in dev too — the woff2 files the
   `@font-face` rules point at were downloaded and used), but I did not run `next build`.
7. **Devices without Inter and non-Chromium engines.** The platform-font query is Chrome on
   Windows; Firefox/Safari and Android WebView were not exercised.
8. **Documents longer than the 6-role CV** (3+ pages) and the compress floor: at
   `SHRINK_MIN = 0.84` a CV whose content is more than ~19% over A4 still spills — behaviour
   unchanged from before, and no such case was measured.
9. **The native app** (`apps/native`, a separate renderer) — untouched, untested.
10. **Print output.** No printer; the ink-coverage points from the audit are not re-measured.
11. **Photo-bearing templates.** The sample CV has no photo, so `kioo`'s photo column was
    measured in its no-photo state only.

Pre-existing working-tree changes I did not make and did not touch:
`apps/native/src/navigation/root-navigator.tsx` (1 line deleted) and the untracked
`apps/web/app/[locale]/(marketing)/pata-kazi/`. Nothing is committed or pushed.
