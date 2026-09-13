import type { NativeTemplate } from "./types";

/**
 * Futura — Blue accent name, accent-line sections
 * Generated from apps/web/components/templates/futura-cv.tsx (MinimalLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const FuturaCvTemplate: NativeTemplate = {
  id: "futura-cv",
  name: { en: "Futura", sw: "Futura" },
  // TODO(copy): sw blurb — mirrored from the web description for now.
  blurb: { en: "Blue accent name, accent-line sections", sw: "Blue accent name, accent-line sections" },
  tier: "free",
  previewColor: "#1D4ED8",
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
    "nameAlign": "left",
    "dividerStyle": "solid",
    "sectionStyle": "line-accent",
    "skillDisplay": "bar",
    "hobbiesDisplay": "chips",
    "accentOnName": true,
    "experienceVariant": "default"
  },
};
