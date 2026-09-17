import type { NativeTemplate } from "./types";

/**
 * Louisville — Charcoal, clean underline sections
 * Generated from apps/web/components/templates/louisville.tsx (HeaderLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const LouisvilleTemplate: NativeTemplate = {
  id: "louisville",
  name: { en: "Louisville", sw: "Louisville" },
  blurb: { en: "Charcoal, clean underline sections", sw: "Mkaa, sehemu safi zenye mstari chini" },
  tier: "free",
  previewColor: "#1E293B",
  style: "header",
  layout: "HeaderLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "default",
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
    "bodyBg": "#FFFFFF",
    "headerPaddingV": 24,
    "asideWidth": 195,
    "asideSections": [
      "skills",
      "certifications"
    ],
    "asideSectionStyle": "tag",
    "mainSectionStyle": "underline",
    "photoSize": 76,
    "photoOnLeft": true,
    "skillDisplay": "dot",
    "showTimeline": false,
    "hobbiesDisplay": "chips",
    "experienceVariant": "default"
  },
};
