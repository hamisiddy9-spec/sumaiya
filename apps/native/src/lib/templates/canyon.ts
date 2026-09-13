import type { NativeTemplate } from "./types";

/**
 * Canyon — Brick banner, compact, aside
 * Generated from apps/web/components/templates/canyon.tsx (HeaderLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const CanyonTemplate: NativeTemplate = {
  id: "canyon",
  name: { en: "Canyon", sw: "Canyon" },
  // TODO(copy): sw blurb — mirrored from the web description for now.
  blurb: { en: "Brick banner, compact, aside", sw: "Brick banner, compact, aside" },
  tier: "free",
  previewColor: "#7C2D12",
  style: "creative",
  layout: "HeaderLayout",
  personality: {
    "density": "compact",
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
    "asideWidth": 190,
    "asideSections": [
      "skills",
      "languages"
    ],
    "asideSectionStyle": "dots",
    "mainSectionStyle": "dots",
    "photoSize": 76,
    "photoOnLeft": true,
    "skillDisplay": "dot",
    "showTimeline": false,
    "hobbiesDisplay": "chips",
    "experienceVariant": "default"
  },
};
