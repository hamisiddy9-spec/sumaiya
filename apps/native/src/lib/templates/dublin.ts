import type { NativeTemplate } from "./types";

/**
 * Dublin — Dark, emerald accent, clean body
 * Generated from apps/web/components/templates/dublin.tsx (HeaderLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const DublinTemplate: NativeTemplate = {
  id: "dublin",
  name: { en: "Dublin", sw: "Dublin" },
  blurb: { en: "Dark, emerald accent, clean body", sw: "Nyeusi, msisitizo wa kijani cha zumaridi, maudhui safi" },
  tier: "free",
  previewColor: "#059669",
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
    "headerSubColor": "#34D399",
    "headerContactColor": "#94A3B8",
    "bodyBg": "#FFFFFF",
    "headerPaddingV": 24,
    "mainSectionStyle": "underline",
    "photoSize": 70,
    "photoOnLeft": true,
    "skillDisplay": "bar",
    "showTimeline": false,
    "hobbiesDisplay": "chips",
    "experienceVariant": "default"
  },
};
