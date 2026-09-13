import type { NativeTemplate } from "./types";

/**
 * Slab — Numbered headers, table experience, tag-rated skills
 * Generated from apps/web/components/templates/slab.tsx (MinimalLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const SlabTemplate: NativeTemplate = {
  id: "slab",
  name: { en: "Slab", sw: "Slab" },
  // TODO(copy): sw blurb — mirrored from the web description for now.
  blurb: { en: "Numbered headers, table experience, tag-rated skills", sw: "Numbered headers, table experience, tag-rated skills" },
  tier: "free",
  previewColor: "#374151",
  style: "minimal",
  layout: "MinimalLayout",
  personality: {
    "density": "compact",
    "experienceVariant": "table",
    "skillDisplay": "tag-rated",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "bg": "#FFFFFF",
    "nameAlign": "left",
    "dividerStyle": "solid",
    "sectionStyle": "numbered",
    "skillDisplay": "tag-rated",
    "hobbiesDisplay": "chips",
    "accentOnName": false,
    "experienceVariant": "table"
  },
};
