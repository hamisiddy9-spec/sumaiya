import type { NativeTemplate } from "./types";

/**
 * Awash — Deep plum, card blocks, airy
 * Generated from apps/web/components/templates/awash.tsx (SidebarLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const AwashTemplate: NativeTemplate = {
  id: "awash",
  name: { en: "Awash", sw: "Awash" },
  blurb: { en: "Deep plum, card blocks, airy", sw: "Zambarau nyeusi, vipande vya kadi, nafasi nyingi" },
  tier: "free",
  previewColor: "#4A044E",
  style: "sidebar",
  layout: "SidebarLayout",
  personality: {
    "density": "airy",
    "experienceVariant": "card",
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
    "sidebarWidth": 230,
    "sidebarBg": "@accent",
    "mainBg": "#FFFFFF",
    "nameColor": "#FFFFFF",
    "titleColor": "rgba(255,255,255,0.8)",
    "contactIconColor": "rgba(255,255,255,0.85)",
    "sidebarSectionStyle": "none",
    "mainSectionStyle": "underline",
    "sidebarSections": [
      "skills",
      "languages",
      "certifications",
      "hobbies"
    ],
    "skillDisplay": "bar",
    "photoSize": 84,
    "photoRadius": 50,
    "showTimeline": false,
    "hobbiesDisplay": "chips",
    "experienceVariant": "card"
  },
};
