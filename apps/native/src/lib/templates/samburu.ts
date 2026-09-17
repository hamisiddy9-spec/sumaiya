import type { NativeTemplate } from "./types";

/**
 * Samburu — Wide dark sidebar, accent lines
 * Generated from apps/web/components/templates/samburu.tsx (SidebarLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const SamburuTemplate: NativeTemplate = {
  id: "samburu",
  name: { en: "Samburu", sw: "Samburu" },
  blurb: { en: "Wide dark sidebar, accent lines", sw: "Pembeni pana nyeusi, mistari ya msisitizo" },
  tier: "free",
  previewColor: "#0F172A",
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
      "sidebarBg": "#0F172A",
      "onSidebar": "#F8FAFC",
      "onSidebarMuted": "#94A3B8"
    }
  },
  config: {
    "sidebarWidth": 230,
    "sidebarBg": "#0F172A",
    "sidebarBorderColor": "@accent",
    "mainBg": "#FFFFFF",
    "nameColor": "#F8FAFC",
    "titleColor": "@accent",
    "contactIconColor": "@accent",
    "sidebarSectionStyle": "tag",
    "mainSectionStyle": "line-accent",
    "sidebarSections": [
      "skills",
      "languages",
      "certifications",
      "hobbies"
    ],
    "skillDisplay": "bar",
    "photoSize": 85,
    "photoRadius": 50,
    "showTimeline": false,
    "hobbiesDisplay": "chips",
    "experienceVariant": "default"
  },
};
