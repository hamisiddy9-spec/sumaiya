import type { NativeTemplate } from "./types";

/**
 * Atlanta — Deep navy, airy, accent lines
 * Generated from apps/web/components/templates/atlanta.tsx (HeaderLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const AtlantaTemplate: NativeTemplate = {
  id: "atlanta",
  name: { en: "Atlanta", sw: "Atlanta" },
  // TODO(copy): sw blurb — mirrored from the web description for now.
  blurb: { en: "Deep navy, airy, accent lines", sw: "Deep navy, airy, accent lines" },
  tier: "free",
  previewColor: "#1A1A2E",
  style: "header",
  layout: "HeaderLayout",
  personality: {
    "density": "airy",
    "experienceVariant": "default",
    "skillDisplay": "dot",
    "showTimeline": false,
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
    "asideWidth": 195,
    "asideSections": [
      "skills",
      "languages",
      "certifications"
    ],
    "asideSectionStyle": "tag",
    "mainSectionStyle": "line-accent",
    "photoSize": 74,
    "photoOnLeft": true,
    "skillDisplay": "dot",
    "showTimeline": false,
    "hobbiesDisplay": "chips",
    "experienceVariant": "default"
  },
};
