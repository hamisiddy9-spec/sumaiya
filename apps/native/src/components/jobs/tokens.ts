/**
 * The Jobs flow's tokens — the ONLY place its type ramp and rhythm live.
 *
 * §2 TYPOGRAPHY names three families with three jobs:
 *
 *   display / headings   Bricolage Grotesque (800)
 *   body / UI            Hanken Grotesk
 *   numeric / eyebrows   JetBrains Mono
 *
 * `FONT` is Home's ramp, re-exported rather than copied: it is the list of
 * `fontFamily` strings React Native resolves at paint time (keys of
 * `FONT_ASSETS` in `src/app/_layout.tsx`), and a second literal copy here is
 * exactly how the Jobs heading would drift onto the system font without
 * raising (`components/home/home-fonts.test.ts` guards the one list).
 *
 * The rhythm is B4/B5's own: `space-y-3` between feed cards, `p-4` inside a
 * card, `space-y-4` between the detail's blocks. The design's `text-2xl`
 * heading is not re-declared here — it is the app's `ScreenTitle`.
 */
export { FONT } from "../home";

export const JOBS_SPACING = {
  /** `space-y-3` — the feed's card-to-card cadence. */
  cardGap: 12,
  /** `p-4` — inside a feed card. */
  cardPad: 16,
  /** `space-y-4` — the detail's block cadence. */
  block: 16,
  /** `gap-2` — the chip rows on both screens. */
  chipGap: 8,
  /** §8 — nothing tappable below this. */
  minTarget: 44,
  /** §8's floor for a primary action. */
  primaryTarget: 48,
} as const;
