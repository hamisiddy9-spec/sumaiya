import type { NativeTemplate } from "./types";

/**
 * Rail — 12px rail, timeline, accent lines
 * Generated from apps/web/components/templates/rail.tsx (AccentBandLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const RailTemplate: NativeTemplate = {
  id: "rail",
  name: { en: "Rail", sw: "Rail" },
  // TODO(copy): sw blurb — mirrored from the web description for now.
  blurb: { en: "12px rail, timeline, accent lines", sw: "12px rail, timeline, accent lines" },
  tier: "free",
  previewColor: "#059669",
  style: "minimal",
  layout: "AccentBandLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "default",
    "skillDisplay": "bar",
    "showTimeline": true,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "bandWidth": 12,
    "bandColor": "@accent",
    "bg": "#FFFFFF",
    "nameColor": "#111827",
    "sectionStyle": "line-accent",
    "skillDisplay": "bar",
    "hobbiesDisplay": "chips",
    "experienceVariant": "default",
    "showTimeline": true,
    "photoSize": 76,
    "photoRadius": 50,
    "topRule": false
  },
};
