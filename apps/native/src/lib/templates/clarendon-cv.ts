import type { NativeTemplate } from "./types";

/**
 * Clarendon — No divider, accent-line sections
 * Generated from apps/web/components/templates/clarendon-cv.tsx (MinimalLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const ClarendonCvTemplate: NativeTemplate = {
  id: "clarendon-cv",
  name: { en: "Clarendon", sw: "Clarendon" },
  blurb: { en: "No divider, accent-line sections", sw: "Bila kitenganishi, sehemu za mistari ya msisitizo" },
  tier: "free",
  previewColor: "#0F172A",
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
    "dividerStyle": "none",
    "sectionStyle": "line-accent",
    "skillDisplay": "chip",
    "hobbiesDisplay": "chips",
    "accentOnName": false,
    "experienceVariant": "default"
  },
};
