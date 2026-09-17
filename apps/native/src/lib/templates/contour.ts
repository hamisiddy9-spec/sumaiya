import type { NativeTemplate } from "./types";

/**
 * Contour — Slate-tint sidebar, box sections
 * Generated from apps/web/components/templates/contour.tsx (SidebarLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const ContourTemplate: NativeTemplate = {
  id: "contour",
  name: { en: "Contour", sw: "Contour" },
  blurb: { en: "Slate-tint sidebar, box sections", sw: "Pembeni ya kijivu hafifu, sehemu za masanduku" },
  tier: "free",
  previewColor: "#1E293B",
  style: "creative",
  layout: "SidebarLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "card",
    "skillDisplay": "dot",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {
    "color": {
      "sidebarBg": "#F1F5F9",
      "onSidebar": "#1F2937",
      "onSidebarMuted": "#6B7280"
    }
  },
  config: {
    "sidebarWidth": 220,
    "sidebarBg": "#F1F5F9",
    "mainBg": "#FFFFFF",
    "nameColor": "#1F2937",
    "titleColor": "@accent",
    "contactIconColor": "@accent",
    "sidebarSectionStyle": "none",
    "mainSectionStyle": "box",
    "sidebarSections": [
      "skills",
      "languages",
      "certifications"
    ],
    "skillDisplay": "dot",
    "photoSize": 80,
    "photoRadius": 50,
    "showTimeline": false,
    "hobbiesDisplay": "chips",
    "experienceVariant": "card"
  },
};
