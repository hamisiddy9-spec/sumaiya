import type { NativeTemplate } from "./types";

/**
 * Ruvuma — Pink accent, card experience
 * Generated from apps/web/components/templates/ruvuma.tsx (SidebarLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const RuvumaTemplate: NativeTemplate = {
  id: "ruvuma",
  name: { en: "Ruvuma", sw: "Ruvuma" },
  blurb: { en: "Pink accent, card experience", sw: "Msisitizo wa waridi, uzoefu wa kadi" },
  tier: "free",
  previewColor: "#BE185D",
  style: "sidebar",
  layout: "SidebarLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "card",
    "skillDisplay": "bar",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {
    "color": {
      "sidebarBg": "@accent",
      "onSidebar": "#FFFFFF",
      "onSidebarMuted": "rgba(255,255,255,0.7)"
    }
  },
  config: {
    "sidebarWidth": 215,
    "sidebarBg": "@accent",
    "mainBg": "#FFFFFF",
    "nameColor": "#FFFFFF",
    "titleColor": "rgba(255,255,255,0.8)",
    "contactIconColor": "rgba(255,255,255,0.85)",
    "sidebarSectionStyle": "tag",
    "mainSectionStyle": "line-accent",
    "sidebarSections": [
      "skills",
      "languages"
    ],
    "skillDisplay": "bar",
    "photoSize": 78,
    "photoRadius": 50,
    "showTimeline": false,
    "hobbiesDisplay": "chips",
    "experienceVariant": "card"
  },
};
