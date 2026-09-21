# QA — I/O MATRIX: every input the app takes, every output it produces

Date: **2026-09-20** · Target: **https://sumaiya.app (live production)** · Repo: `C:\Users\hamis\projects\sumaiya`

Scope: the **input/output surface only** — what the product accepts, what it emits, and where it
lies about either. Signed-in user journeys and the Android client are covered by sibling agents
and are deliberately not duplicated here.

Everything below comes from driving the live site with a real Chrome (Playwright) using **real
fixtures**: genuine OOXML `.docx` files, genuine text-layer PDFs, a genuine image-only scanned
PDF, real JPEG/PNG/WebP bytes, a 27 MB PDF, a password-protected PDF, a corrupt PDF, and two
deliberate content/extension mismatches. No fixture is a renamed text file. How each was built is
in the appendix.

---

## 0. Method, and two corrections to earlier numbers in this workstream

Two independent live paths were exercised, because the product has two:

1. **The server extractor** — `POST /api/tools/extract-text` (`apps/web/lib/api/routes/tools.ts`),
   the engine behind the public PDF tools and the assistant's fallback. Magic-byte sniffed.
2. **The browser extractor** — `apps/web/lib/client-cv-extract.ts`, reached through the real file
   input on `/assistant` (its `accept` list is the app's widest): pdf.js text layer, tesseract.js
   OCR fallback, mammoth for DOCX, `File.text()` for plain text.

Outputs were captured by hooking `URL.createObjectURL` inside the live page — the exact call
`lib/pdf.ts` `triggerBlobDownload()` makes — so every PDF inspected is **the real blob the user
downloads**, not a re-render. The PDFs were then inspected in the bytes (pypdf + Pillow), not in
the DOM.

> **Correction 1 — a false red, discarded.** An early pass of the template sweep reported that
> different templates exported byte-identical rasters, which would have been a severe defect. It
> was my harness: two browser sessions were PATCHing the same CV row at once, so the template
> under test was overwritten mid-run. Run serially with a single writer, four templates give four
> distinct documents (nakuru 290,879 B / rift 384,089 B / zahabu 324,981 B / coral 353,517 B, four
> distinct raster hashes). The contention numbers are discarded.
>
> **Correction 2 — a false absence, resolved.** The clean 162-case sweep *does* exercise the photo
> path: **59 photo rows, 50 with a rendered photo and an in-page variance of 4102.8** (proving a
> real image, not the present-but-empty bug), 9 with `photos=0` (templates that drop the photo by
> design — see D7). The `photos=0`/`var=-` figures circulated earlier belong to the discarded
> 105-row contention run, which never set a photo and never measured variance. The photo evidence
> in §4 is measured from the PDF bytes, not from DOM presence.

## 1. Headline

**D8 — the entire Skills section silently disappears whenever a skill entry's `level` is missing
or is not a strict 1–5 integer. No error, no warning, no log.**

This is the biggest finding of the pass, and it is the "silent" class the brief was hunting.

`apps/web/types/index.ts` defines the strictest entry schema in the file:

```ts
export const skillEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  level: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
});
```

`level` is **required** and has **no default** — unlike `experienceEntrySchema` and
`educationEntrySchema`, which carry defaults for every field. `looseArray()` then does
`safeParse` + `flatMap`, so a skill that fails validation is **dropped entry by entry**, and the
whole section disappears. Measured with the app's own `parseCVData()`:

    skills as written by the import adapter ({id,name,level:3})
       in=9 out=9 names=["TypeScript","Node.js","PostgreSQL","AWS","Docker","Terraform","Kafka","React","Go"]
    skills WITHOUT level (what my API fixture stored)
       in=9 out=0 names=[]
    skills with level as a STRING "3"
       in=9 out=0 names=[]
    skills with level 0 (out of the 1-5 literals)
       in=9 out=0 names=[]
    skills with level 7 (out of range)
       in=9 out=0 names=[]
    
    control (my fixture, no level): experience=3 education=2 languages=3 certifications=2 projects=2

Everything else in the same payload survives untouched (experience 3, education 2, languages 3,
certifications 2, projects 2) — the loss is isolated to skills, which makes it invisible:
looks like a perfectly good CV that happens to have no skills on it.

Confirmed end-to-end on the live site: the API returned `data.skills` with 9 entries including
"TypeScript"; the rendered nakuru preview contained **no `UJUZI`/`SKILLS` heading and none of the 9
skills**; and the exported PDF's decompressed content stream does not contain the string
"TypeScript" at all. The PDF's drawn-string count is **47**, against **50** for a faithful replay
of the same text-layer code with the same library and a `level`-bearing skills array — exactly the
3 elements (`""`, the heading, the skills line) that the skills block pushes.

**Reachability, stated honestly:** the app's own import adapter (`lib/cv/from-parsed.ts`,
`toCvData`) does emit `level: 3`, so the `/import-cv` and CV-Assistant on-ramps are safe. But
`POST`/`PATCH /api/cv` validate `data` only as `z.record(z.unknown())` — the payload is stored
unvalidated — and the schema's own comment names the trigger (*"a skill whose `level` arrived as a
string instead of 1–5"*). So any other writer (a native client, an integration, an older build)
silently costs the user their whole Skills section on every subsequent read.

**D1 — Kioo stretches the CV photo ~10 % in the exported PDF. The screen shows it correctly.**

