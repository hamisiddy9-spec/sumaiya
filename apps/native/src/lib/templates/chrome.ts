import type { NativeTemplate } from "./types";

/**
 * Chrome — Light sidebar, numbered main, grid skills
 * Generated from apps/web/components/templates/chrome.tsx (SidebarLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const ChromeTemplate: NativeTemplate = {
  id: "chrome",
  name: { en: "Chrome", sw: "Chrome" },
  blurb: { en: "Light sidebar, numbered main, grid skills", sw: "Pembeni nyepesi, sehemu kuu yenye namba, ujuzi kwa gridi" },
  tier: "free",
  previewColor: "#1D4ED8",
  style: "sidebar",
  layout: "SidebarLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "default",
    "skillDisplay": "grid",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {
    "color": {
      "sidebarBg": "#F1F5F9",
      "onSidebar": "#1F2937",
      "onSidebarMuted": "#6B7280"
    }
  },
  config: {
    "sidebarWidth": 210,
    "sidebarBg": "#F1F5F9",
    "sidebarBorderColor": "@accent",
    "mainBg": "#FFFFFF",
    "nameColor": "#1F2937",
    "titleColor": "@accent",
    "contactIconColor": "@accent",
    "sidebarSectionStyle": "none",
    "mainSectionStyle": "numbered",
    "sidebarSections": [
      "skills",
      "languages"
    ],
    "skillDisplay": "grid",
    "photoSize": 76,
    "photoRadius": 50,
    "showTimeline": false,
    "hobbiesDisplay": "chips",
    "experienceVariant": "default"
  },
};
