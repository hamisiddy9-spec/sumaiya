import type { NativeTemplate } from "./types";

/**
 * Baroque — Card experience, no divider, dark
 * Generated from apps/web/components/templates/baroque-cv.tsx (MinimalLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const BaroqueCvTemplate: NativeTemplate = {
  id: "baroque-cv",
  name: { en: "Baroque", sw: "Baroque" },
  blurb: { en: "Card experience, no divider, dark", sw: "Uzoefu wa kadi, bila kitenganishi, nyeusi" },
  tier: "free",
  previewColor: "#0F172A",
  style: "minimal",
  layout: "MinimalLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "card",
    "skillDisplay": "chip",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "bg": "#FFFFFF",
    "nameAlign": "left",
    "dividerStyle": "none",
    "sectionStyle": "underline",
    "skillDisplay": "chip",
    "hobbiesDisplay": "chips",
    "accentOnName": false,
    "experienceVariant": "card"
  },
};
