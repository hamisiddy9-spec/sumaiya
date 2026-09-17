import type { NativeTemplate } from "./types";

/**
 * Vector — Blue name, dot sections, airy
 * Generated from apps/web/components/templates/vector.tsx (MinimalLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const VectorTemplate: NativeTemplate = {
  id: "vector",
  name: { en: "Vector", sw: "Vector" },
  blurb: { en: "Blue name, dot sections, airy", sw: "Jina la bluu, sehemu zenye nukta, nafasi nyingi" },
  tier: "free",
  previewColor: "#1D4ED8",
  style: "minimal",
  layout: "MinimalLayout",
  personality: {
    "density": "airy",
    "experienceVariant": "default",
    "skillDisplay": "chip",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "bg": "#FFFFFF",
    "nameAlign": "center",
    "dividerStyle": "dotted",
    "sectionStyle": "dots",
    "skillDisplay": "chip",
    "hobbiesDisplay": "chips",
    "accentOnName": true,
    "experienceVariant": "default"
  },
};
