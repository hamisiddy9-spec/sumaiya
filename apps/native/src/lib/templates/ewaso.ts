import type { NativeTemplate } from "./types";

/**
 * Ewaso — Warm brown, card experience
 * Generated from apps/web/components/templates/ewaso.tsx (SidebarLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const EwasoTemplate: NativeTemplate = {
  id: "ewaso",
  name: { en: "Ewaso", sw: "Ewaso" },
  // TODO(copy): sw blurb — mirrored from the web description for now.
  blurb: { en: "Warm brown, card experience", sw: "Warm brown, card experience" },
  tier: "free",
  previewColor: "#78350F",
  style: "sidebar",
  layout: "SidebarLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "card",
    "skillDisplay": "chip",
    "showTimeline": true,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {
    "color": {
      "sidebarBg": "@accent",
      "onSidebar": "#FFFFFF",
      "onSidebarMuted": "rgba(255,255,255,0.7)"
    }
  },
  config: {
    "sidebarWidth": 210,
    "sidebarBg": "@accent",
    "mainBg": "#FFFFFF",
    "nameColor": "#FFFFFF",
    "titleColor": "rgba(255,255,255,0.8)",
    "contactIconColor": "rgba(255,255,255,0.85)",
    "sidebarSectionStyle": "none",
    "mainSectionStyle": "box",
    "sidebarSections": [
      "skills",
      "languages"
    ],
    "skillDisplay": "chip",
    "photoSize": 76,
    "photoRadius": 8,
    "showTimeline": true,
    "hobbiesDisplay": "chips",
    "experienceVariant": "card"
  },
};
