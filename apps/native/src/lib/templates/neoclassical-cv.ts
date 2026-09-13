import type { NativeTemplate } from "./types";

/**
 * Neoclassical — Box sections, compact, solid divider
 * Generated from apps/web/components/templates/neoclassical-cv.tsx (MinimalLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const NeoclassicalCvTemplate: NativeTemplate = {
  id: "neoclassical-cv",
  name: { en: "Neoclassical", sw: "Neoclassical" },
  // TODO(copy): sw blurb — mirrored from the web description for now.
  blurb: { en: "Box sections, compact, solid divider", sw: "Box sections, compact, solid divider" },
  tier: "free",
  previewColor: "#111827",
  style: "minimal",
  layout: "MinimalLayout",
  personality: {
    "density": "compact",
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
    "sectionStyle": "box",
    "skillDisplay": "chip",
    "hobbiesDisplay": "chips",
    "accentOnName": false,
    "experienceVariant": "default"
  },
};
