import type { NativeTemplate } from "./types";

/**
 * Altus — Slate, card experience, accent lines
 * Generated from apps/web/components/templates/altus.tsx (MinimalLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const AltusTemplate: NativeTemplate = {
  id: "altus",
  name: { en: "Altus", sw: "Altus" },
  blurb: { en: "Slate, card experience, accent lines", sw: "Kijivu, uzoefu wa kadi, mistari ya rangi" },
  tier: "free",
  previewColor: "#374151",
  style: "minimal",
  layout: "MinimalLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "card",
    "skillDisplay": "bar",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "bg": "#FFFFFF",
    "nameAlign": "center",
    "dividerStyle": "none",
    "sectionStyle": "line-accent",
    "skillDisplay": "bar",
    "hobbiesDisplay": "chips",
    "accentOnName": false,
    "experienceVariant": "card"
  },
};
