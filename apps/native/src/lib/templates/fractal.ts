import type { NativeTemplate } from "./types";

/**
 * Fractal — Light grey sidebar, purple accent lines
 * Generated from apps/web/components/templates/fractal.tsx (SidebarLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const FractalTemplate: NativeTemplate = {
  id: "fractal",
  name: { en: "Fractal", sw: "Fractal" },
  blurb: { en: "Light grey sidebar, purple accent lines", sw: "Pembeni ya kijivu hafifu, mistari ya rangi ya zambarau" },
  tier: "free",
  previewColor: "#6D28D9",
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
      "sidebarBg": "#F1F5F9",
      "onSidebar": "#1F2937",
      "onSidebarMuted": "#6B7280"
    }
  },
  config: {
    "sidebarWidth": 215,
    "sidebarBg": "#F1F5F9",
    "mainBg": "#FFFFFF",
    "nameColor": "#1F2937",
    "titleColor": "@accent",
    "contactIconColor": "@accent",
    "sidebarSectionStyle": "tag",
    "mainSectionStyle": "line-accent",
    "sidebarSections": [
      "skills",
      "languages",
      "certifications"
    ],
    "skillDisplay": "chip",
    "photoSize": 78,
    "photoRadius": 50,
    "showTimeline": false,
    "hobbiesDisplay": "chips",
    "experienceVariant": "default"
  },
};
