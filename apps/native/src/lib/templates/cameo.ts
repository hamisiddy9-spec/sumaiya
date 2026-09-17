import type { NativeTemplate } from "./types";

/**
 * Cameo — Warm cream sidebar, amber accent
 * Generated from apps/web/components/templates/cameo.tsx (SidebarLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const CameoTemplate: NativeTemplate = {
  id: "cameo",
  name: { en: "Cameo", sw: "Cameo" },
  blurb: { en: "Warm cream sidebar, amber accent", sw: "Pembeni ya krimu ya joto, msisitizo wa njano" },
  tier: "free",
  previewColor: "#D97706",
  style: "creative",
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
      "sidebarBg": "#FFF7ED",
      "onSidebar": "#1F2937",
      "onSidebarMuted": "#6B7280"
    }
  },
  config: {
    "sidebarWidth": 220,
    "sidebarBg": "#FFF7ED",
    "mainBg": "#FFFFFF",
    "nameColor": "#1F2937",
    "titleColor": "@accent",
    "contactIconColor": "@accent",
    "sidebarSectionStyle": "none",
    "mainSectionStyle": "underline",
    "sidebarSections": [
      "skills",
      "languages",
      "certifications"
    ],
    "skillDisplay": "bar",
    "photoSize": 80,
    "photoRadius": 50,
    "showTimeline": false,
    "hobbiesDisplay": "chips",
    "experienceVariant": "default"
  },
};
