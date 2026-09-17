import type { NativeTemplate } from "./types";

/**
 * Bangweulu — Purple accent, timeline, dot sections
 * Generated from apps/web/components/templates/bangweulu.tsx (SidebarLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const BangweuluTemplate: NativeTemplate = {
  id: "bangweulu",
  name: { en: "Bangweulu", sw: "Bangweulu" },
  blurb: { en: "Purple accent, timeline, dot sections", sw: "Msisitizo wa zambarau, timeline, sehemu zenye nukta" },
  tier: "free",
  previewColor: "#7C3AED",
  style: "sidebar",
  layout: "SidebarLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "default",
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
    "sidebarSectionStyle": "tag",
    "mainSectionStyle": "dots",
    "sidebarSections": [
      "skills",
      "languages"
    ],
    "skillDisplay": "dot",
    "photoSize": 76,
    "photoRadius": 50,
    "showTimeline": true,
    "hobbiesDisplay": "chips",
    "experienceVariant": "default"
  },
};
