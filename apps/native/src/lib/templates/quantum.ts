import type { NativeTemplate } from "./types";

/**
 * Quantum — Charcoal, borderless centered body
 * Generated from apps/web/components/templates/quantum.tsx (MinimalLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const QuantumTemplate: NativeTemplate = {
  id: "quantum",
  name: { en: "Quantum", sw: "Quantum" },
  blurb: { en: "Charcoal, borderless centered body", sw: "Mkaa, maudhui bila mipaka katikati" },
  tier: "free",
  previewColor: "#1E293B",
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
    "dividerStyle": "solid",
    "sectionStyle": "none",
    "skillDisplay": "bar",
    "hobbiesDisplay": "chips",
    "accentOnName": false,
    "experienceVariant": "default"
  },
};
