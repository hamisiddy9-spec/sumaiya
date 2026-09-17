import type { NativeTemplate } from "./types";

/**
 * Ledge — Ruled sections, grid skills, no divider
 * Generated from apps/web/components/templates/ledge.tsx (MinimalLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const LedgeTemplate: NativeTemplate = {
  id: "ledge",
  name: { en: "Ledge", sw: "Ledge" },
  blurb: { en: "Ruled sections, grid skills, no divider", sw: "Sehemu zenye mistari, ujuzi kwa gridi, bila kitenganishi" },
  tier: "free",
  previewColor: "#0F172A",
  style: "minimal",
  layout: "MinimalLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "default",
    "skillDisplay": "grid",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "bg": "#FFFFFF",
    "nameAlign": "left",
    "dividerStyle": "none",
    "sectionStyle": "ruled",
    "skillDisplay": "grid",
    "hobbiesDisplay": "chips",
    "accentOnName": false,
    "experienceVariant": "default"
  },
};
