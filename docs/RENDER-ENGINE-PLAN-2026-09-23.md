# Render engine + landing page — research findings and ordered plan
*2026-09-23. Two independent audits (native render engine; web landing page), plus my own measurements on
the Enigma (Hisense, Android 15, 720×1560, density 320/override 272) and on a real exported PDF.*

---

## PART A — Why documents look poor, and the ordered fix

### A1. Everything is software-rasterised — 3 surfaces, 0 bytes, one word each
`androidLayerType="software"` is set on **every** document surface:
`cv-preview-card.tsx:288` (card thumb), `cv-preview-card.tsx:409` (full-screen), `real-template-thumb.tsx:63`
(TemplateHub modal). `react-native-webview` defaults to `'none'` (`WebView.android.tsx:73`) — the prop maps
1:1 onto `View.setLayerType` (`RNCWebViewManagerImpl.kt:566-574`). `LAYER_TYPE_SOFTWARE` makes Chromium
rasterise the whole page to a CPU bitmap and composite that onto a 2.75–3× density screen. At the preview's
0.38–0.52 page scale (`fit.ts:45-48`), that is where perceived sharpness lives. **This is the single most
likely cause of "feels low res".**

### A2. The app ships zero typefaces
No `.ttf`/`.otf`/`.woff2` anywhere in `apps/native`, and `_layout.tsx:54` calls `Font.loadAsync({…})` with an
**empty map**. Every template asks for `-apple-system`/`"Helvetica Neue"`/`Arial` (`cv-html.ts:235-305`,
`render.ts:56-71`) — none exist on Android, so all 218 templates render in Roboto, and the *serif* templates
render in whatever the ROM's serif alias is, or in sans, erasing the design intent.

### A3. Small print is below the legibility floor — and the constant already exists
`tokens.ts:69-86` emits an 8.5px meta/tag token, and compact density multiplies by 0.9 (`:42-46`, `:83-84`)
→ **7.65px = 5.7pt**. `sections.ts:164` is a literal `font-size:8px`; `cv-html.ts` has 9–10.5px literals
(`:244,:252,:254,:263,:264,:279,:286,:289,:292,:301`).
**`apps/web/components/templates/engine/typography.ts` already defines `SMALL_PRINT_FLOOR_PX` (10.7 = 8pt at
96dpi) and `clampFontPx` — and has ZERO importers.** Clamping the token scale fixes all 218 engine templates
without touching a single generated template file.
Note: two tests pin current CSS and must move in the same commit — `registry-sync.test.ts:142`,
`cv-html.test.ts:99`.

### A4. Export is US Letter, not A4 — verified from the native source
`expo-print`'s Android path builds media size only from `PrintAttributes` and defaults to
`DEFAULT_MEDIA_WIDTH = 612` / `DEFAULT_MEDIA_HEIGHT = 792` (`PrintPDFRenderTask.kt:23-24`), honouring
`options.width`/`options.height` (`:57-62`). `@page { size: A4 }` is **ignored** on that path. Measured on a
real export: MediaBox **612×792pt**.
Every page is authored **794×1123** (`fit.ts:34-35`), i.e. 67 CSS px taller than a Letter content box — which
is exactly why a one-page CV exports as a two-page PDF with a sliver on page 2, and sits off-centre.
Fix: `Print.printToFileAsync({ html, width: 595, height: 842 })` at **three** call sites —
`pdf-export.ts:66`, `job-apply-screen.tsx:119-121`, `pdf-tools-screen.tsx:91`.
Caveat to verify on device: depends on Chromium's CSS-px-per-inch for print (96 → solved; 72 → also needs a
print-only `zoom: 595/794` wrapper).

### A5. Previews can never be readable at fit-width (a geometry fact, not a bug)
A 360dp frame is 360 CSS px, so a 794px sheet shows at ~0.45 and 9.75px body text paints at ~4.4 CSS px.
What is called "low res" on the reading surface is largely "too small to sample". Needs a 1×/2× toggle
(re-render at `screenW*2`, built lazily), `scalesPageToFit={false}` (library default is `true`,
`WebView.android.tsx:66`), and page guides + a page count.

