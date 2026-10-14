// RF1 — Design-system consistency tokens.
//
// These are the shared primitives for the "world-class bar" sweep:
//   - EMBER_TEXT: the ONLY ember class allowed for small text. `text-ember`
//     (#DA4A1C) is 4.01:1 on the guide's surface — it fails WCAG AA for normal
//     text (needs 4.5:1) and is 3.38:1 on the tint fill.
//
//     This used to point at `ember-hover` (#C13E14). Since the palette moved to
//     docs/DESIGN-GUIDE.md §1, that no longer works: the guide's emberHover is
//     #C2410C, which is 4.46:1 on surfaceSunken — under AA, on a surface this
//     app genuinely paints. The guide's OWN `emberPressed` (#B93C13) clears
//     every surface we render on (5.65 on white, 5.37 surface, 5.10 raised,
//     4.86 sunken, 4.53 on the tint fill), so the token points there.
//     outside the guide's palette is introduced: ember, emberHover and
//     emberPressed are all guide tokens, each doing the job it is defined for
//     (fill, state, small ember text).
//
//     Large display text and icons may still use `text-ember` (icons/UI
//     components need only 3:1), but any NORMAL-SIZE text (<= 15px, non-bold)
//     must use EMBER_TEXT.
//   - FOCUS_RING: one consistent visible keyboard-focus treatment for custom
//     interactive elements (the <Button> primitive has its own double ring).
//     2px ember at 60% on a 1px cream offset — visible on white, cream and
//     ember fills without the old 1.08:1 invisible tint ring.
//   - TAP_MIN: the minimum interactive hit area (24x24px) for icon-only
//     controls. Apply alongside negative margins so layout doesn't shift.
//
// lib/ui-tokens.test.ts guards the contrast math so these can't drift.

export const EMBER_TEXT = "text-ember-pressed";

export const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember/60 focus-visible:ring-offset-1 focus-visible:ring-offset-cream";

export const TAP_MIN = "min-h-6 min-w-6";
