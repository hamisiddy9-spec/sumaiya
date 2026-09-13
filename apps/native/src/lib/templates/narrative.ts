import type { NativeTemplate } from "./types";

/**
 * Narrative — Bold header, editorial story
 * Generated from apps/web/components/templates/narrative.tsx (HeaderLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const NarrativeTemplate: NativeTemplate = {
  id: "narrative",
  name: { en: "Narrative", sw: "Narrative" },
  // TODO(copy): sw blurb — mirrored from the web description for now.
  blurb: { en: "Bold header, editorial story", sw: "Bold header, editorial story" },
  tier: "free",
  previewColor: "#7C3AED",
  style: "creative",
  layout: "HeaderLayout",
  personality: {
    "density": "airy",
    "experienceVariant": "card",
    "skillDisplay": "chip",
    "showTimeline": true,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {
    "font": {
      "name": 26,
      "nameTitle": 13
    },
    "color": {
      "faint": "#F8F4EF",
      "text": "#1A1108",
      "sub": "#3D2E1A",
      "muted": "#7C6848"
    }
  },
  config: {
    "headerBg": "@accent",
    "headerTextColor": "#FFFFFF",
    "headerSubColor": "rgba(255,255,255,0.82)",
    "headerContactColor": "rgba(255,255,255,0.68)",
    "bodyBg": "#FFFBF5",
    "headerPaddingV": 30,
    "mainSectionStyle": "line-accent",
    "photoSize": 88,
    "photoOnLeft": true,
    "skillDisplay": "chip",
    "showTimeline": true,
    "hobbiesDisplay": "chips",
    "experienceVariant": "card"
  },
};
