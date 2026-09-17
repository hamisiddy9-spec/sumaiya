import type { NativeTemplate } from "./types";

/**
 * Kibo — Dark sidebar, pill labels, numbered mains, grid skills
 * Generated from apps/web/components/templates/kibo.tsx (SidebarLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const KiboTemplate: NativeTemplate = {
  id: "kibo",
  name: { en: "Kibo", sw: "Kibo" },
  blurb: { en: "Dark sidebar, pill labels, numbered mains, grid skills", sw: "Pembeni nyeusi, lebo za vidonge, sehemu kuu zenye namba, ujuzi katika gridi" },
  tier: "free",
  previewColor: "#0F172A",
  style: "sidebar",
  layout: "SidebarLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "default",
    "skillDisplay": "grid",
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
    "sidebarWidth": 215,
    "sidebarBg": "#0F172A",
    "sidebarBorderColor": "@accent",
    "mainBg": "#FFFFFF",
    "nameColor": "#F8FAFC",
    "titleColor": "@accent",
    "contactIconColor": "@accent",
    "sidebarSectionStyle": "pill",
    "mainSectionStyle": "numbered",
    "sidebarSections": [
      "skills",
      "languages",
      "certs"
    ],
    "skillDisplay": "grid",
    "photoSize": 78,
    "photoRadius": 50,
    "showTimeline": false,
    "hobbiesDisplay": "chips",
    "experienceVariant": "default"
  },
};
