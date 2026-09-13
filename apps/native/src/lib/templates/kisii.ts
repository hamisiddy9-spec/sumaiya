import type { NativeTemplate } from "./types";

/**
 * Kisii — Deep navy, chip skills
 * Generated from apps/web/components/templates/kisii.tsx (SidebarLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const KisiiTemplate: NativeTemplate = {
  id: "kisii",
  name: { en: "Kisii", sw: "Kisii" },
  // TODO(copy): sw blurb — mirrored from the web description for now.
  blurb: { en: "Deep navy, chip skills", sw: "Deep navy, chip skills" },
  tier: "free",
  previewColor: "#1A1A2E",
  style: "sidebar",
  layout: "SidebarLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "default",
    "skillDisplay": "chip",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {
    "color": {
      "sidebarBg": "#1A1A2E",
      "onSidebar": "#F8FAFC",
      "onSidebarMuted": "#94A3B8"
    }
  },
  config: {
    "sidebarWidth": 230,
    "sidebarBg": "#1A1A2E",
    "sidebarBorderColor": "@accent",
    "mainBg": "#FFFFFF",
    "nameColor": "#F8FAFC",
    "titleColor": "@accent",
    "contactIconColor": "@accent",
    "sidebarSectionStyle": "tag",
    "mainSectionStyle": "underline",
    "sidebarSections": [
      "skills",
      "languages",
      "certifications",
      "hobbies"
    ],
    "skillDisplay": "chip",
    "photoSize": 84,
    "photoRadius": 50,
    "showTimeline": false,
    "hobbiesDisplay": "chips",
    "experienceVariant": "default"
  },
};
