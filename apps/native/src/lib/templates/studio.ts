import type { NativeTemplate } from "./types";

/**
 * Studio — Editorial single-column
 * Generated from apps/web/components/templates/studio.tsx (MinimalLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const StudioTemplate: NativeTemplate = {
  id: "studio",
  name: { en: "Studio", sw: "Studio" },
  // TODO(copy): sw blurb — mirrored from the web description for now.
  blurb: { en: "Editorial single-column", sw: "Editorial single-column" },
  tier: "free",
  previewColor: "#6366F1",
  style: "minimal",
  layout: "MinimalLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "compact",
    "skillDisplay": "chip",
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {
    "font": {
      "name": 24
    }
  },
  config: {
    "bg": "#FFFFFF",
    "nameAlign": "left",
    "dividerStyle": "solid",
    "sectionStyle": "dots",
    "skillDisplay": "chip",
    "hobbiesDisplay": "chips",
    "accentOnName": true,
    "experienceVariant": "compact"
  },
};
