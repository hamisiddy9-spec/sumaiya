import type { NativeTemplate } from "./types";

/**
 * Solaris — Amber, box sections, card experience
 * Generated from apps/web/components/templates/solaris.tsx (MinimalLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const SolarisTemplate: NativeTemplate = {
  id: "solaris",
  name: { en: "Solaris", sw: "Solaris" },
  blurb: { en: "Amber, box sections, card experience", sw: "Njano, sehemu za masanduku, uzoefu wa kadi" },
  tier: "free",
  previewColor: "#F59E0B",
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
    "nameAlign": "center",
    "dividerStyle": "solid",
    "sectionStyle": "box",
    "skillDisplay": "chip",
    "hobbiesDisplay": "chips",
    "accentOnName": false,
    "experienceVariant": "card"
  },
};
