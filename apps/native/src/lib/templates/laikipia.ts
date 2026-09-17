import type { NativeTemplate } from "./types";

/**
 * Laikipia — Deep navy, card experience blocks
 * Generated from apps/web/components/templates/laikipia.tsx (SidebarLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const LaikipiaTemplate: NativeTemplate = {
  id: "laikipia",
  name: { en: "Laikipia", sw: "Laikipia" },
  blurb: { en: "Deep navy, card experience blocks", sw: "Bluu nyeusi, vipande vya uzoefu wa kadi" },
  tier: "free",
  previewColor: "#1A1A2E",
  style: "sidebar",
  layout: "SidebarLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "card",
    "skillDisplay": "dot",
    "showTimeline": true,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {
    "color": {
      "sidebarBg": "#1A1A2E",
      "onSidebar": "#F8FAFC",
      "onSidebarMuted": "#94A3B8"
    }
  },
  config: {
    "sidebarWidth": 215,
    "sidebarBg": "#1A1A2E",
    "sidebarBorderColor": "@accent",
    "mainBg": "#FFFFFF",
    "nameColor": "#F8FAFC",
    "titleColor": "@accent",
    "contactIconColor": "@accent",
    "sidebarSectionStyle": "dots",
    "mainSectionStyle": "box",
    "sidebarSections": [
      "skills",
      "languages"
    ],
    "skillDisplay": "dot",
    "photoSize": 78,
    "photoRadius": 50,
    "showTimeline": true,
    "hobbiesDisplay": "chips",
    "experienceVariant": "card"
  },
};
