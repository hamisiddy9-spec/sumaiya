import type { NativeTemplate } from "./types";

/**
 * Boston — Midnight, purple sub, timeline
 * Generated from apps/web/components/templates/boston.tsx (HeaderLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const BostonTemplate: NativeTemplate = {
  id: "boston",
  name: { en: "Boston", sw: "Boston" },
  blurb: { en: "Midnight, purple sub, timeline", sw: "Usiku wa manane, kichwa kidogo cha zambarau, timeline" },
  tier: "free",
  previewColor: "#7C3AED",
  style: "header",
  layout: "HeaderLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "default",
    "skillDisplay": "bar",
    "showTimeline": true,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "headerBg": "#0D1B2A",
    "headerTextColor": "#F8FAFC",
    "headerSubColor": "#D4B8FF",
    "headerContactColor": "#94A3B8",
    "bodyBg": "#FFFFFF",
    "headerPaddingV": 24,
    "mainSectionStyle": "underline",
    "photoSize": 74,
    "photoOnLeft": true,
    "skillDisplay": "bar",
    "showTimeline": true,
    "hobbiesDisplay": "chips",
    "experienceVariant": "default"
  },
};
