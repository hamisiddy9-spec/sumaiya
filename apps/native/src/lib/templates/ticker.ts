import type { NativeTemplate } from "./types";

/**
 * Ticker — Centered, numbered, timeline-v2 experience
 * Generated from apps/web/components/templates/ticker.tsx (MinimalLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const TickerTemplate: NativeTemplate = {
  id: "ticker",
  name: { en: "Ticker", sw: "Ticker" },
  blurb: { en: "Centered, numbered, timeline-v2 experience", sw: "Katikati, namba, uzoefu wa mstari wa wakati v2" },
  tier: "free",
  previewColor: "#DC2626",
  style: "minimal",
  layout: "MinimalLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "timeline-v2",
    "skillDisplay": "bar",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "bg": "#FFFFFF",
    "nameAlign": "center",
    "dividerStyle": "dotted",
    "sectionStyle": "numbered",
    "skillDisplay": "bar",
    "hobbiesDisplay": "chips",
    "accentOnName": false,
    "experienceVariant": "timeline-v2"
  },
};
