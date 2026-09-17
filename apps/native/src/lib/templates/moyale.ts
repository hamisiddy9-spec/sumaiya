import type { NativeTemplate } from "./types";

/**
 * Moyale — Midnight, airy, dot sections, timeline
 * Generated from apps/web/components/templates/moyale.tsx (SidebarLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const MoyaleTemplate: NativeTemplate = {
  id: "moyale",
  name: { en: "Moyale", sw: "Moyale" },
  blurb: { en: "Midnight, airy, dot sections, timeline", sw: "Usiku wa manane, nafasi nyingi, sehemu za vitone, timeline" },
  tier: "free",
  previewColor: "#0D1B2A",
  style: "sidebar",
  layout: "SidebarLayout",
  personality: {
    "density": "airy",
    "experienceVariant": "default",
    "skillDisplay": "dot",
    "showTimeline": true,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {
    "color": {
      "sidebarBg": "#0D1B2A",
      "onSidebar": "#F8FAFC",
      "onSidebarMuted": "#94A3B8"
    }
  },
  config: {
    "sidebarWidth": 225,
    "sidebarBg": "#0D1B2A",
    "sidebarBorderColor": "@accent",
    "mainBg": "#FFFFFF",
    "nameColor": "#F8FAFC",
    "titleColor": "@accent",
    "contactIconColor": "@accent",
    "sidebarSectionStyle": "none",
    "mainSectionStyle": "dots",
    "sidebarSections": [
      "skills",
      "languages",
      "certifications",
      "hobbies"
    ],
    "skillDisplay": "dot",
    "photoSize": 82,
    "photoRadius": 50,
    "showTimeline": true,
    "hobbiesDisplay": "chips",
    "experienceVariant": "default"
  },
};
