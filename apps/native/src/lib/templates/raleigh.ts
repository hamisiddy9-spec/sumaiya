import type { NativeTemplate } from "./types";

/**
 * Raleigh — Midnight, compact, narrow aside
 * Generated from apps/web/components/templates/raleigh.tsx (HeaderLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const RaleighTemplate: NativeTemplate = {
  id: "raleigh",
  name: { en: "Raleigh", sw: "Raleigh" },
  // TODO(copy): sw blurb — mirrored from the web description for now.
  blurb: { en: "Midnight, compact, narrow aside", sw: "Midnight, compact, narrow aside" },
  tier: "free",
  previewColor: "#0D1B2A",
  style: "header",
  layout: "HeaderLayout",
  personality: {
    "density": "compact",
    "experienceVariant": "compact",
    "skillDisplay": "chip",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "headerBg": "#0D1B2A",
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
    "mainSectionStyle": "line-accent",
    "photoSize": 78,
    "photoOnLeft": true,
    "skillDisplay": "chip",
    "showTimeline": false,
    "hobbiesDisplay": "chips",
    "experienceVariant": "compact"
  },
};
