import type { NativeTemplate } from "./types";

/**
 * Futurism — Red accent name, tag labels, airy
 * Generated from apps/web/components/templates/futurism-cv.tsx (MinimalLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const FuturismCvTemplate: NativeTemplate = {
  id: "futurism-cv",
  name: { en: "Futurism", sw: "Futurism" },
  blurb: { en: "Red accent name, tag labels, airy", sw: "Jina la msisitizo wa nyekundu, lebo za tagi, nafasi nyingi" },
  tier: "free",
  previewColor: "#DC2626",
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
    "sectionStyle": "tag",
    "skillDisplay": "bar",
    "hobbiesDisplay": "chips",
    "accentOnName": true,
    "experienceVariant": "default"
  },
};
