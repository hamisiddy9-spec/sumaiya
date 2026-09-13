import type { NativeTemplate } from "./types";

/**
 * Brutalist — Tag labels, accent name, borderless
 * Generated from apps/web/components/templates/brutalist-cv.tsx (MinimalLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const BrutalistCvTemplate: NativeTemplate = {
  id: "brutalist-cv",
  name: { en: "Brutalist", sw: "Brutalist" },
  // TODO(copy): sw blurb — mirrored from the web description for now.
  blurb: { en: "Tag labels, accent name, borderless", sw: "Tag labels, accent name, borderless" },
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
    "nameAlign": "left",
    "dividerStyle": "none",
    "sectionStyle": "tag",
    "skillDisplay": "chip",
    "hobbiesDisplay": "chips",
    "accentOnName": true,
    "experienceVariant": "default"
  },
};
