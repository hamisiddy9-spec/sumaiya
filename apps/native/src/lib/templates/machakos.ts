import type { NativeTemplate } from "./types";

/**
 * Machakos — Midnight, timeline, dot labels
 * Generated from apps/web/components/templates/machakos.tsx (SidebarLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const MachakosTemplate: NativeTemplate = {
  id: "machakos",
  name: { en: "Machakos", sw: "Machakos" },
  blurb: { en: "Midnight, timeline, dot labels", sw: "Usiku wa manane, mstari wa wakati, lebo za vitone" },
  tier: "free",
  previewColor: "#0D1B2A",
  style: "sidebar",
  layout: "SidebarLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "default",
    "skillDisplay": "bar",
    "showTimeline": true,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {
    "color": {
      "sidebarBg": "#0D1B2A",
      "onSidebar": "#F8FAFC",
      "onSidebarMuted": "#94A3B8"
    }
  },
  config: {
    "sidebarWidth": 210,
    "sidebarBg": "#0D1B2A",
    "sidebarBorderColor": "@accent",
    "mainBg": "#FFFFFF",
    "nameColor": "#F8FAFC",
    "titleColor": "@accent",
    "contactIconColor": "@accent",
    "sidebarSectionStyle": "dots",
    "mainSectionStyle": "underline",
    "sidebarSections": [
      "skills",
      "languages"
    ],
    "skillDisplay": "bar",
    "photoSize": 76,
    "photoRadius": 50,
    "showTimeline": true,
    "hobbiesDisplay": "chips",
    "experienceVariant": "default"
  },
};
