import type { NativeTemplate } from "./types";

/**
 * Chicago — Dark, ice cyan, accent lines
 * Generated from apps/web/components/templates/chicago.tsx (HeaderLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const ChicagoTemplate: NativeTemplate = {
  id: "chicago",
  name: { en: "Chicago", sw: "Chicago" },
  // TODO(copy): sw blurb — mirrored from the web description for now.
  blurb: { en: "Dark, ice cyan, accent lines", sw: "Dark, ice cyan, accent lines" },
  tier: "free",
  previewColor: "#0891B2",
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
    "headerBg": "#111827",
    "headerTextColor": "#F8FAFC",
    "headerSubColor": "#A5F3FC",
    "headerContactColor": "#94A3B8",
    "bodyBg": "#FFFFFF",
    "headerPaddingV": 24,
    "mainSectionStyle": "line-accent",
    "photoSize": 80,
    "photoOnLeft": true,
    "skillDisplay": "dot",
    "showTimeline": false,
    "hobbiesDisplay": "chips",
    "experienceVariant": "default"
  },
};
