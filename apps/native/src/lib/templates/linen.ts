import type { NativeTemplate } from "./types";

/**
 * Linen — Warm cream sidebar, ruled sections, airy
 * Generated from apps/web/components/templates/linen.tsx (SidebarLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const LinenTemplate: NativeTemplate = {
  id: "linen",
  name: { en: "Linen", sw: "Linen" },
  blurb: { en: "Warm cream sidebar, ruled sections, airy", sw: "Pembeni ya krimu ya joto, sehemu zenye mistari, nafasi nyingi" },
  tier: "free",
  previewColor: "#D97706",
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
      "sidebarBg": "#FFF7ED",
      "onSidebar": "#1F2937",
      "onSidebarMuted": "#6B7280"
    }
  },
  config: {
    "sidebarWidth": 215,
    "sidebarBg": "#FFF7ED",
    "sidebarBorderColor": "@accent",
    "mainBg": "#FFFFFF",
    "nameColor": "#1F2937",
    "titleColor": "@accent",
    "contactIconColor": "@accent",
    "sidebarSectionStyle": "tag",
    "mainSectionStyle": "ruled",
    "sidebarSections": [
      "skills",
      "certifications"
    ],
    "skillDisplay": "bar",
    "photoSize": 80,
    "photoRadius": 50,
    "showTimeline": false,
    "hobbiesDisplay": "chips",
    "experienceVariant": "default"
  },
};
