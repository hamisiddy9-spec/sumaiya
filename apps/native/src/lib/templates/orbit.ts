import type { NativeTemplate } from "./types";

/**
 * Orbit — Cyan, dot sections, dotted divider
 * Generated from apps/web/components/templates/orbit.tsx (MinimalLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const OrbitTemplate: NativeTemplate = {
  id: "orbit",
  name: { en: "Orbit", sw: "Orbit" },
  blurb: { en: "Cyan, dot sections, dotted divider", sw: "Bluu ya samawati, sehemu za vitone, kitenganishi cha vitone" },
  tier: "free",
  previewColor: "#0891B2",
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
    "nameAlign": "center",
    "dividerStyle": "dotted",
    "sectionStyle": "dots",
    "skillDisplay": "chip",
    "hobbiesDisplay": "chips",
    "accentOnName": false,
    "experienceVariant": "default"
  },
};
