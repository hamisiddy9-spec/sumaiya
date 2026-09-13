import type { NativeTemplate } from "./types";

/**
 * Trace — Ruled sections, dotted divider, left-aligned
 * Generated from apps/web/components/templates/trace.tsx (MinimalLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const TraceTemplate: NativeTemplate = {
  id: "trace",
  name: { en: "Trace", sw: "Trace" },
  // TODO(copy): sw blurb — mirrored from the web description for now.
  blurb: { en: "Ruled sections, dotted divider, left-aligned", sw: "Ruled sections, dotted divider, left-aligned" },
  tier: "free",
  previewColor: "#0891B2",
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
    "nameAlign": "left",
    "dividerStyle": "dotted",
    "sectionStyle": "ruled",
    "skillDisplay": "bar",
    "hobbiesDisplay": "chips",
    "accentOnName": false,
    "experienceVariant": "default"
  },
};
