import type { NativeTemplate } from "./types";

/**
 * Miami — Deep navy, timeline, hobbies in aside
 * Generated from apps/web/components/templates/miami-cv.tsx (HeaderLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const MiamiCvTemplate: NativeTemplate = {
  id: "miami-cv",
  name: { en: "Miami", sw: "Miami" },
  blurb: { en: "Deep navy, timeline, hobbies in aside", sw: "Bluu nyeusi, timeline, burudani pembeni" },
  tier: "free",
  previewColor: "#1A1A2E",
  style: "header",
  layout: "HeaderLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "default",
    "skillDisplay": "bar",
    "showTimeline": true,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "headerBg": "#1A1A2E",
    "headerTextColor": "#F8FAFC",
    "headerSubColor": "@accent",
    "headerContactColor": "#94A3B8",
    "bodyBg": "#FFFFFF",
    "headerPaddingV": 24,
    "asideWidth": 195,
    "asideSections": [
      "skills",
      "certifications",
      "hobbies"
    ],
    "asideSectionStyle": "dots",
    "mainSectionStyle": "underline",
    "photoSize": 72,
    "photoOnLeft": true,
    "skillDisplay": "bar",
    "showTimeline": true,
    "hobbiesDisplay": "chips",
    "experienceVariant": "default"
  },
};
