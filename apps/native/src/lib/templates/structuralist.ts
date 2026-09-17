import type { NativeTemplate } from "./types";

/**
 * Structuralist — Dot sections, dotted divider, slate
 * Generated from apps/web/components/templates/structuralist.tsx (MinimalLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const StructuralistTemplate: NativeTemplate = {
  id: "structuralist",
  name: { en: "Structuralist", sw: "Structuralist" },
  blurb: { en: "Dot sections, dotted divider, slate", sw: "Sehemu za vitone, kitenganishi cha vitone, kijivu" },
  tier: "free",
  previewColor: "#374151",
  style: "minimal",
  layout: "MinimalLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "default",
    "skillDisplay": "chip",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "bg": "#FFFFFF",
    "nameAlign": "left",
    "dividerStyle": "dotted",
    "sectionStyle": "dots",
    "skillDisplay": "chip",
    "hobbiesDisplay": "chips",
    "accentOnName": false,
    "experienceVariant": "default"
  },
};