### A6. Font embedding — measured, not estimated
Base64 `@font-face` inside the document `<head>` (same mechanism the photo already uses, `photo.ts:65-70`),
because `expo-print` builds its own WebView with `loadDataWithBaseURL(null, html, …)` and exposes no
file-access props (`PrintPDFRenderTask.kt:41-48`) — so `baseUrl`/`file://` are not options.
Subset to 204 codepoints (ASCII + Latin-1 + curly quotes/dashes/bullet/ellipsis):
Inter var 100–900 = 37.4KB raw / **49.9KB base64**; Noto Serif var = 31.7KB / **42.2KB base64**
→ **~92KB of APK** for the pair. A `.woff2` cannot be a Metro asset (not in `assetExts`), hence a generated
base64 module. Verify with `pdffonts` that the subset really embeds — the face must be applied before
`onPageFinished` writes the PDF (`PrintPDFRenderTask.kt:89`).

### A7. Short CVs leave the page ~half empty
The engine has **no AutoFit wrapper at all** (`layouts.ts:8-12`); the web measured 45–55% fill
(`docs/CV_DESIGN_AUDIT.md:370-384`). Port the web's SmartFit (band 0.92–1.12, 7 measured iterations,
`engine/fit.tsx:44-80`) as a lightweight native version: measure `scrollHeight` via `onMessage`, re-render
once with a clamped spacing multiplier from the space tokens. Print path untouched.

### THE ORDER
1. **Delete `androidLayerType="software"`** (A1) — one word per surface, zero bytes, trivially revertible.
   Nothing else can be credited until this is A/B screenshotted on the phone, because every typeface, size and
   page improvement sits on top of this raster.
2. **A4 print options** (A4) — three lines, fixes every exported document.
3. **Small-print floor** (A3) — one clamped function, fixes 218 templates.
4. **Bundle 2 fonts** (A6) — ~92KB, the biggest step from "phone default text" to "a designed document".
5. **Zoom + page guides** (A5), then **SmartFit fill** (A7), then the offline photo fix.

### DELIBERATELY NOT DOING
Server-side rendering (breaks offline); a JS typesetter (throws away Chromium line-breaking, colour and the
free ATS text layer, costs hundreds of KB, re-implements pagination by hand); a native per-template renderer
(breaks the "a WebView shows exactly what will print" invariant, `cv-html.ts:8-10`); a WebView per gallery
cell (dozens of Chromium instances on a cheap phone); bundling the web's full 12-family catalogue (~400–500KB
for no phone legibility gain); blankly scaling the type scale up (cannot help a 0.45-scale view and turns
one-page CVs into two-page PDFs).

---

## PART B — The template gallery does not show real previews (measured on the Enigma)

Screenshot evidence: grid vs tap-preview, both captured 2026-09-23.

**B1. The grid is a 5-variant wireframe drawing.**
`template-gallery.tsx:208` renders `<TemplateThumb>` — `template-thumb.tsx`, which draws fake bars
(`#c9c4bd` lines, `accent+"22"` sidebar) in **5 variant branches**, for **224 templates**. That is why
*Aberdare, Meridian, Safu Pembeni, Athi, Awash, Bangweulu, Baro* all look identical.
The real renderer exists — `RealTemplateThumb` — and is used **once**, at `:402` (behind a tap).
`:353` records why: *"a real WebView per cell stuttered scrolling"*.
**Fix:** pre-render each template once to a cached image (generated at device resolution, shipped or
lazily built + cached). Real, sharp, and faster than 224 live thumbnails. Cost ≈ 224 × 20–30KB ≈ 5–7MB, or
0 if generated on-device on first view. This also serves the low-res goal, since the cached render is
device-resolution.

**B2. The tap preview is a real render — but the sample is thin, so it reads as unfinished.**
Verified on device: *Meridian* renders a genuine design (navy sidebar, `MAWASILIANO`, `UJUZI` with rating
dots, `MUHTASARI`, `UZOEFU WA KAZI`, `ELIMU`). But **~60% of the sheet is blank**, because
`lib/sample-cv.ts` (146 lines) holds only: experience 2, education 1, skills 8, languages 2,
certifications 2, **no projects**, summary 148 chars.
**Fix:** make `sample-cv.ts` a full-length realistic CV — 3–4 roles with achievement bullets, 2 education
entries, projects, certifications, referees. One file; every preview immediately looks like a document
someone would send.

