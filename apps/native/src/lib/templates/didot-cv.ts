import type { NativeTemplate } from "./types";

/**
 * Didot — Card experience, accent name, solid divider
 * Generated from apps/web/components/templates/didot-cv.tsx (MinimalLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const DidotCvTemplate: NativeTemplate = {
  id: "didot-cv",
  name: { en: "Didot", sw: "Didot" },
  blurb: { en: "Card experience, accent name, solid divider", sw: "Uzoefu wa kadi, jina la msisitizo, kitenganishi kigumu" },
  tier: "free",
  previewColor: "#111827",
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
    "nameAlign": "left",
    "dividerStyle": "solid",
    "sectionStyle": "none",
    "skillDisplay": "bar",
    "hobbiesDisplay": "chips",
    "accentOnName": true,
    "experienceVariant": "card"
  },
};
