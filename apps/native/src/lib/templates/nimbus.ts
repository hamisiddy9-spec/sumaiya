import type { NativeTemplate } from "./types";

/**
 * Nimbus — Blue name, compact, no divider
 * Generated from apps/web/components/templates/nimbus.tsx (MinimalLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const NimbusTemplate: NativeTemplate = {
  id: "nimbus",
  name: { en: "Nimbus", sw: "Nimbus" },
  // TODO(copy): sw blurb — mirrored from the web description for now.
  blurb: { en: "Blue name, compact, no divider", sw: "Blue name, compact, no divider" },
  tier: "free",
  previewColor: "#1D4ED8",
  style: "minimal",
  layout: "MinimalLayout",
  personality: {
    "density": "compact",
    "experienceVariant": "compact",
    "skillDisplay": "chip",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "bg": "#FFFFFF",
    "nameAlign": "center",
    "dividerStyle": "none",
    "sectionStyle": "underline",
    "skillDisplay": "chip",
    "hobbiesDisplay": "chips",
    "accentOnName": true,
    "experienceVariant": "compact"
  },
};
