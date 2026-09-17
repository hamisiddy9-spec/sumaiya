import type { NativeTemplate } from "./types";

/**
 * Dallas — Dark, dot sections, skill aside
 * Generated from apps/web/components/templates/dallas.tsx (HeaderLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const DallasTemplate: NativeTemplate = {
  id: "dallas",
  name: { en: "Dallas", sw: "Dallas" },
  blurb: { en: "Dark, dot sections, skill aside", sw: "Nyeusi, sehemu za vitone, pembeni ya ujuzi" },
  tier: "free",
  previewColor: "#111827",
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
    "headerBg": "#111827",
    "headerTextColor": "#F8FAFC",
    "headerSubColor": "@accent",
    "headerContactColor": "#94A3B8",
    "bodyBg": "#FFFFFF",
    "headerPaddingV": 24,
    "asideWidth": 195,
    "asideSections": [
      "skills",
      "certifications"
    ],
    "asideSectionStyle": "dots",
    "mainSectionStyle": "dots",
    "photoSize": 70,
    "photoOnLeft": true,
    "skillDisplay": "bar",
    "showTimeline": false,
    "hobbiesDisplay": "chips",
    "experienceVariant": "default"
  },
};
