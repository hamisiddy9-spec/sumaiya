import type { NativeTemplate } from "./types";

/**
 * Okavango — Green accent, airy, full sidebar sections
 * Generated from apps/web/components/templates/okavango.tsx (SidebarLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const OkavangoTemplate: NativeTemplate = {
  id: "okavango",
  name: { en: "Okavango", sw: "Okavango" },
  // TODO(copy): sw blurb — mirrored from the web description for now.
  blurb: { en: "Green accent, airy, full sidebar sections", sw: "Green accent, airy, full sidebar sections" },
  tier: "free",
  previewColor: "#059669",
  style: "sidebar",
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
      "sidebarBg": "@accent",
      "onSidebar": "#FFFFFF",
      "onSidebarMuted": "rgba(255,255,255,0.7)"
    }
  },
  config: {
    "sidebarWidth": 230,
    "sidebarBg": "@accent",
    "mainBg": "#FFFFFF",
    "nameColor": "#FFFFFF",
    "titleColor": "rgba(255,255,255,0.8)",
    "contactIconColor": "rgba(255,255,255,0.85)",
    "sidebarSectionStyle": "none",
    "mainSectionStyle": "line-accent",
    "sidebarSections": [
      "skills",
      "languages",
      "certifications",
      "hobbies"
    ],
    "skillDisplay": "chip",
    "photoSize": 84,
    "photoRadius": 8,
    "showTimeline": false,
    "hobbiesDisplay": "chips",
    "experienceVariant": "default"
  },
};
