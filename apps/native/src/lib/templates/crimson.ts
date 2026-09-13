import type { NativeTemplate } from "./types";

/**
 * Crimson — Deep red, box sections, two-column
 * Generated from apps/web/components/templates/crimson.tsx (TwoColumnLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const CrimsonTemplate: NativeTemplate = {
  id: "crimson",
  name: { en: "Crimson", sw: "Crimson" },
  // TODO(copy): sw blurb — mirrored from the web description for now.
  blurb: { en: "Deep red, box sections, two-column", sw: "Deep red, box sections, two-column" },
  tier: "free",
  previewColor: "#DC2626",
  style: "creative",
  layout: "TwoColumnLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "card",
    "skillDisplay": "bar",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "headerBg": "#991B1B",
    "headerTextColor": "#FFFFFF",
    "headerSubColor": "#FCA5A5",
    "headerContactColor": "rgba(255,255,255,0.7)",
    "leftBg": "#FFF5F5",
    "rightBg": "#FFFFFF",
    "leftWidth": 205,
    "leftSections": [
      "skills",
      "languages"
    ],
    "rightSections": [
      "summary",
      "experience",
      "education",
      "certifications"
    ],
    "leftSectionStyle": "tag",
    "rightSectionStyle": "box",
    "dividerColor": "#FEE2E2",
    "photoSize": 74,
    "photoOnLeft": true,
    "skillDisplay": "bar",
    "hobbiesDisplay": "chips",
    "experienceVariant": "card",
    "showTimeline": false
  },
};
