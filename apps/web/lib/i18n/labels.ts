// Shared UI chrome labels — the repeated `lang === "sw" ? "…" : "…"` strings
// that would otherwise drift across files. Mechanism only: the strings are
// byte-identical to what was hardcoded before, so no copy changes.
//
// `label(lang, key)` accepts either a lang string ("sw"/"en") or the common
// `sw` boolean (true = Swahili) used across client components.

export const UI = {
  loading: { sw: "Ninapakia…", en: "Loading…" },
  skipToContent: { sw: "Ruka hadi maudhui", en: "Skip to content" },
  openingEditor: { sw: "Ninafungua kihariri…", en: "Opening editor…" },
  retry: { sw: "Jaribu tena", en: "Retry" },
  close: { sw: "Funga", en: "Close" },
} as const;

export type UiLabelKey = keyof typeof UI;

export function label(lang: string | boolean, key: UiLabelKey): string {
  const l = typeof lang === "boolean" ? (lang ? "sw" : "en") : lang;
  return UI[key][l === "en" ? "en" : "sw"];
}
