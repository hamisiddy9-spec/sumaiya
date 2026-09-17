import type { NativeTemplate } from "./types";

/**
 * Cobblestone — Warm dark, numbered main, table exp, timeline
 * Generated from apps/web/components/templates/cobblestone.tsx (SidebarLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const CobblestoneTemplate: NativeTemplate = {
  id: "cobblestone",
  name: { en: "Cobblestone", sw: "Cobblestone" },
  blurb: { en: "Warm dark, numbered main, table exp, timeline", sw: "Nyeusi ya joto, sehemu kuu yenye namba, uzoefu kwa jedwali, mstari wa wakati" },
  tier: "free",
  previewColor: "#1C1917",
  style: "sidebar",
  layout: "SidebarLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "table",
    "skillDisplay": "bar",
    "showTimeline": true,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {
    "color": {
      "sidebarBg": "#292524",
      "onSidebar": "#F8FAFC",
      "onSidebarMuted": "#94A3B8"
    }
  },
  config: {
    "sidebarWidth": 215,
    "sidebarBg": "#292524",
    "sidebarBorderColor": "@accent",
    "mainBg": "#FFFFFF",
    "nameColor": "#F8FAFC",
    "titleColor": "@accent",
    "contactIconColor": "@accent",
    "sidebarSectionStyle": "tag",
    "mainSectionStyle": "numbered",
    "sidebarSections": [
      "skills",
      "certifications"
    ],
    "skillDisplay": "bar",
    "photoSize": 76,
    "photoRadius": 8,
    "showTimeline": true,
    "hobbiesDisplay": "chips",
    "experienceVariant": "table"
  },
};
