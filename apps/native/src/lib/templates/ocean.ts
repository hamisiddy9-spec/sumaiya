import type { NativeTemplate } from "./types";

/**
 * Ocean — Ocean blue, numbered sections, timeline
 * Generated from apps/web/components/templates/ocean.tsx (TwoColumnLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const OceanTemplate: NativeTemplate = {
  id: "ocean",
  name: { en: "Ocean", sw: "Ocean" },
  // TODO(copy): sw blurb — mirrored from the web description for now.
  blurb: { en: "Ocean blue, numbered sections, timeline", sw: "Ocean blue, numbered sections, timeline" },
  tier: "free",
  previewColor: "#0369A1",
  style: "creative",
  layout: "TwoColumnLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "default",
    "skillDisplay": "dot",
    "showTimeline": true,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "headerBg": "#0369A1",
    "headerTextColor": "#FFFFFF",
    "headerSubColor": "#BAE6FD",
    "headerContactColor": "rgba(255,255,255,0.75)",
    "leftBg": "#EFF6FF",
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
    "leftSectionStyle": "dots",
    "rightSectionStyle": "numbered",
    "dividerColor": "#BFDBFE",
    "photoSize": 72,
    "photoOnLeft": true,
    "skillDisplay": "dot",
    "hobbiesDisplay": "chips",
    "experienceVariant": "default",
    "showTimeline": true
  },
};
