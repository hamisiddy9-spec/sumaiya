import type { NativeTemplate } from "./types";

/**
 * Gravity — Slate, box sections, no divider
 * Generated from apps/web/components/templates/gravity.tsx (MinimalLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const GravityTemplate: NativeTemplate = {
  id: "gravity",
  name: { en: "Gravity", sw: "Gravity" },
  // TODO(copy): sw blurb — mirrored from the web description for now.
  blurb: { en: "Slate, box sections, no divider", sw: "Slate, box sections, no divider" },
  tier: "free",
  previewColor: "#374151",
  style: "minimal",
  layout: "MinimalLayout",
  personality: {
    "density": "normal",
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
    "sectionStyle": "box",
    "skillDisplay": "bar",
    "hobbiesDisplay": "chips",
    "accentOnName": false,
    "experienceVariant": "default"
  },
};
