import type { NativeTemplate } from "./types";

/**
 * Tana — Deep ocean blue, square photo
 * Generated from apps/web/components/templates/tana.tsx (SidebarLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const TanaTemplate: NativeTemplate = {
  id: "tana",
  name: { en: "Tana", sw: "Tana" },
  // TODO(copy): sw blurb — mirrored from the web description for now.
  blurb: { en: "Deep ocean blue, square photo", sw: "Deep ocean blue, square photo" },
  tier: "free",
  previewColor: "#0C4A6E",
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
    "mainSectionStyle": "line-accent",
    "sidebarSections": [
      "skills",
      "languages",
      "certifications"
    ],
    "skillDisplay": "bar",
    "photoSize": 80,
    "photoRadius": 0,
    "showTimeline": false,
    "hobbiesDisplay": "chips",
    "experienceVariant": "default"
  },
};
