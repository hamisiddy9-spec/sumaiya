import type { NativeTemplate } from "./types";

/**
 * Ledger — Dark band, numbered headers, table exp, grid skills
 * Generated from apps/web/components/templates/ledger.tsx (AccentBandLayout).
 * Do not edit by hand: run `node scripts/gen-native-templates.mjs`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const LedgerTemplate: NativeTemplate = {
  id: "ledger",
  name: { en: "Ledger", sw: "Ledger" },
  // TODO(copy): sw blurb — mirrored from the web description for now.
  blurb: { en: "Dark band, numbered headers, table exp, grid skills", sw: "Dark band, numbered headers, table exp, grid skills" },
  tier: "free",
  previewColor: "#1E293B",
  style: "minimal",
  layout: "AccentBandLayout",
  personality: {
    "density": "compact",
    "experienceVariant": "table",
    "skillDisplay": "grid",
    "showTimeline": false,
    "hobbiesDisplay": "chips"
  },
  tokenOverrides: {},
  config: {
    "bandWidth": 6,
    "bandColor": "#1E293B",
    "bg": "#FAFAFA",
    "nameColor": "#111827",
    "sectionStyle": "numbered",
    "skillDisplay": "grid",
    "hobbiesDisplay": "chips",
    "experienceVariant": "table",
    "showTimeline": false,
    "photoSize": 0,
    "photoRadius": 50,
    "topRule": false
  },
};
