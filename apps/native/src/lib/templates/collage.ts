import type { NativeTemplate } from "./types";

/**
 * Collage — Amber banner, full aside, dot sections
 * Generated from apps/web/components/templates/collage.tsx (HeaderLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const CollageTemplate: NativeTemplate = {
  id: "collage",
  name: { en: "Collage", sw: "Collage" },
  blurb: { en: "Amber banner, full aside, dot sections", sw: "Bango la njano, pembeni kamili, sehemu za vitone" },
  tier: "free",
  previewColor: "#F59E0B",
  style: "creative",
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
    "headerBg": "@accent",
    "headerTextColor": "#FFFFFF",
    "headerSubColor": "rgba(255,255,255,0.8)",
    "headerContactColor": "rgba(255,255,255,0.75)",
    "bodyBg": "#FFFFFF",
    "headerPaddingV": 26,
    "asideWidth": 205,
    "asideSections": [
      "skills",
      "languages",
      "certifications",
      "hobbies"
    ],
    "asideSectionStyle": "box",
    "mainSectionStyle": "dots",
    "photoSize": 84,
    "photoOnLeft": true,
    "skillDisplay": "dot",
    "showTimeline": false,
    "hobbiesDisplay": "chips",
    "experienceVariant": "default"
  },
};
