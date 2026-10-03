/**
 * The welcoming path — ONE source of truth for the web's type and geometry.
 *
 * This is NOT a scale. It is the literal spec from Sumaiya's onboarding screen
 * (`apps/native/src/screens/onboarding-screen.tsx`: `WelcomeStage`, `Slide` and
 * the language `choices`). 29 is not 30. 15 is not 16. 15.5 is not 16, and -0.6
 * is not -0.5. The rule is copy the spec, never round to the nearest step.
 *
 * The web landing reads these objects directly, so the welcome cannot drift into
 * "the same idea a few steps off" — which is exactly what it did once and read
 * as vibe-coded. `apps/web/lib/welcome-spec.test.ts` fails if a number here moves
 * away from the native screen, and source-guards the landing so the greeting
 * cannot be re-hand-rolled with hand-picked values.
 *
 * The geometry is the house `MARK_WELL` (`apps/native/src/components/ui/
 * mark-well-tokens.ts`): size 128, radius 40, mark 72, well tint `accent + 14`
 * (an 8% accent, not the solid `--ember-tint`). The same object the native
 * welcome path and both siblings' welcoming screens render.
 */

/** The greeting. The app's own word, ONE element, weight 800. */
export const WELCOME_GREETING = { fontSize: 29, fontWeight: 800, letterSpacing: -0.6 } as const;

/** The bilingual line under the greeting. Swahili first, English on line two. */
export const WELCOME_BODY = { fontSize: 15, lineHeight: 22, maxWidth: 290 } as const;

/** The greeting's own word — no separator dot, no second word beside it. */
export const WELCOME_WORD = "Karibu";

/** The exact bilingual body the native welcome renders. */
export const WELCOME_BODY_TEXT = "Mimi ni Sumaiya. Chagua lugha yako.\nI'm Sumaiya. Choose your language.";

/** The house mark well — one container, one mark size, on every welcoming stage. */
export const MARK_WELL = {
  /** Outer container size, px. */
  size: 128,
  /** Corner radius, px. r/size = 0.3125, the house well ratio. */
  radius: 40,
  /** The mark drawn inside it, px. mark/size = 0.5625. */
  mark: 72,
  /** Hex alpha suffix appended to the accent: the well is `accent + "14"`. */
  tint: "14",
} as const;

/** The well's tint for a given accent — the house `accent + "14"` (8% alpha). */
export function wellTint(accent: string): string {
  return `${accent}${MARK_WELL.tint}`;
}

/** The four slides' type — kept here so the same spec numbers travel together. */
export const SLIDE_TITLE = { fontSize: 26, fontWeight: 800, letterSpacing: -0.5 } as const;
export const SLIDE_BODY = { fontSize: 15.5, lineHeight: 23, maxWidth: 320 } as const;

/** A language choice, and its two lines. */
export const CHOICE_CARD = { borderWidth: 1.5, radius: 18, paddingVertical: 14, paddingHorizontal: 20 } as const;
export const CHOICE_TITLE = { fontSize: 18, fontWeight: 800 } as const;
export const CHOICE_HINT = { fontSize: 13 } as const;

/** A tertiary action (skip / sign in) — 14/700. */
export const TERTIARY_ACTION = { fontSize: 14, fontWeight: 700 } as const;
