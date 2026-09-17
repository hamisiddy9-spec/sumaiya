import type { NativeTemplate } from "./types";

/**
 * Baskerville — Box sections, dotted divider
 * Generated from apps/web/components/templates/baskerville-cv.tsx (MinimalLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const BaskervilleCvTemplate: NativeTemplate = {
  id: "baskerville-cv",
  name: { en: "Baskerville", sw: "Baskerville" },
  blurb: { en: "Box sections, dotted divider", sw: "Sehemu za masanduku, kitenganishi chenye nukta" },
  tier: "free",
  previewColor: "#374151",
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
    "dividerStyle": "dotted",
    "sectionStyle": "box",
    "skillDisplay": "chip",
    "hobbiesDisplay": "chips",
    "accentOnName": false,
    "experienceVariant": "default"
  },
};
