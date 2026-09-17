import type { NativeTemplate } from "./types";

/**
 * Kavango — Violet accent, compact, dot labels
 * Generated from apps/web/components/templates/kavango.tsx (SidebarLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const KavangoTemplate: NativeTemplate = {
  id: "kavango",
  name: { en: "Kavango", sw: "Kavango" },
  blurb: { en: "Violet accent, compact, dot labels", sw: "Msisitizo wa zambarau, fupi, lebo za vitone" },
  tier: "free",
  previewColor: "#6D28D9",
  style: "sidebar",
  layout: "SidebarLayout",
  personality: {
    "density": "compact",
    "experienceVariant": "compact",
    "skillDisplay": "dot",
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
    "sidebarSectionStyle": "dots",
    "mainSectionStyle": "underline",
    "sidebarSections": [
      "skills",
      "certifications"
    ],
    "skillDisplay": "dot",
    "photoSize": 74,
    "photoRadius": 50,
    "showTimeline": false,
    "hobbiesDisplay": "chips",
    "experienceVariant": "compact"
  },
};
