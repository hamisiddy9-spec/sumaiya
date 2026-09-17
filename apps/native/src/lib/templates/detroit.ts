import type { NativeTemplate } from "./types";

/**
 * Detroit — Charcoal, card layout, dot sections
 * Generated from apps/web/components/templates/detroit.tsx (HeaderLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const DetroitTemplate: NativeTemplate = {
  id: "detroit",
  name: { en: "Detroit", sw: "Detroit" },
  blurb: { en: "Charcoal, card layout, dot sections", sw: "Mkaa, mpangilio wa kadi, sehemu za vitone" },
  tier: "free",
  previewColor: "#1E293B",
  style: "header",
  layout: "HeaderLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "card",
    "skillDisplay": "bar",
    "showTimeline": false,
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
    "asideWidth": 190,
    "asideSections": [
      "skills",
      "languages"
    ],
    "asideSectionStyle": "dots",
    "mainSectionStyle": "dots",
    "photoSize": 76,
    "photoOnLeft": true,
    "skillDisplay": "bar",
    "showTimeline": false,
    "hobbiesDisplay": "chips",
    "experienceVariant": "card"
  },
};
