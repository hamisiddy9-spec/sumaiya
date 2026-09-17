import type { NativeTemplate } from "./types";

/**
 * Ribbon — 10px ribbon, pill section labels, photo
 * Generated from apps/web/components/templates/ribbon.tsx (AccentBandLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const RibbonTemplate: NativeTemplate = {
  id: "ribbon",
  name: { en: "Ribbon", sw: "Ribbon" },
  blurb: { en: "10px ribbon, pill section labels, photo", sw: "Utepe wa 10px, lebo za mviringo vya sehemu, picha" },
  tier: "free",
  previewColor: "#DC2626",
  style: "minimal",
  layout: "AccentBandLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "default",
    "skillDisplay": "dot",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "bandWidth": 10,
    "bandColor": "@accent",
    "bg": "#FFFFFF",
    "nameColor": "#111827",
    "sectionStyle": "pill",
    "skillDisplay": "dot",
    "hobbiesDisplay": "chips",
    "experienceVariant": "default",
    "showTimeline": false,
    "photoSize": 80,
    "photoRadius": 50,
    "topRule": false
  },
};
