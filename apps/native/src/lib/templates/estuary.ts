import type { NativeTemplate } from "./types";

/**
 * Estuary — Light blue sidebar, chip skills
 * Generated from apps/web/components/templates/estuary.tsx (SidebarLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const EstuaryTemplate: NativeTemplate = {
  id: "estuary",
  name: { en: "Estuary", sw: "Estuary" },
  blurb: { en: "Light blue sidebar, chip skills", sw: "Pembeni ya bluu hafifu, ujuzi katika vibao vya UI" },
  tier: "free",
  previewColor: "#0891B2",
  style: "creative",
  layout: "SidebarLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "default",
    "skillDisplay": "chip",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {
    "color": {
      "sidebarBg": "#EFF6FF",
      "onSidebar": "#1F2937",
      "onSidebarMuted": "#6B7280"
    }
  },
  config: {
    "sidebarWidth": 200,
    "sidebarBg": "#EFF6FF",
    "mainBg": "#FFFFFF",
    "nameColor": "#1F2937",
    "titleColor": "@accent",
    "contactIconColor": "@accent",
    "sidebarSectionStyle": "none",
    "mainSectionStyle": "underline",
    "sidebarSections": [
      "skills",
      "languages"
    ],
    "skillDisplay": "chip",
    "photoSize": 70,
    "photoRadius": 50,
    "showTimeline": false,
    "hobbiesDisplay": "chips",
    "experienceVariant": "default"
  },
};
