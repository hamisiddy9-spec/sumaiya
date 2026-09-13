import type { NativeTemplate } from "./types";

/**
 * Gambia — Royal blue accent sidebar
 * Generated from apps/web/components/templates/gambia-cv.tsx (SidebarLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const GambiaCvTemplate: NativeTemplate = {
  id: "gambia-cv",
  name: { en: "Gambia", sw: "Gambia" },
  // TODO(copy): sw blurb — mirrored from the web description for now.
  blurb: { en: "Royal blue accent sidebar", sw: "Royal blue accent sidebar" },
  tier: "free",
  previewColor: "#1D4ED8",
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
    "sidebarWidth": 220,
    "sidebarBg": "@accent",
    "mainBg": "#FFFFFF",
    "nameColor": "#FFFFFF",
    "titleColor": "rgba(255,255,255,0.8)",
    "contactIconColor": "rgba(255,255,255,0.85)",
    "sidebarSectionStyle": "tag",
    "mainSectionStyle": "underline",
    "sidebarSections": [
      "skills",
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
