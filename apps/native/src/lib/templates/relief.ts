import type { NativeTemplate } from "./types";

/**
 * Relief — Ice blue sidebar, rounded photo
 * Generated from apps/web/components/templates/relief.tsx (SidebarLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const ReliefTemplate: NativeTemplate = {
  id: "relief",
  name: { en: "Relief", sw: "Relief" },
  // TODO(copy): sw blurb — mirrored from the web description for now.
  blurb: { en: "Ice blue sidebar, rounded photo", sw: "Ice blue sidebar, rounded photo" },
  tier: "free",
  previewColor: "#1D4ED8",
  style: "creative",
  layout: "SidebarLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "default",
    "skillDisplay": "bar",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {
    "color": {
      "sidebarBg": "#EFF6FF",
      "onSidebar": "#1F2937",
      "onSidebarMuted": "#6B7280"
    }
  },
  config: {
    "sidebarWidth": 210,
    "sidebarBg": "#EFF6FF",
    "mainBg": "#FFFFFF",
    "nameColor": "#1F2937",
    "titleColor": "@accent",
    "contactIconColor": "@accent",
    "sidebarSectionStyle": "tag",
    "mainSectionStyle": "underline",
    "sidebarSections": [
      "skills",
      "languages"
    ],
    "skillDisplay": "bar",
    "photoSize": 76,
    "photoRadius": 8,
    "showTimeline": false,
    "hobbiesDisplay": "chips",
    "experienceVariant": "default"
  },
};
