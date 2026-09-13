import type { NativeTemplate } from "./types";

/**
 * Palatino — No divider, accent name, airy
 * Generated from apps/web/components/templates/palatino-cv.tsx (MinimalLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const PalatinoCvTemplate: NativeTemplate = {
  id: "palatino-cv",
  name: { en: "Palatino", sw: "Palatino" },
  // TODO(copy): sw blurb — mirrored from the web description for now.
  blurb: { en: "No divider, accent name, airy", sw: "No divider, accent name, airy" },
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
    "nameAlign": "left",
    "dividerStyle": "none",
    "sectionStyle": "underline",
    "skillDisplay": "bar",
    "hobbiesDisplay": "chips",
    "accentOnName": true,
    "experienceVariant": "default"
  },
};
