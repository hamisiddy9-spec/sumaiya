import type { NativeTemplate } from "./types";

/**
 * Impressionist — Purple accent, borderless sections, airy
 * Generated from apps/web/components/templates/impressionist-cv.tsx (MinimalLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const ImpressionistCvTemplate: NativeTemplate = {
  id: "impressionist-cv",
  name: { en: "Impressionist", sw: "Impressionist" },
  blurb: { en: "Purple accent, borderless sections, airy", sw: "Msisitizo wa zambarau, sehemu bila mipaka, nafasi nyingi" },
  tier: "free",
  previewColor: "#7C3AED",
  style: "minimal",
  layout: "MinimalLayout",
  personality: {
    "density": "airy",
    "experienceVariant": "default",
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
    "experienceVariant": "default"
  },
};
