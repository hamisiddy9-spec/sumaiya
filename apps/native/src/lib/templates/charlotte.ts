import type { NativeTemplate } from "./types";

/**
 * Charlotte — Slate, card blocks, aside with hobbies
 * Generated from apps/web/components/templates/charlotte.tsx (HeaderLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const CharlotteTemplate: NativeTemplate = {
  id: "charlotte",
  name: { en: "Charlotte", sw: "Charlotte" },
  blurb: { en: "Slate, card blocks, aside with hobbies", sw: "Kijivu, vibao vya kadi, pembeni yenye burudani" },
  tier: "free",
  previewColor: "#0F172A",
  style: "header",
  layout: "HeaderLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "card",
    "skillDisplay": "chip",
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
    "asideWidth": 195,
    "asideSections": [
      "skills",
      "certifications",
      "hobbies"
    ],
    "asideSectionStyle": "tag",
    "mainSectionStyle": "box",
    "photoSize": 74,
    "photoOnLeft": true,
    "skillDisplay": "chip",
    "showTimeline": false,
    "hobbiesDisplay": "chips",
    "experienceVariant": "card"
  },
};
