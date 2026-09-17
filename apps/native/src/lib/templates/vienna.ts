import type { NativeTemplate } from "./types";

/**
 * Vienna — Dark header, amber subtext, card blocks
 * Generated from apps/web/components/templates/vienna.tsx (HeaderLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const ViennaTemplate: NativeTemplate = {
  id: "vienna",
  name: { en: "Vienna", sw: "Vienna" },
  blurb: { en: "Dark header, amber subtext, card blocks", sw: "Kichwa cheusi, maandishi madogo ya njano, vibao vya kadi" },
  tier: "free",
  previewColor: "#B45309",
  style: "header",
  layout: "HeaderLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "card",
    "skillDisplay": "bar",
    "showTimeline": true,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "headerBg": "#111827",
    "headerTextColor": "#F8FAFC",
    "headerSubColor": "#F59E0B",
    "headerContactColor": "#94A3B8",
    "bodyBg": "#FFFFFF",
    "headerPaddingV": 24,
    "mainSectionStyle": "box",
    "photoSize": 80,
    "photoOnLeft": true,
    "skillDisplay": "bar",
    "showTimeline": true,
    "hobbiesDisplay": "chips",
    "experienceVariant": "card"
  },
};
