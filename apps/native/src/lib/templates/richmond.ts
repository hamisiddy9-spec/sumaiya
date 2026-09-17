import type { NativeTemplate } from "./types";

/**
 * Richmond — Dark, airy body, dot labels
 * Generated from apps/web/components/templates/richmond.tsx (HeaderLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const RichmondTemplate: NativeTemplate = {
  id: "richmond",
  name: { en: "Richmond", sw: "Richmond" },
  blurb: { en: "Dark, airy body, dot labels", sw: "Nyeusi, maudhui yenye nafasi, lebo zenye nukta" },
  tier: "free",
  previewColor: "#111827",
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
    "headerBg": "#111827",
    "headerTextColor": "#F8FAFC",
    "headerSubColor": "@accent",
    "headerContactColor": "#94A3B8",
    "bodyBg": "#FFFFFF",
    "headerPaddingV": 24,
    "asideWidth": 200,
    "asideSections": [
      "skills",
      "languages",
      "certifications"
    ],
    "asideSectionStyle": "box",
    "mainSectionStyle": "dots",
    "photoSize": 70,
    "photoOnLeft": true,
    "skillDisplay": "bar",
    "showTimeline": false,
    "hobbiesDisplay": "chips",
    "experienceVariant": "default"
  },
};
