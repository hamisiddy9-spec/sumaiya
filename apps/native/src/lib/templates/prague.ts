import type { NativeTemplate } from "./types";

/**
 * Prague — Deep navy, purple, photo right, airy
 * Generated from apps/web/components/templates/prague.tsx (HeaderLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const PragueTemplate: NativeTemplate = {
  id: "prague",
  name: { en: "Prague", sw: "Prague" },
  // TODO(copy): sw blurb — mirrored from the web description for now.
  blurb: { en: "Deep navy, purple, photo right, airy", sw: "Deep navy, purple, photo right, airy" },
  tier: "free",
  previewColor: "#7C3AED",
  style: "header",
  layout: "HeaderLayout",
  personality: {
    "density": "airy",
    "experienceVariant": "default",
    "skillDisplay": "bar",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "headerBg": "#1A1A2E",
    "headerTextColor": "#F8FAFC",
    "headerSubColor": "#A78BFA",
    "headerContactColor": "#94A3B8",
    "bodyBg": "#FFFFFF",
    "headerPaddingV": 24,
    "mainSectionStyle": "line-accent",
    "photoSize": 72,
    "photoOnLeft": false,
    "skillDisplay": "bar",
    "showTimeline": false,
    "hobbiesDisplay": "chips",
    "experienceVariant": "default"
  },
};
