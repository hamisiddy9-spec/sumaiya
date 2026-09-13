import type { NativeTemplate } from "./types";

/**
 * Edge — Wide 16px edge, card experience, rounded photo
 * Generated from apps/web/components/templates/edge.tsx (AccentBandLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const EdgeTemplate: NativeTemplate = {
  id: "edge",
  name: { en: "Edge", sw: "Edge" },
  // TODO(copy): sw blurb — mirrored from the web description for now.
  blurb: { en: "Wide 16px edge, card experience, rounded photo", sw: "Wide 16px edge, card experience, rounded photo" },
  tier: "free",
  previewColor: "#0F172A",
  style: "minimal",
  layout: "AccentBandLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "card",
    "skillDisplay": "bar",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "bandWidth": 16,
    "bandColor": "@accent",
    "bg": "#F9FAFB",
    "nameColor": "#111827",
    "sectionStyle": "tag",
    "skillDisplay": "bar",
    "hobbiesDisplay": "chips",
    "experienceVariant": "card",
    "showTimeline": false,
    "photoSize": 72,
    "photoRadius": 8,
    "topRule": true
  },
};
