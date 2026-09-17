import type { NativeTemplate } from "./types";

/**
 * Watamu — Narrow compact sidebar, skills only
 * Generated from apps/web/components/templates/watamu.tsx (SidebarLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const WatamuTemplate: NativeTemplate = {
  id: "watamu",
  name: { en: "Watamu", sw: "Watamu" },
  blurb: { en: "Narrow compact sidebar, skills only", sw: "Pembeni nyembamba fupi, ujuzi pekee" },
  tier: "free",
  previewColor: "#111827",
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
      "sidebarBg": "#111827",
      "onSidebar": "#F8FAFC",
      "onSidebarMuted": "#94A3B8"
    }
  },
  config: {
    "sidebarWidth": 195,
    "sidebarBg": "#111827",
    "sidebarBorderColor": "@accent",
    "mainBg": "#FFFFFF",
    "nameColor": "#F8FAFC",
    "titleColor": "@accent",
    "contactIconColor": "@accent",
    "sidebarSectionStyle": "tag",
    "mainSectionStyle": "dots",
    "sidebarSections": [
      "skills"
    ],
    "skillDisplay": "dot",
    "photoSize": 68,
    "photoRadius": 8,
    "showTimeline": false,
    "hobbiesDisplay": "chips",
    "experienceVariant": "compact"
  },
};
