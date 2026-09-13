import type { NativeTemplate } from "./types";

/**
 * Caslon — Tag labels, compact, solid divider
 * Generated from apps/web/components/templates/caslon.tsx (MinimalLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const CaslonTemplate: NativeTemplate = {
  id: "caslon",
  name: { en: "Caslon", sw: "Caslon" },
  // TODO(copy): sw blurb — mirrored from the web description for now.
  blurb: { en: "Tag labels, compact, solid divider", sw: "Tag labels, compact, solid divider" },
  tier: "free",
  previewColor: "#0F172A",
  style: "minimal",
  layout: "MinimalLayout",
  personality: {
    "density": "compact",
    "experienceVariant": "compact",
    "skillDisplay": "chip",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "bg": "#FFFFFF",
    "nameAlign": "left",
    "dividerStyle": "solid",
    "sectionStyle": "tag",
    "skillDisplay": "chip",
    "hobbiesDisplay": "chips",
    "accentOnName": false,
    "experienceVariant": "compact"
  },
};
