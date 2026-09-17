import type { NativeTemplate } from "./types";

/**
 * Melbourne — Midnight, lavender, compact
 * Generated from apps/web/components/templates/melbourne.tsx (HeaderLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const MelbourneTemplate: NativeTemplate = {
  id: "melbourne",
  name: { en: "Melbourne", sw: "Melbourne" },
  blurb: { en: "Midnight, lavender, compact", sw: "Usiku wa manane, zambarau hafifu, fupi" },
  tier: "free",
  previewColor: "#6D28D9",
  style: "header",
  layout: "HeaderLayout",
  personality: {
    "density": "compact",
    "experienceVariant": "compact",
    "skillDisplay": "dot",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "headerBg": "#0D1B2A",
    "headerTextColor": "#F8FAFC",
    "headerSubColor": "#C4B5FD",
    "headerContactColor": "#94A3B8",
    "bodyBg": "#FFFFFF",
    "headerPaddingV": 24,
    "mainSectionStyle": "line-accent",
    "photoSize": 74,
    "photoOnLeft": false,
    "skillDisplay": "dot",
    "showTimeline": false,
    "hobbiesDisplay": "chips",
    "experienceVariant": "compact"
  },
};
