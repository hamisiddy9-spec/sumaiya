import type { NativeTemplate } from "./types";

/**
 * Galana — Deep green accent sidebar
 * Generated from apps/web/components/templates/galana.tsx (SidebarLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const GalanaTemplate: NativeTemplate = {
  id: "galana",
  name: { en: "Galana", sw: "Galana" },
  // TODO(copy): sw blurb — mirrored from the web description for now.
  blurb: { en: "Deep green accent sidebar", sw: "Deep green accent sidebar" },
  tier: "free",
  previewColor: "#166534",
  style: "sidebar",
  layout: "SidebarLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "default",
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
    "sidebarWidth": 215,
    "sidebarBg": "@accent",
    "mainBg": "#FFFFFF",
    "nameColor": "#FFFFFF",
    "titleColor": "rgba(255,255,255,0.8)",
    "contactIconColor": "rgba(255,255,255,0.85)",
    "sidebarSectionStyle": "tag",
    "mainSectionStyle": "underline",
    "sidebarSections": [
      "skills",
      "languages",
      "certifications"
    ],
    "skillDisplay": "dot",
    "photoSize": 78,
    "photoRadius": 50,
    "showTimeline": false,
    "hobbiesDisplay": "chips",
    "experienceVariant": "default"
  },
};
