import type { NativeTemplate } from "./types";

/**
 * De Stijl — Blue, dot sections, card experience
 * Generated from apps/web/components/templates/de-stijl.tsx (MinimalLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const DeStijlTemplate: NativeTemplate = {
  id: "de-stijl",
  name: { en: "De Stijl", sw: "De Stijl" },
  blurb: { en: "Blue, dot sections, card experience", sw: "Bluu, sehemu zenye nukta, uzoefu wa kadi" },
  tier: "free",
  previewColor: "#1D4ED8",
  style: "minimal",
  layout: "MinimalLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "card",
    "skillDisplay": "chip",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "bg": "#FFFFFF",
    "nameAlign": "left",
    "dividerStyle": "solid",
    "sectionStyle": "dots",
    "skillDisplay": "chip",
    "hobbiesDisplay": "chips",
    "accentOnName": false,
    "experienceVariant": "card"
  },
};
