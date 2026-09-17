import type { NativeTemplate } from "./types";

/**
 * Wajir — Box sections, dot labels, compact
 * Generated from apps/web/components/templates/wajir.tsx (SidebarLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const WajirTemplate: NativeTemplate = {
  id: "wajir",
  name: { en: "Wajir", sw: "Wajir" },
  blurb: { en: "Box sections, dot labels, compact", sw: "Sehemu za masanduku, lebo zenye nukta, fupi" },
  tier: "free",
  previewColor: "#1E293B",
  style: "sidebar",
  layout: "SidebarLayout",
  personality: {
    "density": "compact",
    "experienceVariant": "default",
    "skillDisplay": "bar",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {
    "color": {
      "sidebarBg": "#1E293B",
      "onSidebar": "#F8FAFC",
      "onSidebarMuted": "#94A3B8"
    }
  },
  config: {
    "sidebarWidth": 205,
    "sidebarBg": "#1E293B",
    "sidebarBorderColor": "@accent",
    "mainBg": "#FFFFFF",
    "nameColor": "#F8FAFC",
    "titleColor": "@accent",
    "contactIconColor": "@accent",
    "sidebarSectionStyle": "dots",
    "mainSectionStyle": "box",
    "sidebarSections": [
      "skills",
      "certifications"
    ],
    "skillDisplay": "bar",
    "photoSize": 72,
    "photoRadius": 50,
    "showTimeline": false,
    "hobbiesDisplay": "chips",
    "experienceVariant": "default"
  },
};
