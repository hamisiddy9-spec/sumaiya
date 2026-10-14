/**
 * Home's type ramp — the ONLY place these family names appear.
 *
 * §2 TYPOGRAPHY names three families with three jobs:
 *
 *   display / headings   Bricolage Grotesque (800)
 *   body / UI            Hanken Grotesk
 *   numeric / eyebrows   JetBrains Mono
 *
 * Each value here is the exact `fontFamily` string React Native resolves at
 * paint time — i.e. a key of `FONT_ASSETS` in `src/app/_layout.tsx`, NOT the
 * web family name. React Native takes one family and has no font stack, so a
 * near-miss does not raise: it silently paints the system font and the heading
 * is merely "a bit off" (the failure mode §2 flags in Stitch's own render).
 * `home-fonts.test.ts` reads `_layout.tsx` and fails if any name here is not
 * actually registered, so a typo cannot ship as a silent fallback.
 *
 * The weight is carried by the FILE, so a style sets `fontFamily` and leaves
 * `fontWeight` alone — pairing a `fontWeight` with a cut that does not have it
 * is how Android fake-bolds, and pairing a 400 file with `fontWeight: "700"` is
 * how it drops back to the system font.
 */
export const FONT = {
  /** Bricolage Grotesque 800 — the greeting, the score numeral. */
  display: "BricolageGrotesque_800ExtraBold",
  /** Hanken Grotesk 700 — titles, labels. */
  bold: "HankenGrotesk_700Bold",
  /** Hanken Grotesk 600 — secondary labels. */
  semibold: "HankenGrotesk_600SemiBold",
  /** Hanken Grotesk 400 — body copy. */
  regular: "HankenGrotesk_400Regular",
  /** JetBrains Mono — tracked uppercase eyebrows, metrics. */
  mono: "JetBrainsMono_500Medium",
} as const;

/**
 * §5 — the 'apple polish' variant's spacing, adopted as the preferred one:
 * a 16 inter-card rhythm, a 10 grid gutter, a 16 card inset.
 */
export const HOME_SPACING = {
  /** `gap-4` — the content container's vertical cadence. */
  block: 16,
  /** `gap-2.5` — the quick-action grid gutter. */
  gutter: 10,
  /** `p-4` — inside a card. */
  cardPad: 16,
  /** The screen's horizontal margin (`px-5`); `Screen` already pads this. */
  side: 20,
  /** §8 — nothing tappable below this. */
  minTarget: 44,
} as const;
