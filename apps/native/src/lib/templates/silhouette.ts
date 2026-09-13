import type { NativeTemplate } from "./types";

/**
 * Silhouette — Barely-there sidebar, sharp accent lines
 * Generated from apps/web/components/templates/silhouette.tsx (SidebarLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const SilhouetteTemplate: NativeTemplate = {
  id: "silhouette",
  name: { en: "Silhouette", sw: "Silhouette" },
  // TODO(copy): sw blurb — mirrored from the web description for now.
  blurb: { en: "Barely-there sidebar, sharp accent lines", sw: "Barely-there sidebar, sharp accent lines" },
  tier: "free",
  previewColor: "#0F172A",
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
      "sidebarBg": "#F9FAFB",
      "onSidebar": "#1F2937",
      "onSidebarMuted": "#6B7280"
    }
  },
  config: {
    "sidebarWidth": 225,
    "sidebarBg": "#F9FAFB",
    "mainBg": "#FFFFFF",
    "nameColor": "#1F2937",
    "titleColor": "@accent",
    "contactIconColor": "@accent",
    "sidebarSectionStyle": "tag",
    "mainSectionStyle": "line-accent",
    "sidebarSections": [
      "skills",
      "languages"
    ],
    "skillDisplay": "bar",
    "photoSize": 82,
    "photoRadius": 8,
    "showTimeline": true,
    "hobbiesDisplay": "chips",
    "experienceVariant": "default"
  },
};
