import type { NativeTemplate } from "./types";

/**
 * Storm — Steel, numbered+tag-rated, ruled body
 * Generated from apps/web/components/templates/storm.tsx (TwoColumnLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const StormTemplate: NativeTemplate = {
  id: "storm",
  name: { en: "Storm", sw: "Storm" },
  blurb: { en: "Steel, numbered+tag-rated, ruled body", sw: "Kijivu cha chuma, namba na madaraja, maudhui yenye mistari" },
  tier: "free",
  previewColor: "#374151",
  style: "creative",
  layout: "TwoColumnLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "default",
    "skillDisplay": "tag-rated",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "headerBg": "#1F2937",
    "headerTextColor": "#F8FAFC",
    "headerSubColor": "#9CA3AF",
    "headerContactColor": "#6B7280",
    "leftBg": "#F9FAFB",
    "rightBg": "#FFFFFF",
    "leftWidth": 210,
    "leftSections": [
      "skills",
      "languages"
    ],
    "rightSections": [
      "summary",
      "experience",
      "education",
      "certifications",
      "hobbies"
    ],
    "leftSectionStyle": "numbered",
    "rightSectionStyle": "ruled",
    "dividerColor": "#E5E7EB",
    "photoSize": 76,
    "photoOnLeft": true,
    "skillDisplay": "tag-rated",
    "hobbiesDisplay": "chips",
    "experienceVariant": "default",
    "showTimeline": false
  },
};
