import type { NativeTemplate } from "./types";

/**
 * Memphis — Dark, compact, chip skills
 * Generated from apps/web/components/templates/memphis.tsx (HeaderLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const MemphisTemplate: NativeTemplate = {
  id: "memphis",
  name: { en: "Memphis", sw: "Memphis" },
  // TODO(copy): sw blurb — mirrored from the web description for now.
  blurb: { en: "Dark, compact, chip skills", sw: "Dark, compact, chip skills" },
  tier: "free",
  previewColor: "#111827",
  style: "header",
  layout: "HeaderLayout",
  personality: {
    "density": "compact",
    "experienceVariant": "default",
    "skillDisplay": "chip",
    "showTimeline": true,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "headerBg": "#111827",
    "headerTextColor": "#F8FAFC",
    "headerSubColor": "@accent",
    "headerContactColor": "#94A3B8",
    "bodyBg": "#FFFFFF",
    "headerPaddingV": 24,
    "asideWidth": 195,
    "asideSections": [
      "skills",
      "certifications"
    ],
    "asideSectionStyle": "tag",
    "mainSectionStyle": "line-accent",
    "photoSize": 68,
    "photoOnLeft": true,
    "skillDisplay": "chip",
    "showTimeline": true,
    "hobbiesDisplay": "chips",
    "experienceVariant": "default"
  },
};
