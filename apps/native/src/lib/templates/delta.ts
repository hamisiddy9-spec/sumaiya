import type { NativeTemplate } from "./types";

/**
 * Delta — Sand sidebar, square photo, card body
 * Generated from apps/web/components/templates/delta.tsx (SidebarLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const DeltaTemplate: NativeTemplate = {
  id: "delta",
  name: { en: "Delta", sw: "Delta" },
  blurb: { en: "Sand sidebar, square photo, card body", sw: "Pembeni ya mchanga, picha ya mraba, maudhui ya kadi" },
  tier: "free",
  previewColor: "#B45309",
  style: "creative",
  layout: "SidebarLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "card",
    "skillDisplay": "bar",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {
    "color": {
      "sidebarBg": "#FEF3C7",
      "onSidebar": "#1F2937",
      "onSidebarMuted": "#6B7280"
    }
  },
  config: {
    "sidebarWidth": 205,
    "sidebarBg": "#FEF3C7",
    "mainBg": "#FFFFFF",
    "nameColor": "#1F2937",
    "titleColor": "@accent",
    "contactIconColor": "@accent",
    "sidebarSectionStyle": "tag",
    "mainSectionStyle": "box",
    "sidebarSections": [
      "skills",
      "certifications"
    ],
    "skillDisplay": "bar",
    "photoSize": 74,
    "photoRadius": 0,
    "showTimeline": false,
    "hobbiesDisplay": "chips",
    "experienceVariant": "card"
  },
};
