import type { NativeTemplate } from "./types";

/**
 * Vancouver — Charcoal, pink, photo right, airy
 * Generated from apps/web/components/templates/vancouver.tsx (HeaderLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const VancouverTemplate: NativeTemplate = {
  id: "vancouver",
  name: { en: "Vancouver", sw: "Vancouver" },
  // TODO(copy): sw blurb — mirrored from the web description for now.
  blurb: { en: "Charcoal, pink, photo right, airy", sw: "Charcoal, pink, photo right, airy" },
  tier: "free",
  previewColor: "#E11D48",
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
    "headerBg": "#1E293B",
    "headerTextColor": "#F8FAFC",
    "headerSubColor": "#FDA4AF",
    "headerContactColor": "#94A3B8",
    "bodyBg": "#FFFFFF",
    "headerPaddingV": 24,
    "mainSectionStyle": "dots",
    "photoSize": 76,
    "photoOnLeft": false,
    "skillDisplay": "bar",
    "showTimeline": false,
    "hobbiesDisplay": "chips",
    "experienceVariant": "default"
  },
};
