# apps/web/components/templates/engine/fit.tsx — role 1
model: nvidia/nemotron-3-ultra-550b-a55b:free
role: a product strategist who has launched consumer products in East Africa

VERDICT: Remove `data-pdf-exclude=""` from the warning banner so the "CV too long" alert appears in the exported PDF, making truncation visible to the user at the moment they download.

WHY:
- The warning already renders on-screen when content exceeds the 0.92 floor, but `data-pdf-exclude=""` strips it from the PDF (per the comment referencing `lib/pdf.ts`).
- Users who skip the preview and go straight to download currently get a silently clipped A4 with no indication content was lost.
- This is a one-line deletion that requires no layout, scaling, or export-pipeline changes.

ACTION: Delete `data-pdf-exclude=""` from the warning `<div>` in `AutoFitPage`.
ACTION: Verify the warning remains inside the page box (bottom:10, right:10) at 0.92 scale so it isn't itself clipped by `overflow:hidden`.
ACTION: Add a one-line test in `lib/pdf.ts` (or the existing PDF snapshot suite) asserting the warning text appears in the output when `scale === SHRINK_MIN && overflow > 1`.

RISK: The warning text ("remove some content") is an editor action, not a PDF-viewer action — a recruiter opening the file sees a confusing badge.

DOUBT: Cannot confirm from this file alone whether `lib/pdf.ts` uses `data-pdf-exclude` as the sole exclusion mechanism or also strips by class/selector; if the latter, the warning may still disappear.
