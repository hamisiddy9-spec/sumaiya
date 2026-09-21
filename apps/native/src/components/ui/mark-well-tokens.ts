/**
 * The welcoming path's container — ONE well, ONE mark scale.
 *
 * Why this exists as data: the cold start used to render the same mark four
 * ways on four screens (mark 52 in a solid 96 square, r26 → mark 72 in a tinted
 * 128 square, r40 → mark 78 in a tinted 148 square, r44 → mark 64 in a bare 80
 * box in the portal). Four sizes, three container treatments, one cold start.
 * Each of those numbers was written where it was used, so nothing stopped the
 * next screen from inventing a fifth. These constants are the only place the
 * geometry is allowed to live, and `mark-well-tokens.test.ts` reads the three
 * screens and fails if a hard-coded well number reappears in any of them (see
 * the "source guard" cases there).
 *
 * The radius is not arbitrary: the design system's well family
 * (`docs/design/2026-09-20/_mockup.css`: `.well--30/--38/--44/--72`) all sit at
 * radius/size ≈ 0.29–0.30, and `wellRadiusRatio()` is asserted against that
 * band. The tint hex suffix is the same `accent + "14"` the language stage and
 * the slides already used, i.e. the house `--ember-tint` (#FBE9E1) expressed as
 * an alpha so it still works when the un-pinned theme is dark.
 */

/** The pre-auth mark container. Every value in dp. */
export const MARK_WELL = {
  /** Outer container size. */
  size: 128,
  /** Corner radius. r/size ≈ 0.31, the design system's well ratio. */
  radius: 40,
  /** The mark drawn inside it — one size on every stage of the flow. */
  mark: 72,
  /** Hex alpha suffix appended to the theme accent: `accent + tint`. */
  tint: "14",
} as const;

/** The design system's `.well` family ratio band (11/38 … 22/72). */
export const WELL_RATIO_MIN = 0.26;
export const WELL_RATIO_MAX = 0.34;

/** Outer radius as a fraction of the outer size. */
export function wellRadiusRatio(size: number = MARK_WELL.size, radius: number = MARK_WELL.radius): number {
  return radius / size;
}

/** The mark's share of the well. A well holds the mark; it is not the mark. */
export function wellMarkRatio(size: number = MARK_WELL.size, mark: number = MARK_WELL.mark): number {
  return mark / size;
}

/** The well's background colour for a given theme accent. */
export function wellBackground(accent: string): string {
  return `${accent}${MARK_WELL.tint}`;
}
