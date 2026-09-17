import type { NativeTemplate } from "./types";

/**
 * Malindi — Borderless sections, accent lines
 * Generated from apps/web/components/templates/malindi.tsx (SidebarLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const MalindiTemplate: NativeTemplate = {
  id: "malindi",
  name: { en: "Malindi", sw: "Malindi" },
  blurb: { en: "Borderless sections, accent lines", sw: "Sehemu bila mipaka, mistari ya msisitizo" },
  tier: "free",
  previewColor: "#0F172A",
  style: "sidebar",
  layout: "SidebarLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "default",
    "skillDisplay": "chip",
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
    "sidebarWidth": 225,
    "sidebarBg": "#0F172A",
    "sidebarBorderColor": "@accent",
    "mainBg": "#FFFFFF",
    "nameColor": "#F8FAFC",
    "titleColor": "@accent",
    "contactIconColor": "@accent",
    "sidebarSectionStyle": "none",
    "mainSectionStyle": "line-accent",
    "sidebarSections": [
      "skills",
      "languages",
      "certifications"
    ],
    "skillDisplay": "chip",
    "photoSize": 82,
    "photoRadius": 50,
    "showTimeline": true,
    "hobbiesDisplay": "chips",
    "experienceVariant": "default"
  },
};
