import type { NativeTemplate } from "./types";

/**
 * Houston — Slate, wide aside, box sections
 * Generated from apps/web/components/templates/houston.tsx (HeaderLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const HoustonTemplate: NativeTemplate = {
  id: "houston",
  name: { en: "Houston", sw: "Houston" },
  blurb: { en: "Slate, wide aside, box sections", sw: "Kijivu, pembeni pana, sehemu za masanduku" },
  tier: "free",
  previewColor: "#0F172A",
  style: "header",
  layout: "HeaderLayout",
  personality: {
    "density": "compact",
    "experienceVariant": "compact",
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
    "bodyBg": "#FFFFFF",
    "headerPaddingV": 24,
    "asideWidth": 205,
    "asideSections": [
      "skills",
      "languages",
      "certifications",
      "hobbies"
    ],
    "asideSectionStyle": "dots",
    "mainSectionStyle": "box",
    "photoSize": 72,
    "photoOnLeft": true,
    "skillDisplay": "bar",
    "showTimeline": false,
    "hobbiesDisplay": "chips",
    "experienceVariant": "compact"
  },
};
