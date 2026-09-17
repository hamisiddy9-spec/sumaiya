import type { NativeTemplate } from "./types";

/**
 * Zurich — Charcoal header, photo right
 * Generated from apps/web/components/templates/zurich.tsx (HeaderLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const ZurichTemplate: NativeTemplate = {
  id: "zurich",
  name: { en: "Zurich", sw: "Zurich" },
  blurb: { en: "Charcoal header, photo right", sw: "Kichwa cha mkaa, picha kulia" },
  tier: "free",
  previewColor: "#1E293B",
  style: "header",
  layout: "HeaderLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "default",
    "skillDisplay": "chip",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "headerBg": "#1E293B",
    "headerTextColor": "#F8FAFC",
    "headerSubColor": "@accent",
    "headerContactColor": "#94A3B8",
    "bodyBg": "#FFFFFF",
    "headerPaddingV": 24,
    "mainSectionStyle": "line-accent",
    "photoSize": 76,
    "photoOnLeft": false,
    "skillDisplay": "chip",
    "showTimeline": false,
    "hobbiesDisplay": "chips",
    "experienceVariant": "default"
  },
};
