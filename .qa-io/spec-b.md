# SPEC B — items 3, 4 and 5 (import hangs, Kioo photo, extractor honesty)

Repo: `C:\Users\hamis\projects\sumaiya` (git-bash). App: `apps/web` (Next.js, TypeScript, vitest, zod + hono).
You are the IMPLEMENTER. Do exactly this; do not redesign it, do not commit, do not push, do not run `next build`.

## HARD BOUNDARIES (a sibling agent is editing this tree in parallel)
- Do NOT touch `apps/web/components/templates/engine/**`, `components/templates/template-utils.tsx`,
  `components/templates/template-gallery-client.tsx`, `jobs-feed.tsx`, `about/page.tsx`, `ats-checker*`,
  or any template other than `components/templates/kioo.tsx`.
- Do NOT touch `apps/web/lib/pdf.ts`, `apps/web/types/index.ts`, `apps/web/components/editor/cv-editor-client.tsx`,
  `apps/web/lib/stores/editor-store.ts` — another agent is editing those right now.
- Stage nothing, commit nothing.

---

# ITEM 3 — a 27 MB PDF leaves `/assistant` on "· inasoma…" forever (the one genuinely silent failure)

Measured live (clean context): attach `cv-huge.pdf` (27 001 436 bytes) → the chip shows `· inasoma…` for **177 s**,
terminal state `null`, one `POST /api/tools/extract-text` issued and never settled, no error, no completion, no way
forward. Every other awkward input IS honest (corrupt, password-protected, zero-byte, PNG-named-.pdf, blank and
DOCX-with-no-extension all show a visible Swahili message within 1.3–17 s).

Root cause (chain, all in `apps/web/components/assistant/cv-assistant-client.tsx` `onAttachFile`):
1. `extractTextFromFile` throws `ExtractionError("TOO_LARGE")` immediately — `lib/client-cv-extract.ts` caps the
   browser reader at `MAX_FILE_MB = 25` (line 42) and this file is 27 MB.
2. The `catch (clientErr)` block then falls back to the SERVER for any `.pdf`/`.docx`, **discarding the code it was
   just given**, and `await fetch("/api/tools/extract-text", ...)` is issued with a 27 MB body.
3. Vercel rejects a body that large at the edge before the route runs, so the fetch never settles: nothing throws,
   nothing resolves, the spinner is permanent. The same route answers the raw platform body
   `Request Entity Too Large / FUNCTION_PAYLOAD_TOO_LARGE` after 91 377 ms when POSTed directly (D3) — the route's
   own friendly 413 can never run, because the platform never lets the request reach it.

## 3.1 `apps/web/components/assistant/cv-assistant-client.tsx`

In `onAttachFile`'s server fallback:
- **Never issue a request that cannot settle.** Before the `fetch`, refuse locally —
  `file.size > MAX_PDF_UPLOAD_BYTES` (import `MAX_PDF_UPLOAD_BYTES` / `MAX_PDF_UPLOAD_MB` from
  `@/lib/upload-limits`; never hardcode a number) **or** the client error's code is `"TOO_LARGE"` — by throwing a
  visible outcome instead of POSTing. The refusal must be OPTIMISTIC in the sense that it names the real limits and
  the way forward, in the user's language, e.g.
  en: `This file is 27.0 MB — too big to read here (PDF and Word uploads are limited to 4 MB; photos are read on your
  device up to 25 MB). Try a shorter copy (1–3 pages), take a photo of the CV page instead, or paste the text.`
  sw: same content in Swahili, matching this file's voice.
- For a file under that cap, keep the fallback but bound it: `new AbortController()`, a 20 s timer, `signal` on the
  fetch, and `clearTimeout` in a `finally`. On `AbortError`/timeout throw an `ExtractionError(..., "TIMEOUT")` so the
  existing message branch handles it — the user gets a visible message instead of a spinner.
- On a non-OK response, prefer the SERVER's honest reason over the generic client one: if the JSON body has a string
  `error`, throw an `ExtractionError(json.error, <mapped code>)` so that specific message is what the user reads;
  map 413 → `TOO_LARGE`, 415 → `PARSE_FAILED`, 422 → `PARSE_FAILED`, network/abort → `TIMEOUT`.
- Fix the stale cap in the `TOO_LARGE` message branch: it says `max 25MB`, which is the browser reader's cap, not the
  upload path's. Use the real numbers ("photos up to 25 MB on your device; PDF/Word uploads up to 4 MB").
- `runPdfOp` (`pdf.*` tools) also POSTs to `/api/tools/extract-text` with no size guard: apply the same guard —
  if any target exceeds `MAX_PDF_UPLOAD_BYTES`, say so in chat and return instead of posting. Same for any other
  site in this file that posts a file to that route.
