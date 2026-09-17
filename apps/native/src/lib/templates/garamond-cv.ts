import type { NativeTemplate } from "./types";

/**
 * Garamond — Dotted divider, dot-label sections
 * Generated from apps/web/components/templates/garamond-cv.tsx (MinimalLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const GaramondCvTemplate: NativeTemplate = {
  id: "garamond-cv",
  name: { en: "Garamond", sw: "Garamond" },
  blurb: { en: "Dotted divider, dot-label sections", sw: "Kitenganishi chenye nukta, sehemu za lebo zenye nukta" },
  tier: "free",
  previewColor: "#374151",
  style: "minimal",
  layout: "MinimalLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "default",
    "skillDisplay": "bar",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "bg": "#FFFFFF",
    "nameAlign": "left",
    "dividerStyle": "dotted",
    "sectionStyle": "dots",
    "skillDisplay": "bar",
    "hobbiesDisplay": "chips",
    "accentOnName": false,
    "experienceVariant": "default"
  },
};
