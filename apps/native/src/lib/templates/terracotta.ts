import type { NativeTemplate } from "./types";

/**
 * Terracotta — Warm amber header, ruled section dividers
 * Generated from apps/web/components/templates/terracotta.tsx (TwoColumnLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const TerracottaTemplate: NativeTemplate = {
  id: "terracotta",
  name: { en: "Terracotta", sw: "Terracotta" },
  // TODO(copy): sw blurb — mirrored from the web description for now.
  blurb: { en: "Warm amber header, ruled section dividers", sw: "Warm amber header, ruled section dividers" },
  tier: "free",
  previewColor: "#B45309",
  style: "creative",
  layout: "TwoColumnLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "default",
    "skillDisplay": "bar",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "headerBg": "#B45309",
    "headerTextColor": "#FFFFFF",
    "headerSubColor": "#FEF3C7",
    "headerContactColor": "rgba(255,255,255,0.75)",
    "leftBg": "#FEF9F0",
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
    "rightSectionStyle": "ruled",
    "dividerColor": "#F5DEB3",
    "photoSize": 74,
    "photoOnLeft": true,
    "skillDisplay": "bar",
    "hobbiesDisplay": "chips",
    "experienceVariant": "default",
    "showTimeline": false
  },
};
