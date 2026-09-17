import type { NativeTemplate } from "./types";

/**
 * Cincinnati — Slate, card timeline, accent lines
 * Generated from apps/web/components/templates/cincinnati.tsx (HeaderLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const CincinnatiTemplate: NativeTemplate = {
  id: "cincinnati",
  name: { en: "Cincinnati", sw: "Cincinnati" },
  blurb: { en: "Slate, card timeline, accent lines", sw: "Kijivu, timeline ya kadi, mistari ya rangi" },
  tier: "free",
  previewColor: "#0F172A",
  style: "header",
  layout: "HeaderLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "card",
    "skillDisplay": "bar",
    "showTimeline": true,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "headerBg": "#0F172A",
    "headerTextColor": "#F8FAFC",
    "headerSubColor": "@accent",
    "headerContactColor": "#94A3B8",
    "bodyBg": "#FFFFFF",
    "headerPaddingV": 24,
    "asideWidth": 190,
    "asideSections": [
      "skills",
      "languages"
    ],
    "asideSectionStyle": "dots",
    "mainSectionStyle": "line-accent",
    "photoSize": 72,
    "photoOnLeft": true,
    "skillDisplay": "bar",
    "showTimeline": true,
    "hobbiesDisplay": "chips",
    "experienceVariant": "card"
  },
};
