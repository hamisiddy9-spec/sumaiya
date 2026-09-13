import type { NativeTemplate } from "./types";

/**
 * Herald — Dark band, ruled sections, table layout, rounded photo
 * Generated from apps/web/components/templates/herald.tsx (AccentBandLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const HeraldTemplate: NativeTemplate = {
  id: "herald",
  name: { en: "Herald", sw: "Herald" },
  // TODO(copy): sw blurb — mirrored from the web description for now.
  blurb: { en: "Dark band, ruled sections, table layout, rounded photo", sw: "Dark band, ruled sections, table layout, rounded photo" },
  tier: "free",
  previewColor: "#0F172A",
  style: "minimal",
  layout: "AccentBandLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "table",
    "skillDisplay": "bar",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "bandWidth": 12,
    "bandColor": "#0F172A",
    "bg": "#FAFAFA",
    "nameColor": "#0F172A",
    "sectionStyle": "ruled",
    "skillDisplay": "bar",
    "hobbiesDisplay": "chips",
    "experienceVariant": "table",
    "showTimeline": false,
    "photoSize": 78,
    "photoRadius": 8,
    "topRule": true
  },
};
