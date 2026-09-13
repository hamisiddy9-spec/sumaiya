import type { NativeTemplate } from "./types";

/**
 * Slate Two — Steel blue, two-col, grid skill display
 * Generated from apps/web/components/templates/slate-two.tsx (TwoColumnLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const SlateTwoTemplate: NativeTemplate = {
  id: "slate-two",
  name: { en: "Slate Two", sw: "Slate Two" },
  // TODO(copy): sw blurb — mirrored from the web description for now.
  blurb: { en: "Steel blue, two-col, grid skill display", sw: "Steel blue, two-col, grid skill display" },
  tier: "free",
  previewColor: "#334155",
  style: "creative",
  layout: "TwoColumnLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "default",
    "skillDisplay": "grid",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "headerBg": "#334155",
    "headerTextColor": "#F8FAFC",
    "headerSubColor": "#CBD5E1",
    "headerContactColor": "#94A3B8",
    "leftBg": "#F1F5F9",
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
      "certifications",
      "hobbies"
    ],
    "leftSectionStyle": "dots",
    "rightSectionStyle": "underline",
    "dividerColor": "#CBD5E1",
    "photoSize": 70,
    "photoOnLeft": true,
    "skillDisplay": "grid",
    "hobbiesDisplay": "chips",
    "experienceVariant": "default",
    "showTimeline": false
  },
};
