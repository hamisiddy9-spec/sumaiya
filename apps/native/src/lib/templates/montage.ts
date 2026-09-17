import type { NativeTemplate } from "./types";

/**
 * Montage — Pink banner, photo right, timeline
 * Generated from apps/web/components/templates/montage.tsx (HeaderLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const MontageTemplate: NativeTemplate = {
  id: "montage",
  name: { en: "Montage", sw: "Montage" },
  blurb: { en: "Pink banner, photo right, timeline", sw: "Bango la waridi, picha kulia, timeline" },
  tier: "free",
  previewColor: "#BE185D",
  style: "creative",
  layout: "HeaderLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "default",
    "skillDisplay": "chip",
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
    "asideWidth": 195,
    "asideSections": [
      "skills",
      "certifications"
    ],
    "asideSectionStyle": "tag",
    "mainSectionStyle": "underline",
    "photoSize": 72,
    "photoOnLeft": false,
    "skillDisplay": "chip",
    "showTimeline": true,
    "hobbiesDisplay": "chips",
    "experienceVariant": "default"
  },
};
