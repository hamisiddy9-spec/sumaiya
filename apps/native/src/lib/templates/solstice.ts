import type { NativeTemplate } from "./types";

/**
 * Solstice — Amber name, tag labels, solid divider
 * Generated from apps/web/components/templates/solstice.tsx (MinimalLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const SolsticeTemplate: NativeTemplate = {
  id: "solstice",
  name: { en: "Solstice", sw: "Solstice" },
  blurb: { en: "Amber name, tag labels, solid divider", sw: "Jina la njano, lebo za tagi, kitenganishi kigumu" },
  tier: "free",
  previewColor: "#D97706",
  style: "minimal",
  layout: "MinimalLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "default",
    "skillDisplay": "bar",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "bg": "#FFFFFF",
    "nameAlign": "center",
    "dividerStyle": "solid",
    "sectionStyle": "tag",
    "skillDisplay": "bar",
    "hobbiesDisplay": "chips",
    "accentOnName": true,
    "experienceVariant": "default"
  },
};
