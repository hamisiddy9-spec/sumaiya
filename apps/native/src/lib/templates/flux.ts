import type { NativeTemplate } from "./types";

/**
 * Flux — 10px band, box headers, chip skills
 * Generated from apps/web/components/templates/flux.tsx (AccentBandLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const FluxTemplate: NativeTemplate = {
  id: "flux",
  name: { en: "Flux", sw: "Flux" },
  blurb: { en: "10px band, box headers, chip skills", sw: "Ukanda wa 10px, vichwa vya masanduku, ujuzi katika vibao vya UI" },
  tier: "free",
  previewColor: "#6D28D9",
  style: "minimal",
  layout: "AccentBandLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "card",
    "skillDisplay": "chip",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "bandWidth": 10,
    "bandColor": "@accent",
    "bg": "#FFFFFF",
    "nameColor": "#111827",
    "sectionStyle": "box",
    "skillDisplay": "chip",
    "hobbiesDisplay": "chips",
    "experienceVariant": "card",
    "showTimeline": false,
    "photoSize": 0,
    "photoRadius": 50,
    "topRule": false
  },
};
