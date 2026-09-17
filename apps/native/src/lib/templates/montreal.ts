import type { NativeTemplate } from "./types";

/**
 * Montreal — Slate, green, card timeline
 * Generated from apps/web/components/templates/montreal.tsx (HeaderLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const MontrealTemplate: NativeTemplate = {
  id: "montreal",
  name: { en: "Montreal", sw: "Montreal" },
  blurb: { en: "Slate, green, card timeline", sw: "Kijivu, kijani, timeline ya kadi" },
  tier: "free",
  previewColor: "#166534",
  style: "header",
  layout: "HeaderLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "card",
    "skillDisplay": "chip",
    "showTimeline": true,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "headerBg": "#0F172A",
    "headerTextColor": "#F8FAFC",
    "headerSubColor": "#86EFAC",
    "headerContactColor": "#94A3B8",
    "bodyBg": "#FFFFFF",
    "headerPaddingV": 24,
    "mainSectionStyle": "box",
    "photoSize": 72,
    "photoOnLeft": true,
    "skillDisplay": "chip",
    "showTimeline": true,
    "hobbiesDisplay": "chips",
    "experienceVariant": "card"
  },
};
