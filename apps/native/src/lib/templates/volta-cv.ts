import type { NativeTemplate } from "./types";

/**
 * Volta — Brown accent, square photo, card blocks
 * Generated from apps/web/components/templates/volta-cv.tsx (SidebarLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const VoltaCvTemplate: NativeTemplate = {
  id: "volta-cv",
  name: { en: "Volta", sw: "Volta" },
  blurb: { en: "Brown accent, square photo, card blocks", sw: "Msisitizo wa kahawia, picha ya mraba, vipande vya kadi" },
  tier: "free",
  previewColor: "#7C2D12",
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
      "sidebarBg": "@accent",
      "onSidebar": "#FFFFFF",
      "onSidebarMuted": "rgba(255,255,255,0.7)"
    }
  },
  config: {
    "sidebarWidth": 210,
    "sidebarBg": "@accent",
    "mainBg": "#FFFFFF",
    "nameColor": "#FFFFFF",
    "titleColor": "rgba(255,255,255,0.8)",
    "contactIconColor": "rgba(255,255,255,0.85)",
    "sidebarSectionStyle": "dots",
    "mainSectionStyle": "box",
    "sidebarSections": [
      "skills",
      "languages"
    ],
    "skillDisplay": "dot",
    "photoSize": 76,
    "photoRadius": 0,
    "showTimeline": true,
    "hobbiesDisplay": "chips",
    "experienceVariant": "card"
  },
};
