import type { NativeTemplate } from "./types";

/**
 * Equinox — No divider, borderless, spacious
 * Generated from apps/web/components/templates/equinox.tsx (MinimalLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const EquinoxTemplate: NativeTemplate = {
  id: "equinox",
  name: { en: "Equinox", sw: "Equinox" },
  blurb: { en: "No divider, borderless, spacious", sw: "Bila kitenganishi, bila mipaka, nafasi nyingi" },
  tier: "free",
  previewColor: "#374151",
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
    "dividerStyle": "none",
    "sectionStyle": "none",
    "skillDisplay": "chip",
    "hobbiesDisplay": "chips",
    "accentOnName": false,
    "experienceVariant": "default"
  },
};