- Check `components/pdf-tools/import-cv-client.tsx` and `app/(app)/snap/snap-client.tsx` for other unguarded
  POSTs of the same shape and guard them the same way if they exist.
- Add `export function serverUploadTooLarge(bytes: number): boolean` (a one-line predicate over
  `MAX_PDF_UPLOAD_BYTES`) where it can be unit-tested — `apps/web/lib/upload-limits.ts` is the natural home — and use
  it at the call sites so the rule is testable and cannot drift.

## 3.2 Tests
- `apps/web/lib/upload-limits.test.ts` (extend): `serverUploadTooLarge` at 4 MB ± 1 byte, and a source assertion that
  no client module posts a file to `/api/tools/extract-text` without importing the shared cap.
- Do NOT assert on 27 MB by uploading it anywhere in a test.

---

# ITEM 4 — the Kioo photo is stretched in the PDF while the screen is correct

Reproduced in isolation with the app's OWN html2canvas build (1.4.1, `node_modules/html2canvas/dist/html2canvas.min.js`),
square 600×600 source photo with a centred disc, Kioo's frame (272 wide × 300 tall, `object-fit: cover`):

| variant | screen aspect (browser) | raster aspect (html2canvas) | verdict |
|---|---|---|---|
| `<img width:100% height:100% object-fit:cover>` in a 272×300 frame | 1.000 | **0.904** | ~10 % vertical stretch in the file, correct on screen |
| `background-image` + `background-size:cover` + `background-position:center` in the same frame | 1.000 | **1.000** | faithful |

html2canvas 1.4.1 ignores `object-fit` on `<img>`, so the portrait is drawn stretched to the frame's aspect;
`background-size: cover` IS honoured. Kioo is the only one of 266 templates with a raw `<img>`
(`components/templates/kioo.tsx` line ~60); every other template goes through the shared `CvPhoto`/`PhotoCircle`
`<img>` in `template-utils.tsx`, whose frame is SQUARE — which is why a square photo survives there (measured:
96×96 frame + square photo → raster aspect 1.000, faithful) and a non-square photo does not (measured: 96×96 frame +
3:1 landscape photo → screen 1.000, raster **0.333**). That is the same defect class and the same mechanism as the
8 of 43 distorted templates the sibling measured (regent 0.145, horizon 0.179, sahara 0.383) — say so in the code
comment and in your report; do NOT fix their file.

## 4.1 `apps/web/components/templates/kioo.tsx` — same pixels on screen and in the file

Replace ONLY the photo rendering (the frame stays `width: "100%"`, `height: 300`, `overflow: "hidden"`,
`flexShrink: 0`): draw the portrait as a `background-image` with `backgroundSize: "cover"`,
`backgroundPosition: "center"`, `backgroundRepeat: "no-repeat"`, and keep it accessible with
`role="img"` + `aria-label={personal.fullName}` (the `<img alt>` semantics must not be lost). Leave the
no-photo initials branch and every other line of the template untouched. Comment the reason:
html2canvas 1.4.1 does not implement `object-fit` on `<img>` (the other templates hide this because their frames are
square), so `object-fit: cover` in a 272×300 frame delivered a ~10 % vertically stretched portrait while the preview
was correct; `background-size: cover` is honoured by the same library.

## 4.2 Test
Add `apps/web/components/templates/kioo.test.tsx` (follow the existing template test style in that folder): with a
`personal.photo` set, the rendered photo container carries the background-image/background-size:cover/role/aria-label,
and no `<img>` is rendered for the photo; with no photo, the initials fallback is unchanged.

---

# ITEM 5 — `POST /api/tools/extract-text` (live evidence, measured 2026-09-20)

| fixture | before: status | before: message |
|---|---|---|
| JPEG photo of a CV (378 773 B) | 415 | "Couldn't read that file type. Send a PDF, a Word (.docx) file, a photo, or paste the text." |
| PNG photo of a CV (222 099 B) | 415 | same |
| WebP image (289 812 B) | 415 | same |
| corrupt PDF (11 515 B) | **500** | "Couldn't read that file. Try a PDF or paste the text." |
| password-protected PDF (3 418 B) | **500** | same as corrupt — never mentions a password |
| blank PDF, 2 empty pages (1 708 B) | 422 | "That PDF has no selectable text — it's a scan. Send a clear photo of it instead." |
| zero-byte file named .pdf / .docx | 415 | "Couldn't read that file type. Send a PDF, a Word (.docx) file, a photo, or paste the text." |

