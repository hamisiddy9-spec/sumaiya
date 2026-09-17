import type { NativeTemplate } from "./types";

/**
 * Stellar — Dark, dot sections, dotted divider
 * Generated from apps/web/components/templates/stellar.tsx (MinimalLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const StellarTemplate: NativeTemplate = {
  id: "stellar",
  name: { en: "Stellar", sw: "Stellar" },
  blurb: { en: "Dark, dot sections, dotted divider", sw: "Nyeusi, sehemu zenye nukta, kitenganishi chenye nukta" },
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
    "nameAlign": "center",
    "dividerStyle": "dotted",
    "sectionStyle": "dots",
    "skillDisplay": "chip",
    "hobbiesDisplay": "chips",
    "accentOnName": false,
    "experienceVariant": "default"
  },
};
