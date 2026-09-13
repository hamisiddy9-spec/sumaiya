import type { NativeTemplate } from "./types";

/**
 * Limpopo — Teal-green, wide airy sidebar
 * Generated from apps/web/components/templates/limpopo-cv.tsx (SidebarLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const LimpopoCvTemplate: NativeTemplate = {
  id: "limpopo-cv",
  name: { en: "Limpopo", sw: "Limpopo" },
  // TODO(copy): sw blurb — mirrored from the web description for now.
  blurb: { en: "Teal-green, wide airy sidebar", sw: "Teal-green, wide airy sidebar" },
  tier: "free",
  previewColor: "#0F766E",
  style: "sidebar",
  layout: "SidebarLayout",
  personality: {
    "density": "airy",
    "experienceVariant": "default",
    "skillDisplay": "bar",
    "showTimeline": true,
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
    "sidebarWidth": 235,
    "sidebarBg": "@accent",
    "mainBg": "#FFFFFF",
    "nameColor": "#FFFFFF",
    "titleColor": "rgba(255,255,255,0.8)",
    "contactIconColor": "rgba(255,255,255,0.85)",
    "sidebarSectionStyle": "tag",
    "mainSectionStyle": "dots",
    "sidebarSections": [
      "skills",
      "languages",
      "certifications",
      "hobbies"
    ],
    "skillDisplay": "bar",
    "photoSize": 86,
    "photoRadius": 50,
    "showTimeline": true,
    "hobbiesDisplay": "chips",
    "experienceVariant": "default"
  },
};
