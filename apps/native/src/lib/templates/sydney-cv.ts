import type { NativeTemplate } from "./types";

/**
 * Sydney — Dark, sky blue sub, dot sections
 * Generated from apps/web/components/templates/sydney-cv.tsx (HeaderLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const SydneyCvTemplate: NativeTemplate = {
  id: "sydney-cv",
  name: { en: "Sydney", sw: "Sydney" },
  blurb: { en: "Dark, sky blue sub, dot sections", sw: "Nyeusi, kichwa kidogo cha bluu ya anga, sehemu zenye nukta" },
  tier: "free",
  previewColor: "#0284C7",
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
    "headerBg": "#111827",
    "headerTextColor": "#F8FAFC",
    "headerSubColor": "#BAE6FD",
    "headerContactColor": "#94A3B8",
    "bodyBg": "#FFFFFF",
    "headerPaddingV": 24,
    "mainSectionStyle": "dots",
    "photoSize": 76,
    "photoOnLeft": true,
    "skillDisplay": "bar",
    "showTimeline": false,
    "hobbiesDisplay": "chips",
    "experienceVariant": "default"
  },
};