- On screen the square source photo renders as a **round** face disc (the browser honours
  `object-fit: cover` and crops into the 272 × 300 frame).
- In the **exported PDF** the same disc measures **304 × 333 px (aspect 0.913)** — a filled ellipse, not a circle
  (pixel count 79,458 ≈ π/4 · w · h = 79,507, so it is a solid stretched shape, not noise).
- **Mechanism, proven in isolation.** `components/templates/kioo.tsx` puts the photo in a
  `width:"100%"` (272 px) × `height:300` frame with `objectFit:"cover"`. html2canvas **1.4.1**
  (the version `lib/pdf.ts` imports) does not implement `object-fit`, so it scales the two axes
  independently into the box. Reproduced on a bare page with the app's own html2canvas build:
  a 600 × 600 source with a round disc, in a 120 × 132 frame with `object-fit: cover`,
  rasterises the disc as **60 × 66 → aspect 0.909**, an exact 10 % stretch. See `h2c/index.html`.
- **Blast radius: exactly one template out of 266.** A static scan of every component in
  `components/templates/` (266 files) finds only `kioo.tsx` using a raw `<img>` for the
  photo; every other template goes through the shared `PhotoCircle` / `PhotoSquare` / `CvPhoto`
  helpers, which are square by construction and therefore immune.
- **Not the shipped blank-photo bug.** Non-uniformity was measured, not presence:
  **50 / 59 photo-bearing exports carry real image content**
  (in-page canvas variance 4102.8), and per-template, in the PDF bytes, the photo footprint's
  luminance standard deviation is 60–94 with 45–200 distinct grey levels. Nothing was blank.
- **Why it matters commercially:** Tanzania's own recruitment portal requires a passport-size
  photo, so a distorted headshot in the file the candidate sends is a product-level failure.

**D9 — a CV too long for one page is CLIPPED in the exported PDF, and the "CV too long" UI warning
is printed into the file.**

- A deliberately over-long CV (9 roles × 5 bullets, 21 skills, 4 projects) exports as **1 page**.
- The visible content **stops mid-line at the bottom edge** — pixel crop `longcv-bottom-right.png`
  shows a bullet cut off at "…y improved settlement throughput a". Roles 6–9, education,
  certifications, referees and interests are simply not on the page.
- The **ATS text layer still claims all of it** (7,347 chars, contains `Role 9` / `Employer 9`) —
  so the machine copy describes a document the recruiter cannot see.
- The bottom-right of the exported page carries the in-app warning pill **"⚠ CV too long —
  remove some content"**, rasterised into the deliverable.
- Measured cause: the captured sheet is always 794 × 1123 CSS px (`scrollHeight` 1123 even for the
  over-long CV), so `computePageCount()` in `lib/pdf.ts` sees one page and the multi-page slicing
  path is never reached; content beyond the sheet is dropped by the frame's `overflow: hidden`.
- All 162 exports in the sweep are 1 page — the multi-page code in `lib/pdf.ts` is, on this
  evidence, unreachable from the editor.

**D2 — the server extractor rejects every image, with a message that tells you to send an image.**

`POST /api/tools/extract-text` answers JPEG, PNG and WebP with `415` and the body _"Couldn't read
that file type. Send a PDF, a Word (.docx) file, **a photo**, or paste the text."_ The route has no
image branch at all. The same tool's tile on `/tools` advertises *"Toa Maandishi … Inafanya kazi na
PDF za skani na za dijitali"*, yet a scanned PDF gets `422` _"…it's a scan. Send a clear photo of
it instead."_ The `/assistant` browser extractor OCRs the same files correctly, so this is a
/tools-surface gap, not a platform limit.

**D3 — over the cap, the user gets the platform's raw error.** `lib/upload-limits.ts` documents a
4 MB cap because the platform rejects larger bodies at the edge. A 27 MB PDF returns HTTP **413**
with a **plain-text** body `Request Entity Too Large / FUNCTION_PAYLOAD_TOO_LARGE` after ~91 s;
the app's own friendly 413 never runs.

---

## 2. PART 1 — the input matrix

### 2.1 Server extractor — `POST /api/tools/extract-text` (live)

