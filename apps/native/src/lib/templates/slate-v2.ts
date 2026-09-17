import type { NativeTemplate } from "./types";

/**
 * Slate v2 — White-ish sidebar, ruled main, grid, timeline-v2
 * Generated from apps/web/components/templates/slate-v2.tsx (SidebarLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const SlateV2Template: NativeTemplate = {
  id: "slate-v2",
  name: { en: "Slate v2", sw: "Slate v2" },
  blurb: { en: "White-ish sidebar, ruled main, grid, timeline-v2", sw: "Pembeni nyeupe hafifu, sehemu kuu yenye mistari, gridi, mstari wa wakati v2" },
  tier: "free",
  previewColor: "#374151",
  style: "sidebar",
  layout: "SidebarLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "timeline-v2",
    "skillDisplay": "grid",
    "showTimeline": true,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {
    "color": {
      "sidebarBg": "#F8FAFC",
      "onSidebar": "#1F2937",
      "onSidebarMuted": "#6B7280"
    }
  },
  config: {
    "sidebarWidth": 210,
    "sidebarBg": "#F8FAFC",
    "sidebarBorderColor": "@accent",
    "mainBg": "#FFFFFF",
    "nameColor": "#1F2937",
    "titleColor": "@accent",
    "contactIconColor": "@accent",
    "sidebarSectionStyle": "none",
    "mainSectionStyle": "ruled",
    "sidebarSections": [
      "skills",
      "certifications"
    ],
    "skillDisplay": "grid",
    "photoSize": 72,
    "photoRadius": 0,
    "showTimeline": true,
    "hobbiesDisplay": "chips",
    "experienceVariant": "timeline-v2"
  },
};
