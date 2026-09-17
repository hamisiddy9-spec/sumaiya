import type { NativeTemplate } from "./types";

/**
 * Mesa — Warm sand sidebar, compact, square
 * Generated from apps/web/components/templates/mesa.tsx (SidebarLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const MesaTemplate: NativeTemplate = {
  id: "mesa",
  name: { en: "Mesa", sw: "Mesa" },
  blurb: { en: "Warm sand sidebar, compact, square", sw: "Pembeni ya mchanga wa joto, fupi, mraba" },
  tier: "free",
  previewColor: "#92400E",
  style: "creative",
  layout: "SidebarLayout",
  personality: {
    "density": "compact",
    "experienceVariant": "compact",
    "skillDisplay": "bar",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {
    "color": {
      "sidebarBg": "#FFF7ED",
      "onSidebar": "#1F2937",
      "onSidebarMuted": "#6B7280"
    }
  },
  config: {
    "sidebarWidth": 210,
    "sidebarBg": "#FFF7ED",
    "mainBg": "#FFFFFF",
    "nameColor": "#1F2937",
    "titleColor": "@accent",
    "contactIconColor": "@accent",
    "sidebarSectionStyle": "tag",
    "mainSectionStyle": "dots",
    "sidebarSections": [
      "skills",
      "certifications"
    ],
    "skillDisplay": "bar",
    "photoSize": 76,
    "photoRadius": 0,
    "showTimeline": false,
    "hobbiesDisplay": "chips",
    "experienceVariant": "compact"
  },
};
