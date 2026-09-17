import type { NativeTemplate } from "./types";

/**
 * Narok — Full sidebar sections, airy layout
 * Generated from apps/web/components/templates/narok.tsx (SidebarLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const NarokTemplate: NativeTemplate = {
  id: "narok",
  name: { en: "Narok", sw: "Narok" },
  blurb: { en: "Full sidebar sections, airy layout", sw: "Sehemu zote za pembeni, mpangilio wenye nafasi" },
  tier: "free",
  previewColor: "#1A1A2E",
  style: "sidebar",
  layout: "SidebarLayout",
  personality: {
    "density": "airy",
    "experienceVariant": "default",
    "skillDisplay": "bar",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {
    "color": {
      "sidebarBg": "#1A1A2E",
      "onSidebar": "#F8FAFC",
      "onSidebarMuted": "#94A3B8"
    }
  },
  config: {
    "sidebarWidth": 235,
    "sidebarBg": "#1A1A2E",
    "sidebarBorderColor": "@accent",
    "mainBg": "#FFFFFF",
    "nameColor": "#F8FAFC",
    "titleColor": "@accent",
    "contactIconColor": "@accent",
    "sidebarSectionStyle": "none",
    "mainSectionStyle": "underline",
    "sidebarSections": [
      "skills",
      "languages",
      "certifications",
      "hobbies"
    ],
    "skillDisplay": "bar",
    "photoSize": 86,
    "photoRadius": 50,
    "showTimeline": false,
    "hobbiesDisplay": "chips",
    "experienceVariant": "default"
  },
};
