import type { NativeTemplate } from "./types";

/**
 * Rockwell — Dot sections, compact, solid divider
 * Generated from apps/web/components/templates/rockwell-cv.tsx (MinimalLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const RockwellCvTemplate: NativeTemplate = {
  id: "rockwell-cv",
  name: { en: "Rockwell", sw: "Rockwell" },
  // TODO(copy): sw blurb — mirrored from the web description for now.
  blurb: { en: "Dot sections, compact, solid divider", sw: "Dot sections, compact, solid divider" },
  tier: "free",
  previewColor: "#1E293B",
  style: "minimal",
  layout: "MinimalLayout",
  personality: {
    "density": "compact",
    "experienceVariant": "compact",
    "skillDisplay": "bar",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "bg": "#FFFFFF",
    "nameAlign": "left",
    "dividerStyle": "solid",
    "sectionStyle": "dots",
    "skillDisplay": "bar",
    "hobbiesDisplay": "chips",
    "accentOnName": false,
    "experienceVariant": "compact"
  },
};
