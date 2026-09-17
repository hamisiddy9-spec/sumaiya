import type { NativeTemplate } from "./types";

/**
 * Fjord — Ocean blue banner, airy single column
 * Generated from apps/web/components/templates/fjord.tsx (HeaderLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const FjordTemplate: NativeTemplate = {
  id: "fjord",
  name: { en: "Fjord", sw: "Fjord" },
  blurb: { en: "Ocean blue banner, airy single column", sw: "Bango la bluu ya bahari, safu moja yenye nafasi" },
  tier: "free",
  previewColor: "#0369A1",
  style: "creative",
  layout: "HeaderLayout",
  personality: {
    "density": "airy",
    "experienceVariant": "default",
    "skillDisplay": "bar",
    "showTimeline": true,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "headerBg": "@accent",
    "headerTextColor": "#FFFFFF",
    "headerSubColor": "rgba(255,255,255,0.8)",
    "headerContactColor": "rgba(255,255,255,0.75)",
    "bodyBg": "#FFFFFF",
    "headerPaddingV": 26,
    "mainSectionStyle": "line-accent",
    "photoSize": 80,
    "photoOnLeft": true,
    "skillDisplay": "bar",
    "showTimeline": true,
    "hobbiesDisplay": "chips",
    "experienceVariant": "default"
  },
};
