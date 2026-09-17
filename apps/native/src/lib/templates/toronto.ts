import type { NativeTemplate } from "./types";

/**
 * Toronto — Deep navy, red-pink accent
 * Generated from apps/web/components/templates/toronto.tsx (HeaderLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const TorontoTemplate: NativeTemplate = {
  id: "toronto",
  name: { en: "Toronto", sw: "Toronto" },
  blurb: { en: "Deep navy, red-pink accent", sw: "Bluu nyeusi, msisitizo wa nyekundu-waridi" },
  tier: "free",
  previewColor: "#DC2626",
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
    "headerBg": "#1A1A2E",
    "headerTextColor": "#F8FAFC",
    "headerSubColor": "#FCA5A5",
    "headerContactColor": "#94A3B8",
    "bodyBg": "#FFFFFF",
    "headerPaddingV": 24,
    "mainSectionStyle": "underline",
    "photoSize": 78,
    "photoOnLeft": true,
    "skillDisplay": "bar",
    "showTimeline": false,
    "hobbiesDisplay": "chips",
    "experienceVariant": "default"
  },
};
