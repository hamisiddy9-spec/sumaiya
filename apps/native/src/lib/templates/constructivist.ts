import type { NativeTemplate } from "./types";

/**
 * Constructivist — Red accent, box sections, compact
 * Generated from apps/web/components/templates/constructivist.tsx (MinimalLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const ConstructivistTemplate: NativeTemplate = {
  id: "constructivist",
  name: { en: "Constructivist", sw: "Constructivist" },
  // TODO(copy): sw blurb — mirrored from the web description for now.
  blurb: { en: "Red accent, box sections, compact", sw: "Red accent, box sections, compact" },
  tier: "free",
  previewColor: "#DC2626",
  style: "minimal",
  layout: "MinimalLayout",
  personality: {
    "density": "compact",
    "experienceVariant": "card",
    "skillDisplay": "chip",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "bg": "#FFFFFF",
    "nameAlign": "left",
    "dividerStyle": "solid",
    "sectionStyle": "box",
    "skillDisplay": "chip",
    "hobbiesDisplay": "chips",
    "accentOnName": false,
    "experienceVariant": "card"
  },
};
