import type { NativeTemplate } from "./types";

/**
 * Cipher — Red name, accent lines, no divider
 * Generated from apps/web/components/templates/cipher.tsx (MinimalLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const CipherTemplate: NativeTemplate = {
  id: "cipher",
  name: { en: "Cipher", sw: "Cipher" },
  // TODO(copy): sw blurb — mirrored from the web description for now.
  blurb: { en: "Red name, accent lines, no divider", sw: "Red name, accent lines, no divider" },
  tier: "free",
  previewColor: "#DC2626",
  style: "minimal",
  layout: "MinimalLayout",
  personality: {
    "density": "normal",
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
    "sectionStyle": "line-accent",
    "skillDisplay": "chip",
    "hobbiesDisplay": "chips",
    "accentOnName": true,
    "experienceVariant": "default"
  },
};
