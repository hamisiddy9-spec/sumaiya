# SPEC A — two high-severity CV export/import defects (items 1 and 2)

Repo: `C:\Users\hamis\projects\sumaiya` (git-bash). App: `apps/web` (Next.js, TypeScript, vitest).
You are the IMPLEMENTER. Do exactly this; do not redesign it, do not commit, do not push, do not run `next build`.

## HARD BOUNDARIES (a sibling agent is editing this tree in parallel)
- Do NOT touch: `apps/web/components/templates/engine/**` EXCEPT for the single one-line attribute addition in
  `components/templates/engine/fit.tsx` described in item 1.3 (nothing else in that file, and no other file under engine/).
- Do NOT touch: `components/templates/template-gallery-client.tsx`, any template's `languages` block,
  `jobs-feed.tsx`, `about/page.tsx`, `ats-checker*`, `components/templates/template-utils.tsx`.
- Stage nothing, commit nothing. Only edit the files named below.

---

# ITEM 1 — the delivered PDF: a clipped single page, and the editor's warning pill printed into it

Measured with the app's own `lib/pdf.ts` (bundled, real Chromium, real html2canvas 1.4.1 + jspdf 2.5.2) over a DOM
that mirrors the editor's capture target (FitFrame sheet 794x1123 → AutoFitPage page box 794x1123 `overflow:hidden`
→ an over-long CV, plus the fit engine's `⚠ CV too long — remove some content` pill):

- content height 2531 px inside a 1123 px page box; roles 5,6,7,8,9 + education/certifications/referees are clipped
- the delivered PDF is **1 page** (`imageDims: [1588, 2246]`), i.e. `computePageCount` can only ever see one page
  because the capture target is a fixed 1123 px box that clips its own content
- the ATS text layer still carries `Role 9` (all 9 roles) — the applicant's own ATS score reports a document that
  was never delivered
