import type { NativeTemplate } from "./types";

/**
 * Tempo — Accent name, dot sections, dot skills, timeline
 * Generated from apps/web/components/templates/tempo.tsx (AccentBandLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const TempoTemplate: NativeTemplate = {
  id: "tempo",
  name: { en: "Tempo", sw: "Tempo" },
  blurb: { en: "Accent name, dot sections, dot skills, timeline", sw: "Jina la msisitizo, sehemu zenye nukta, ujuzi katika nukta, timeline" },
  tier: "free",
  previewColor: "#0891B2",
  style: "minimal",
  layout: "AccentBandLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "default",
    "skillDisplay": "dot",
    "showTimeline": true,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "bandWidth": 8,
    "bandColor": "@accent",
    "bg": "#FAFAFA",
    "nameColor": "@accent",
    "sectionStyle": "dots",
    "skillDisplay": "dot",
    "hobbiesDisplay": "chips",
    "experienceVariant": "default",
    "showTimeline": true,
    "photoSize": 76,
    "photoRadius": 50,
    "topRule": false
  },
};
