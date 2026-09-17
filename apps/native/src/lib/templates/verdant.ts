import type { NativeTemplate } from "./types";

/**
 * Verdant — Green header, pill labels, two-column
 * Generated from apps/web/components/templates/verdant.tsx (TwoColumnLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const VerdantTemplate: NativeTemplate = {
  id: "verdant",
  name: { en: "Verdant", sw: "Verdant" },
  blurb: { en: "Green header, pill labels, two-column", sw: "Kichwa cha kijani, lebo za mviringo, safu mbili" },
  tier: "free",
  previewColor: "#059669",
  style: "creative",
  layout: "TwoColumnLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "default",
    "skillDisplay": "chip",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "headerBg": "#059669",
    "headerTextColor": "#FFFFFF",
    "headerSubColor": "#ECFDF5",
    "headerContactColor": "rgba(255,255,255,0.75)",
    "leftBg": "#F0FDF4",
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
    "rightSectionStyle": "dots",
    "dividerColor": "#D1FAE5",
    "photoSize": 72,
    "photoOnLeft": true,
    "skillDisplay": "chip",
    "hobbiesDisplay": "chips",
    "experienceVariant": "default",
    "showTimeline": false
  },
};
