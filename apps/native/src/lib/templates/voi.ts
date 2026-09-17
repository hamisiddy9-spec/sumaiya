import type { NativeTemplate } from "./types";

/**
 * Voi — Card experience, timeline, rounded photo
 * Generated from apps/web/components/templates/voi.tsx (SidebarLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const VoiTemplate: NativeTemplate = {
  id: "voi",
  name: { en: "Voi", sw: "Voi" },
  blurb: { en: "Card experience, timeline, rounded photo", sw: "Uzoefu wa kadi, mstari wa wakati, picha ya mviringo" },
  tier: "free",
  previewColor: "#0F172A",
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
      "sidebarBg": "#0F172A",
      "onSidebar": "#F8FAFC",
      "onSidebarMuted": "#94A3B8"
    }
  },
  config: {
    "sidebarWidth": 215,
    "sidebarBg": "#0F172A",
    "sidebarBorderColor": "@accent",
    "mainBg": "#FFFFFF",
    "nameColor": "#F8FAFC",
    "titleColor": "@accent",
    "contactIconColor": "@accent",
    "sidebarSectionStyle": "tag",
    "mainSectionStyle": "line-accent",
    "sidebarSections": [
      "skills",
      "languages"
    ],
    "skillDisplay": "dot",
    "photoSize": 78,
    "photoRadius": 8,
    "showTimeline": true,
    "hobbiesDisplay": "chips",
    "experienceVariant": "card"
  },
};
