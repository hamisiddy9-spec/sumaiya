import type { NativeTemplate } from "./types";

/**
 * Avant Garde — Violet accent name, accent lines
 * Generated from apps/web/components/templates/avant-garde-cv.tsx (MinimalLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const AvantGardeCvTemplate: NativeTemplate = {
  id: "avant-garde-cv",
  name: { en: "Avant Garde", sw: "Avant Garde" },
  blurb: { en: "Violet accent name, accent lines", sw: "Jina la msisitizo wa zambarau, mistari ya msisitizo" },
  tier: "free",
  previewColor: "#6D28D9",
  style: "minimal",
  layout: "MinimalLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "default",
    "skillDisplay": "bar",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "bg": "#FFFFFF",
    "nameAlign": "left",
    "dividerStyle": "none",
    "sectionStyle": "line-accent",
    "skillDisplay": "bar",
    "hobbiesDisplay": "chips",
    "accentOnName": true,
    "experienceVariant": "default"
  },
};
