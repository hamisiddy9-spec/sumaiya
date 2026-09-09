// Design token system — the single source of truth for all visual decisions
// in engine-backed templates. Every theme config calls makeTokens() and
// optionally overrides specific values.

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
    text: string;            // Primary text
    sub: string;             // Secondary text
    muted: string;           // Tertiary — dates, location
    faint: string;           // Very-light backgrounds, hairlines
    sidebarBg: string;       // Sidebar fill
    onSidebar: string;       // Text on sidebar
    onSidebarMuted: string;  // Muted text on sidebar
    onAccent: string;        // Text on accent color
  };
  fontFamily: string;
}

export type DensityMode = "compact" | "normal" | "airy";

// Per-density space and font-scale multipliers
// Density now spans a genuinely perceptible range — "airy" used to be only 5%
// looser than "normal", so the three modes felt identical. The section/entry
// gaps carry most of the felt difference.
const DENSITY: Record<DensityMode, { mul: number; space: DesignTokens["space"] }> = {
  compact: {
    mul: 0.90,
    space: { pageH: 22, pageV: 22, section: 9, entry: 6, line: 1.36 },
  },
  normal: {
    mul: 1.0,
    space: { pageH: 28, pageV: 28, section: 15, entry: 10, line: 1.5 },
  },
  airy: {
    mul: 1.10,
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
  density: DensityMode = "normal"
): DesignTokens {
  const d = DENSITY[density];
  const m = d.mul;

  return {
    // Type scale opened up so hierarchy comes from SIZE, not only colour/weight.
    // The name now has real presence (was a timid 20pt), and role/org/body/meta
    // are spread far enough apart to read as distinct levels instead of a flat
    // wall of ~9–11pt text.
    font: {
      name:         Math.round(26   * m * 10) / 10,
      nameTitle:    Math.round(12   * m * 10) / 10,
      sectionLabel: Math.round(9    * m * 10) / 10,
      roleTitle:    Math.round(12   * m * 10) / 10,
      orgName:      Math.round(10.5 * m * 10) / 10,
      body:         Math.round(9.75 * m * 10) / 10,
      meta:         Math.round(8.5  * m * 10) / 10,
      tag:          Math.round(8.5  * m * 10) / 10,
      ...overrides.font,
    },
    space: {
      ...d.space,
      ...overrides.space,
    },
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
