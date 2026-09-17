import type { NativeTemplate } from "./types";

/**
 * Budapest — Slate, amber sub, dot-label sections
 * Generated from apps/web/components/templates/budapest.tsx (HeaderLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const BudapestTemplate: NativeTemplate = {
  id: "budapest",
  name: { en: "Budapest", sw: "Budapest" },
  blurb: { en: "Slate, amber sub, dot-label sections", sw: "Kijivu, kichwa kidogo cha njano, sehemu za lebo zenye nukta" },
  tier: "free",
  previewColor: "#D97706",
  style: "header",
  layout: "HeaderLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "default",
    "skillDisplay": "dot",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "headerBg": "#0F172A",
    "headerTextColor": "#F8FAFC",
    "headerSubColor": "#FCD34D",
    "headerContactColor": "#94A3B8",
    "bodyBg": "#FFFFFF",
    "headerPaddingV": 24,
    "mainSectionStyle": "underline",
    "photoSize": 74,
    "photoOnLeft": true,
    "skillDisplay": "dot",
    "showTimeline": false,
    "hobbiesDisplay": "chips",
    "experienceVariant": "default"
  },
};
