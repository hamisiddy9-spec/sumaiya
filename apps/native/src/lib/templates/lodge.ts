import type { NativeTemplate } from "./types";

/**
 * Lodge — Charcoal, dot sidebar, ruled main, tag-rated, timeline-v2
 * Generated from apps/web/components/templates/lodge.tsx (SidebarLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const LodgeTemplate: NativeTemplate = {
  id: "lodge",
  name: { en: "Lodge", sw: "Lodge" },
  blurb: { en: "Charcoal, dot sidebar, ruled main, tag-rated, timeline-v2", sw: "Mkaa, pembeni yenye nukta, sehemu kuu yenye mistari, ujuzi wenye madaraja, timeline v2" },
  tier: "free",
  previewColor: "#1E293B",
  style: "sidebar",
  layout: "SidebarLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "timeline-v2",
    "skillDisplay": "tag-rated",
    "showTimeline": true,
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
    "sidebarWidth": 205,
    "sidebarBg": "#1E293B",
    "sidebarBorderColor": "@accent",
    "mainBg": "#FFFFFF",
    "nameColor": "#F8FAFC",
    "titleColor": "@accent",
    "contactIconColor": "@accent",
    "sidebarSectionStyle": "dots",
    "mainSectionStyle": "ruled",
    "sidebarSections": [
      "skills",
      "languages"
    ],
    "skillDisplay": "tag-rated",
    "photoSize": 72,
    "photoRadius": 8,
    "showTimeline": true,
    "hobbiesDisplay": "chips",
    "experienceVariant": "timeline-v2"
  },
};
