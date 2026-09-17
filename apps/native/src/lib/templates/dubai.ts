import type { NativeTemplate } from "./types";

/**
 * Dubai — Slate, gold sub, photo right, airy
 * Generated from apps/web/components/templates/dubai.tsx (HeaderLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const DubaiTemplate: NativeTemplate = {
  id: "dubai",
  name: { en: "Dubai", sw: "Dubai" },
  blurb: { en: "Slate, gold sub, photo right, airy", sw: "Kijivu, kichwa kidogo cha dhahabu, picha kulia, nafasi nyingi" },
  tier: "free",
  previewColor: "#D97706",
  style: "header",
  layout: "HeaderLayout",
  personality: {
    "density": "airy",
    "experienceVariant": "default",
    "skillDisplay": "bar",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "headerBg": "#0F172A",
    "headerTextColor": "#F8FAFC",
    "headerSubColor": "#FDE68A",
    "headerContactColor": "#94A3B8",
    "bodyBg": "#FFFFFF",
    "headerPaddingV": 24,
    "mainSectionStyle": "line-accent",
    "photoSize": 78,
    "photoOnLeft": false,
    "skillDisplay": "bar",
    "showTimeline": false,
    "hobbiesDisplay": "chips",
    "experienceVariant": "default"
  },
};
