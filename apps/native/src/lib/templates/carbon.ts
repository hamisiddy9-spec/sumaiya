import type { NativeTemplate } from "./types";

/**
 * Carbon — Near-black header+left, timeline-v2 body
 * Generated from apps/web/components/templates/carbon.tsx (TwoColumnLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const CarbonTemplate: NativeTemplate = {
  id: "carbon",
  name: { en: "Carbon", sw: "Carbon" },
  blurb: { en: "Near-black header+left, timeline-v2 body", sw: "Karibu nyeusi kichwa na kushoto, maudhui ya mstari wa wakati v2" },
  tier: "free",
  previewColor: "#059669",
  style: "creative",
  layout: "TwoColumnLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "timeline-v2",
    "skillDisplay": "bar",
    "showTimeline": true,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "headerBg": "#111827",
    "headerTextColor": "#F9FAFB",
    "headerSubColor": "#6EE7B7",
    "headerContactColor": "#9CA3AF",
    "leftBg": "#18181B",
    "rightBg": "#FFFFFF",
    "leftWidth": 215,
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
    "leftSectionStyle": "tag",
    "rightSectionStyle": "line-accent",
    "dividerColor": "#374151",
    "photoSize": 76,
    "photoOnLeft": true,
    "skillDisplay": "bar",
    "hobbiesDisplay": "chips",
    "experienceVariant": "timeline-v2",
    "showTimeline": true
  },
};
