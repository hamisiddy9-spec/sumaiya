import type { NativeTemplate } from "./types";

/**
 * Portland — Charcoal, narrow aside, accent lines
 * Generated from apps/web/components/templates/portland.tsx (HeaderLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const PortlandTemplate: NativeTemplate = {
  id: "portland",
  name: { en: "Portland", sw: "Portland" },
  blurb: { en: "Charcoal, narrow aside, accent lines", sw: "Mkaa, pembeni nyembamba, mistari ya msisitizo" },
  tier: "free",
  previewColor: "#1E293B",
  style: "header",
  layout: "HeaderLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "default",
    "skillDisplay": "dot",
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
    "asideWidth": 185,
    "asideSections": [
      "skills",
      "languages"
    ],
    "asideSectionStyle": "dots",
    "mainSectionStyle": "line-accent",
    "photoSize": 76,
    "photoOnLeft": true,
    "skillDisplay": "dot",
    "showTimeline": false,
    "hobbiesDisplay": "chips",
    "experienceVariant": "default"
  },
};
