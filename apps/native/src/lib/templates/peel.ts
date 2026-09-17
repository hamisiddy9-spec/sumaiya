import type { NativeTemplate } from "./types";

/**
 * Peel — Centered, pill labels, chip skills, card exp, airy
 * Generated from apps/web/components/templates/peel.tsx (MinimalLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const PeelTemplate: NativeTemplate = {
  id: "peel",
  name: { en: "Peel", sw: "Peel" },
  blurb: { en: "Centered, pill labels, chip skills, card exp, airy", sw: "Katikati, lebo za mviringo, ujuzi katika vibao vya UI, uzoefu wa kadi, nafasi nyingi" },
  tier: "free",
  previewColor: "#BE185D",
  style: "minimal",
  layout: "MinimalLayout",
  personality: {
    "density": "airy",
    "experienceVariant": "card",
    "skillDisplay": "chip",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "bg": "#FFFFFF",
    "nameAlign": "center",
    "dividerStyle": "none",
    "sectionStyle": "pill",
    "skillDisplay": "chip",
    "hobbiesDisplay": "chips",
    "accentOnName": true,
    "experienceVariant": "card"
  },
};
