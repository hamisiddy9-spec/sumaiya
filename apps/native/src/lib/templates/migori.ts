import type { NativeTemplate } from "./types";

/**
 * Migori — Dot-style sections throughout
 * Generated from apps/web/components/templates/migori.tsx (SidebarLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const MigoriTemplate: NativeTemplate = {
  id: "migori",
  name: { en: "Migori", sw: "Migori" },
  blurb: { en: "Dot-style sections throughout", sw: "Sehemu zenye nukta kote" },
  tier: "free",
  previewColor: "#111827",
  style: "sidebar",
  layout: "SidebarLayout",
  personality: {
    "density": "compact",
    "experienceVariant": "compact",
    "skillDisplay": "bar",
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
    "sidebarWidth": 215,
    "sidebarBg": "#111827",
    "sidebarBorderColor": "@accent",
    "mainBg": "#FFFFFF",
    "nameColor": "#F8FAFC",
    "titleColor": "@accent",
    "contactIconColor": "@accent",
    "sidebarSectionStyle": "dots",
    "mainSectionStyle": "dots",
    "sidebarSections": [
      "skills",
      "languages",
      "certifications"
    ],
    "skillDisplay": "bar",
    "photoSize": 78,
    "photoRadius": 50,
    "showTimeline": false,
    "hobbiesDisplay": "chips",
    "experienceVariant": "compact"
  },
};
