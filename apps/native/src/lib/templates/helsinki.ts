import type { NativeTemplate } from "./types";

/**
 * Helsinki — Charcoal, cyan accent, timeline
 * Generated from apps/web/components/templates/helsinki.tsx (HeaderLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const HelsinkiTemplate: NativeTemplate = {
  id: "helsinki",
  name: { en: "Helsinki", sw: "Helsinki" },
  blurb: { en: "Charcoal, cyan accent, timeline", sw: "Mkaa, msisitizo wa bluu ya samawati, mstari wa wakati" },
  tier: "free",
  previewColor: "#0891B2",
  style: "header",
  layout: "HeaderLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "default",
    "skillDisplay": "dot",
    "showTimeline": true,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "headerBg": "#1E293B",
    "headerTextColor": "#F8FAFC",
    "headerSubColor": "#22D3EE",
    "headerContactColor": "#94A3B8",
    "bodyBg": "#FFFFFF",
    "headerPaddingV": 24,
    "mainSectionStyle": "dots",
    "photoSize": 76,
    "photoOnLeft": true,
    "skillDisplay": "dot",
    "showTimeline": true,
    "hobbiesDisplay": "chips",
    "experienceVariant": "default"
  },
};
