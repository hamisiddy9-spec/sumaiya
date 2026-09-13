import type { NativeTemplate } from "./types";

/**
 * Baro — Dark amber, compact, rounded photo
 * Generated from apps/web/components/templates/baro.tsx (SidebarLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const BaroTemplate: NativeTemplate = {
  id: "baro",
  name: { en: "Baro", sw: "Baro" },
  // TODO(copy): sw blurb — mirrored from the web description for now.
  blurb: { en: "Dark amber, compact, rounded photo", sw: "Dark amber, compact, rounded photo" },
  tier: "free",
  previewColor: "#422006",
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
    "sidebarWidth": 210,
    "sidebarBg": "@accent",
    "mainBg": "#FFFFFF",
    "nameColor": "#FFFFFF",
    "titleColor": "rgba(255,255,255,0.8)",
    "contactIconColor": "rgba(255,255,255,0.85)",
    "sidebarSectionStyle": "tag",
    "mainSectionStyle": "box",
    "sidebarSections": [
      "skills",
      "certifications"
    ],
    "skillDisplay": "dot",
    "photoSize": 76,
    "photoRadius": 8,
    "showTimeline": false,
    "hobbiesDisplay": "chips",
    "experienceVariant": "compact"
  },
};
