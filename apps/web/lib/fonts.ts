// Shared document font list, used by every editor (CV, cover letter, studio) so
// the typography options are consistent system-wide.
//
// Each font is a full CSS stack so it renders reliably on-screen AND in the
// html2canvas PDF export — either a system face present on the user's device
// (with graceful serif/sans fallbacks) or one of our self-hosted faces
// (Hanken Grotesk, JetBrains Mono). Bare legacy values (e.g. "Inter",
// "Georgia, serif") still resolve fine through the browser.

export interface DocFont {
  name: string;
  stack: string;
  blurb: string;
}

/**
 * The one stack a Sumaiya CV is typeset in. `--font-inter` is defined by
 * next/font on <html> in BOTH root layouts; the inline `'Inter'` fallback keeps
 * the declaration valid when the custom property is missing (static HTML
 * renders, tests, PDF jobs) and 'Hanken Grotesk' — also self-hosted — is the
 * last real face before the metric-compatible Arial fallback.
 */
export const INTER_STACK =
  "var(--font-inter, 'Inter'), 'Inter', 'Hanken Grotesk', 'Helvetica Neue', Arial, sans-serif";

/**
 * Resolves whatever a document has stored in `fontFamily` into a stack the
 * browser can actually honour.
 *
 * CVs in the database, in localStorage and in the API default to the BARE
 * string "Inter" (lib/db/schema.ts, lib/stores/editor-store.ts, lib/api/routes/cv.ts).
 * A bare `Inter` is not a stack: if the user's machine has no Inter installed —
 * which is nearly every machine — the browser falls straight through to its
 * default sans (Arial/Helvetica), so the typography the template was designed
 * around never appears. Every render site therefore passes the stored value
 * through here first.
 *
 * Full stacks (anything with a comma or a var()) pass through untouched so a
 * user's own choice is never rewritten.
 */
export function resolveFontStack(family?: string | null): string {
  const f = (family ?? "").trim();
  if (!f) return INTER_STACK;
  if (f.includes(",") || f.includes("var(")) return f;
  const known = DOC_FONTS.find((d) => d.name.toLowerCase() === f.toLowerCase());
  if (known) return known.stack;
  // Legacy bare family we no longer offer (e.g. "Georgia" persisted before
  // stacks were): keep the requested face, then something real behind it.
  return `${f}, 'Hanken Grotesk', Arial, sans-serif`;
}

export const DOC_FONTS: DocFont[] = [
  // "'Inter'" is the design the CV templates are drawn for; it is self-hosted by
  // next/font (see app/[locale]/layout.tsx, app/(app)/layout.tsx) and exposed as
  // --font-inter. The var() carries its own fallback so a document rendered
  // OUTSIDE the app (static HTML, an email, a test harness) stays valid CSS
  // instead of collapsing to the browser default serif.
  { name: "Inter",     stack: INTER_STACK,                                             blurb: "Clean · Modern · ATS-friendly" },
  { name: "Hanken",    stack: "'Hanken Grotesk', 'Inter', Arial, sans-serif",         blurb: "Warm · Geometric · Contemporary" },
  { name: "Helvetica", stack: "'Helvetica Neue', Helvetica, Arial, sans-serif",       blurb: "Neutral · Swiss · Crisp" },
  { name: "Verdana",   stack: "Verdana, Geneva, sans-serif",                          blurb: "Legible · Friendly · Screen-safe" },
  { name: "Trebuchet", stack: "'Trebuchet MS', 'Segoe UI', Tahoma, sans-serif",       blurb: "Humanist · Approachable" },
  { name: "Georgia",   stack: "Georgia, 'Times New Roman', serif",                    blurb: "Classic · Elegant · Traditional" },
  { name: "Palatino",  stack: "'Palatino Linotype', 'Book Antiqua', Palatino, serif", blurb: "Refined · Bookish · Executive" },
  { name: "Garamond",  stack: "Garamond, 'EB Garamond', Georgia, serif",              blurb: "Literary · Timeless · Formal" },
  { name: "Cambria",   stack: "Cambria, Georgia, 'Times New Roman', serif",           blurb: "Sturdy · Readable · Formal" },
  { name: "Times",     stack: "'Times New Roman', Times, serif",                      blurb: "Academic · Conservative" },
  { name: "JetBrains", stack: "'JetBrains Mono', ui-monospace, 'SF Mono', monospace", blurb: "Technical · Code · Precise" },
  { name: "Courier",   stack: "'Courier New', Courier, monospace",                    blurb: "Typewriter · Retro · Mono" },
];

/** {label, value} form for plain <select> pickers. */
export const FONT_SELECT_OPTIONS: { label: string; value: string }[] =
  DOC_FONTS.map((f) => ({ label: f.name, value: f.stack }));
