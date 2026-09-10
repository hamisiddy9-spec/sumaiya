// Shared design tokens for web + mobile
// Single source of truth for colors, spacing, typography

// Mirrors apps/web/tailwind.config.ts exactly. Web is the reference — if these
// drift, the mobile app renders a different brand.
export const colors = {
  // Primary palette
  espresso: "#211A15",
  espresso_dark: "#171009",
  espresso_light: "#2C231C",
  espresso_line: "#3A2E25",

  // Accent
  ember: "#DA4A1C",
  ember_hover: "#C13E14",
  ember_shadow: "#A8330F",
  ember_tint: "#FBE9E1",

  // Secondary
  pine: "#12433D",
  pine_tint: "#E4EDEA",

  // Tertiary
  gold: "#F2A93B",
  gold_text: "#96630F",
  gold_tint: "#FBF3E2",

  // Neutral
  cream: "#FAF5EE",
  sand: "#EFE7DA",
  sand_2: "#F4EEE4",

  // Text
  text_body: "#6B5F54",
  text_muted: "#756A5E",

  // UI
  border: "#E9E0D4",
  border_input: "#9C8D7B",
  card: "#FFFFFF",

  // States
  success: "#12766A",
  warning: "#96630F",
  error: "#C13E14",
} as const;

export const spacing = {
  px: "1px",
  0: "0px",
  1: "0.25rem",    // 4px
  1.5: "0.375rem", // 6px
  2: "0.5rem",     // 8px
  2.5: "0.625rem", // 10px
  3: "0.75rem",    // 12px
  3.5: "0.875rem", // 14px
  4: "1rem",       // 16px
  5: "1.25rem",    // 20px
  6: "1.5rem",     // 24px
  8: "2rem",       // 32px
  10: "2.5rem",    // 40px
  12: "3rem",      // 48px
  16: "4rem",      // 64px
} as const;

export const radii = {
  sm: "0.375rem",   // 6px
  md: "0.5rem",     // 8px
  lg: "0.75rem",    // 12px
  input: "0.625rem", // 10px
  input_lg: "0.875rem", // 14px
  card: "1rem",     // 16px
  card_lg: "1.375rem", // 22px
  pill: "9999px",
} as const;

export const typography = {
  fontFamily: {
    display: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    body: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    mono: "'Monaco', 'Menlo', 'Ubuntu Mono', monospace",
  },
  fontSize: {
    xs: "0.75rem",    // 12px
    sm: "0.875rem",   // 14px
    base: "1rem",     // 16px
    lg: "1.125rem",   // 18px
    xl: "1.25rem",    // 20px
    "2xl": "1.5rem",  // 24px
    "3xl": "1.875rem", // 30px
    "4xl": "2.25rem", // 36px
    "5xl": "3rem",    // 48px
    "6xl": "3.75rem", // 60px
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

export const shadows = {
  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
  floating: "0 20px 25px -5px rgba(0, 0, 0, 0.15)",
} as const;

export const transitions = {
  fast: "150ms ease-out",
  normal: "200ms ease-out",
  slow: "300ms ease-out",
} as const;
