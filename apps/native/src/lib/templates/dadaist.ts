import type { NativeTemplate } from "./types";

/**
 * Dadaist — Dotted divider, underline sections
 * Generated from apps/web/components/templates/dadaist.tsx (MinimalLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const DadaistTemplate: NativeTemplate = {
  id: "dadaist",
  name: { en: "Dadaist", sw: "Dadaist" },
  blurb: { en: "Dotted divider, underline sections", sw: "Kitenganishi cha vitone, sehemu zenye mstari chini" },
  tier: "free",
  previewColor: "#374151",
  style: "minimal",
  layout: "MinimalLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "default",
    "skillDisplay": "chip",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "bg": "#FFFFFF",
    "nameAlign": "left",
    "dividerStyle": "dotted",
    "sectionStyle": "underline",
    "skillDisplay": "chip",
    "hobbiesDisplay": "chips",
    "accentOnName": false,
    "experienceVariant": "default"
  },
};
