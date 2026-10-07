/**
 * Design token system — the single source of truth for all visual decisions in
 * engine-backed templates. Ported 1:1 from the web engine
 * (apps/web/components/templates/engine/tokens.ts) so a template's type scale
 * and spacing read the same on both platforms.
 */

export interface DesignTokens {
  font: {
    name: number;         // Full name — largest text on the page
    nameTitle: number;    // Job title below the name
    sectionLabel: number; // WORK EXPERIENCE, EDUCATION, SKILLS ...
    roleTitle: number;    // Job position / degree title
    orgName: number;      // Company / institution name
    body: number;         // Description prose
    meta: number;         // Dates, location (muted)
    tag: number;          // Skill chips, small badges
  };
  space: {
    pageH: number;   // Horizontal page padding
    pageV: number;   // Vertical page padding
    section: number; // Gap between sections
    entry: number;   // Gap between entries within a section
    line: number;    // Line-height multiplier for prose
  };
  color: {
    accent: string;
    text: string;
    sub: string;
    muted: string;
    faint: string;
    sidebarBg: string;
    onSidebar: string;
    onSidebarMuted: string;
    onAccent: string;
  };
  fontFamily: string;
}

export type DensityMode = "compact" | "normal" | "airy";

/**
 * 8pt at 96dpi (this sheet is authored at 96dpi — 794px = A4's 8.27in, so
 * 8 × 96/72 = 10.667, rounded to 10.7). Below this, printed text reads as a
 * grey smudge, and at the gallery's ~0.45 preview scale it isn't text at all.
 * Nothing the token scale emits — at any density, before or after an
 * override — may render smaller than this.
 */
export const SMALL_PRINT_FLOOR_PX = 10.7;

/** Raises `px` to the floor when it falls under it; otherwise returns it
 *  unchanged, so applying it more than once is a no-op. */
export function clampFontPx(px: number): number {
  return px < SMALL_PRINT_FLOOR_PX ? SMALL_PRINT_FLOOR_PX : px;
}

const DENSITY: Record<DensityMode, { mul: number; space: DesignTokens["space"] }> = {
  compact: {
    mul: 0.9,
    space: { pageH: 22, pageV: 22, section: 9, entry: 6, line: 1.36 },
  },
  normal: {
    mul: 1.0,
    space: { pageH: 28, pageV: 28, section: 15, entry: 10, line: 1.5 },
  },
  airy: {
    mul: 1.1,
    space: { pageH: 34, pageV: 34, section: 22, entry: 15, line: 1.64 },
  },
};

export function makeTokens(
  accent: string,
  fontFamily: string,
  overrides: {
    font?: Partial<DesignTokens["font"]>;
    space?: Partial<DesignTokens["space"]>;
    color?: Partial<DesignTokens["color"]>;
  } = {},
  density: DensityMode = "normal",
): DesignTokens {
  const d = DENSITY[density] ?? DENSITY.normal;
  const m = d.mul;
  const r = (n: number) => Math.round(n * m * 10) / 10;

  const font = {
    name: r(26),
    nameTitle: r(12),
    sectionLabel: r(9),
    roleTitle: r(12),
    orgName: r(10.5),
    body: r(9.75),
    meta: r(8.5),
    tag: r(8.5),
    ...overrides.font,
  };
  (Object.keys(font) as (keyof typeof font)[]).forEach((key) => {
    font[key] = clampFontPx(font[key]);
  });

  return {
    font,
    space: { ...d.space, ...overrides.space },
    color: {
      accent,
      text: "#111827",
      sub: "#374151",
      muted: "#6B7280",
      faint: "#F3F4F6",
      sidebarBg: "#F8FAFC",
      onSidebar: "#1F2937",
      onSidebarMuted: "#4B5563",
      onAccent: "#FFFFFF",
      ...overrides.color,
    },
    fontFamily,
  };
}
