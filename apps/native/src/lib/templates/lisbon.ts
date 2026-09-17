import type { NativeTemplate } from "./types";

/**
 * Lisbon — Charcoal, cyan, compact body
 * Generated from apps/web/components/templates/lisbon.tsx (HeaderLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const LisbonTemplate: NativeTemplate = {
  id: "lisbon",
  name: { en: "Lisbon", sw: "Lisbon" },
  blurb: { en: "Charcoal, cyan, compact body", sw: "Mkaa, bluu ya samawati, maudhui fupi" },
  tier: "free",
  previewColor: "#0891B2",
  style: "header",
  layout: "HeaderLayout",
  personality: {
    "density": "compact",
    "experienceVariant": "compact",
    "skillDisplay": "bar",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "headerBg": "#1E293B",
    "headerTextColor": "#F8FAFC",
    "headerSubColor": "#67E8F9",
    "headerContactColor": "#94A3B8",
    "bodyBg": "#FFFFFF",
    "headerPaddingV": 24,
    "mainSectionStyle": "dots",
    "photoSize": 76,
    "photoOnLeft": true,
    "skillDisplay": "bar",
    "showTimeline": false,
    "hobbiesDisplay": "chips",
    "experienceVariant": "compact"
  },
};