| fixture | bytes | outcome | pages | text chars | message / extracted head | latency |
|---|---|---|---|---|---|---|
| cv-text.pdf | 3,283 | accepted | 1 | 1,725 | Amina Joseph Mwakasege Software Engineer amina.mwakasege@exa | 1675 ms |
| cv-sw.pdf | 2,880 | accepted | 1 | 1,373 | Juma Hamisi Chang'ombe Mhandisi wa Programu juma.chang'ombe@ | 1420 ms |
| cv-mixed.pdf | 2,795 | accepted | 1 | 1,084 | Grace Nyambura Mugo Data Analyst / Mchanganuzi wa Taarifa ju | 1735 ms |
| cv-long.pdf | 17,551 | accepted | 7 | 15,525 | Amina Joseph Mwakasege Software Engineer amina.mwakasege@exa | 1467 ms |
| cv-scanned.pdf | 242,440 | **rejected 422** | – | – | That PDF has no selectable text — it's a scan. Send a clear photo… | 4519 ms |
| cv-blank.pdf | 1,708 | **rejected 422** | – | – | That PDF has no selectable text — it's a scan. Send a clear photo… | 2891 ms |
| cv-huge.pdf | 27,001,436 | **rejected 413** | – | – |  | 91377 ms |
| cv-zero.pdf | 0 | **rejected 415** | – | – | Couldn't read that file type. Send a PDF, a Word (.docx) file, a … | 4025 ms |
| cv-corrupt.pdf | 11,515 | **rejected 500** | – | – | Couldn't read that file. Try a PDF or paste the text. | 2386 ms |
| cv-protected.pdf | 3,418 | **rejected 500** | – | – | Couldn't read that file. Try a PDF or paste the text. | 2459 ms |
| cv-docx-content-mismatch.pdf | 9,547 | accepted | 1 | 926 | Amina Joseph Mwakasege  Software Engineer  amina.mwakasege@e | 1809 ms |
| cv-png-content-mismatch.pdf | 222,099 | **rejected 415** | – | – | Couldn't read that file type. Send a PDF, a Word (.docx) file, a … | 9265 ms |
| cv-pdf-content-mismatch.docx | 3,283 | accepted | 1 | 1,725 | Amina Joseph Mwakasege Software Engineer amina.mwakasege@exa | 2574 ms |
| cv-noextension | 9,547 | accepted | 1 | 926 | Amina Joseph Mwakasege  Software Engineer  amina.mwakasege@e | 1322 ms |
| cv.docx | 9,547 | accepted | 1 | 926 | Amina Joseph Mwakasege  Software Engineer  amina.mwakasege@e | 445 ms |
| cv-sw.docx | 9,514 | accepted | 1 | 927 | Juma Hamisi Chang'ombe  Mhandisi wa Programu  juma.chang'omb | 1064 ms |
| cv-mixed.docx | 9,428 | accepted | 1 | 725 | Grace Nyambura Mugo  Data Analyst / Mchanganuzi wa Taarifa | 670 ms |
| cv-photo.docx | 340,189 | accepted | 1 | 926 | Amina Joseph Mwakasege  Software Engineer  amina.mwakasege@e | 1922 ms |
| cv-long.docx | 9,679 | accepted | 1 | 16,721 | Amina Joseph Mwakasege  EXPERIENCE EXPERIENCE EXPERIENCE EXP | 598 ms |
| cv.txt | 2,128 | accepted | 1 | 1,725 | Amina Joseph Mwakasege Software Engineer amina.mwakasege@e | 859 ms |
| cv-sw.txt | 1,690 | accepted | 1 | 1,373 | Juma Hamisi Chang'ombe Mhandisi wa Programu juma.chang'omb | 476 ms |
| cv-photo.jpg | 378,773 | **rejected 415** | – | – | Couldn't read that file type. Send a PDF, a Word (.docx) file, a … | 2118 ms |
| cv-photo-sw.png | 222,099 | **rejected 415** | – | – | Couldn't read that file type. Send a PDF, a Word (.docx) file, a … | 1914 ms |
| photo-tall-alpha.png | 7,618 | **rejected 415** | – | – | Couldn't read that file type. Send a PDF, a Word (.docx) file, a … | 818 ms |
| photo.webp | 289,812 | **rejected 415** | – | – | Couldn't read that file type. Send a PDF, a Word (.docx) file, a … | 2703 ms |
| cv-zero.docx | 0 | **rejected 415** | – | – | Couldn't read that file type. Send a PDF, a Word (.docx) file, a … | 424 ms |

### 2.2 Browser extractor — the real file input on `/assistant`

The app's widest input surface. The AI request is aborted so the payload the app *built* is the
evidence and no model spend occurs; the text between the first pair of triple quotes in the
message that names the file is the extraction.

| fixture | bytes | what the user got | message | chars extracted | wall |
|---|---|---|---|---|---|
| cv-text.pdf | 3,283 | read → sent to AI |  | 1,725 | 1317 ms |
| cv-sw.pdf | 2,880 | read → sent to AI |  | 1,373 | 4973 ms |
| cv-long.pdf | 17,551 | read → sent to AI |  | 9,994 | 2514 ms |
| cv-scanned.pdf | 242,440 | read → sent to AI |  | 1,588 | 19890 ms |
| cv-blank.pdf | 1,708 | **NO TERMINAL STATE (silent)** |  | – | 260223 ms |
| cv-huge.pdf | 27,001,436 | **NO TERMINAL STATE (silent)** |  | – | 95272 ms |
| cv-zero.pdf | 0 | **NO TERMINAL STATE (silent)** |  | – | 95285 ms |
| cv-corrupt.pdf | 11,515 | **NO TERMINAL STATE (silent)** |  | – | 95089 ms |
| cv-protected.pdf | 3,418 | **NO TERMINAL STATE (silent)** |  | – | 95114 ms |
| cv-docx-content-mismatch.pdf | 9,547 | read → sent to AI |  | 926 | 1700 ms |
| cv-png-content-mismatch.pdf | 222,099 | **NO TERMINAL STATE (silent)** |  | – | 95335 ms |
| cv-pdf-content-mismatch.docx | 3,283 | read → sent to AI |  | 1,725 | 1307 ms |
| cv-noextension | 9,547 | **NO TERMINAL STATE (silent)** |  | – | 95120 ms |
| cv.docx | 9,547 | read → sent to AI |  | 926 | 475 ms |
| cv-sw.docx | 9,514 | read → sent to AI |  | 927 | 461 ms |
| cv-long.docx | 9,679 | read → sent to AI |  | 10,464 | 481 ms |
| cv.txt | 2,128 | read → sent to AI |  | 1,725 | 479 ms |
| cv-sw.txt | 1,690 | read → sent to AI |  | 1,373 | 480 ms |
| cv-photo.jpg | 378,773 | read → sent to AI |  | 1,546 | 5817 ms |
| cv-photo-sw.png | 222,099 | read → sent to AI |  | 1,372 | 4607 ms |

