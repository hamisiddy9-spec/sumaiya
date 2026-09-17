import type { NativeTemplate } from "./types";

/**
 * Inset — 6px band, ruled sections, airy
 * Generated from apps/web/components/templates/inset.tsx (AccentBandLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const InsetTemplate: NativeTemplate = {
  id: "inset",
  name: { en: "Inset", sw: "Inset" },
  blurb: { en: "6px band, ruled sections, airy", sw: "Ukanda wa 6px, sehemu zenye mistari, nafasi nyingi" },
  tier: "free",
  previewColor: "#7C3AED",
  style: "minimal",
  layout: "AccentBandLayout",
  personality: {
    "density": "airy",
    "experienceVariant": "default",
    "skillDisplay": "chip",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "bandWidth": 6,
    "bandColor": "@accent",
    "bg": "#FAFAFA",
    "nameColor": "#111827",
    "sectionStyle": "ruled",
    "skillDisplay": "chip",
    "hobbiesDisplay": "chips",
    "experienceVariant": "default",
    "showTimeline": false,
    "photoSize": 0,
    "photoRadius": 50,
    "topRule": true
  },
};
