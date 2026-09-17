import type { NativeTemplate } from "./types";

/**
 * Singapore — Charcoal, mint, chip skills
 * Generated from apps/web/components/templates/singapore-cv.tsx (HeaderLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const SingaporeCvTemplate: NativeTemplate = {
  id: "singapore-cv",
  name: { en: "Singapore", sw: "Singapore" },
  blurb: { en: "Charcoal, mint, chip skills", sw: "Mkaa, kijani hafifu, ujuzi kwa vibao" },
  tier: "free",
  previewColor: "#059669",
  style: "header",
  layout: "HeaderLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "default",
    "skillDisplay": "chip",
    "showTimeline": true,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "headerBg": "#1E293B",
    "headerTextColor": "#F8FAFC",
    "headerSubColor": "#6EE7B7",
    "headerContactColor": "#94A3B8",
    "bodyBg": "#FFFFFF",
    "headerPaddingV": 24,
    "mainSectionStyle": "underline",
    "photoSize": 72,
    "photoOnLeft": true,
    "skillDisplay": "chip",
    "showTimeline": true,
    "hobbiesDisplay": "chips",
    "experienceVariant": "default"
  },
};
