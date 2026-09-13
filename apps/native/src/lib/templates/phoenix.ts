import type { NativeTemplate } from "./types";

/**
 * Phoenix — Slate, box sections, skill aside
 * Generated from apps/web/components/templates/phoenix.tsx (HeaderLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const PhoenixTemplate: NativeTemplate = {
  id: "phoenix",
  name: { en: "Phoenix", sw: "Phoenix" },
  // TODO(copy): sw blurb — mirrored from the web description for now.
  blurb: { en: "Slate, box sections, skill aside", sw: "Slate, box sections, skill aside" },
  tier: "free",
  previewColor: "#0F172A",
  style: "header",
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
    "headerBg": "#0F172A",
    "headerTextColor": "#F8FAFC",
    "headerSubColor": "@accent",
    "headerContactColor": "#94A3B8",
    "bodyBg": "#FFFFFF",
    "headerPaddingV": 24,
    "asideWidth": 200,
    "asideSections": [
      "skills",
      "languages",
      "certifications"
    ],
    "asideSectionStyle": "tag",
    "mainSectionStyle": "box",
    "photoSize": 74,
    "photoOnLeft": true,
    "skillDisplay": "dot",
    "showTimeline": false,
    "hobbiesDisplay": "chips",
    "experienceVariant": "default"
  },
};
