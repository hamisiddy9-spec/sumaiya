import type { NativeTemplate } from "./types";

/**
 * Modernist — Blue accent name, dotted divider
 * Generated from apps/web/components/templates/modernist-cv.tsx (MinimalLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const ModernistCvTemplate: NativeTemplate = {
  id: "modernist-cv",
  name: { en: "Modernist", sw: "Modernist" },
  blurb: { en: "Blue accent name, dotted divider", sw: "Jina la msisitizo wa bluu, kitenganishi chenye nukta" },
  tier: "free",
  previewColor: "#1D4ED8",
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
    "sectionStyle": "underline",
    "skillDisplay": "bar",
    "hobbiesDisplay": "chips",
    "accentOnName": true,
    "experienceVariant": "default"
  },
};
