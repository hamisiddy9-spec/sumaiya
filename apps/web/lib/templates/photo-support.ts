/**
 * Which CV templates can actually PRINT the photo a candidate uploaded — the
 * single source of truth for the honest notice the editor owes the user.
 *
 * Why this list has to exist at all: a template can look photo-capable and
 * still emit nothing. It may pass `photoSize: 0` to the shared engine, spread
 * `personal.photo` away entirely, or simply have no portrait slot in its
 * header. Nothing in the type system says so, so the ONLY way to know is to
 * render the template with a photo set and look at the markup.
 *
 * That is exactly how this list was produced: every template in
 * `TEMPLATE_COMPONENTS` (266 registered) is rendered with a photo attached, and
 * the ones whose markup contains no `data:image/` are the ones that dropped it.
 * Measured 2026-09-20:
 *
 *   total registered templates : 266
 *   templates that drop it    : 70
 *   of which offered (curated): 3   — grid, stripe, mono-cv
 *   of which legacy tail      : 67
 *
 * The QA sweep that first found this (docs/QA-IO-MATRIX-2026-09-20.md, D7)
 * inspected 59 templates and named 9 — `grid`, `stripe`, `mono-cv`, `alpine`,
 * `bauhaus`, `cirrus`, `cipher`, `celeste`, `baroque-cv`. Those 9 are all in
 * this list; the sweep simply never rendered the other 61.
 *
 * For three of them dropping the photo is DELIBERATE and correct: `grid`,
 * `stripe` and `mono-cv` are the Minimal/ATS group, where the whole point is an
 * output a parser reads cleanly, and a headshot is noise in that output. The
 * other 67 are legacy layouts that predate the shared photo helper. The notice
 * this module drives does not tell the user the template is broken — it tells
 * them the truth, which is that their photo will not be in the file, so they can
 * pick differently BEFORE they send it to an employer.
 *
 * Drift is caught, not hoped for: `components/templates/photo-support.test.ts`
 * re-renders the entire registry and fails if this set and reality disagree in
 * either direction. If a template is given a photo slot, that test says so and
 * this list must shrink with it.
 *
 * Client-safe by construction: no server-only imports, no JSX, no React.
 */

/** Every template id whose markup contains no photo even when one is set. */
export const TEMPLATES_WITHOUT_PHOTO: ReadonlySet<string> = new Set([
  // --- Offered in the gallery (curated) — all three are the Minimal/ATS group ---
  "grid",
  "stripe",
  "mono-cv",
  // --- Legacy tail: no portrait slot in the layout ---
  "executive-one",
  "silicon-pro",
  "alpine",
  "ascent",
  "imperial",
  "studio",
  "inset",
  "ledger",
  "flux",
  "script-cv",
  "capsule",
  "ledge",
  "ticker",
  "slab",
  "peel",
  "trace",
  "clean-cv",
  "herald-cv",
  "folio",
  "atlas-v2",
  "bauhaus",
  "futura-cv",
  "bodoni-cv",
  "garamond-cv",
  "caslon",
  "palatino-cv",
  "baskerville-cv",
  "didot-cv",
  "clarendon-cv",
  "rockwell-cv",
  "brutalist-cv",
  "modernist-cv",
  "constructivist",
  "deco-cv",
  "structuralist",
  "impressionist-cv",
  "baroque-cv",
  "classical-cv",
  "neoclassical-cv",
  "avant-garde-cv",
  "de-stijl",
  "suprematist",
  "dadaist",
  "futurism-cv",
  "nebula",
  "cosmos",
  "orbit",
  "solstice",
  "equinox",
  "zenith",
  "solaris",
  "lunar",
  "stellar",
  "stratus",
  "nimbus",
  "cirrus",
  "cumulus",
  "altus",
  "celeste",
  "quantum",
  "photon",
  "quasar",
  "pulsar",
  "gravity",
  "vector",
  "neural",
  "cipher",
]);

/** Does this template put the candidate's photo in the rendered document? */
export function templateShowsPhoto(templateId: string | null | undefined): boolean {
  if (!templateId) return true;
  return !TEMPLATES_WITHOUT_PHOTO.has(templateId);
}

/**
 * The honest notice shown when the candidate HAS a photo and has picked a
 * template that cannot print it. It names the template, states plainly that the
 * photo will not be in the file, and offers the two real ways forward — so it is
 * discovered in the editor rather than in the PDF an employer receives.
 *
 * `templateName` is passed in rather than looked up here because the display
 * name lives in the template catalog, and this module deliberately imports
 * nothing.
 */
export function photoNotPrintedNotice(
  templateName: string,
  lang: "sw" | "en" = "sw",
): string {
  if (lang === "sw") {
    return `Muundo wa ${templateName} hauonyeshi picha. Picha yako haitakuwa kwenye PDF unayopakua — chagua muundo mwingine kama unataka ionekane, au endelea bila picha.`;
  }
  return `The ${templateName} template does not print a photo. Your photo will not be in the PDF you download — pick another template if you want it shown, or carry on without it.`;
}
