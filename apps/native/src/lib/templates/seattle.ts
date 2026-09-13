import type { NativeTemplate } from "./types";

/**
 * Seattle — Dark header, skill aside, timeline
 * Generated from apps/web/components/templates/seattle.tsx (HeaderLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const SeattleTemplate: NativeTemplate = {
  id: "seattle",
  name: { en: "Seattle", sw: "Seattle" },
  // TODO(copy): sw blurb — mirrored from the web description for now.
  blurb: { en: "Dark header, skill aside, timeline", sw: "Dark header, skill aside, timeline" },
  tier: "free",
  previewColor: "#0F172A",
  style: "header",
  layout: "HeaderLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "default",
    "skillDisplay": "bar",
    "showTimeline": true,
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
    "asideWidth": 195,
    "asideSections": [
      "skills",
      "languages",
      "certifications"
    ],
    "asideSectionStyle": "tag",
    "mainSectionStyle": "underline",
    "photoSize": 72,
    "photoOnLeft": true,
    "skillDisplay": "bar",
    "showTimeline": true,
    "hobbiesDisplay": "chips",
    "experienceVariant": "default"
  },
};
