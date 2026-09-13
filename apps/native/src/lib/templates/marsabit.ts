import type { NativeTemplate } from "./types";

/**
 * Marsabit — Square photo, airy spacing
 * Generated from apps/web/components/templates/marsabit.tsx (SidebarLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const MarsabitTemplate: NativeTemplate = {
  id: "marsabit",
  name: { en: "Marsabit", sw: "Marsabit" },
  // TODO(copy): sw blurb — mirrored from the web description for now.
  blurb: { en: "Square photo, airy spacing", sw: "Square photo, airy spacing" },
  tier: "free",
  previewColor: "#1E293B",
  style: "sidebar",
  layout: "SidebarLayout",
  personality: {
    "density": "airy",
    "experienceVariant": "default",
    "skillDisplay": "bar",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {
    "color": {
      "sidebarBg": "#1E293B",
      "onSidebar": "#F8FAFC",
      "onSidebarMuted": "#94A3B8"
    }
  },
  config: {
    "sidebarWidth": 205,
    "sidebarBg": "#1E293B",
    "sidebarBorderColor": "@accent",
    "mainBg": "#FFFFFF",
    "nameColor": "#F8FAFC",
    "titleColor": "@accent",
    "contactIconColor": "@accent",
    "sidebarSectionStyle": "tag",
    "mainSectionStyle": "underline",
    "sidebarSections": [
      "skills",
      "certifications"
    ],
    "skillDisplay": "bar",
    "photoSize": 72,
    "photoRadius": 0,
    "showTimeline": false,
    "hobbiesDisplay": "chips",
    "experienceVariant": "default"
  },
};
