import type { NativeTemplate } from "./types";

/**
 * Bauhaus — Left-aligned, solid divider, compact
 * Generated from apps/web/components/templates/bauhaus.tsx (MinimalLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const BauhausTemplate: NativeTemplate = {
  id: "bauhaus",
  name: { en: "Bauhaus", sw: "Bauhaus" },
  // TODO(copy): sw blurb — mirrored from the web description for now.
  blurb: { en: "Left-aligned, solid divider, compact", sw: "Left-aligned, solid divider, compact" },
  tier: "free",
  previewColor: "#0F172A",
  style: "minimal",
  layout: "MinimalLayout",
  personality: {
    "density": "compact",
    "experienceVariant": "default",
    "skillDisplay": "chip",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "bg": "#FFFFFF",
    "nameAlign": "left",
    "dividerStyle": "solid",
    "sectionStyle": "underline",
    "skillDisplay": "chip",
    "hobbiesDisplay": "chips",
    "accentOnName": false,
    "experienceVariant": "default"
  },
};
