import type { NativeTemplate } from "./types";

/**
 * Highland — Clean white sidebar, dark accent lines
 * Generated from apps/web/components/templates/highland.tsx (SidebarLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const HighlandTemplate: NativeTemplate = {
  id: "highland",
  name: { en: "Highland", sw: "Highland" },
  // TODO(copy): sw blurb — mirrored from the web description for now.
  blurb: { en: "Clean white sidebar, dark accent lines", sw: "Clean white sidebar, dark accent lines" },
  tier: "free",
  previewColor: "#0F172A",
  style: "creative",
  layout: "SidebarLayout",
  personality: {
    "density": "airy",
    "experienceVariant": "default",
    "skillDisplay": "dot",
    "showTimeline": false,
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
    "sidebarWidth": 215,
    "sidebarBg": "#F8FAFC",
    "mainBg": "#FFFFFF",
    "nameColor": "#1F2937",
    "titleColor": "@accent",
    "contactIconColor": "@accent",
    "sidebarSectionStyle": "dots",
    "mainSectionStyle": "line-accent",
    "sidebarSections": [
      "skills",
      "certifications"
    ],
    "skillDisplay": "dot",
    "photoSize": 78,
    "photoRadius": 8,
    "showTimeline": false,
    "hobbiesDisplay": "chips",
    "experienceVariant": "default"
  },
};
