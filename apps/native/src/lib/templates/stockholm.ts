import type { NativeTemplate } from "./types";

/**
 * Stockholm — Midnight header, green sub, airy body
 * Generated from apps/web/components/templates/stockholm.tsx (HeaderLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const StockholmTemplate: NativeTemplate = {
  id: "stockholm",
  name: { en: "Stockholm", sw: "Stockholm" },
  // TODO(copy): sw blurb — mirrored from the web description for now.
  blurb: { en: "Midnight header, green sub, airy body", sw: "Midnight header, green sub, airy body" },
  tier: "free",
  previewColor: "#059669",
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
    "headerBg": "#0D1B2A",
    "headerTextColor": "#F8FAFC",
    "headerSubColor": "#10B981",
    "headerContactColor": "#94A3B8",
    "bodyBg": "#FFFFFF",
    "headerPaddingV": 24,
    "mainSectionStyle": "dots",
    "photoSize": 68,
    "photoOnLeft": true,
    "skillDisplay": "dot",
    "showTimeline": false,
    "hobbiesDisplay": "chips",
    "experienceVariant": "default"
  },
};
