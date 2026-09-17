import type { NativeTemplate } from "./types";

/**
 * Classical — Tag labels, dotted divider, charcoal
 * Generated from apps/web/components/templates/classical-cv.tsx (MinimalLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const ClassicalCvTemplate: NativeTemplate = {
  id: "classical-cv",
  name: { en: "Classical", sw: "Classical" },
  blurb: { en: "Tag labels, dotted divider, charcoal", sw: "Lebo za tagi, kitenganishi cha vitone, mkaa" },
  tier: "free",
  previewColor: "#1E293B",
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
    "dividerStyle": "dotted",
    "sectionStyle": "tag",
    "skillDisplay": "bar",
    "hobbiesDisplay": "chips",
    "accentOnName": false,
    "experienceVariant": "default"
  },
};
