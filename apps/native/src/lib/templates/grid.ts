import type { NativeTemplate } from "./types";

/**
 * Grid — ATS-strict, machine-readable
 * Generated from apps/web/components/templates/grid.tsx (MinimalLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const GridTemplate: NativeTemplate = {
  id: "grid",
  name: { en: "Grid", sw: "Grid" },
  blurb: { en: "ATS-strict, machine-readable", sw: "Kali kwa ATS, inasomwa na mashine" },
  tier: "free",
  previewColor: "#0F172A",
  style: "minimal",
  layout: "MinimalLayout",
  personality: {
    "density": "compact",
    "experienceVariant": "default",
    "skillDisplay": "chip",
    "hobbiesDisplay": "text"
  },
  tokenOverrides: {
    "color": {
      "text": "#0F172A",
      "sub": "#334155",
      "muted": "#64748B"
    }
  },
  config: {
    "bg": "#FFFFFF",
    "nameAlign": "left",
    "dividerStyle": "solid",
    "sectionStyle": "underline",
    "skillDisplay": "chip",
    "hobbiesDisplay": "text",
    "accentOnName": false,
    "experienceVariant": "default"
  },
};
