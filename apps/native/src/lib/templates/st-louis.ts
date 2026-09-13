import type { NativeTemplate } from "./types";

/**
 * St Louis — Midnight, wide aside, full sections
 * Generated from apps/web/components/templates/st-louis.tsx (HeaderLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const StLouisTemplate: NativeTemplate = {
  id: "st-louis",
  name: { en: "St Louis", sw: "St Louis" },
  // TODO(copy): sw blurb — mirrored from the web description for now.
  blurb: { en: "Midnight, wide aside, full sections", sw: "Midnight, wide aside, full sections" },
  tier: "free",
  previewColor: "#0D1B2A",
  style: "header",
  layout: "HeaderLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "default",
    "skillDisplay": "bar",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "headerBg": "#0D1B2A",
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
    "asideSectionStyle": "box",
    "mainSectionStyle": "underline",
    "photoSize": 78,
    "photoOnLeft": true,
    "skillDisplay": "bar",
    "showTimeline": false,
    "hobbiesDisplay": "chips",
    "experienceVariant": "default"
  },
};
