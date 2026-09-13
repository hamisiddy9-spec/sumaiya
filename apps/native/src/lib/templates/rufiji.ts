import type { NativeTemplate } from "./types";

/**
 * Rufiji — Amber accent, wide sidebar, timeline
 * Generated from apps/web/components/templates/rufiji.tsx (SidebarLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const RufijiTemplate: NativeTemplate = {
  id: "rufiji",
  name: { en: "Rufiji", sw: "Rufiji" },
  // TODO(copy): sw blurb — mirrored from the web description for now.
  blurb: { en: "Amber accent, wide sidebar, timeline", sw: "Amber accent, wide sidebar, timeline" },
  tier: "free",
  previewColor: "#D97706",
  style: "sidebar",
  layout: "SidebarLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "default",
    "skillDisplay": "dot",
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
    "sidebarWidth": 240,
    "sidebarBg": "@accent",
    "mainBg": "#FFFFFF",
    "nameColor": "#FFFFFF",
    "titleColor": "rgba(255,255,255,0.8)",
    "contactIconColor": "rgba(255,255,255,0.85)",
    "sidebarSectionStyle": "dots",
    "mainSectionStyle": "underline",
    "sidebarSections": [
      "skills",
      "languages",
      "certifications"
    ],
    "skillDisplay": "dot",
    "photoSize": 88,
    "photoRadius": 50,
    "showTimeline": true,
    "hobbiesDisplay": "chips",
    "experienceVariant": "default"
  },
};
