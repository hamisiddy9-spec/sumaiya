import type { NativeTemplate } from "./types";

/**
 * Baltimore — Charcoal, airy body, dot sections
 * Generated from apps/web/components/templates/baltimore.tsx (HeaderLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const BaltimoreTemplate: NativeTemplate = {
  id: "baltimore",
  name: { en: "Baltimore", sw: "Baltimore" },
  // TODO(copy): sw blurb — mirrored from the web description for now.
  blurb: { en: "Charcoal, airy body, dot sections", sw: "Charcoal, airy body, dot sections" },
  tier: "free",
  previewColor: "#1E293B",
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
    "headerBg": "#1E293B",
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
    "asideSectionStyle": "dots",
    "mainSectionStyle": "dots",
    "photoSize": 76,
    "photoOnLeft": true,
    "skillDisplay": "bar",
    "showTimeline": false,
    "hobbiesDisplay": "chips",
    "experienceVariant": "default"
  },
};
