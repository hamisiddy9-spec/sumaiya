import type { NativeTemplate } from "./types";

/**
 * Veldt — Forest banner, tag labels
 * Generated from apps/web/components/templates/veldt.tsx (HeaderLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const VeldtTemplate: NativeTemplate = {
  id: "veldt",
  name: { en: "Veldt", sw: "Veldt" },
  blurb: { en: "Forest banner, tag labels", sw: "Bango la kijani cha msitu, lebo za tagi" },
  tier: "free",
  previewColor: "#166534",
  style: "creative",
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
    "headerBg": "@accent",
    "headerTextColor": "#FFFFFF",
    "headerSubColor": "rgba(255,255,255,0.8)",
    "headerContactColor": "rgba(255,255,255,0.75)",
    "bodyBg": "#FFFFFF",
    "headerPaddingV": 26,
    "mainSectionStyle": "tag",
    "photoSize": 74,
    "photoOnLeft": true,
    "skillDisplay": "bar",
    "showTimeline": false,
    "hobbiesDisplay": "chips",
    "experienceVariant": "default"
  },
};
