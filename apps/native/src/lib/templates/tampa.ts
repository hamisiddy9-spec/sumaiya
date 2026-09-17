import type { NativeTemplate } from "./types";

/**
 * Tampa — Dark, narrow aside, accent lines
 * Generated from apps/web/components/templates/tampa.tsx (HeaderLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const TampaTemplate: NativeTemplate = {
  id: "tampa",
  name: { en: "Tampa", sw: "Tampa" },
  blurb: { en: "Dark, narrow aside, accent lines", sw: "Nyeusi, pembeni nyembamba, mistari ya rangi" },
  tier: "free",
  previewColor: "#111827",
  style: "header",
  layout: "HeaderLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "default",
    "skillDisplay": "dot",
    "showTimeline": true,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "headerBg": "#111827",
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
    "photoSize": 80,
    "photoOnLeft": true,
    "skillDisplay": "dot",
    "showTimeline": true,
    "hobbiesDisplay": "chips",
    "experienceVariant": "default"
  },
};
