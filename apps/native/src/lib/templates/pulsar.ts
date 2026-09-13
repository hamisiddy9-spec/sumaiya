import type { NativeTemplate } from "./types";

/**
 * Pulsar — Dark name, tag labels, compact
 * Generated from apps/web/components/templates/pulsar.tsx (MinimalLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const PulsarTemplate: NativeTemplate = {
  id: "pulsar",
  name: { en: "Pulsar", sw: "Pulsar" },
  // TODO(copy): sw blurb — mirrored from the web description for now.
  blurb: { en: "Dark name, tag labels, compact", sw: "Dark name, tag labels, compact" },
  tier: "free",
  previewColor: "#0F172A",
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
    "dividerStyle": "solid",
    "sectionStyle": "tag",
    "skillDisplay": "chip",
    "hobbiesDisplay": "chips",
    "accentOnName": true,
    "experienceVariant": "compact"
  },
};
