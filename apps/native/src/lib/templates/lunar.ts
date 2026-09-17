import type { NativeTemplate } from "./types";

/**
 * Lunar — Dark centered, accent lines, spacious
 * Generated from apps/web/components/templates/lunar.tsx (MinimalLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const LunarTemplate: NativeTemplate = {
  id: "lunar",
  name: { en: "Lunar", sw: "Lunar" },
  blurb: { en: "Dark centered, accent lines, spacious", sw: "Cheusi katikati, mistari ya rangi, nafasi nyingi" },
  tier: "free",
  previewColor: "#1E293B",
  style: "minimal",
  layout: "MinimalLayout",
  personality: {
    "density": "airy",
    "experienceVariant": "default",
    "skillDisplay": "bar",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "bg": "#FFFFFF",
    "nameAlign": "center",
    "dividerStyle": "none",
    "sectionStyle": "line-accent",
    "skillDisplay": "bar",
    "hobbiesDisplay": "chips",
    "accentOnName": true,
    "experienceVariant": "default"
  },
};
