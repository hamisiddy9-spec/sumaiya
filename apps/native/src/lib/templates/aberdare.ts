import type { NativeTemplate } from "./types";

/**
 * Aberdare — Dark charcoal, compact, rounded photo
 * Generated from apps/web/components/templates/aberdare.tsx (SidebarLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const AberdareTemplate: NativeTemplate = {
  id: "aberdare",
  name: { en: "Aberdare", sw: "Aberdare" },
  blurb: { en: "Dark charcoal, compact, rounded photo", sw: "Mkaa mweusi, fupi, picha ya mviringo" },
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
    "sidebarWidth": 200,
    "sidebarBg": "#111827",
    "sidebarBorderColor": "@accent",
    "mainBg": "#FFFFFF",
    "nameColor": "#F8FAFC",
    "titleColor": "@accent",
    "contactIconColor": "@accent",
    "sidebarSectionStyle": "none",
    "mainSectionStyle": "underline",
    "sidebarSections": [
      "skills",
      "languages",
      "certifications"
    ],
    "skillDisplay": "chip",
    "photoSize": 70,
    "photoRadius": 8,
    "showTimeline": false,
    "hobbiesDisplay": "chips",
    "experienceVariant": "compact"
  },
};
