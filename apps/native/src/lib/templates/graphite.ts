import type { NativeTemplate } from "./types";

/**
 * Graphite — Near-black, ruled labels, grid skills, compact
 * Generated from apps/web/components/templates/graphite.tsx (TwoColumnLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const GraphiteTemplate: NativeTemplate = {
  id: "graphite",
  name: { en: "Graphite", sw: "Graphite" },
  blurb: { en: "Near-black, ruled labels, grid skills, compact", sw: "Karibu nyeusi, lebo zenye mistari, ujuzi kwa gridi, fupi" },
  tier: "free",
  previewColor: "#404040",
  style: "creative",
  layout: "TwoColumnLayout",
  personality: {
    "density": "compact",
    "experienceVariant": "compact",
    "skillDisplay": "grid",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "headerBg": "#1C1C1C",
    "headerTextColor": "#F9FAFB",
    "headerSubColor": "#A3A3A3",
    "headerContactColor": "#737373",
    "leftBg": "#F5F5F5",
    "rightBg": "#FFFFFF",
    "leftWidth": 200,
    "leftSections": [
      "skills",
      "certifications"
    ],
    "rightSections": [
      "summary",
      "experience",
      "education",
      "languages",
      "hobbies"
    ],
    "leftSectionStyle": "ruled",
    "rightSectionStyle": "underline",
    "dividerColor": "#D4D4D4",
    "photoSize": 70,
    "photoOnLeft": true,
    "skillDisplay": "grid",
    "hobbiesDisplay": "chips",
    "experienceVariant": "compact",
    "showTimeline": false
  },
};
