import type { NativeTemplate } from "./types";

/**
 * Minneapolis — Midnight, accent lines, aside skills
 * Generated from apps/web/components/templates/minneapolis.tsx (HeaderLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const MinneapolisTemplate: NativeTemplate = {
  id: "minneapolis",
  name: { en: "Minneapolis", sw: "Minneapolis" },
  blurb: { en: "Midnight, accent lines, aside skills", sw: "Usiku wa manane, mistari ya msisitizo, ujuzi pembeni" },
  tier: "free",
  previewColor: "#0D1B2A",
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
    "headerBg": "#0D1B2A",
    "headerTextColor": "#F8FAFC",
    "headerSubColor": "@accent",
    "headerContactColor": "#94A3B8",
    "bodyBg": "#FFFFFF",
    "headerPaddingV": 24,
    "asideWidth": 200,
    "asideSections": [
      "skills",
      "languages",
      "certifications"
    ],
    "asideSectionStyle": "tag",
    "mainSectionStyle": "line-accent",
    "photoSize": 78,
    "photoOnLeft": true,
    "skillDisplay": "dot",
    "showTimeline": false,
    "hobbiesDisplay": "chips",
    "experienceVariant": "default"
  },
};
