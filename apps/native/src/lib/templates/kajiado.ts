import type { NativeTemplate } from "./types";

/**
 * Kajiado — Narrow, square photo, compact
 * Generated from apps/web/components/templates/kajiado.tsx (SidebarLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const KajiadoTemplate: NativeTemplate = {
  id: "kajiado",
  name: { en: "Kajiado", sw: "Kajiado" },
  blurb: { en: "Narrow, square photo, compact", sw: "Nyembamba, picha ya mraba, fupi" },
  tier: "free",
  previewColor: "#111827",
  style: "sidebar",
  layout: "SidebarLayout",
  personality: {
    "density": "compact",
    "experienceVariant": "compact",
    "skillDisplay": "chip",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {
    "color": {
      "sidebarBg": "#111827",
      "onSidebar": "#F8FAFC",
      "onSidebarMuted": "#94A3B8"
    }
  },
  config: {
    "sidebarWidth": 195,
    "sidebarBg": "#111827",
    "sidebarBorderColor": "@accent",
    "mainBg": "#FFFFFF",
    "nameColor": "#F8FAFC",
    "titleColor": "@accent",
    "contactIconColor": "@accent",
    "sidebarSectionStyle": "tag",
    "mainSectionStyle": "dots",
    "sidebarSections": [
      "skills",
      "certifications"
    ],
    "skillDisplay": "chip",
    "photoSize": 68,
    "photoRadius": 0,
    "showTimeline": false,
    "hobbiesDisplay": "chips",
    "experienceVariant": "compact"
  },
};
