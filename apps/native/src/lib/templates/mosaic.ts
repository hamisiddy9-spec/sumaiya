import type { NativeTemplate } from "./types";

/**
 * Mosaic — Teal banner, skill aside, chip tags
 * Generated from apps/web/components/templates/mosaic.tsx (HeaderLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const MosaicTemplate: NativeTemplate = {
  id: "mosaic",
  name: { en: "Mosaic", sw: "Mosaic" },
  blurb: { en: "Teal banner, skill aside, chip tags", sw: "Bango la kijani cha bahari, pembeni ya ujuzi, lebo za vibao" },
  tier: "free",
  previewColor: "#0891B2",
  style: "creative",
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
    "headerBg": "@accent",
    "headerTextColor": "#FFFFFF",
    "headerSubColor": "rgba(255,255,255,0.8)",
    "headerContactColor": "rgba(255,255,255,0.75)",
    "bodyBg": "#FFFFFF",
    "headerPaddingV": 26,
    "asideWidth": 195,
    "asideSections": [
      "skills",
      "languages",
      "certifications"
    ],
    "asideSectionStyle": "dots",
    "mainSectionStyle": "tag",
    "photoSize": 80,
    "photoOnLeft": true,
    "skillDisplay": "chip",
    "showTimeline": false,
    "hobbiesDisplay": "chips",
    "experienceVariant": "default"
  },
};
