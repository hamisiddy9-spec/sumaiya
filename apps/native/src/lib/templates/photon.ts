import type { NativeTemplate } from "./types";

/**
 * Photon — Sky blue name, airy, underline sections
 * Generated from apps/web/components/templates/photon.tsx (MinimalLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const PhotonTemplate: NativeTemplate = {
  id: "photon",
  name: { en: "Photon", sw: "Photon" },
  blurb: { en: "Sky blue name, airy, underline sections", sw: "Jina la bluu ya anga, nafasi nyingi, sehemu zenye mstari chini" },
  tier: "free",
  previewColor: "#0284C7",
  style: "minimal",
  layout: "MinimalLayout",
  personality: {
    "density": "airy",
    "experienceVariant": "default",
    "skillDisplay": "chip",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "bg": "#FFFFFF",
    "nameAlign": "center",
    "dividerStyle": "none",
    "sectionStyle": "underline",
    "skillDisplay": "chip",
    "hobbiesDisplay": "chips",
    "accentOnName": true,
    "experienceVariant": "default"
  },
};
