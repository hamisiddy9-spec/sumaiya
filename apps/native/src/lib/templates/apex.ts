import type { NativeTemplate } from "./types";

/**
 * Apex — Bold header, timeline body
 * Generated from apps/web/components/templates/apex.tsx (HeaderLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const ApexTemplate: NativeTemplate = {
  id: "apex",
  name: { en: "Apex", sw: "Apex" },
  blurb: { en: "Bold header, timeline body", sw: "Kichwa kinene, maudhui ya timeline" },
  tier: "free",
  previewColor: "#1E293B",
  style: "header",
  layout: "HeaderLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "card",
    "skillDisplay": "bar",
    "showTimeline": true,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {
    "font": {
      "name": 22
    }
  },
  config: {
    "headerBg": "#1E293B",
    "headerTextColor": "#F8FAFC",
    "headerSubColor": "@accent",
    "headerContactColor": "#94A3B8",
    "bodyBg": "#FFFFFF",
    "headerPaddingV": 26,
    "asideWidth": 195,
    "asideSections": [
      "skills",
      "languages",
      "certifications"
    ],
    "mainSectionStyle": "line-accent",
    "asideSectionStyle": "tag",
    "photoSize": 76,
    "photoOnLeft": true,
    "skillDisplay": "bar",
    "showTimeline": true,
    "hobbiesDisplay": "chips",
    "experienceVariant": "card"
  },
};
