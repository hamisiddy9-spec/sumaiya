import type { NativeTemplate } from "./types";

/**
 * Kagera — Blue accent, rounded, compact
 * Generated from apps/web/components/templates/kagera.tsx (SidebarLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const KageraTemplate: NativeTemplate = {
  id: "kagera",
  name: { en: "Kagera", sw: "Kagera" },
  blurb: { en: "Blue accent, rounded, compact", sw: "Msisitizo wa bluu, mviringo, fupi" },
  tier: "free",
  previewColor: "#0369A1",
  style: "sidebar",
  layout: "SidebarLayout",
  personality: {
    "density": "compact",
    "experienceVariant": "compact",
    "skillDisplay": "chip",
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
    "sidebarWidth": 205,
    "sidebarBg": "@accent",
    "mainBg": "#FFFFFF",
    "nameColor": "#FFFFFF",
    "titleColor": "rgba(255,255,255,0.8)",
    "contactIconColor": "rgba(255,255,255,0.85)",
    "sidebarSectionStyle": "none",
    "mainSectionStyle": "dots",
    "sidebarSections": [
      "skills",
      "certifications"
    ],
    "skillDisplay": "chip",
    "photoSize": 74,
    "photoRadius": 8,
    "showTimeline": false,
    "hobbiesDisplay": "chips",
    "experienceVariant": "compact"
  },
};
