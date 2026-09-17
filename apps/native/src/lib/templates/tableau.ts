import type { NativeTemplate } from "./types";

/**
 * Tableau — Lavender sidebar, square photo, cards
 * Generated from apps/web/components/templates/tableau.tsx (SidebarLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const TableauTemplate: NativeTemplate = {
  id: "tableau",
  name: { en: "Tableau", sw: "Tableau" },
  blurb: { en: "Lavender sidebar, square photo, cards", sw: "Pembeni ya zambarau hafifu, picha ya mraba, kadi" },
  tier: "free",
  previewColor: "#7C3AED",
  style: "creative",
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
      "sidebarBg": "#F5F3FF",
      "onSidebar": "#1F2937",
      "onSidebarMuted": "#6B7280"
    }
  },
  config: {
    "sidebarWidth": 225,
    "sidebarBg": "#F5F3FF",
    "mainBg": "#FFFFFF",
    "nameColor": "#1F2937",
    "titleColor": "@accent",
    "contactIconColor": "@accent",
    "sidebarSectionStyle": "dots",
    "mainSectionStyle": "box",
    "sidebarSections": [
      "skills",
      "languages",
      "certifications"
    ],
    "skillDisplay": "dot",
    "photoSize": 82,
    "photoRadius": 0,
    "showTimeline": true,
    "hobbiesDisplay": "chips",
    "experienceVariant": "card"
  },
};
