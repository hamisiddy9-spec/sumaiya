import type { NativeTemplate } from "./types";

/**
 * Indianapolis — Deep navy, compact, box aside
 * Generated from apps/web/components/templates/indianapolis.tsx (HeaderLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const IndianapolisTemplate: NativeTemplate = {
  id: "indianapolis",
  name: { en: "Indianapolis", sw: "Indianapolis" },
  // TODO(copy): sw blurb — mirrored from the web description for now.
  blurb: { en: "Deep navy, compact, box aside", sw: "Deep navy, compact, box aside" },
  tier: "free",
  previewColor: "#1A1A2E",
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
    "headerBg": "#1A1A2E",
    "headerTextColor": "#F8FAFC",
    "headerSubColor": "@accent",
    "headerContactColor": "#94A3B8",
    "bodyBg": "#FFFFFF",
    "headerPaddingV": 24,
    "asideWidth": 190,
    "asideSections": [
      "skills",
      "languages"
    ],
    "asideSectionStyle": "box",
    "mainSectionStyle": "underline",
    "photoSize": 72,
    "photoOnLeft": true,
    "skillDisplay": "bar",
    "showTimeline": true,
    "hobbiesDisplay": "chips",
    "experienceVariant": "default"
  },
};
