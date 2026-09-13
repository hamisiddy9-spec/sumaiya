import type { NativeTemplate } from "./types";

/**
 * Geneva — Slate header, centered contact row
 * Generated from apps/web/components/templates/geneva.tsx (HeaderLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const GenevaTemplate: NativeTemplate = {
  id: "geneva",
  name: { en: "Geneva", sw: "Geneva" },
  // TODO(copy): sw blurb — mirrored from the web description for now.
  blurb: { en: "Slate header, centered contact row", sw: "Slate header, centered contact row" },
  tier: "free",
  previewColor: "#0F172A",
  style: "header",
  layout: "HeaderLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "default",
    "skillDisplay": "bar",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "headerBg": "#0F172A",
    "headerTextColor": "#F8FAFC",
    "headerSubColor": "@accent",
    "headerContactColor": "#94A3B8",
    "bodyBg": "#FFFFFF",
    "headerPaddingV": 24,
    "mainSectionStyle": "underline",
    "photoSize": 72,
    "photoOnLeft": true,
    "skillDisplay": "bar",
    "showTimeline": false,
    "hobbiesDisplay": "chips",
    "experienceVariant": "default"
  },
};
