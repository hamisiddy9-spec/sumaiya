import type { NativeTemplate } from "./types";

/**
 * Capsule — Pill section labels, accent name, solid divider
 * Generated from apps/web/components/templates/capsule.tsx (MinimalLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const CapsuleTemplate: NativeTemplate = {
  id: "capsule",
  name: { en: "Capsule", sw: "Capsule" },
  // TODO(copy): sw blurb — mirrored from the web description for now.
  blurb: { en: "Pill section labels, accent name, solid divider", sw: "Pill section labels, accent name, solid divider" },
  tier: "free",
  previewColor: "#7C3AED",
  style: "minimal",
  layout: "MinimalLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "default",
    "skillDisplay": "chip",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "bg": "#FFFFFF",
    "nameAlign": "left",
    "dividerStyle": "solid",
    "sectionStyle": "pill",
    "skillDisplay": "chip",
    "hobbiesDisplay": "chips",
    "accentOnName": true,
    "experienceVariant": "default"
  },
};
