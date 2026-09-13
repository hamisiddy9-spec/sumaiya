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

  return {
    font: {
      name: r(26),
      nameTitle: r(12),
      sectionLabel: r(9),
      roleTitle: r(12),
      orgName: r(10.5),
      body: r(9.75),
      meta: r(8.5),
      tag: r(8.5),
      ...overrides.font,
    },
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
