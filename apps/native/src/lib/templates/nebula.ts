import type { NativeTemplate } from "./types";

/**
 * Nebula — Centered violet name, airy whitespace
 * Generated from apps/web/components/templates/nebula.tsx (MinimalLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const NebulaTemplate: NativeTemplate = {
  id: "nebula",
  name: { en: "Nebula", sw: "Nebula" },
  blurb: { en: "Centered violet name, airy whitespace", sw: "Jina la zambarau katikati, nafasi nyingi" },
  tier: "free",
  previewColor: "#6D28D9",
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
    "sectionStyle": "underline",
    "skillDisplay": "chip",
    "hobbiesDisplay": "chips",
    "accentOnName": true,
    "experienceVariant": "default"
  },
};
