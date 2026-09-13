import type { NativeTemplate } from "./types";

/**
 * Gash — Indigo accent, square photo, dot sections
 * Generated from apps/web/components/templates/gash.tsx (SidebarLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const GashTemplate: NativeTemplate = {
  id: "gash",
  name: { en: "Gash", sw: "Gash" },
  // TODO(copy): sw blurb — mirrored from the web description for now.
  blurb: { en: "Indigo accent, square photo, dot sections", sw: "Indigo accent, square photo, dot sections" },
  tier: "free",
  previewColor: "#1E1B4B",
  style: "sidebar",
  layout: "SidebarLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "compact",
    "skillDisplay": "bar",
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
    "sidebarWidth": 215,
    "sidebarBg": "@accent",
    "mainBg": "#FFFFFF",
    "nameColor": "#FFFFFF",
    "titleColor": "rgba(255,255,255,0.8)",
    "contactIconColor": "rgba(255,255,255,0.85)",
    "sidebarSectionStyle": "none",
    "mainSectionStyle": "dots",
    "sidebarSections": [
      "skills",
      "certifications",
      "hobbies"
    ],
    "skillDisplay": "bar",
    "photoSize": 78,
    "photoRadius": 0,
    "showTimeline": false,
    "hobbiesDisplay": "chips",
    "experienceVariant": "compact"
  },
};
