# TEMPLATE FIT — what actually goes wrong at the A4 edge

Measured 2026-09-21 against the live probe (`docs/template-renders/probe.json`, 47 curated
templates) and read out of `components/templates/engine/fit.tsx`. Every number below is
quoted from a run or a file line — nothing here is inferred from a screenshot.

## 1. The page is A4, on both surfaces, correctly

| Surface | Source | Value |
|---|---|---|
| Web | `engine/fit.tsx:36-37` | `PAGE_W = 794`, `PAGE_H = 1123` |
| Phone | `apps/native/src/lib/cv-engine/fit.ts` | same 794 × 1123; `fitScaleFor(794) === 1`; css `#cv-page { width: 794px; transform: scale(frame/794) }` |

794 × 1123 px @96dpi = **210.1 × 297.1 mm** — A4. Both clients render the same A4 sheet and
scale it to their frame. There is no page-size bug. **The question is only what happens when
content does not fit A4.**

## 2. `usedFraction` is NOT an overflow metric — retraction

`docs/TEMPLATE-DESIGN-JUDGEMENT-2026-09-21.md` cited `usedFraction 1.254` and this session
earlier read "42 of 47 templates overflow". **That reading was wrong.** The probe computes it
over *all* elements, including non-text boxes, so any full-height decorative band pushes it
past 1.0 and the metric's floor is 1.000 by construction:

```
value counts across 47:  {1.0: 4, 1.12: 29, 1.254: 3, 1.019: 1, 1.034...1.116: 10}
min 1.0   median 1.12   max 1.254
```

29 templates sharing exactly `1.12` is a measurement artefact, not a shared defect.

**The probe's real overflow signals are two other fields**, and they are much narrower:

- **Vertical spill** — `belowCount > 0`, i.e. elements whose bottom passes the page edge:

  | template | spill |
  |---|---|
  | `mono-cv` | **+137px** |
  | `rift`, `metro` | +64px |
  | `vertex` | +49px |
  | `monarch` | +45px |
  | `stripe` | +41px |
  | `serif-cv` | +10px |

  **7 of 47.**

- **Horizontal overflow** — `overflowCount > 0`: `grid` (56 elements), `mono-cv` (49),
  `meridian` (31). **3 of 47.** They use three *different* layouts (Sidebar, Minimal,
  AccentBand), so the cause is not the layout.

## 3. The mechanism: the engine clips, and will not shrink past 0.92

`engine/fit.tsx` is a fill engine, not a paginator. `AutoFitPage`:

1. measures fill (text-bearing elements only), derives a tier from `deriveContext(ratio)`,
2. rewrites the layout width to `PAGE_W / scale` and transform-scales, iterating to a target
   fill of 0.9,
3. clamps every step with `clampFitScale` → **`FIT_BAND = { min: 0.92, max: 1.12 }`**,
4. renders inside `style={{ width: PAGE_W, height: PAGE_H, overflow: "hidden" }}`.

So when content needs more than 8% of shrink, the loop stops making progress, `break`s, and
**`overflow: hidden` discards the remainder.** That is the whole defect class: not nine broken
templates, one engine with a floor and a clip.

## 4. The warning exists — and the export deliberately excludes it

`fit.tsx:203` sets `warn: warn || scale <= SHRINK_MIN + 0.001`, and `fit.tsx:245` renders:

```
⚠ CV too long — remove some content      // data-pdf-exclude — "UI only, never part of an exported document"
```

The intent behind that attribute is right (a warning must not print on the CV). The
consequence is the defect: **the person most affected — the one who downloads the PDF — is
the only one who never sees it.** The screen shows a badge in 8.5px with `pointerEvents:
none`; the file that leaves the app shows nothing, and 137px of content is simply absent.

## 5. So what is the fix (A4 preserved in every option)

| Option | What it does | Cost | Against |
|---|---|---|---|
| **A. Surface it at export** | Keep the clip, but confirm at download: "your CV is cut off — fix it or download anyway" | tiny | still ships a cut CV if the user insists |
| **B. Continue to a second A4 page** | Real pagination: page 2 is still A4 | large | CVs are conventionally 1–2 pages; the adverts often say so |
| **C. Shrink further** | Lower `SHRINK_MIN` toward the old 0.84 tier | small | makes type smaller — collides with the legibility floor in `typography.ts` |
| **D. Tighten before shrinking** | The engine already has tiers (spacing 1 → 0.78 → 0.65 → 0.6 + `descriptionClamp`); make Tier 2/3 do more work so fewer files reach the floor | medium | bounded; can only buy a few percent |

**A is the one that must not be missing regardless of which of B–D is chosen:** an export
that silently drops content is a correctness defect, not a design opinion. **B is the honest
answer for `mono-cv` (+137px), because no amount of tightening recovers 12% of a page.**
