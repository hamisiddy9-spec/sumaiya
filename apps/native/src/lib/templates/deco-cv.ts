import type { NativeTemplate } from "./types";

/**
 * Deco — Gold accent name, airy, accent lines
 * Generated from apps/web/components/templates/deco-cv.tsx (MinimalLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const DecoCvTemplate: NativeTemplate = {
  id: "deco-cv",
  name: { en: "Deco", sw: "Deco" },
  blurb: { en: "Gold accent name, airy, accent lines", sw: "Jina la msisitizo wa dhahabu, nafasi nyingi, mistari ya rangi" },
  tier: "free",
  previewColor: "#B45309",
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
    "dividerStyle": "none",
    "sectionStyle": "line-accent",
    "skillDisplay": "bar",
    "hobbiesDisplay": "chips",
    "accentOnName": true,
    "experienceVariant": "default"
  },
};
