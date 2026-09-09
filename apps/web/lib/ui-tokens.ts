// RF1 — Design-system consistency tokens.
//
// These are the shared primitives for the "world-class bar" sweep:
//   - EMBER_TEXT: the ONLY ember class allowed for small text. `text-ember`
//     (#DA4A1C) is 4.22:1 on white — it fails WCAG AA for normal text (needs
//     4.5:1) and was 3.59:1 on the tint badge fill. `text-ember-hover`
//     (#C13E14) is 5.29:1 on white, 4.50:1 on tint, 4.88:1 on cream, 4.59:1 on
//     sand-2 — it passes everywhere the app actually renders it. Hue is
//     unchanged; one step darker. Large display text and icons may still use
//     `text-ember` (icons/UI components only need 3:1; large text passes at
//     3:1), but any NORMAL-SIZE text (<= 15px, non-bold) must use EMBER_TEXT.
//   - FOCUS_RING: one consistent visible keyboard-focus treatment for custom
//     interactive elements (the <Button> primitive has its own double ring).
//     2px ember at 60% on a 1px cream offset — visible on white, cream and
//     ember fills without the old 1.08:1 invisible tint ring.
//   - TAP_MIN: the minimum interactive hit area (24x24px) for icon-only
//     controls. Apply alongside negative margins so layout doesn't shift.
//
// lib/ui-tokens.test.ts guards the contrast math so these can't drift.

export const EMBER_TEXT = "text-ember-hover";

export const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember/60 focus-visible:ring-offset-1 focus-visible:ring-offset-cream";

export const TAP_MIN = "min-h-6 min-w-6";
