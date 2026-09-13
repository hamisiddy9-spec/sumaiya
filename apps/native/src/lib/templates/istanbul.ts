import type { NativeTemplate } from "./types";

/**
 * Istanbul — Deep navy, pink, card experience
 * Generated from apps/web/components/templates/istanbul.tsx (HeaderLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const IstanbulTemplate: NativeTemplate = {
  id: "istanbul",
  name: { en: "Istanbul", sw: "Istanbul" },
  // TODO(copy): sw blurb — mirrored from the web description for now.
  blurb: { en: "Deep navy, pink, card experience", sw: "Deep navy, pink, card experience" },
  tier: "free",
  previewColor: "#DB2777",
  style: "header",
  layout: "HeaderLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "card",
    "skillDisplay": "dot",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "headerBg": "#1A1A2E",
    "headerTextColor": "#F8FAFC",
    "headerSubColor": "#F9A8D4",
    "headerContactColor": "#94A3B8",
    "bodyBg": "#FFFFFF",
    "headerPaddingV": 24,
    "mainSectionStyle": "box",
    "photoSize": 74,
    "photoOnLeft": true,
    "skillDisplay": "dot",
    "showTimeline": false,
    "hobbiesDisplay": "chips",
    "experienceVariant": "card"
  },
};
