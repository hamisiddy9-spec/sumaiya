import type { NativeTemplate } from "./types";

/**
 * Mono — Black band, no section headers, ultra compact
 * Generated from apps/web/components/templates/mono-cv.tsx (AccentBandLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const MonoCvTemplate: NativeTemplate = {
  id: "mono-cv",
  name: { en: "Mono", sw: "Mono" },
  // TODO(copy): sw blurb — mirrored from the web description for now.
  blurb: { en: "Black band, no section headers, ultra compact", sw: "Black band, no section headers, ultra compact" },
  tier: "free",
  previewColor: "#111827",
  style: "minimal",
  layout: "AccentBandLayout",
  personality: {
    "density": "compact",
    "experienceVariant": "compact",
    "skillDisplay": "chip",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "bandWidth": 8,
    "bandColor": "#111827",
    "bg": "#F9FAFB",
    "nameColor": "#111827",
    "sectionStyle": "none",
    "skillDisplay": "chip",
    "hobbiesDisplay": "chips",
    "experienceVariant": "compact",
    "showTimeline": false,
    "photoSize": 0,
    "photoRadius": 50,
    "topRule": false
  },
};