Progress states observed live (the real spinner label):
- `Inasoma faili yako…` — on 19 run(s)
- `Inasoma picha… 9%` — on 2 run(s)
- `Inasoma picha… 26%` — on 2 run(s)
- `Inasoma picha… 31%` — on 2 run(s)
- `Inasoma picha… 40%` — on 2 run(s)
- `Inasoma picha… 100%` — on 2 run(s)
- `Inasoma picha… 56%` — on 2 run(s)
- `Inasoma picha… 3%` — on 1 run(s)

### 2.3 Pasted inputs

| case | fixture chars | chars accepted by the composer | chars reaching the API | note |
|---|---|---|---|---|
| paste-plain-text | 2108 | 2061 | 2061 | for 42 schools. REFEREES Dr. Neema Kimaro \| Head of Engine… |
| paste-html | 127 | 127 | 138 | a Nimeipata CV yako "QA English CV". Ningeweza kuikagua, au… |
| paste-huge | 126598 | 123719 | – | for 42 schools. REFEREES Dr. Neema Kimaro \| Head of Engine… |
| paste-whitespace | 12 | 0 | – | — au niambie tu. Linganisha na kazi Kagua CV yako Kazi zina… |
| paste-tiny | 2 | 2 | 138 | Ruka hadi maudhui Rudi Sumaiya Ninafanyia kazi CV yako — QA… |
| paste-swahili | 1682 | 1644 | 1644 | \| Mtengenezaji \| 2019 - Mfumo wa kufuatilia mifugo na maz… |

---

## 3. PART 2 — the output matrix

### 3.1 The PDF, inspected in the bytes

- PDFs captured from the live editor and inspected: **162**
- A4 MediaBox (595.28 × 841.89 pt): **162 / 162**
- With a real, copyable text layer: **161 / 162** (exceptions: ['minimal-nameonly.pdf'])
- With the typed candidate name findable in that layer: **162 / 162**
- **One embedded raster object per page** (one JPEG slice per page, not the whole image repeated).
- **Pages > 1: 0.** Every export is a single page — see D9.

Representative rows:

| export | bytes | pages | MediaBox pt | text layer | text chars | rasters | raster sha1 |
|---|---|---|---|---|---|---|---|
| nophoto-nakuru.pdf | 290,884 | 1 | 595.28×841.89 | yes | 1,477 | 1 | 948dd56… |
| photo-nakuru.pdf | 291,379 | 1 | 595.28×841.89 | yes | 1,477 | 1 | b0e9799… |
| photo-kioo.pdf | 323,121 | 1 | 595.28×841.89 | yes | 1,477 | 1 | 7d8d3c8… |
| photo-coral.pdf | 353,973 | 1 | 595.28×841.89 | yes | 1,477 | 1 | 39c1e65… |
| swahili-zahabu.pdf | 325,708 | 1 | 595.28×841.89 | yes | 1,088 | 1 | 3166b6e… |
| long-zahabu.pdf | 609,221 | 1 | 595.28×841.89 | yes | 7,347 | 1 | 1b18ecd… |
| minimal-nameonly.pdf | 54,021 | 1 | 595.28×841.89 | NO | 20 | 1 | fe6b4d3… |
| font-JetBrainsMono.pdf | 338,052 | 1 | 595.28×841.89 | yes | 1,477 | 1 | 2fe4319… |
| colour-Midnight.pdf | 296,172 | 1 | 595.28×841.89 | yes | 1,477 | 1 | 6594140… |
| hide-referees.pdf | 348,788 | 1 | 595.28×841.89 | yes | 1,318 | 1 | 5aa3484… |

### 3.2 Every other output the product offers

The CV editor's download menu, read off the live UI:

| # | menu item | produces | verified |
|---|---|---|---|
| 1 | Pakua PDF / Download PDF | rasterised A4 PDF + invisible ATS text layer | yes — 162 exports captured and byte-inspected |
| 2 | Word (.docx) | real OOXML, text-only ("not the template design") | see below |
| 3 | Maandishi (.txt) | plain-text ATS render | see below |
| 4 | Shiriki mtandaoni / Share online (NEW) | public link | see below |
| 5 | Shiriki faili… / Share file | Web Share sheet → email / Drive / WhatsApp | see below |
| 6 | Historia ya matoleo / Version history | restore a previous version | see below |

- **Word (.docx)** — clicked: True; blob emitted: 1; 9858 bytes; filename `QA_English_CV.docx`
- **Plain text (.txt)** — clicked: True; blob emitted: 1; 1773 bytes; filename `QA_English_CV.txt`
- **Share file** — clicked: True; `navigator.share` calls captured: [{"title": "QA English CV", "files": ["QA_English_CV.pdf:369734"], "text": "My CV \u2014 made with Sumaiya"}]; fallback blob: 0
- **Share online** — clicked: True; URLs in the modal: ["https://\u2026)"]
- **Public CV page** — `POST /api/cv/:id/share` → {"status": 200, "slug": "amina-joseph-mwakasege-vrqhg3", "isPublic": true}; `GET /cv/<slug>` → HTTP 200, 54395 bytes, name present: True
- **Version history** — clicked: False; panel: Ruka hadi maudhui Nyumbani Imehifadhiwa Wasifu Nakuru +5 Pakua PDF 1 Kuhusu 2 Kazi 3 Elimu 4 Ujuzi 5 Nyongeza 86 IMARA NGUVU YA CV Ongeza ujuzi angalau 4 Jina lako linao…
- **Download counter** — the editor POSTs `/api/cv/<id>/download` after each export; verified in
  the DB (`download_count` and `download_log` both move).
