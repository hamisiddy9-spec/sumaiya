import type { NativeTemplate } from "./types";

/**
 * Sacramento — Midnight, compact, slim aside
 * Generated from apps/web/components/templates/sacramento.tsx (HeaderLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const SacramentoTemplate: NativeTemplate = {
  id: "sacramento",
  name: { en: "Sacramento", sw: "Sacramento" },
  blurb: { en: "Midnight, compact, slim aside", sw: "Usiku wa manane, fupi, pembeni nyembamba" },
  tier: "free",
  previewColor: "#0D1B2A",
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
    "headerBg": "#0D1B2A",
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
    "mainSectionStyle": "underline",
    "photoSize": 68,
    "photoOnLeft": true,
    "skillDisplay": "bar",
    "showTimeline": false,
    "hobbiesDisplay": "chips",
    "experienceVariant": "compact"
  },
};
