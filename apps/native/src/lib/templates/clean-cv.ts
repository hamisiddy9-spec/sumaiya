import type { NativeTemplate } from "./types";

/**
 * Clean — No section labels, grid skills, ultra compact
 * Generated from apps/web/components/templates/clean-cv.tsx (MinimalLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const CleanCvTemplate: NativeTemplate = {
  id: "clean-cv",
  name: { en: "Clean", sw: "Clean" },
  blurb: { en: "No section labels, grid skills, ultra compact", sw: "Bila lebo za sehemu, ujuzi katika gridi, fupi sana" },
  tier: "free",
  previewColor: "#1E293B",
  style: "minimal",
  layout: "MinimalLayout",
  personality: {
    "density": "compact",
    "experienceVariant": "compact",
    "skillDisplay": "grid",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "bg": "#FFFFFF",
    "nameAlign": "left",
    "dividerStyle": "solid",
    "sectionStyle": "none",
    "skillDisplay": "grid",
    "hobbiesDisplay": "chips",
    "accentOnName": false,
    "experienceVariant": "compact"
  },
};
