# apps/web/components/templates/engine/fit.tsx — role 2
model: nvidia/nemotron-3-ultra-550b-a55b:free (rotated from ling-3.0-flash-vl:free)
role: a user who is unemployed and applying for their first formal job

VERDICT: Block the export entirely when content would be clipped at the minimum scale, because a first-time job seeker cannot risk sending a CV they haven't seen in full.

WHY:
- Silent clipping means the user sends a broken CV without knowing — the worst possible outcome for a first application
- The existing warning banner is UI-only (data-pdf-exclude) so it disappears in the PDF the employer sees
- At 0.92 scale the text is already 8% smaller than designed; shrinking further makes it unreadable, not "fitted"

ACTION: Add a pre-export check that measures overflow at scale 0.92 and throws if > 1.02
ACTION: Show a blocking modal (not a toast) listing which sections overflow, with a "Edit CV" button that returns to the editor
ACTION: Keep the 0.92 floor — do not add smaller scales, multi-page, or auto-summarization

RISK: If the measurement runs before webfonts settle, a CV that fits might be falsely blocked.

DOUBT: Whether lib/pdf.ts currently re-measures at export time or trusts the editor's scale — if it re-renders independently, the block must live there too.
