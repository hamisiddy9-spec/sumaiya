import type { NativeTemplate } from "./types";

/**
 * Bodoni — No divider, borderless, generous whitespace
 * Generated from apps/web/components/templates/bodoni-cv.tsx (MinimalLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const BodoniCvTemplate: NativeTemplate = {
  id: "bodoni-cv",
  name: { en: "Bodoni", sw: "Bodoni" },
  // TODO(copy): sw blurb — mirrored from the web description for now.
  blurb: { en: "No divider, borderless, generous whitespace", sw: "No divider, borderless, generous whitespace" },
  tier: "free",
  previewColor: "#111827",
  style: "minimal",
  layout: "MinimalLayout",
  personality: {
    "density": "airy",
    "experienceVariant": "default",
    "skillDisplay": "chip",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "bg": "#FFFFFF",
    "nameAlign": "left",
    "dividerStyle": "none",
    "sectionStyle": "none",
    "skillDisplay": "chip",
    "hobbiesDisplay": "chips",
    "accentOnName": false,
    "experienceVariant": "default"
  },
};
