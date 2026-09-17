import type { NativeTemplate } from "./types";

/**
 * Herald — Centered, numbered, dot skills, accent name
 * Generated from apps/web/components/templates/herald-cv.tsx (MinimalLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const HeraldCvTemplate: NativeTemplate = {
  id: "herald-cv",
  name: { en: "Herald", sw: "Herald" },
  blurb: { en: "Centered, numbered, dot skills, accent name", sw: "Katikati, namba, ujuzi katika vitone, jina la msisitizo" },
  tier: "free",
  previewColor: "#1D4ED8",
  style: "minimal",
  layout: "MinimalLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "default",
    "skillDisplay": "dot",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "bg": "#FFFFFF",
    "nameAlign": "center",
    "dividerStyle": "solid",
    "sectionStyle": "numbered",
    "skillDisplay": "dot",
    "hobbiesDisplay": "chips",
    "accentOnName": true,
    "experienceVariant": "default"
  },
};
