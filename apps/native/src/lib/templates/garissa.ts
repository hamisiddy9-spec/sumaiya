import type { NativeTemplate } from "./types";

/**
 * Garissa — Square photo, chip skills
 * Generated from apps/web/components/templates/garissa.tsx (SidebarLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const GarissaTemplate: NativeTemplate = {
  id: "garissa",
  name: { en: "Garissa", sw: "Garissa" },
  blurb: { en: "Square photo, chip skills", sw: "Picha ya mraba, ujuzi kwa vibao" },
  tier: "free",
  previewColor: "#111827",
  style: "sidebar",
  layout: "SidebarLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "default",
    "skillDisplay": "chip",
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
    "sidebarWidth": 220,
    "sidebarBg": "#111827",
    "sidebarBorderColor": "@accent",
    "mainBg": "#FFFFFF",
    "nameColor": "#F8FAFC",
    "titleColor": "@accent",
    "contactIconColor": "@accent",
    "sidebarSectionStyle": "tag",
    "mainSectionStyle": "underline",
    "sidebarSections": [
      "skills",
      "languages",
      "certifications"
    ],
    "skillDisplay": "chip",
    "photoSize": 80,
    "photoRadius": 0,
    "showTimeline": false,
    "hobbiesDisplay": "chips",
    "experienceVariant": "default"
  },
};
