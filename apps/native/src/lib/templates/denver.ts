import type { NativeTemplate } from "./types";

/**
 * Denver — Charcoal, narrow aside, card body
 * Generated from apps/web/components/templates/denver.tsx (HeaderLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const DenverTemplate: NativeTemplate = {
  id: "denver",
  name: { en: "Denver", sw: "Denver" },
  // TODO(copy): sw blurb — mirrored from the web description for now.
  blurb: { en: "Charcoal, narrow aside, card body", sw: "Charcoal, narrow aside, card body" },
  tier: "free",
  previewColor: "#1E293B",
  style: "header",
  layout: "HeaderLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "card",
    "skillDisplay": "chip",
    "showTimeline": true,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "headerBg": "#1E293B",
    "headerTextColor": "#F8FAFC",
    "headerSubColor": "@accent",
    "headerContactColor": "#94A3B8",
    "bodyBg": "#FFFFFF",
    "headerPaddingV": 24,
    "asideWidth": 185,
    "asideSections": [
      "skills",
      "languages"
    ],
    "asideSectionStyle": "tag",
    "mainSectionStyle": "underline",
    "photoSize": 76,
    "photoOnLeft": true,
    "skillDisplay": "chip",
    "showTimeline": true,
    "hobbiesDisplay": "chips",
    "experienceVariant": "card"
  },
};
