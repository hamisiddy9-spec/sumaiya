import type { NativeTemplate } from "./types";

/**
 * Oslo — Deep navy, violet accent, compact
 * Generated from apps/web/components/templates/oslo.tsx (HeaderLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const OsloTemplate: NativeTemplate = {
  id: "oslo",
  name: { en: "Oslo", sw: "Oslo" },
  blurb: { en: "Deep navy, violet accent, compact", sw: "Bluu nyeusi, msisitizo wa zambarau, fupi" },
  tier: "free",
  previewColor: "#7C3AED",
  style: "header",
  layout: "HeaderLayout",
  personality: {
    "density": "compact",
    "experienceVariant": "compact",
    "skillDisplay": "bar",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "headerBg": "#1A1A2E",
    "headerTextColor": "#F8FAFC",
    "headerSubColor": "#A78BFA",
    "headerContactColor": "#94A3B8",
    "bodyBg": "#FFFFFF",
    "headerPaddingV": 24,
    "mainSectionStyle": "underline",
    "photoSize": 74,
    "photoOnLeft": true,
    "skillDisplay": "bar",
    "showTimeline": false,
    "hobbiesDisplay": "chips",
    "experienceVariant": "compact"
  },
};
