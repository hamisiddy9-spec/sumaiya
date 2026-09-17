import type { NativeTemplate } from "./types";

/**
 * Vignette — Mint sidebar, airy accent lines
 * Generated from apps/web/components/templates/vignette.tsx (SidebarLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const VignetteTemplate: NativeTemplate = {
  id: "vignette",
  name: { en: "Vignette", sw: "Vignette" },
  blurb: { en: "Mint sidebar, airy accent lines", sw: "Pembeni ya kijani hafifu, mistari ya rangi yenye nafasi" },
  tier: "free",
  previewColor: "#059669",
  style: "creative",
  layout: "SidebarLayout",
  personality: {
    "density": "airy",
    "experienceVariant": "default",
    "skillDisplay": "chip",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {
    "color": {
      "sidebarBg": "#F0FDF4",
      "onSidebar": "#1F2937",
      "onSidebarMuted": "#6B7280"
    }
  },
  config: {
    "sidebarWidth": 215,
    "sidebarBg": "#F0FDF4",
    "mainBg": "#FFFFFF",
    "nameColor": "#1F2937",
    "titleColor": "@accent",
    "contactIconColor": "@accent",
    "sidebarSectionStyle": "tag",
    "mainSectionStyle": "line-accent",
    "sidebarSections": [
      "skills",
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
