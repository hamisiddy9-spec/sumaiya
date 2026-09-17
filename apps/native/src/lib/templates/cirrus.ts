import type { NativeTemplate } from "./types";

/**
 * Cirrus — Cyan, tag labels, dotted divider
 * Generated from apps/web/components/templates/cirrus.tsx (MinimalLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const CirrusTemplate: NativeTemplate = {
  id: "cirrus",
  name: { en: "Cirrus", sw: "Cirrus" },
  blurb: { en: "Cyan, tag labels, dotted divider", sw: "Bluu ya samawati, lebo za tagi, kitenganishi chenye nukta" },
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
    "nameAlign": "center",
    "dividerStyle": "dotted",
    "sectionStyle": "tag",
    "skillDisplay": "bar",
    "hobbiesDisplay": "chips",
    "accentOnName": false,
    "experienceVariant": "default"
  },
};
