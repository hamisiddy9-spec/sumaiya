import type { NativeTemplate } from "./types";

/**
 * Plateau — Near-white sidebar, navy accent
 * Generated from apps/web/components/templates/plateau.tsx (SidebarLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const PlateauTemplate: NativeTemplate = {
  id: "plateau",
  name: { en: "Plateau", sw: "Plateau" },
  // TODO(copy): sw blurb — mirrored from the web description for now.
  blurb: { en: "Near-white sidebar, navy accent", sw: "Near-white sidebar, navy accent" },
  tier: "free",
  previewColor: "#1E3A8A",
  style: "creative",
  layout: "SidebarLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "default",
    "skillDisplay": "bar",
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
    "sidebarWidth": 220,
    "sidebarBg": "#F8FAFC",
    "mainBg": "#FFFFFF",
    "nameColor": "#1F2937",
    "titleColor": "@accent",
    "contactIconColor": "@accent",
    "sidebarSectionStyle": "tag",
    "mainSectionStyle": "underline",
    "sidebarSections": [
      "skills",
      "languages",
      "certifications"
    ],
    "skillDisplay": "bar",
    "photoSize": 80,
    "photoRadius": 50,
    "showTimeline": true,
    "hobbiesDisplay": "chips",
    "experienceVariant": "default"
  },
};
