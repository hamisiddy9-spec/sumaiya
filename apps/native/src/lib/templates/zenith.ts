import type { NativeTemplate } from "./types";

/**
 * Zenith — Purple name, underline sections
 * Generated from apps/web/components/templates/zenith.tsx (MinimalLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const ZenithTemplate: NativeTemplate = {
  id: "zenith",
  name: { en: "Zenith", sw: "Zenith" },
  blurb: { en: "Purple name, underline sections", sw: "Jina la zambarau, sehemu zenye mstari chini" },
  tier: "free",
  previewColor: "#7C3AED",
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
    "nameAlign": "center",
    "dividerStyle": "dotted",
    "sectionStyle": "underline",
    "skillDisplay": "bar",
    "hobbiesDisplay": "chips",
    "accentOnName": true,
    "experienceVariant": "default"
  },
};
