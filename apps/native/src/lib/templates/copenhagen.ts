import type { NativeTemplate } from "./types";

/**
 * Copenhagen — Slate header, pink sub, photo right
 * Generated from apps/web/components/templates/copenhagen.tsx (HeaderLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const CopenhagenTemplate: NativeTemplate = {
  id: "copenhagen",
  name: { en: "Copenhagen", sw: "Copenhagen" },
  // TODO(copy): sw blurb — mirrored from the web description for now.
  blurb: { en: "Slate header, pink sub, photo right", sw: "Slate header, pink sub, photo right" },
  tier: "free",
  previewColor: "#BE185D",
  style: "header",
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
    "headerBg": "#0F172A",
    "headerTextColor": "#F8FAFC",
    "headerSubColor": "#F472B6",
    "headerContactColor": "#94A3B8",
    "bodyBg": "#FFFFFF",
    "headerPaddingV": 24,
    "mainSectionStyle": "line-accent",
    "photoSize": 72,
    "photoOnLeft": false,
    "skillDisplay": "chip",
    "showTimeline": false,
    "hobbiesDisplay": "chips",
    "experienceVariant": "default"
  },
};
