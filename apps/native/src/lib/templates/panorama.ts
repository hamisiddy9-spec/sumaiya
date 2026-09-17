import type { NativeTemplate } from "./types";

/**
 * Panorama — Green banner, single column, airy
 * Generated from apps/web/components/templates/panorama.tsx (HeaderLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const PanoramaTemplate: NativeTemplate = {
  id: "panorama",
  name: { en: "Panorama", sw: "Panorama" },
  blurb: { en: "Green banner, single column, airy", sw: "Bango la kijani, safu moja, nafasi nyingi" },
  tier: "free",
  previewColor: "#059669",
  style: "creative",
  layout: "HeaderLayout",
  personality: {
    "density": "airy",
    "experienceVariant": "default",
    "skillDisplay": "bar",
    "showTimeline": false,
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
    "mainSectionStyle": "underline",
    "photoSize": 78,
    "photoOnLeft": true,
    "skillDisplay": "bar",
    "showTimeline": false,
    "hobbiesDisplay": "chips",
    "experienceVariant": "default"
  },
};
