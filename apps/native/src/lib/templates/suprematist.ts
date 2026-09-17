import type { NativeTemplate } from "./types";

/**
 * Suprematist — Borderless, accent name, ultra-compact
 * Generated from apps/web/components/templates/suprematist.tsx (MinimalLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const SuprematistTemplate: NativeTemplate = {
  id: "suprematist",
  name: { en: "Suprematist", sw: "Suprematist" },
  blurb: { en: "Borderless, accent name, ultra-compact", sw: "Bila mipaka, jina la msisitizo, fupi sana" },
  tier: "free",
  previewColor: "#0F172A",
  style: "minimal",
  layout: "MinimalLayout",
  personality: {
    "density": "compact",
    "experienceVariant": "compact",
    "skillDisplay": "bar",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "bg": "#FFFFFF",
    "nameAlign": "left",
    "dividerStyle": "none",
    "sectionStyle": "none",
    "skillDisplay": "bar",
    "hobbiesDisplay": "chips",
    "accentOnName": true,
    "experienceVariant": "compact"
  },
};
