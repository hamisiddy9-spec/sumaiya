import type { NativeTemplate } from "./types";

/**
 * Kericho — Minimal sections, card experience
 * Generated from apps/web/components/templates/kericho.tsx (SidebarLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const KerichoTemplate: NativeTemplate = {
  id: "kericho",
  name: { en: "Kericho", sw: "Kericho" },
  // TODO(copy): sw blurb — mirrored from the web description for now.
  blurb: { en: "Minimal sections, card experience", sw: "Minimal sections, card experience" },
  tier: "free",
  previewColor: "#0F172A",
  style: "sidebar",
  layout: "SidebarLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "card",
    "skillDisplay": "bar",
    "showTimeline": true,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {
    "color": {
      "sidebarBg": "#0F172A",
      "onSidebar": "#F8FAFC",
      "onSidebarMuted": "#94A3B8"
    }
  },
  config: {
    "sidebarWidth": 205,
    "sidebarBg": "#0F172A",
    "sidebarBorderColor": "@accent",
    "mainBg": "#FFFFFF",
    "nameColor": "#F8FAFC",
    "titleColor": "@accent",
    "contactIconColor": "@accent",
    "sidebarSectionStyle": "none",
    "mainSectionStyle": "box",
    "sidebarSections": [
      "skills"
    ],
    "skillDisplay": "bar",
    "photoSize": 74,
    "photoRadius": 0,
    "showTimeline": true,
    "hobbiesDisplay": "chips",
    "experienceVariant": "card"
  },
};
