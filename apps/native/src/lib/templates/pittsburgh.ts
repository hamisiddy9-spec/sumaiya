import type { NativeTemplate } from "./types";

/**
 * Pittsburgh — Deep navy, wide aside, box layout
 * Generated from apps/web/components/templates/pittsburgh.tsx (HeaderLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const PittsburghTemplate: NativeTemplate = {
  id: "pittsburgh",
  name: { en: "Pittsburgh", sw: "Pittsburgh" },
  // TODO(copy): sw blurb — mirrored from the web description for now.
  blurb: { en: "Deep navy, wide aside, box layout", sw: "Deep navy, wide aside, box layout" },
  tier: "free",
  previewColor: "#1A1A2E",
  style: "header",
  layout: "HeaderLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "default",
    "skillDisplay": "chip",
    "showTimeline": false,
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
    "asideWidth": 205,
    "asideSections": [
      "skills",
      "languages",
      "certifications",
      "hobbies"
    ],
    "asideSectionStyle": "tag",
    "mainSectionStyle": "box",
    "photoSize": 74,
    "photoOnLeft": true,
    "skillDisplay": "chip",
    "showTimeline": false,
    "hobbiesDisplay": "chips",
    "experienceVariant": "default"
  },
};
