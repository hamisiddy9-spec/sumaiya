import type { NativeTemplate } from "./types";

/**
 * Parallax — Red banner, aside, card experience
 * Generated from apps/web/components/templates/parallax.tsx (HeaderLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const ParallaxTemplate: NativeTemplate = {
  id: "parallax",
  name: { en: "Parallax", sw: "Parallax" },
  blurb: { en: "Red banner, aside, card experience", sw: "Bango la nyekundu, pembeni, uzoefu wa kadi" },
  tier: "free",
  previewColor: "#DC2626",
  style: "creative",
  layout: "HeaderLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "card",
    "skillDisplay": "bar",
    "showTimeline": true,
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
    "asideWidth": 190,
    "asideSections": [
      "skills",
      "languages"
    ],
    "asideSectionStyle": "tag",
    "mainSectionStyle": "line-accent",
    "photoSize": 76,
    "photoOnLeft": false,
    "skillDisplay": "bar",
    "showTimeline": true,
    "hobbiesDisplay": "chips",
    "experienceVariant": "card"
  },
};
