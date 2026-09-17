import type { NativeTemplate } from "./types";

/**
 * Bloom — Pink, pill labels, card body, two-column
 * Generated from apps/web/components/templates/bloom.tsx (TwoColumnLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const BloomTemplate: NativeTemplate = {
  id: "bloom",
  name: { en: "Bloom", sw: "Bloom" },
  blurb: { en: "Pink, pill labels, card body, two-column", sw: "Waridi, lebo za mviringo, maudhui ya kadi, safu mbili" },
  tier: "free",
  previewColor: "#DB2777",
  style: "creative",
  layout: "TwoColumnLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "card",
    "skillDisplay": "chip",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "headerBg": "#BE185D",
    "headerTextColor": "#FFFFFF",
    "headerSubColor": "#FBCFE8",
    "headerContactColor": "rgba(255,255,255,0.75)",
    "leftBg": "#FFF0F6",
    "rightBg": "#FFFFFF",
    "leftWidth": 205,
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
    "rightSectionStyle": "line-accent",
    "dividerColor": "#FBCFE8",
    "photoSize": 72,
    "photoOnLeft": true,
    "skillDisplay": "chip",
    "hobbiesDisplay": "chips",
    "experienceVariant": "card",
    "showTimeline": false
  },
};