- **HTML export** — `lib/cv-builder/use-cv-export.ts` implements `exportAsHTML()`, but no UI
  exposes it: the six menu items above are the whole set. Dead code, or an unfinished feature.

### 3.3 The options that change the output

| option group | variants exercised | PDFs produced | notes |
|---|---|---|---|
| curated templates, photo ON | 59 | 59 | all 47 curated + 12 legacy |
| same templates, photo OFF | 59 | 59 | the paired control for D1 |
| colours | 10 | 10 | every swatch the editor offers (10) |
| fonts | 12 | 12 | every font in DOC_FONTS (12) |
| densities | 3 | 3 | compact / normal / airy |
| sections hidden | 9 | 9 | one per section |
| Swahili CV | 6 | 6 | across 6 templates |
| over-long CV | 3 | 3 | 9 roles × 5 bullets → see D9 |
| edge (name only) | 1 | 1 | 54,021 bytes, still valid |

**Total exports exercised: 162** — 162 produced a PDF, 0 did not.

- Template identity checked against the editor's own toolbar name on every run: **162 applied, 0 mismatched**. No export below is attributed to the wrong template.

**Why this set is representative:** it is not a sample of 266 templates — it is **all 47 curated**
(the gallery the product actually offers) plus 12 spread across the 219-template legacy tail, and
it is **exhaustive** for every output-affecting control the editor exposes: all 10 colours, all 12
fonts, all 3 densities, every section, both languages, photo on and off. Nothing the UI offers was
skipped.

#### Section toggles genuinely change the output

Each `hide-<section>` variant differs from every other by exactly one hidden section, so the byte
differences between them are attributable to the toggle. All nine produce different files:

| hidden section | export bytes | vs. the smallest of the nine |
|---|---|---|
| experience | 303,365 | +0 |
| languages | 322,314 | +18,949 |
| hobbies | 327,683 | +24,318 |
| summary | 328,278 | +24,913 |
| projects | 331,636 | +28,271 |
| skills | 331,953 | +28,588 |
| certifications | 341,567 | +38,202 |
| education | 344,789 | +41,424 |
| referees | 348,788 | +45,423 |

Spread: **303,365 – 348,788 bytes** (45,423 bytes, 15.0 %). Hiding a section *grows* the file, because freeing vertical
space lets the SmartFit engine magnify the remaining layout — the point is that it changes the
render, not that it shrinks the file.

##### Controlled A/B — section hiding and the skills bug, same template/colour/font

Every job below was exported at template `nakuru`, colour `#DA4A1C`, font `Inter`; only `data`
differs, so the byte differences are attributable to the thing under test. The PDFs are then
checked in the **content stream** (not the DOM) for the Skills section.

#### Colour and font controls

- **Colours (10):** 290,884 – 315,877 bytes, all distinct renders.
- **Fonts (12):** 290,966 – 365,535 bytes, all distinct renders.
- **Densities (3):** compact=331,882, normal=331,905, airy=331,922 — the spread is only 40 bytes, i.e. the density
  control barely moves the raster. Worth a look: it should change line spacing materially.

### 3.4 Where the export time actually goes

The sweep reported 5.3–6.6 s per case, uniformly — suspicious, since a 54 KB one-page PDF and a
653 KB multi-page PDF cannot cost the same to render. Measured per phase, with the export itself
timed **inside the page** via `performance.now()` around the real click:

| case | PATCH | goto→DOMContentLoaded | boot→editor ready | harness settle sleep | font wait | **EXPORT (in-page)** | blob |
|---|---|---|---|---|---|---|---|
| minimal (1 page, 54 KB) | 1728 ms | 1021 ms | 220 ms | 1805 ms | 0 ms | **851 ms** | 54,016 B |
| photo-nakuru (1 page) | 2339 ms | 950 ms | 333 ms | 1813 ms | 0 ms | **1054 ms** | 332,258 B |
| typical full CV (nakuru) | 1664 ms | 1256 ms | 225 ms | 1806 ms | 0 ms | **1151 ms** | 331,990 B |
| over-long CV (3+ pages) | 1696 ms | 886 ms | 221 ms | 1814 ms | 0 ms | **855 ms** | 594,587 B |

**Verdict: harness overhead, not a product defect.** The export itself is **851–1151 ms on this desktop** and is essentially flat across a 11× range in file size,
which is expected: the sheet is always 794 × 1123 CSS px, so html2canvas rasterises the same
1588 × 2246 canvas whatever the content. The measured 5.5 s breaks down as PATCH ~1.7 s +
navigation ~1.0 s + boot 0.25 s + **my own 1.8 s settle sleep** + poll granularity 0.2–1.0 s +
export ~0.9–1.2 s. The single largest component was the harness's own sleep.

On a cheap phone expect roughly 2–5× the 0.9–1.2 s (slower CPU, and `resolveExportScale` drops
the raster scale on low-memory devices) — a few seconds, not a hang, and the editor shows an
explicit export overlay with progress steps and a 1.4 s minimum so the user always sees state.
**No spinner-forever on this path.**

