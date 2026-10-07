# free-panel 20260921-174955
scope=product style=digest
QUESTION: The page is A4. The engine will not shrink below scale 0.92 and the page clips with overflow:hidden, so long content is silently lost at export. What is the smallest correct change that stops a user exporting a cut-off CV, WITHOUT changing the A4 page size?

- apps/web/components/templates/engine/fit.tsx  [1 nemotron-3-ultra-550b-a55b]  Remove `data-pdf-exclude=""` from the warning banner so the "CV too long" alert appears in the exported PDF, making truncation visible to the user at the moment they download.
    ACTION: Delete `data-pdf-exclude=""` from the warning `<div>` in `AutoFitPage`.
    ACTION: Verify the warning remains inside the page box (bottom:10, right:10) at 0.92 scale so it isn't itself clipped by `overflow:hidden`.
    ACTION: Add a one-line test in `lib/pdf.ts` (or the existing PDF snapshot suite) asserting the warning text appears in the output when `scale === SHRINK_MIN && overflow > 1`.
- apps/web/components/templates/engine/fit.tsx  [2 nemotron-3-ultra-550b-a55b]  Block the export entirely when content would be clipped at the minimum scale, because a first-time job seeker cannot risk sending a CV they haven't seen in full.
    ACTION: Add a pre-export check that measures overflow at scale 0.92 and throws if > 1.02
    ACTION: Show a blocking modal (not a toast) listing which sections overflow, with a "Edit CV" button that returns to the editor
    ACTION: Keep the 0.92 floor — do not add smaller scales, multi-page, or auto-summarization
