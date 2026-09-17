import type { NativeTemplate } from "./types";

/**
 * Warsaw — Midnight, orange accent, card blocks
 * Generated from apps/web/components/templates/warsaw.tsx (HeaderLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const WarsawTemplate: NativeTemplate = {
  id: "warsaw",
  name: { en: "Warsaw", sw: "Warsaw" },
  blurb: { en: "Midnight, orange accent, card blocks", sw: "Usiku wa manane, msisitizo wa machungwa, vibao vya kadi" },
  tier: "free",
  previewColor: "#EA580C",
  style: "header",
  layout: "HeaderLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "card",
    "skillDisplay": "chip",
    "showTimeline": true,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "headerBg": "#0D1B2A",
    "headerTextColor": "#F8FAFC",
    "headerSubColor": "#FB923C",
    "headerContactColor": "#94A3B8",
    "bodyBg": "#FFFFFF",
    "headerPaddingV": 24,
    "mainSectionStyle": "box",
    "photoSize": 78,
    "photoOnLeft": true,
    "skillDisplay": "chip",
    "showTimeline": true,
    "hobbiesDisplay": "chips",
    "experienceVariant": "card"
  },
};
