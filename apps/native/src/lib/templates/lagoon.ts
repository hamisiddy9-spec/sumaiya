import type { NativeTemplate } from "./types";

/**
 * Lagoon — Teal mint sidebar, rounded photo
 * Generated from apps/web/components/templates/lagoon.tsx (SidebarLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const LagoonTemplate: NativeTemplate = {
  id: "lagoon",
  name: { en: "Lagoon", sw: "Lagoon" },
  blurb: { en: "Teal mint sidebar, rounded photo", sw: "Pembeni ya kijani hafifu cha bahari, picha ya mviringo" },
  tier: "free",
  previewColor: "#0F766E",
  style: "creative",
  layout: "SidebarLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "default",
    "skillDisplay": "dot",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {
    "color": {
      "sidebarBg": "#ECFDF5",
      "onSidebar": "#1F2937",
      "onSidebarMuted": "#6B7280"
    }
  },
  config: {
    "sidebarWidth": 210,
    "sidebarBg": "#ECFDF5",
    "mainBg": "#FFFFFF",
    "nameColor": "#1F2937",
    "titleColor": "@accent",
    "contactIconColor": "@accent",
    "sidebarSectionStyle": "none",
    "mainSectionStyle": "dots",
    "sidebarSections": [
      "skills",
      "languages"
    ],
    "skillDisplay": "dot",
    "photoSize": 76,
    "photoRadius": 8,
    "showTimeline": false,
    "hobbiesDisplay": "chips",
    "experienceVariant": "default"
  },
};
