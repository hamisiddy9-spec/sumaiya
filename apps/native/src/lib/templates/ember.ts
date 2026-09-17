import type { NativeTemplate } from "./types";

/**
 * Ember — Deep orange, timeline-v2 body
 * Generated from apps/web/components/templates/ember.tsx (TwoColumnLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const EmberTemplate: NativeTemplate = {
  id: "ember",
  name: { en: "Ember", sw: "Ember" },
  blurb: { en: "Deep orange, timeline-v2 body", sw: "Machungwa nzito, maudhui ya mstari wa wakati v2" },
  tier: "free",
  previewColor: "#EA580C",
  style: "creative",
  layout: "TwoColumnLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "timeline-v2",
    "skillDisplay": "bar",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "headerBg": "#7C2D12",
    "headerTextColor": "#FFFFFF",
    "headerSubColor": "#FCA5A5",
    "headerContactColor": "rgba(255,255,255,0.7)",
    "leftBg": "#FFF7ED",
    "rightBg": "#FFFFFF",
    "leftWidth": 215,
    "leftSections": [
      "skills",
      "certifications"
    ],
    "rightSections": [
      "summary",
      "experience",
      "education",
      "languages",
      "hobbies"
    ],
    "leftSectionStyle": "tag",
    "rightSectionStyle": "dots",
    "dividerColor": "#FED7AA",
    "photoSize": 72,
    "photoOnLeft": true,
    "skillDisplay": "bar",
    "hobbiesDisplay": "chips",
    "experienceVariant": "timeline-v2",
    "showTimeline": false
  },
};