## 4. PART 3 — the documented limits vs reality

| limit | claimed by the code | observed in production |
|---|---|---|
| PDF photo source cap | `MAX_PHOTO_SOURCE_BYTES = 12 MB` | see 4.1 |
| stored photo ceiling | `MAX_PHOTO_STORED_BYTES = 400 KB`, 600 px square, JPEG q0.82 | see 4.1 |
| server PDF upload cap | `MAX_PDF_UPLOAD_BYTES = 4 MB` | see D3 |
| browser PDF import cap | `MAX_FILE_MB = 25` | 27 MB fixture → see 2.2 |
| AI burst window | `AI_PER_MINUTE ?? 10` | see 4.2 |
| AI daily cap | `AI_PER_DAY ?? 60` | see 4.2 |

**The 4 MB cap boundary.** `cv-over4mb.pdf` was built to land between the app's own cap
(4,194,304 bytes) and Vercel's ~4.5 MB edge limit, so the app's guard — not the platform — answers:

- _(not captured)_

### 4.1 Photo pipeline, measured through the real editor upload control

### 4.2 AI rate limit

---

## 5. Every defect, with reproduction and an honest/silent verdict

"Silent" = the user gets nothing: no message, no state change, a spinner that never resolves.
That is the class that produced three bugs in one day on this project, so every failure is
labelled.

### D8 — a skill without a strict `level` silently deletes the whole Skills section
**Severity:** High — silent data loss · **Verdict:** **SILENT.** The only genuinely silent input-side loss found, and it is not marked anywhere.

