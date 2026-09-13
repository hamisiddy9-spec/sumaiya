import type { NativeTemplate } from "./types";

/**
 * Cocoa — Warm yellow sidebar, numbered, tag-rated skills
 * Generated from apps/web/components/templates/cocoa.tsx (SidebarLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const CocoaTemplate: NativeTemplate = {
  id: "cocoa",
  name: { en: "Cocoa", sw: "Cocoa" },
  // TODO(copy): sw blurb — mirrored from the web description for now.
  blurb: { en: "Warm yellow sidebar, numbered, tag-rated skills", sw: "Warm yellow sidebar, numbered, tag-rated skills" },
  tier: "free",
  previewColor: "#B45309",
  style: "sidebar",
  layout: "SidebarLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "default",
    "skillDisplay": "tag-rated",
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
    "sidebarWidth": 220,
    "sidebarBg": "#FEF3C7",
    "sidebarBorderColor": "@accent",
    "mainBg": "#FFFFFF",
    "nameColor": "#1F2937",
    "titleColor": "@accent",
    "contactIconColor": "@accent",
    "sidebarSectionStyle": "tag",
    "mainSectionStyle": "numbered",
    "sidebarSections": [
      "skills",
      "languages",
      "certs"
    ],
    "skillDisplay": "tag-rated",
    "photoSize": 78,
    "photoRadius": 50,
    "showTimeline": false,
    "hobbiesDisplay": "chips",
    "experienceVariant": "default"
  },
};
