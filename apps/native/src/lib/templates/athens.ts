import type { NativeTemplate } from "./types";

/**
 * Athens — Midnight, light blue sub, clean body
 * Generated from apps/web/components/templates/athens.tsx (HeaderLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const AthensTemplate: NativeTemplate = {
  id: "athens",
  name: { en: "Athens", sw: "Athens" },
  // TODO(copy): sw blurb — mirrored from the web description for now.
  blurb: { en: "Midnight, light blue sub, clean body", sw: "Midnight, light blue sub, clean body" },
  tier: "free",
  previewColor: "#1D4ED8",
  style: "header",
  layout: "HeaderLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "default",
    "skillDisplay": "bar",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "headerBg": "#0D1B2A",
    "headerTextColor": "#F8FAFC",
    "headerSubColor": "#93C5FD",
    "headerContactColor": "#94A3B8",
    "bodyBg": "#FFFFFF",
    "headerPaddingV": 24,
    "mainSectionStyle": "underline",
    "photoSize": 72,
    "photoOnLeft": true,
    "skillDisplay": "bar",
    "showTimeline": false,
    "hobbiesDisplay": "chips",
    "experienceVariant": "default"
  },
};
