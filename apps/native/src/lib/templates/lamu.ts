import type { NativeTemplate } from "./types";

/**
 * Lamu — Midnight blue, card layout
 * Generated from apps/web/components/templates/lamu.tsx (SidebarLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const LamuTemplate: NativeTemplate = {
  id: "lamu",
  name: { en: "Lamu", sw: "Lamu" },
  blurb: { en: "Midnight blue, card layout", sw: "Bluu ya usiku, mpangilio wa kadi" },
  tier: "free",
  previewColor: "#0D1B2A",
  style: "sidebar",
  layout: "SidebarLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "card",
    "skillDisplay": "chip",
    "showTimeline": true,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {
    "color": {
      "sidebarBg": "#0D1B2A",
      "onSidebar": "#F8FAFC",
      "onSidebarMuted": "#94A3B8"
    }
  },
  config: {
    "sidebarWidth": 210,
    "sidebarBg": "#0D1B2A",
    "sidebarBorderColor": "@accent",
    "mainBg": "#FFFFFF",
    "nameColor": "#F8FAFC",
    "titleColor": "@accent",
    "contactIconColor": "@accent",
    "sidebarSectionStyle": "tag",
    "mainSectionStyle": "box",
    "sidebarSections": [
      "skills",
      "languages"
    ],
    "skillDisplay": "chip",
    "photoSize": 76,
    "photoRadius": 50,
    "showTimeline": true,
    "hobbiesDisplay": "chips",
    "experienceVariant": "card"
  },
};
