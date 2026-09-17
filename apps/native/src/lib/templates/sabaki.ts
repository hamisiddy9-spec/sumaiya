import type { NativeTemplate } from "./types";

/**
 * Sabaki — Navy accent, dot labels, accent lines
 * Generated from apps/web/components/templates/sabaki.tsx (SidebarLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const SabakiTemplate: NativeTemplate = {
  id: "sabaki",
  name: { en: "Sabaki", sw: "Sabaki" },
  blurb: { en: "Navy accent, dot labels, accent lines", sw: "Msisitizo wa bluu nyeusi, lebo za vitone, mistari ya rangi" },
  tier: "free",
  previewColor: "#1E3A5F",
  style: "sidebar",
  layout: "SidebarLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "default",
    "skillDisplay": "bar",
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
    "sidebarWidth": 225,
    "sidebarBg": "@accent",
    "mainBg": "#FFFFFF",
    "nameColor": "#FFFFFF",
    "titleColor": "rgba(255,255,255,0.8)",
    "contactIconColor": "rgba(255,255,255,0.85)",
    "sidebarSectionStyle": "dots",
    "mainSectionStyle": "line-accent",
    "sidebarSections": [
      "skills",
      "certifications",
      "hobbies"
    ],
    "skillDisplay": "bar",
    "photoSize": 82,
    "photoRadius": 50,
    "showTimeline": false,
    "hobbiesDisplay": "chips",
    "experienceVariant": "default"
  },
};
