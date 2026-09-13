import type { NativeTemplate } from "./types";

/**
 * Folio — Pill labels, tag-rated skills, timeline-v2, airy
 * Generated from apps/web/components/templates/folio.tsx (MinimalLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const FolioTemplate: NativeTemplate = {
  id: "folio",
  name: { en: "Folio", sw: "Folio" },
  // TODO(copy): sw blurb — mirrored from the web description for now.
  blurb: { en: "Pill labels, tag-rated skills, timeline-v2, airy", sw: "Pill labels, tag-rated skills, timeline-v2, airy" },
  tier: "free",
  previewColor: "#059669",
  style: "minimal",
  layout: "MinimalLayout",
  personality: {
    "density": "airy",
    "experienceVariant": "timeline-v2",
    "skillDisplay": "tag-rated",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "bg": "#FFFFFF",
    "nameAlign": "left",
    "dividerStyle": "none",
    "sectionStyle": "pill",
    "skillDisplay": "tag-rated",
    "hobbiesDisplay": "chips",
    "accentOnName": false,
    "experienceVariant": "timeline-v2"
  },
};
