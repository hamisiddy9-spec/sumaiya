import type { NativeTemplate } from "./types";

/**
 * Cumulus — Green name, box sections, airy
 * Generated from apps/web/components/templates/cumulus.tsx (MinimalLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const CumulusTemplate: NativeTemplate = {
  id: "cumulus",
  name: { en: "Cumulus", sw: "Cumulus" },
  blurb: { en: "Green name, box sections, airy", sw: "Jina la kijani, sehemu za masanduku, nafasi nyingi" },
  tier: "free",
  previewColor: "#059669",
  style: "minimal",
  layout: "MinimalLayout",
  personality: {
    "density": "airy",
    "experienceVariant": "default",
    "skillDisplay": "chip",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "bg": "#FFFFFF",
    "nameAlign": "center",
    "dividerStyle": "solid",
    "sectionStyle": "box",
    "skillDisplay": "chip",
    "hobbiesDisplay": "chips",
    "accentOnName": true,
    "experienceVariant": "default"
  },
};
