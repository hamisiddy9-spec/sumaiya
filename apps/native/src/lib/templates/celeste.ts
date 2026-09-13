import type { NativeTemplate } from "./types";

/**
 * Celeste — Pink name, dot sections, dotted divider
 * Generated from apps/web/components/templates/celeste.tsx (MinimalLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const CelesteTemplate: NativeTemplate = {
  id: "celeste",
  name: { en: "Celeste", sw: "Celeste" },
  // TODO(copy): sw blurb — mirrored from the web description for now.
  blurb: { en: "Pink name, dot sections, dotted divider", sw: "Pink name, dot sections, dotted divider" },
  tier: "free",
  previewColor: "#BE185D",
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
    "accentOnName": true,
    "experienceVariant": "default"
  },
};