---

## PART C — The landing page: why a visitor cannot tell what to do

**C1. Two different first steps on one screen.** The subhead instructs *"Bandika tangazo la kazi"* /
*"Paste the job advert"* (`home-page-client.tsx:494-496`) while the only button says *"Anza CV yako – Bure"*
/ *"Start your CV – free"* → `/editor/cv/try` (`:510-513`). Instruction and control disagree about action one.

**C2. The page still sells AI writing that is dark.** `:504-507`'s own comment records that `/assistant`'s AI
is `configured:false` in production and 401s a guest — yet `:495-496` promises the AI, `:515-522` keeps the
secondary CTA *"au ongea nami"* / *"or talk to me"* → `/assistant`, and step 2 (`:645-646`) repeats it.

**C3. It contradicts itself about accounts** inside the same first screen: *"ingia tu"* / *"sign in when you
want me to do the writing"* (`:495-496`) vs *"Faili lako ni lako, ukiingia au usiingie"* (`:531-533`) vs the
FAQ's *"Hapana"* (`:441`).

**C4. The one instruction is a 39-word run-on** carrying instruction + identity + language + cost + a sign-in
caveat — the densest block on the page, on the smallest screen.

**C5. Five messages above the fold, one of them actionable** (`:474`, `:487`, `:495`, `:531`, `:543-551`).

**C6. The nav asks for a choice before the page says what it is** — six destinations, none of them
"write my CV" (`marketing-nav.tsx:36-45`).

**C7. The same three claims are made three times** (`:543`/`:706`, `:551`/`:711`, `:547`/`:774`) — the page
grows without adding an action.

**C8. "Try it" contains nothing to try** (`:754`, body `:763-783`, no button).

**C9. Three CTA bands, three labels, one destination** (`:510-513`, `:669-672`, `:930-933`).

**C10. The real product (the phone app) is last on the page**, and its label, body and QR destination each
promise something different (`scan-to-app.tsx:48`, `:52-53`, `:56-61`, `:26-31`).

**C11. The sample CV has no caption** — the sentence explaining it lives ~350 lines lower (`:842-843`).

### THE FIX (do the hero first, alone)
Replace `:486-523` with one outcome headline, one instruction subhead, **ONE** button, no second CTA:

- eyebrow EN `FOR JOB SEEKERS — TANZANIA` / SW `KWA WATAFUTA NAFASI ZA KAZI — TANZANIA`
- headline EN *"A CV that matches the job you are applying for."* / SW *"CV inayolingana na kazi unayoomba."*
- subhead EN *"I'm Sumaiya. Open the editor, put in your details, download your PDF — free, no account
  needed. Swahili first."* / SW *"Mimi ni Sumaiya. Fungua kihariri, ingiza ujazo wako, pakua PDF yako —
  bure, bila akaunti. Kiswahili kwanza."*
- primary CTA **one label everywhere**: EN *"Write my CV — free"* / SW *"Andika CV yangu — bure"* →
  `/editor/cv/try`; secondary = in-page jump *"Ona hatua tatu"* / *"See the three steps"* → `#how-it-works`
- keep the reassurance line verbatim (`:531-533`); put step one in words under the button; caption the sample.

Then: move HOW IT WORKS up to position 3, CV DESIGNS GRID to 5 with the caption from `:842-843`, FAQ to 6;
**delete** the DARK CTA BAND (`:915-938`), PROOF (`:743-784`), the hero micro-claim row (`:540-553`), the
`/assistant` secondary CTA, the sign-in caveat, and the design counts on product cards; demote the PRODUCT
GRID to two cards; move ScanToApp above the footer and make it device-aware with ONE promise.

No fabricated content exists on the page today (the testimonials band was already removed, `:743-747`; "no
invented numbers" at `:757-759`), and no pricing claim is rendered. Remaining claim defect for the Swahili
side: the nav entry `Kagua CV`/`ATS Checker` (`marketing-nav.tsx:41`, `:110`) still exposes "ATS".
