import type { NativeTemplate } from "./types";

/**
 * Kitale — Rounded photo, airy, accent lines
 * Generated from apps/web/components/templates/kitale.tsx (SidebarLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const KitaleTemplate: NativeTemplate = {
  id: "kitale",
  name: { en: "Kitale", sw: "Kitale" },
  // TODO(copy): sw blurb — mirrored from the web description for now.
  blurb: { en: "Rounded photo, airy, accent lines", sw: "Rounded photo, airy, accent lines" },
  tier: "free",
  previewColor: "#1E293B",
  style: "sidebar",
  layout: "SidebarLayout",
  personality: {
    "density": "airy",
    "experienceVariant": "default",
    "skillDisplay": "dot",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {
    "color": {
      "sidebarBg": "#1E293B",
      "onSidebar": "#F8FAFC",
      "onSidebarMuted": "#94A3B8"
    }
  },
  config: {
    "sidebarWidth": 220,
    "sidebarBg": "#1E293B",
    "sidebarBorderColor": "@accent",
    "mainBg": "#FFFFFF",
    "nameColor": "#F8FAFC",
    "titleColor": "@accent",
    "contactIconColor": "@accent",
    "sidebarSectionStyle": "tag",
    "mainSectionStyle": "line-accent",
    "sidebarSections": [
      "skills",
      "languages",
      "certifications"
    ],
    "skillDisplay": "dot",
    "photoSize": 80,
    "photoRadius": 8,
    "showTimeline": false,
    "hobbiesDisplay": "chips",
    "experienceVariant": "default"
  },
};
