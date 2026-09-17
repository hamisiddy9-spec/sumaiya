import type { NativeTemplate } from "./types";

/**
 * Dusk — Dark left column, accent-line right body
 * Generated from apps/web/components/templates/dusk.tsx (TwoColumnLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const DuskTemplate: NativeTemplate = {
  id: "dusk",
  name: { en: "Dusk", sw: "Dusk" },
  blurb: { en: "Dark left column, accent-line right body", sw: "Safu ya kushoto cheusi, maudhui ya mistari ya msisitizo kulia" },
  tier: "free",
  previewColor: "#1E293B",
  style: "creative",
  layout: "TwoColumnLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "card",
    "skillDisplay": "dot",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "headerBg": "#1E293B",
    "headerTextColor": "#F8FAFC",
    "headerSubColor": "@accent",
    "headerContactColor": "#94A3B8",
    "leftBg": "#1E293B",
    "rightBg": "#FFFFFF",
    "leftWidth": 200,
    "leftSections": [
      "skills",
      "languages"
    ],
    "rightSections": [
      "summary",
      "experience",
      "education",
      "certifications"
    ],
    "leftSectionStyle": "tag",
    "rightSectionStyle": "line-accent",
    "dividerColor": "#334155",
    "photoSize": 76,
    "photoOnLeft": true,
    "skillDisplay": "dot",
    "hobbiesDisplay": "chips",
    "experienceVariant": "card",
    "showTimeline": false
  },
};
