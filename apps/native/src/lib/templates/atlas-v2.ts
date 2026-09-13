import type { NativeTemplate } from "./types";

/**
 * Atlas v2 — Numbered, chip skills, card blocks, accent name
 * Generated from apps/web/components/templates/atlas-v2.tsx (MinimalLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const AtlasV2Template: NativeTemplate = {
  id: "atlas-v2",
  name: { en: "Atlas v2", sw: "Atlas v2" },
  // TODO(copy): sw blurb — mirrored from the web description for now.
  blurb: { en: "Numbered, chip skills, card blocks, accent name", sw: "Numbered, chip skills, card blocks, accent name" },
  tier: "free",
  previewColor: "#0F172A",
  style: "minimal",
  layout: "MinimalLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "card",
    "skillDisplay": "chip",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "bg": "#FFFFFF",
    "nameAlign": "left",
    "dividerStyle": "dotted",
    "sectionStyle": "numbered",
    "skillDisplay": "chip",
    "hobbiesDisplay": "chips",
    "accentOnName": true,
    "experienceVariant": "card"
  },
};