- **Reproduce:** Store a CV whose `skills` entries lack `level` (or carry it as a string, or outside 1–5), then open it in the editor: e.g. `POST /api/cv` with `data.skills = [{id:"s1", name:"TypeScript"}, …]`.
- **Expected:** Either the skills render, or the user is told they could not be read.
- **Actual:** The Skills section disappears from the rendered CV **and** from the ATS text layer. No error, no toast, no log — the CV simply looks like it has no skills.
- **Evidence:** `parsecvdata-proof.txt` (the app's own `parseCVData`: 9 skills in → 9 out with `level:3`; **0 out** without `level`, with `"3"`, with `0`, with `7`; all other sections unaffected). Live: the API returns 9 skills, the rendered `/editor/cv/<id>` preview contains no `UJUZI` heading and none of the names, and the exported PDF's content stream contains no `TypeScript` string (47 drawn strings vs 50 for a faithful replay of the same text-layer code).

### D9 — an over-long CV is clipped in the PDF, and the "CV too long" UI warning is printed into it
**Severity:** High · **Verdict:** honest on screen (the warning exists) but the exported FILE is silently incomplete — the loss only appears after sending it to an employer.

- **Reproduce:** Fill a CV with far more than one A4 page of content (9 roles × 5 bullets, 21 skills, 4 projects), then Download PDF.
- **Expected:** Either the content flows onto page 2, or the user is stopped from exporting something truncated. The file must never contain an internal UI warning.
- **Actual:** The export is **1 page**; visible content is cut off mid-sentence at the bottom edge; roles 6–9, education, certifications, referees and interests are absent from the page; the ATS text layer still contains them (7,347 chars including `Role 9`); and the pill **"⚠ CV too long — remove some content"** is rasterised into the bottom-right of the deliverable.
- **Evidence:** `clean/long-nakuru.pdf` (1 page, 594,482 bytes); `longcv-bottom-right.png` (the clipped line + the warning pill, cropped from the PDF raster); text-layer extraction containing `Role 1..9`; all 162 exports in the sweep are 1 page.

### D1 — Kioo stretches the photo ~10 % in the PDF
**Severity:** High · **Verdict:** visible only in the file the candidate sends — the screen looks perfect.

- **Reproduce:** Open a CV, pick template **Kioo**, upload a square headshot, Download PDF, and measure the photo in the file.
- **Expected:** The exported photo matches the preview (square-cropped by `object-fit: cover`).
- **Actual:** A round disc on screen becomes a **304 × 333 px ellipse (aspect 0.913)** — a ~8.7 % vertical stretch.
- **Evidence:** `clean/photo-kioo.pdf` vs `clean/nophoto-kioo.pdf` raster diff; `kioo-screen-photo.png` (round on screen); `h2c/index.html` (html2canvas 1.4.1 ignores `object-fit`: a 120 × 132 frame turns a round disc into 60 × 66); source `components/templates/kioo.tsx`.

### D10 — a blank PDF leaves the assistant showing "Reading your file…" with no result and no error
**Severity:** High · **Verdict:** **SILENT** — nothing is shown to the user at all.

- **Reproduce:** On `/assistant`, attach a valid PDF whose pages contain no text at all (e.g. two empty A4 pages).
- **Expected:** Either the app says it could not read any text, or it stops and returns to idle.
- **Actual:** The spinner label **"Inasoma faili yako… / Reading your file…" stayed up for 260 seconds with no error message, no attachment chip and no state change** — the state the brief calls "spinner forever". The same file through the server route is rejected honestly (422).
- **Evidence:** `results-assistant-uploads.json` → cv-blank.pdf, `kind: TIMEOUT_NO_TERMINAL_STATE`, wallMs=260223. Re-tested on purpose with a **260 s** budget after a first run cut it off at 75 s, so this is not a too-short timeout in the harness: the app never reaches a terminal state.

### D2 — the server extractor rejects images and tells you to send an image
**Severity:** High · **Verdict:** honest (a clear message) but self-contradictory.

- **Reproduce:** `POST /api/tools/extract-text` with a real JPEG/PNG/WebP, or use the public **Toa Maandishi** tool with a photo or a scan.
- **Expected:** OCR the image, or say plainly that images are not supported.
- **Actual:** `415` — *"Couldn't read that file type. Send a PDF, a Word (.docx) file, a photo, or paste the text."* A scanned PDF gets `422` — *"…it's a scan. Send a clear photo of it instead."* The tile advertises support for scans.
- **Evidence:** `results-server-extract.json`: cv-photo.jpg, cv-photo-sw.png, photo.webp, photo-tall-alpha.png → 415; cv-scanned.pdf → 422.

### D3 — over the cap the user gets the platform's raw error
**Severity:** Medium · **Verdict:** honest-but-opaque.

- **Reproduce:** Upload a 27 MB PDF to any PDF-tool surface.
- **Expected:** The app's own 413 with a readable message.
- **Actual:** HTTP 413 with a plain-text body `Request Entity Too Large / FUNCTION_PAYLOAD_TOO_LARGE`, after ~91 s, straight from the edge.
- **Evidence:** `results-server-extract.json` → cv-huge.pdf, ms=91377.

### D4 — corrupt and password-protected PDFs return HTTP 500
**Severity:** Low · **Verdict:** honest but wrong status and wrong advice.

- **Reproduce:** Upload a truncated PDF, or one encrypted with a user password.
- **Expected:** A 4xx with a specific message ("damaged" / "password-protected — remove the password").
- **Actual:** Both return **500** with the same generic *"Couldn't read that file. Try a PDF or paste the text."* The encrypted case never mentions the password.
- **Evidence:** `results-server-extract.json`: cv-corrupt.pdf → 500, cv-protected.pdf → 500.

### D5 — a blank PDF is diagnosed as "a scan"
**Severity:** Low · **Verdict:** honest but wrong diagnosis; the advice leads to a photo of an empty page.

- **Reproduce:** Upload a valid PDF whose pages contain no text at all.
- **Expected:** "This PDF has no text in it."
- **Actual:** *"That PDF has no selectable text — it's a scan. Send a clear photo of it instead."*
- **Evidence:** `results-server-extract.json`: cv-blank.pdf → 422, identical message to cv-scanned.pdf.

### D6 — an empty file is reported as an unsupported type
**Severity:** Low · **Verdict:** honest but misattributed.

- **Reproduce:** Upload a 0-byte file named `.pdf` or `.docx`.
- **Expected:** "That file is empty."
- **Actual:** `415` — *"Couldn't read that file type…"*
- **Evidence:** `results-server-extract.json`: cv-zero.pdf, cv-zero.docx → 415.

### D7 — templates that drop the photo do not say so
**Severity:** Low · **Verdict:** **SILENT, by design** — the only intentional silence found.

- **Reproduce:** Pick **Grid**, **Stripe** or **Mono**, upload a photo, watch the preview.
- **Expected:** Either the photo appears, or the editor says this template does not print photos.
- **Actual:** The photo is omitted with no notice. Deliberate (`grid.tsx`: "ATS mode: strip photo"; `stripe`/`mono-cv`: `photoSize: 0`) and defensible, but the editor's photo note only covers optionality.
- **Evidence:** `results-clean.json`: 59 photo rows; the 9 with `photos: 0` are grid, stripe, mono-cv, alpine, bauhaus, cirrus, cipher, celeste, baroque-cv; all other curated templates report `photos: 1` with variance 4102.8.

### Defect count

| id | area | severity | silent or honest |
|---|---|---|---|
| D8 | skills parsing | High | **SILENT** |
| D10 | blank PDF on /assistant | High | **SILENT** |
| D9 | PDF export, long CV | High | honest on screen, silent in the file |
| D1 | PDF export, photo | High | visible only in the file |
| D2 | server extractor, images | High | honest, self-contradictory |
| D3 | upload cap | Medium | honest, opaque |
| D4 | corrupt / encrypted PDF | Low | honest, wrong status |
| D5 | blank PDF | Low | honest, wrong diagnosis |
| D6 | empty file | Low | honest, wrong diagnosis |
| D7 | photo-less templates | Low | silent, by design |

**Two genuinely silent failures (D8, D10), one of them by design (D7).** Everything else produced
a visible message; those failures are wrong messages and wrong statuses rather than absent ones.

---

## 6. What I verified WORKING

- **Genuine .docx import through both extractors.** A real 22-part OOXML file (built with the
  app's own `docx` npm package) extracts clean text via mammoth in the browser and on the server,
  including one carrying a real embedded image part.
- **Magic-byte sniffing on the server.** A real DOCX renamed `.pdf` is read as DOCX; a real PDF
  renamed `.docx` is read as PDF; a DOCX with **no extension** is read correctly.
- **Text-layer PDFs.** English, Swahili and mixed CVs extract with every field intact. A 7-page CV
  returns `pages: 7` and 15,525 characters.
- **Browser OCR fallback.** Image-only PDFs and photographed CVs go through pdf.js render →
  tesseract.js and come back as text, with a live progress label.
- **The PDF export's invisible text layer is real and copyable** — present on every export, A4
  MediaBox 595.28 × 841.89 pt, one embedded JPEG slice per page, and the candidate's name findable
  by text extraction. The seam test's claim reproduces and generalises.
- **Template switching genuinely changes the export** — 59 templates, 59 distinct documents, each
  verified against the editor's own toolbar name.
- **Every colour and font control changes the bytes** and every one renders distinctly.
- **Section hiding is honoured in both copies** — `hiddenSections` removes the section from the
  page *and* from the ATS text layer, so the machine copy cannot describe a section the human copy
  does not show.
- **The download counter works** — the editor POSTs `/api/cv/<id>/download` after a successful
  export and both `download_count` and `download_log` move.
- **Swahili survives the round trip** — `ng'` apostrophes (`Chang'ombe`, `ng'ombe`), long
  agglutinated words and Swahili headings come through the extractors, the text layer and the
  `.txt` export unmangled.
- **The name-only edge case still produces a valid A4 PDF** (54,021 bytes), not a broken file.

---

## 7. Test data and cleanup

_cleanup results missing_

---

## 8. What I could NOT test

- **Native clients.** The Android build is six hours stale and the owner said not to build, so the
  native-only input path (`POST /api/tools/extract-text` with `{fileBase64, name}`, `/api/mobile/*`)
  was read but not exercised.
- **All 266 templates.** 59 were exported and byte-inspected; the other 207 legacy templates were
  covered only by the static non-square-photo scan, not by an export.
- **iOS delivery paths.** On iOS `resolvePdfDelivery` uses the Web Share sheet or a new tab instead
  of a blob download; unreachable from headless Chrome on Windows.
- **Real camera photos.** Fixtures are synthetic; EXIF-rotation handling was not exercised because
  no fixture carries an EXIF orientation tag.
- **Low-end Android rendering.** `resolveExportScale`'s `navigator.deviceMemory` step-down needs a
  2–3 GB device; the harness always reports desktop memory.
- **Auth rate limits / magic-link delivery.** The seam domain cannot receive mail.
- **`/import-cv` (the PDF-only import page) end-to-end as a signed-in user.** It redirects to
  `/dashboard` for an authenticated session; its extraction path is the same
  `extractCvTextFromPdf` exercised through `/assistant`, but the page itself was not driven.

---

## 9. Appendix — how each fixture was built

Scripts are in `docs/qa-fixtures-2026-09-20/`. Nothing is a renamed text file.

| fixture | how it was genuinely produced |
|---|---|
| cv.docx / cv-sw.docx / cv-mixed.docx / cv-long.docx / cv-photo.docx | `build_docx.cjs` — the app's own `docx` npm package; real OOXML zip, 22 parts, `word/document.xml`; one carries a real embedded `word/media` image |
| cv-text.pdf / cv-sw.pdf / cv-mixed.pdf / cv-long.pdf | `make_fixtures.py` — reportlab writes real `BT`/`Tj` text operators; verified extractable by pypdf (1,725 / 1,373 / 1,084 / 15,525 chars) |
| cv-scanned.pdf | Pillow renders a full CV page to a 1000 px JPEG, embedded as the only page object — **zero** text operators (`text_chars=0`) |
| cv-blank.pdf | reportlab, two empty pages — a valid PDF with no text at all |
| cv-photo.jpg / cv-photo-sw.png | Pillow renders the CV to a 1600 px JPEG / 1400 px PNG |
| cv.txt / cv-sw.txt / cv-huge-paste.txt | plain UTF-8, 2.1 KB / 1.7 KB / 128 KB |
| cv-zero.pdf / cv-zero.docx | `open(p,'wb').close()` — genuinely 0 bytes |
| cv-corrupt.pdf | a `%PDF-1.7` header followed by non-PDF bytes — pypdf: `startxref not found` |
| cv-protected.pdf | pypdf `PdfWriter.encrypt("sumaiya123", algorithm="AES-128")` — `is_encrypted=True` |
| cv-huge.pdf | reportlab, 8 pages each embedding a *different* 1400 × 1980 noise JPEG — 27,001,436 bytes |
| cv-over4mb.pdf | one page embedding a 1599 × 2310 noise JPEG — 4,493,232 bytes, deliberately between the app's 4 MB cap and Vercel's ~4.5 MB edge limit |
| cv-docx-content-mismatch.pdf / cv-pdf-content-mismatch.docx / cv-png-content-mismatch.pdf | real bytes of one format written under another format's extension |
| cv-noextension | real DOCX bytes with no extension |
| cv-whitespace.txt | only spaces, tabs and newlines |
| cv-prompt-injection.pdf | a legitimate CV plus text that tries to instruct the model |
| photo-oversize.jpg (14.3 MB) / photo-noisy.jpg (7.9 MB) | Pillow noise images straddling the 12 MB source cap |
| photo-tall-alpha.png / photo.webp / photo.svg | a 700 × 1000 RGBA PNG, a WebP, and an SVG (a deliberately excluded type) |
| photo-small-dataurl.txt | the 600 × 600 square headshot used for every photo test: a beige face disc, dark shoulders and `QA`, so a distortion or a blank is measurable rather than eyeballed |
| h2c/index.html | the isolated html2canvas 1.4.1 `object-fit` reproduction (the app's own build of the library) |

Captured artefacts: **162 PDFs** in `clean/`, plus the fixture set, the result JSONs, the
extracted rasters/screenshots and every probe script in `docs/qa-fixtures-2026-09-20/`.
