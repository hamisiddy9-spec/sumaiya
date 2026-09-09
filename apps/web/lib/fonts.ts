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

export const DOC_FONTS: DocFont[] = [
  { name: "Inter",     stack: "'Inter', 'Helvetica Neue', Arial, sans-serif",         blurb: "Clean · Modern · ATS-friendly" },
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
