import type { NativeTemplate } from "./types";

/**
 * Margin — Slate band, square photo, tag-rated skills
 * Generated from apps/web/components/templates/margin.tsx (AccentBandLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const MarginTemplate: NativeTemplate = {
  id: "margin",
  name: { en: "Margin", sw: "Margin" },
  blurb: { en: "Slate band, square photo, tag-rated skills", sw: "Ukanda wa kijivu, picha ya mraba, ujuzi wenye madaraja" },
  tier: "free",
  previewColor: "#374151",
  style: "minimal",
  layout: "AccentBandLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "default",
    "skillDisplay": "tag-rated",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "bandWidth": 14,
    "bandColor": "#374151",
    "bg": "#FFFFFF",
    "nameColor": "#111827",
    "sectionStyle": "underline",
    "skillDisplay": "tag-rated",
    "hobbiesDisplay": "chips",
    "experienceVariant": "default",
    "showTimeline": false,
    "photoSize": 80,
    "photoRadius": 0,
    "topRule": true
  },
};
