import type { NativeTemplate } from "./types";

/**
 * Cascade — Dark header, left skill column, right story
 * Generated from apps/web/components/templates/cascade.tsx (TwoColumnLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const CascadeTemplate: NativeTemplate = {
  id: "cascade",
  name: { en: "Cascade", sw: "Cascade" },
  blurb: { en: "Dark header, left skill column, right story", sw: "Kichwa cheusi, safu ya ujuzi kushoto, hadithi kulia" },
  tier: "free",
  previewColor: "#0F172A",
  style: "creative",
  layout: "TwoColumnLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "default",
    "skillDisplay": "bar",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "headerBg": "#0F172A",
    "headerTextColor": "#F8FAFC",
    "headerSubColor": "@accent",
    "headerContactColor": "#94A3B8",
    "leftBg": "#F8FAFC",
    "rightBg": "#FFFFFF",
    "leftWidth": 220,
    "leftSections": [
      "skills",
      "languages",
      "certifications"
    ],
    "rightSections": [
      "summary",
      "experience",
      "education",
      "hobbies"
    ],
    "leftSectionStyle": "tag",
    "rightSectionStyle": "underline",
    "dividerColor": "#E2E8F0",
    "photoSize": 72,
    "photoOnLeft": true,
    "skillDisplay": "bar",
    "hobbiesDisplay": "chips",
    "experienceVariant": "default",
    "showTimeline": false
  },
};
