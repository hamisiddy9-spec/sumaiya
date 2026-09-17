import type { NativeTemplate } from "./types";

/**
 * Nashville — Midnight, compact, box aside
 * Generated from apps/web/components/templates/nashville.tsx (HeaderLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const NashvilleTemplate: NativeTemplate = {
  id: "nashville",
  name: { en: "Nashville", sw: "Nashville" },
  blurb: { en: "Midnight, compact, box aside", sw: "Usiku wa manane, fupi, pembeni ya masanduku" },
  tier: "free",
  previewColor: "#0D1B2A",
  style: "header",
  layout: "HeaderLayout",
  personality: {
    "density": "compact",
    "experienceVariant": "default",
    "skillDisplay": "bar",
    "showTimeline": true,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "headerBg": "#0D1B2A",
    "headerTextColor": "#F8FAFC",
    "headerSubColor": "@accent",
    "headerContactColor": "#94A3B8",
    "bodyBg": "#FFFFFF",
    "headerPaddingV": 24,
    "asideWidth": 190,
    "asideSections": [
      "skills",
      "certifications"
    ],
    "asideSectionStyle": "box",
    "mainSectionStyle": "underline",
    "photoSize": 68,
    "photoOnLeft": true,
    "skillDisplay": "bar",
    "showTimeline": true,
    "hobbiesDisplay": "chips",
    "experienceVariant": "default"
  },
};
