import type { NativeTemplate } from "./types";

/**
 * Cunene — Slate accent, narrow, compact
 * Generated from apps/web/components/templates/cunene.tsx (SidebarLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const CuneneTemplate: NativeTemplate = {
  id: "cunene",
  name: { en: "Cunene", sw: "Cunene" },
  // TODO(copy): sw blurb — mirrored from the web description for now.
  blurb: { en: "Slate accent, narrow, compact", sw: "Slate accent, narrow, compact" },
  tier: "free",
  previewColor: "#374151",
  style: "sidebar",
  layout: "SidebarLayout",
  personality: {
    "density": "compact",
    "experienceVariant": "default",
    "skillDisplay": "chip",
    "showTimeline": false,
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
    "sidebarWidth": 195,
    "sidebarBg": "@accent",
    "mainBg": "#FFFFFF",
    "nameColor": "#FFFFFF",
    "titleColor": "rgba(255,255,255,0.8)",
    "contactIconColor": "rgba(255,255,255,0.85)",
    "sidebarSectionStyle": "none",
    "mainSectionStyle": "line-accent",
    "sidebarSections": [
      "skills",
      "languages"
    ],
    "skillDisplay": "chip",
    "photoSize": 68,
    "photoRadius": 8,
    "showTimeline": false,
    "hobbiesDisplay": "chips",
    "experienceVariant": "default"
  },
};
