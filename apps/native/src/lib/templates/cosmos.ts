import type { NativeTemplate } from "./types";

/**
 * Cosmos — Dark centered name, accent lines, airy
 * Generated from apps/web/components/templates/cosmos.tsx (MinimalLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const CosmosTemplate: NativeTemplate = {
  id: "cosmos",
  name: { en: "Cosmos", sw: "Cosmos" },
  // TODO(copy): sw blurb — mirrored from the web description for now.
  blurb: { en: "Dark centered name, accent lines, airy", sw: "Dark centered name, accent lines, airy" },
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
    "nameAlign": "center",
    "dividerStyle": "none",
    "sectionStyle": "line-accent",
    "skillDisplay": "bar",
    "hobbiesDisplay": "chips",
    "accentOnName": true,
    "experienceVariant": "default"
  },
};
