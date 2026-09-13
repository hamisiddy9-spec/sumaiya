import type { NativeTemplate } from "./types";

/**
 * Prism — Violet banner, card timeline, no aside
 * Generated from apps/web/components/templates/prism.tsx (HeaderLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const PrismTemplate: NativeTemplate = {
  id: "prism",
  name: { en: "Prism", sw: "Prism" },
  // TODO(copy): sw blurb — mirrored from the web description for now.
  blurb: { en: "Violet banner, card timeline, no aside", sw: "Violet banner, card timeline, no aside" },
  tier: "free",
  previewColor: "#8B5CF6",
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
    "mainSectionStyle": "box",
    "photoSize": 78,
    "photoOnLeft": true,
    "skillDisplay": "bar",
    "showTimeline": true,
    "hobbiesDisplay": "chips",
    "experienceVariant": "card"
  },
};
