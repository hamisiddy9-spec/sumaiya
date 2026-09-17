import type { NativeTemplate } from "./types";

/**
 * Austin — Dark, full aside, card blocks
 * Generated from apps/web/components/templates/austin.tsx (HeaderLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const AustinTemplate: NativeTemplate = {
  id: "austin",
  name: { en: "Austin", sw: "Austin" },
  blurb: { en: "Dark, full aside, card blocks", sw: "Nyeusi, pembeni kamili, vibao vya kadi" },
  tier: "free",
  previewColor: "#111827",
  style: "header",
  layout: "HeaderLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "card",
    "skillDisplay": "chip",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "headerBg": "#111827",
    "headerTextColor": "#F8FAFC",
    "headerSubColor": "@accent",
    "headerContactColor": "#94A3B8",
    "bodyBg": "#FFFFFF",
    "headerPaddingV": 24,
    "asideWidth": 200,
    "asideSections": [
      "skills",
      "languages",
      "certifications",
      "hobbies"
    ],
    "asideSectionStyle": "tag",
    "mainSectionStyle": "dots",
    "photoSize": 80,
    "photoOnLeft": true,
    "skillDisplay": "chip",
    "showTimeline": false,
    "hobbiesDisplay": "chips",
    "experienceVariant": "card"
  },
};
