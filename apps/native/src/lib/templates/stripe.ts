import type { NativeTemplate } from "./types";

/**
 * Stripe — 8px left accent band, clean single column
 * Generated from apps/web/components/templates/stripe.tsx (AccentBandLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const StripeTemplate: NativeTemplate = {
  id: "stripe",
  name: { en: "Stripe", sw: "Stripe" },
  // TODO(copy): sw blurb — mirrored from the web description for now.
  blurb: { en: "8px left accent band, clean single column", sw: "8px left accent band, clean single column" },
  tier: "free",
  previewColor: "#1D4ED8",
  style: "minimal",
  layout: "AccentBandLayout",
  personality: {
    "density": "normal",
    "experienceVariant": "default",
    "skillDisplay": "bar",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "bandWidth": 8,
    "bandColor": "@accent",
    "bg": "#FFFFFF",
    "nameColor": "#111827",
    "sectionStyle": "underline",
    "skillDisplay": "bar",
    "hobbiesDisplay": "chips",
    "experienceVariant": "default",
    "showTimeline": false,
    "photoSize": 0,
    "photoRadius": 50,
    "topRule": true
  },
};
