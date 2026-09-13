import type { NativeTemplate } from "./types";

/**
 * Madrid — Dark, rose accent, photo right
 * Generated from apps/web/components/templates/madrid.tsx (HeaderLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const MadridTemplate: NativeTemplate = {
  id: "madrid",
  name: { en: "Madrid", sw: "Madrid" },
  // TODO(copy): sw blurb — mirrored from the web description for now.
  blurb: { en: "Dark, rose accent, photo right", sw: "Dark, rose accent, photo right" },
  tier: "free",
  previewColor: "#E11D48",
  style: "header",
  layout: "HeaderLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "default",
    "skillDisplay": "chip",
    "showTimeline": true,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "headerBg": "#111827",
    "headerTextColor": "#F8FAFC",
    "headerSubColor": "#FB7185",
    "headerContactColor": "#94A3B8",
    "bodyBg": "#FFFFFF",
    "headerPaddingV": 24,
    "mainSectionStyle": "line-accent",
    "photoSize": 80,
    "photoOnLeft": false,
    "skillDisplay": "chip",
    "showTimeline": true,
    "hobbiesDisplay": "chips",
    "experienceVariant": "default"
  },
};
