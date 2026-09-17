import type { NativeTemplate } from "./types";

/**
 * Script — Warm background, timeline-v2, accent lines
 * Generated from apps/web/components/templates/script-cv.tsx (AccentBandLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const ScriptCvTemplate: NativeTemplate = {
  id: "script-cv",
  name: { en: "Script", sw: "Script" },
  blurb: { en: "Warm background, timeline-v2, accent lines", sw: "Mandhari ya joto, mstari wa wakati v2, mistari ya msisitizo" },
  tier: "free",
  previewColor: "#B45309",
  style: "minimal",
  layout: "AccentBandLayout",
  personality: {
    "density": "airy",
    "experienceVariant": "timeline-v2",
    "skillDisplay": "bar",
    "showTimeline": true,
    "hobbiesDisplay": "text"
  },
  tokenOverrides: {},
  config: {
    "bandWidth": 6,
    "bandColor": "@accent",
    "bg": "#FFF8F0",
    "nameColor": "#1C1917",
    "sectionStyle": "line-accent",
    "skillDisplay": "bar",
    "hobbiesDisplay": "text",
    "experienceVariant": "timeline-v2",
    "showTimeline": true,
    "photoSize": 0,
    "photoRadius": 50,
    "topRule": true
  },
};
