import type { NativeTemplate } from "./types";

/**
 * Stratus — Slate, borderless, compact centered
 * Generated from apps/web/components/templates/stratus.tsx (MinimalLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const StratusTemplate: NativeTemplate = {
  id: "stratus",
  name: { en: "Stratus", sw: "Stratus" },
  // TODO(copy): sw blurb — mirrored from the web description for now.
  blurb: { en: "Slate, borderless, compact centered", sw: "Slate, borderless, compact centered" },
  tier: "free",
  previewColor: "#374151",
  style: "minimal",
  layout: "MinimalLayout",
  personality: {
    "density": "compact",
    "experienceVariant": "default",
    "skillDisplay": "bar",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "bg": "#FFFFFF",
    "nameAlign": "center",
    "dividerStyle": "solid",
    "sectionStyle": "none",
    "skillDisplay": "bar",
    "hobbiesDisplay": "chips",
    "accentOnName": false,
    "experienceVariant": "default"
  },
};