The 415 message tells the user to send a photo — which is exactly what the JPEG/PNG/WebP cases sent — and
`/tools` advertises "a digital or scanned PDF" (`apps/web/lib/pdf-tools.ts`, extract-text `description`).
Verified classification probes (unpdf + pdf-lib, this repo):
- password-protected → unpdf throws `PasswordException: No password given`
- corrupt → unpdf throws `InvalidPDFException: Invalid PDF structure.`
- blank PDF → 0 text, **0 image XObjects**; scanned PDF → 0 text, **1 image XObject** (so "blank" and "a scan"
  are distinguishable, and telling a blank-PDF user to photograph it is wrong)

## 5.1 `apps/web/lib/api/routes/tools.ts` — the `extract-text` handler

Order the checks so each failure gets its own honest status + message (English, non-technical, actionable — the
route returns English strings today; keep that convention):
1. **zero bytes** (sniff after reading the body): `400` —
   "That file is empty (0 bytes) — it didn't upload properly. Choose the file again, or send a different copy."
   (Today a zero-byte file falls through to "unsupported type".)
2. **over the cap** (existing `MAX_PDF_BYTES` 413 branch): keep it exactly as is. Do not invent a bigger cap; Vercel
   rejects >~4.5 MB before the handler runs.
3. **image magic bytes** — JPEG `FF D8 FF`, PNG `89 50 4E 47`, `RIFF….WEBP`, `GIF8`, HEIC/HEIF (`ftypheic`/`ftypmif1`
   at offset 4): `415` —
   "That's a photo, not a document — this tool can only read text out of PDF and Word files, and a photo has no text
   layer for it to read. To read a CV from a photo, attach it in the AI Assistant (it reads photos on your device),
   or send the PDF/Word file." No longer tells them to send a photo to this endpoint.
4. **PDF, parsed through unpdf** — on throw, classify (keep `500` only for genuinely unexpected failures):
   - `PasswordException`, or /password|encrypted/i in the error name/message → `422` —
     "That PDF is password-protected, so its text can't be read. Open it, save/export a copy without a password, then
     send that copy."
   - `InvalidPDFException`, /invalid pdf|structure|xref/i, or a pdf-lib load failure → `422` —
     "That PDF is damaged — it isn't a valid PDF, so nothing can be read from it. Try saving it again from the app
     that made it (Word, Google Docs…), or send a different copy."
   - anything else → keep today's `500` generic.
5. **PDF with no text**: distinguish two genuinely different situations using the page image XObjects
   (`PDFDocument` from `pdf-lib` is already imported in this file; load with `{ ignoreEncryption: true }` and count
   each page's `XObject` keys; wrap in try/catch and treat a failure as "unknown"):
   - has images → `422` — "That PDF is a scan — its pages are pictures, so there is no text to copy. Send the
     original PDF (exported from Word/Google Docs, not photographed), or attach the photo in the AI Assistant, which
     reads photos."
   - has no images → `422` — "There's no text in that PDF — it looks blank (no words and no images on any page).
     Send the document you meant to upload."
   Both keep the 422 status; neither may tell the user to send a photo OF the blank page to this endpoint.
6. Update the copy in `apps/web/lib/pdf-tools.ts` for the `extract-text` tool so it promises what the route does:
   the description currently says "digital or scanded PDF" (write it honestly: any PDF that carries a text layer —
   exported from Word/Google Docs — and say scans/photos are read in the AI Assistant instead). Keep both languages
   consistent with the surrounding entries; do not touch any other tool entry.

## 5.2 Tests
Add `apps/web/lib/api/routes/tools-extract.test.ts` (look at how `lib/api/routes/snap.test.ts` /
`cv-jsonb-write.test.ts` build a request against the Hono router; mount `toolsRoutes` the same way) covering, with
real bytes from `docs/qa-fixtures-2026-09-20/` (read them with `fs`, they are small):
`cv-zero.pdf` → 400 empty-file message; `cv-photo.jpg`, `cv-photo-sw.png`, `photo.webp` → 415 photo message that does
NOT contain the word "photo" as a *recommendation* to this endpoint (assert the message mentions the AI Assistant);
`cv-corrupt.pdf` → 422 damaged; `cv-protected.pdf` → 422 password; `cv-blank.pdf` → 422 blank (assert NOT the scan
message and assert it does not say "send a clear photo"); `cv-scanned.pdf` → 422 scan message. Also assert the happy
path is unchanged: `cv-text.pdf` → 200 with text.

---

# DELIVERABLE
Report, tersely: each file changed with the exact edit, test names added, and the verbatim output (with exit codes)
of `cd apps/web && npx tsc --noEmit` and `npx vitest run <the test files you touched>`. If any part of this spec is
impossible in this codebase, STOP and say so instead of inventing an alternative.
