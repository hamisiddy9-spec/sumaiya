import type { NativeTemplate } from "./types";

/**
 * Serif — Warm paper bg, ruled sections, bar skills
 * Generated from apps/web/components/templates/serif-cv.tsx (AccentBandLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const SerifCvTemplate: NativeTemplate = {
  id: "serif-cv",
  name: { en: "Serif", sw: "Serif" },
  blurb: { en: "Warm paper bg, ruled sections, bar skills", sw: "Mandhari ya karatasi ya joto, sehemu zenye mistari, ujuzi katika mistari" },
  tier: "free",
  previewColor: "#78350F",
  style: "minimal",
  layout: "AccentBandLayout",
  personality: {
    "density": "airy",
    "experienceVariant": "default",
    "skillDisplay": "bar",
    "showTimeline": false,
    "hobbiesDisplay": "text"
  },
  tokenOverrides: {},
  config: {
    "bandWidth": 8,
    "bandColor": "@accent",
    "bg": "#FFFEF9",
    "nameColor": "#1C1917",
    "sectionStyle": "ruled",
    "skillDisplay": "bar",
    "hobbiesDisplay": "text",
    "experienceVariant": "default",
    "showTimeline": false,
    "photoSize": 82,
    "photoRadius": 50,
    "topRule": true
  },
};
