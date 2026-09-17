import type { NativeTemplate } from "./types";

/**
 * Neural — Green, card experience, centered
 * Generated from apps/web/components/templates/neural.tsx (MinimalLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const NeuralTemplate: NativeTemplate = {
  id: "neural",
  name: { en: "Neural", sw: "Neural" },
  blurb: { en: "Green, card experience, centered", sw: "Kijani, uzoefu wa kadi, katikati" },
  tier: "free",
  previewColor: "#059669",
  style: "minimal",
  layout: "MinimalLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "card",
    "skillDisplay": "bar",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "bg": "#FFFFFF",
    "nameAlign": "center",
    "dividerStyle": "solid",
    "sectionStyle": "underline",
    "skillDisplay": "bar",
    "hobbiesDisplay": "chips",
    "accentOnName": false,
    "experienceVariant": "card"
  },
};
