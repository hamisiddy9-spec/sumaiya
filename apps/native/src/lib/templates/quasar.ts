import type { NativeTemplate } from "./types";

/**
 * Quasar — Purple, accent lines, dotted divider
 * Generated from apps/web/components/templates/quasar.tsx (MinimalLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const QuasarTemplate: NativeTemplate = {
  id: "quasar",
  name: { en: "Quasar", sw: "Quasar" },
  blurb: { en: "Purple, accent lines, dotted divider", sw: "Zambarau, mistari ya rangi, kitenganishi chenye nukta" },
  tier: "free",
  previewColor: "#7C3AED",
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
    "dividerStyle": "dotted",
    "sectionStyle": "line-accent",
    "skillDisplay": "bar",
    "hobbiesDisplay": "chips",
    "accentOnName": false,
    "experienceVariant": "default"
  },
};
