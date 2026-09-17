import type { NativeTemplate } from "./types";

/**
 * Jade — Forest green, pill skills, accent lines
 * Generated from apps/web/components/templates/jade.tsx (TwoColumnLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const JadeTemplate: NativeTemplate = {
  id: "jade",
  name: { en: "Jade", sw: "Jade" },
  blurb: { en: "Forest green, pill skills, accent lines", sw: "Kijani cha msitu, ujuzi katika vidonge, mistari ya rangi" },
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
    "headerBg": "#065F46",
    "headerTextColor": "#FFFFFF",
    "headerSubColor": "#6EE7B7",
    "headerContactColor": "rgba(255,255,255,0.75)",
    "leftBg": "#ECFDF5",
    "rightBg": "#FFFFFF",
    "leftWidth": 210,
    "leftSections": [
      "skills",
      "languages",
      "hobbies"
    ],
    "rightSections": [
      "summary",
      "experience",
      "education",
      "certifications"
    ],
    "leftSectionStyle": "pill",
    "rightSectionStyle": "line-accent",
    "dividerColor": "#A7F3D0",
    "photoSize": 76,
    "photoOnLeft": true,
    "skillDisplay": "chip",
    "hobbiesDisplay": "chips",
    "experienceVariant": "default",
    "showTimeline": false
  },
};
