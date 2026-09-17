import type { NativeTemplate } from "./types";

/**
 * Aurora Two — Violet header, pill labels, airy body
 * Generated from apps/web/components/templates/aurora-two.tsx (TwoColumnLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const AuroraTwoTemplate: NativeTemplate = {
  id: "aurora-two",
  name: { en: "Aurora Two", sw: "Aurora Two" },
  blurb: { en: "Violet header, pill labels, airy body", sw: "Kichwa cha zambarau, lebo za mviringo, maudhui yenye nafasi" },
  tier: "free",
  previewColor: "#6D28D9",
  style: "creative",
  layout: "TwoColumnLayout",
  personality: {
    "density": "airy",
    "experienceVariant": "default",
    "skillDisplay": "chip",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "headerBg": "#6D28D9",
    "headerTextColor": "#FFFFFF",
    "headerSubColor": "rgba(255,255,255,0.8)",
    "headerContactColor": "rgba(255,255,255,0.65)",
    "leftBg": "#F5F3FF",
    "rightBg": "#FFFFFF",
    "leftWidth": 210,
    "leftSections": [
      "skills",
      "certifications",
      "hobbies"
    ],
    "rightSections": [
      "summary",
      "experience",
      "education",
      "languages"
    ],
    "leftSectionStyle": "pill",
    "rightSectionStyle": "underline",
    "dividerColor": "#DDD6FE",
    "photoSize": 72,
    "photoOnLeft": true,
    "skillDisplay": "chip",
    "hobbiesDisplay": "chips",
    "experienceVariant": "default",
    "showTimeline": false
  },
};
