import React from "react";
import { useColorScheme } from "nativewind";

// Raw colour values for the places NativeWind classes can't reach:
// `placeholderTextColor`, native icon `color` props, StatusBar, RefreshControl
// tint, ActivityIndicator, navigator style props. Keep in sync with
// tailwind.config.js / vendor/design-tokens.
//
// SOURCE OF TRUTH: `docs/DESIGN-GUIDE.md` §1. The guide adopted Stitch's
// structure but rejected its palette (Stitch rebuilt the scale from a Material
// tonal algorithm around `primary: #ab2e00`; our ember `#DA4A1C` appeared ZERO
// times across its eight screens). The scaled values below are the guide's,
// literal — `theme-tokens.test.ts` fails if any of them drifts, because a
// near-miss palette is the one error a reader cannot see but always feels.
//
// The one place the guide needs a second value: it pins `ember #DA4A1C` with
// `onEmber #FFFFFF` (4.22:1) and also forbids an inaccessible surface. Ember as
// a FILL with white on it is 4.22:1 — fine for a large or bold label, under AA
// for 14–16px. So ember keeps every job the guide gives it (primary actions,
// active tab, focus, the mark) and `accentFillStrong` carries the guide's OWN
// `emberPressed #B93C13` (5.65:1 with white) for small-label filled buttons.
// No colour outside the guide's palette is introduced.

export interface ThemeColors {
  bg: string;
  bgElevated: string;
  /** Inset wells, tracks, progress rails — the guide's `surfaceSunken`. */
  bgSunken: string;
  border: string;
  borderStrong: string;
  text: string;
  textBody: string;
  textMuted: string;
  accent: string;
  /** Hover/press for web-parity and native press feedback (guide: emberHover). */
  accentHover: string;
  /**
   * Background for FILLED accent surfaces (buttons, chips, the user's own chat
   * bubble). The guide's ember, with the guide's onEmber: #FFFFFF.
   */
  accentFill: string;
  /** The guide's `emberPressed` — small-label fills that must clear AA. */
  accentFillStrong: string;
  accentFillPressed: string;
  accentPressed: string;
  accentText: string;
  /** Ember at the guide's 8–14% tint, for pills/selected rows. */
  accentTint: string;
  onAccentMuted: string;
  success: string;
  successTint: string;
  warning: string;
  error: string;
  errorTint: string;
  overlay: string;
}

// ── Light — the guide's warm scale ───────────────────────────────────────────
// Surfaces are warm and NEVER pure white: the guide's rule is that `#ffffff`
// as a surface "reads as a hole in a warm palette". The lightest surface is
// `#FBF9F5`; white appears only as onEmber text.
const light: ThemeColors = {
  bg: "#FBF9F5", // surface
  bgElevated: "#F5F3EF", // surfaceRaised — NOT #ffffff
  bgSunken: "#EFEEEA", // surfaceSunken
  border: "#E2BFB5", // border (guide: @ low alpha)
  borderStrong: "#8E7068", // borderStrong — pending rings, unselected
  text: "#211A15", // espresso — headings, values
  textBody: "#1B1C1A", // text — body
  textMuted: "#5A413A", // textMuted — labels, timestamps, captions
  accent: "#DA4A1C", // ember — primary actions, active tab, focus, the mark
  accentHover: "#C2410C", // emberHover — web parity
  accentFill: "#DA4A1C", // ember
  accentFillStrong: "#B93C13", // emberPressed — 5.65:1 with #FFFFFF
  accentFillPressed: "#B93C13", // emberPressed
  accentPressed: "#B93C13", // emberPressed
  accentText: "#FFFFFF", // onEmber
  accentTint: "rgba(218, 74, 28, 0.12)", // ember @ 12%
  onAccentMuted: "#FBE9E1", // ember tint, opaque (icons on ember fills)
  success: "#186A22",
  successTint: "rgba(24, 106, 34, 0.10)",
  warning: "#B45309",
  error: "#BA1A1A",
  errorTint: "rgba(186, 26, 26, 0.10)",
  overlay: "rgba(33, 26, 21, 0.45)",
};

// ── Dark — `Hali ya giza`: warm parity, NOT an invert ────────────────────────
// The guide pins base #1B1C1A, raised #24201C, sunken #141210, text #F2F0ED,
// muted #C9C0B8, and "ember unchanged". No pure-white cards, no cool greys.
//
// The guide gives no dark values for the hairline or the status hues. They are
// derived, and derived from the guide's own colours: the border is the guide's
// `#E2BFB5` dropped to a low alpha (it is specified "@ low alpha" already), and
// the status hues are lifted just enough to read on #1B1C1A while keeping the
// guide's hue — an invert would be a cool grey, which the guide forbids.
const dark: ThemeColors = {
  bg: "#1B1C1A",
  bgElevated: "#24201C",
  bgSunken: "#141210",
  border: "rgba(226, 191, 181, 0.24)",
  borderStrong: "#8E7068",
  text: "#F2F0ED",
  textBody: "#F2F0ED",
  textMuted: "#C9C0B8",
  accent: "#DA4A1C", // ember unchanged, per the guide
  accentHover: "#C2410C",
  accentFill: "#DA4A1C",
  accentFillStrong: "#B93C13",
  accentFillPressed: "#B93C13",
  accentPressed: "#B93C13",
  accentText: "#FFFFFF",
  accentTint: "rgba(218, 74, 28, 0.18)",
  onAccentMuted: "#FBE9E1",
  success: "#4CAF50",
  successTint: "rgba(76, 175, 80, 0.14)",
  warning: "#E39A3B",
  error: "#F2857A",
  errorTint: "rgba(242, 133, 122, 0.14)",
  overlay: "rgba(0, 0, 0, 0.6)",
};

/**
 * Pins a subtree to one palette regardless of the device / in-app dark-mode
 * setting. The pre-auth funnel — onboarding, sign-in, first-run — is a designed
 * brand runway in warm cream; dark mode is an in-app preference that only makes
 * sense once you're inside the app. Without this, a dark phone drops you from
 * the ember-lit onboarding onto a near-black sign-in screen and the seam shows.
 */
const ForcedTheme = React.createContext<"light" | "dark" | null>(null);

export function ThemeScope({
  mode,
  children,
}: {
  mode: "light" | "dark";
  children: React.ReactNode;
}) {
  return React.createElement(ForcedTheme.Provider, { value: mode }, children);
}

/** Read the pinned palette name, if any ancestor pinned one. */
export function useForcedScheme(): "light" | "dark" | null {
  return React.useContext(ForcedTheme);
}

export function useThemeColors(): ThemeColors {
  const forced = React.useContext(ForcedTheme);
  const { colorScheme } = useColorScheme();
  const scheme = forced ?? colorScheme;
  return scheme === "dark" ? dark : light;
}

export function useIsDark(): boolean {
  const forced = React.useContext(ForcedTheme);
  const { colorScheme } = useColorScheme();
  return (forced ?? colorScheme) === "dark";
}

/** The raw light palette, for navigator-level style props that can't call a hook. */
export const brandLight = light;

/** Both palettes, for the conformance test — not for screens to pick from. */
export const PALETTES = { light, dark } as const;
