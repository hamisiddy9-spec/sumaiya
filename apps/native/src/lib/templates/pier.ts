import type { NativeTemplate } from "./types";

/**
 * Pier — Teal band, pill labels, grid skills
 * Generated from apps/web/components/templates/pier.tsx (AccentBandLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const PierTemplate: NativeTemplate = {
  id: "pier",
  name: { en: "Pier", sw: "Pier" },
  // TODO(copy): sw blurb — mirrored from the web description for now.
  blurb: { en: "Teal band, pill labels, grid skills", sw: "Teal band, pill labels, grid skills" },
  tier: "free",
  previewColor: "#0369A1",
  style: "minimal",
  layout: "AccentBandLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "default",
    "skillDisplay": "grid",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "bandWidth": 10,
    "bandColor": "@accent",
    "bg": "#FFFFFF",
    "nameColor": "#111827",
    "sectionStyle": "pill",
    "skillDisplay": "grid",
    "hobbiesDisplay": "chips",
    "experienceVariant": "default",
    "showTimeline": false,
    "photoSize": 74,
    "photoRadius": 50,
    "topRule": true
  },
};
