import type { NativeTemplate } from "./types";

/**
 * Clarendon — No divider, accent-line sections
 * Generated from apps/web/components/templates/clarendon-cv.tsx (MinimalLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const ClarendonCvTemplate: NativeTemplate = {
  id: "clarendon-cv",
  name: { en: "Clarendon", sw: "Clarendon" },
  // TODO(copy): sw blurb — mirrored from the web description for now.
  blurb: { en: "No divider, accent-line sections", sw: "No divider, accent-line sections" },
  tier: "free",
  previewColor: "#0F172A",
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
    "dividerStyle": "none",
    "sectionStyle": "line-accent",
    "skillDisplay": "chip",
    "hobbiesDisplay": "chips",
    "accentOnName": false,
    "experienceVariant": "default"
  },
};
