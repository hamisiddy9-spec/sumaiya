import type { NativeTemplate } from "./types";

/**
 * Cobalt — Deep blue, airy two-column layout
 * Generated from apps/web/components/templates/cobalt.tsx (TwoColumnLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const CobaltTemplate: NativeTemplate = {
  id: "cobalt",
  name: { en: "Cobalt", sw: "Cobalt" },
  blurb: { en: "Deep blue, airy two-column layout", sw: "Bluu nzito, mpangilio wa safu mbili wenye nafasi" },
  tier: "free",
  previewColor: "#1D4ED8",
  style: "creative",
  layout: "TwoColumnLayout",
  personality: {
    "density": "airy",
    "experienceVariant": "default",
    "skillDisplay": "dot",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "headerBg": "#1E3A8A",
    "headerTextColor": "#FFFFFF",
    "headerSubColor": "#93C5FD",
    "headerContactColor": "rgba(255,255,255,0.75)",
    "leftBg": "#EFF6FF",
    "rightBg": "#FFFFFF",
    "leftWidth": 205,
    "leftSections": [
      "skills",
      "languages",
      "certifications"
    ],
    "rightSections": [
      "summary",
      "experience",
      "education",
      "hobbies"
    ],
    "leftSectionStyle": "dots",
    "rightSectionStyle": "underline",
    "dividerColor": "#BFDBFE",
    "photoSize": 74,
    "photoOnLeft": true,
    "skillDisplay": "dot",
    "hobbiesDisplay": "chips",
    "experienceVariant": "default",
    "showTimeline": false
  },
};
