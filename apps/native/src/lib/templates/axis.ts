import type { NativeTemplate } from "./types";

/**
 * Axis — Black band, timeline-v2 experience
 * Generated from apps/web/components/templates/axis.tsx (AccentBandLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const AxisTemplate: NativeTemplate = {
  id: "axis",
  name: { en: "Axis", sw: "Axis" },
  blurb: { en: "Black band, timeline-v2 experience", sw: "Ukanda mweusi, uzoefu wa mstari wa wakati v2" },
  tier: "free",
  previewColor: "#0F172A",
  style: "minimal",
  layout: "AccentBandLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "timeline-v2",
    "skillDisplay": "bar",
    "showTimeline": true,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "bandWidth": 8,
    "bandColor": "#0F172A",
    "bg": "#FFFFFF",
    "nameColor": "#111827",
    "sectionStyle": "underline",
    "skillDisplay": "bar",
    "hobbiesDisplay": "chips",
    "experienceVariant": "timeline-v2",
    "showTimeline": true,
    "photoSize": 78,
    "photoRadius": 50,
    "topRule": true
  },
};
