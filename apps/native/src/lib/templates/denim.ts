import type { NativeTemplate } from "./types";

/**
 * Denim — Ice blue sidebar, pill mains, card experience
 * Generated from apps/web/components/templates/denim.tsx (SidebarLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const DenimTemplate: NativeTemplate = {
  id: "denim",
  name: { en: "Denim", sw: "Denim" },
  blurb: { en: "Ice blue sidebar, pill mains, card experience", sw: "Pembeni ya bluu hafifu, sehemu kuu za vidonge, uzoefu wa kadi" },
  tier: "free",
  previewColor: "#1D4ED8",
  style: "sidebar",
  layout: "SidebarLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "card",
    "skillDisplay": "chip",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {
    "color": {
      "sidebarBg": "#EFF6FF",
      "onSidebar": "#1F2937",
      "onSidebarMuted": "#6B7280"
    }
  },
  config: {
    "sidebarWidth": 205,
    "sidebarBg": "#EFF6FF",
    "sidebarBorderColor": "@accent",
    "mainBg": "#FFFFFF",
    "nameColor": "#1F2937",
    "titleColor": "@accent",
    "contactIconColor": "@accent",
    "sidebarSectionStyle": "dots",
    "mainSectionStyle": "pill",
    "sidebarSections": [
      "skills",
      "languages"
    ],
    "skillDisplay": "chip",
    "photoSize": 74,
    "photoRadius": 8,
    "showTimeline": false,
    "hobbiesDisplay": "chips",
    "experienceVariant": "card"
  },
};
