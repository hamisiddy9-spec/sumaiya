import type { NativeTemplate } from "./types";

/**
 * Turkana — Charcoal sidebar, dot skills, timeline
 * Generated from apps/web/components/templates/turkana.tsx (SidebarLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const TurkanaTemplate: NativeTemplate = {
  id: "turkana",
  name: { en: "Turkana", sw: "Turkana" },
  blurb: { en: "Charcoal sidebar, dot skills, timeline", sw: "Pembeni ya mkaa, ujuzi katika nukta, timeline" },
  tier: "free",
  previewColor: "#1E293B",
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
      "sidebarBg": "#1E293B",
      "onSidebar": "#F8FAFC",
      "onSidebarMuted": "#94A3B8"
    }
  },
  config: {
    "sidebarWidth": 210,
    "sidebarBg": "#1E293B",
    "sidebarBorderColor": "@accent",
    "mainBg": "#FFFFFF",
    "nameColor": "#F8FAFC",
    "titleColor": "@accent",
    "contactIconColor": "@accent",
    "sidebarSectionStyle": "tag",
    "mainSectionStyle": "dots",
    "sidebarSections": [
      "skills",
      "languages"
    ],
    "skillDisplay": "dot",
    "photoSize": 75,
    "photoRadius": 50,
    "showTimeline": true,
    "hobbiesDisplay": "chips",
    "experienceVariant": "default"
  },
};