- **the warning pill is rasterised into the page image: 2 597 red pixels (#DC2626 / #FCA5A5) in the bottom-right of
  the delivered page JPEG**, so the employer receives a CV with an internal UI warning printed on it

Root cause, both halves:
(a) The pill is rendered by `AutoFitPage` INSIDE the capture target. `FitFrame` already has the right concept — its
    `overlay` slot renders the watermark as a SIBLING of the sheet, so it is never captured — but the fit engine's
    warning pill lives inside the page box, and `lib/pdf.ts` rasterises the whole subtree.
(b) The multi-page slicing path in `lib/pdf.ts` (`computePageCount` / `findCleanCut`) is unreachable for CVs: the
    capture element is the A4 sheet, exactly one page tall, and the DOM clips the rest before html2canvas sees it.

## 1.1 `apps/web/lib/pdf.ts` — exclude export overlays the html2canvas-native way

Add an exported marker constant and a predicate, and pass them to BOTH html2canvas calls (the first one and the
scale-1 OOM retry) via html2canvas's own `ignoreElements` option:

```ts
/**
 * Marks UI that must never appear in an exported document. html2canvas paints the
 * element's whole subtree, so any overlay drawn INSIDE the capture target (the fit
 * engine's "CV too long" warning pill) was rasterised into the delivered PDF and
 * printed on the employer's copy. `ignoreElements` is html2canvas's own mechanism
 * and the equivalent of FitFrame's `overlay` slot, which renders the watermark as a
 * SIBLING of the sheet and is therefore never captured in the first place.
 */
export const EXPORT_EXCLUDE_ATTR = "data-pdf-exclude";
export function isExportExcluded(node: unknown): boolean {
  return typeof Element !== "undefined" && node instanceof Element && node.hasAttribute(EXPORT_EXCLUDE_ATTR);
}
```
and in each `html2canvas(el, {...})` call add `ignoreElements: isExportExcluded`.

## 1.2 `apps/web/components/templates/engine/fit.tsx` — mark the pill (ONE attribute, nothing else)

On the warning pill `div` (the one whose text is `⚠ CV too long — remove some content`) add exactly
`data-pdf-exclude=""` plus a one-line comment: `{/* UI only — never part of an exported document (see lib/pdf.ts). */}`.
Do not change its styles, its text, or anything else in this file or in `components/templates/engine/`.

## 1.3 `apps/web/lib/pdf.ts` — refuse to deliver a clipped document instead of silently clipping

Chosen behaviour: **visibly refuse** (the alternative, honest pagination, would have to un-clip and re-shape the DOM
the screen never shows — a delivered page that does not match the preview is its own lie). Fail fast, before any
rasterisation, with a typed error the callers turn into a specific message.

Add:

```ts
export interface ExportOverflow { contentBottom: number; boxHeight: number; overflowPx: number }
export const EXPORT_OVERFLOW_TOLERANCE_PX = 8; // sub-pixel/rounding only — one clipped line is ~14 px

/** code + fields, so callers can match without importing a class instance check */
export class ExportOverflowError extends Error {
  readonly code = "CV_TOO_LONG";
  constructor(readonly overflow: ExportOverflow) { ... }   // message: ENGLISH, see exportOverflowMessage
}

/**
 * How far the lowest text-bearing descendant of `el` extends below `el`'s own box.
 * Measured with getBoundingClientRect so a CSS transform (the preview's scale, the
 * fit engine's inner scale) is accounted for; subtrees marked EXPORT_EXCLUDE_ATTR
 * (UI overlays) are skipped. html2canvas renders into a canvas the size of `el`, so
 * anything past that edge is simply not in the file.
 */
export function measureExportOverflow(el: HTMLElement, excludeAttr = EXPORT_EXCLUDE_ATTR): ExportOverflow

/** The user-facing message, both languages. */
export function exportOverflowMessage(sw: boolean, o?: ExportOverflow): string
```
Message content (en): `Your CV is too long for one page — the last part would be cut off, so we did not make the PDF. Remove some content (or pick a shorter template), then download again.` Mention the measured amount when `o` is given, e.g. `about 1 408 px of content`. Swahili equivalent in the same style as the rest of the app (see `components/assistant/cv-assistant-client.tsx` for voice).

Then in `renderPdfDoc`, in the SAME try/finally block that neutralises `el.style.transform` (so the style is always
restored), BEFORE `waitForImages` / `html2canvas`:

```ts
if (opts.refuseIfClipped) {
  const overflow = measureExportOverflow(el);
  if (overflow.overflowPx > EXPORT_OVERFLOW_TOLERANCE_PX) throw new ExportOverflowError(overflow);
}
```
Add `refuseIfClipped?: boolean` to `ExportOptions` with a doc comment saying which callers set it and why it is
opt-in (a surface whose element is legitimately taller than one page still paginates through the existing slicing
path, and must not be refused).

## 1.4 Turn the refusal into a visible, specific outcome at the CV call sites

Pass `refuseIfClipped: true` and show `exportOverflowMessage(...)` (not a generic failure) when that typed error is
caught:
- `apps/web/lib/stores/editor-store.ts` — `exportPdf()`. In its catch: if the error is an `ExportOverflowError`,
  set `saveError` to the localised message (the store has no `sw`; use `lang` — the method already receives `lang`).
- `apps/web/components/editor/cv-editor-client.tsx` — `handleDownload` (it awaits the store's `exportPdf`) and
  `handleShare`. In both catches, when the error is `ExportOverflowError` (check `err instanceof ExportOverflowError`
  or `(err as {code?: string})?.code === "CV_TOO_LONG"`), call the file's existing `showToast(exportOverflowMessage(uiLang === "sw"))`
  so the user sees the reason, in addition to the existing `setExportOverlay("error")`.
- `apps/web/components/assistant/cv-assistant-client.tsx` — `downloadBuiltPdf`, and
- `apps/web/components/assistant/cv-ready-card.tsx` — `download`, and
- `apps/web/lib/cv-builder/use-cv-export.ts` — the PDF export: same flag; surface the message through whatever error
  state each file already has (do not invent new UI).

## 1.5 Tests (`apps/web/lib/pdf.test.ts`)

jsdom has no layout: stub `Element.prototype.getBoundingClientRect` per test (assign a function to the specific
element) and build text nodes so the measurement has something to find. Cover:
- `isExportExcluded`: true only for an element carrying the attribute (and false for null / non-elements).
- `measureExportOverflow`: content 300 px past the box → `overflowPx ≈ 300`; content that fits → `0`; a marked
  overlay hanging below the box is NOT counted (this is the pill).
- `exportOverflowMessage`: both languages, mentions the page/removal action, and is non-empty.
- `computePageCount` / slicing behaviour you did not change must stay green.

---

# ITEM 2 — a skill without a valid `level` silently deletes the whole Skills section

Reproduced with the app's own `parseCVData` (9-skill fixture, every other section identical):

| `level` on all 9 skills | skills out | other sections |
|---|---|---|
| `3` | 9 (levels 3) | unaffected |
| missing | **0** | unaffected |
| `"3"` | **0** | unaffected |
| `0` | **0** | unaffected |
| `7` | **0** | unaffected |

Root cause: `apps/web/types/index.ts` — `skillEntrySchema` (line ~50) declares
`level: z.union([z.literal(1) … z.literal(5)])` and `id`/`name` with no defaults, while
`experienceEntrySchema`/`educationEntrySchema` carry defaults. `looseArray()` then drops every unparseable row, so
one missing number costs the user the entire section — from the rendered CV (no `UJUZI`/`Skills` heading, no skill
name) and from the exported PDF text layer (no `TypeScript` string anywhere in the content stream). The write path
`POST/PATCH /api/cv` validates `data` only as `z.record(z.unknown())` (`apps/web/lib/api/routes/cv.ts` lines ~73 and
~82), so this shape is storable and reachable.

## 2.1 `apps/web/types/index.ts` — degrade ONE skill, never the section

Make `skillEntrySchema` forgiving in the same spirit as the other entry schemas:

```ts
export const SKILL_LEVEL_DEFAULT = 3;
/**
 * A skill's level arrives from the editor, the native app, an import, or an older build.
 * `z.union([literal(1)…literal(5)])` rejected anything else, `looseArray` then dropped the
 * row, and losing every row deleted the whole section from the page and the ATS layer.
 * A number (or numeric string) is CLAMPED into 1–5 — 0 → 1, 7 → 5, "3" → 3 — so the
 * candidate's intent survives; anything else falls back to 3. One malformed level must
 * cost one skill's precision, never a section.
 */
const skillLevelSchema = z.preprocess(<clamp/preprocess>, z.union([...]).catch(SKILL_LEVEL_DEFAULT));
export const skillEntrySchema = z.object({
  id: z.string().default(""),
  name: z.string().default(""),
  level: skillLevelSchema,
});
```
`SkillEntry.level` stays `1 | 2 | 3 | 4 | 5` — no type change anywhere. Keep `visibleSkills()` in
`components/templates/template-utils.tsx` (do not edit that file) as the only row filter: a skill with a blank name
has nothing to render, so that rule stays.

## 2.2 `apps/web/lib/api/routes/cv.ts` — the API cannot store a shape the renderer drops

Export from `types/index.ts`:
```ts
/** Repair the array sections of a CV payload at the write boundary ... */
export function repairCvArraySections(data: unknown): unknown
```
It must map ONLY the seven known array sections (`experience, education, skills, projects, languages,
certifications, referees`) through their (now forgiving) row schemas, keep every other key untouched, and leave a
non-object input alone. Use it in both the create and update schemas:
`data: z.record(z.unknown()).transform(repairCvArraySections).optional()`.
Do not add `name`/`title`/other keys, do not strip unknown keys, do not reject payloads — this must not break a
native client or an older build.

## 2.3 Tests
- `apps/web/types/parse-cv-data.test.ts` (add): the 9-skill fixture with `level` missing → 9 skills (level 3);
  `"3"` → 9 (level 3); `0` → 9 (level 1); `7` → 9 (level 5); `3` → 9 (level 3); and in every case the other
  sections keep their rows (name, summary, experience, education, languages, certifications, referees intact).
- A test that `repairCvArraySections` (and therefore the API write path) stores a payload that `parseCVData` reads
  back with the SAME row counts, including the four malformed-level shapes (see
  `apps/web/lib/api/routes/cv-jsonb-write.test.ts` for how the route schemas are exercised).

---

# DELIVERABLE
Report, tersely: each file changed with the exact edit, the test names you added, and the verbatim output of
`cd apps/web && npx tsc --noEmit` (exit code) and `npx vitest run lib/pdf.test.ts types/parse-cv-data.test.ts <any other file you added>`.
If something in this spec is impossible in this codebase, STOP and say so rather than inventing an alternative.
