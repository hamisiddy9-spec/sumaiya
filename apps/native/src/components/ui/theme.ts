import { useColorScheme } from "nativewind";

// Raw color values for the places NativeWind classes can't reach:
// `placeholderTextColor`, native icon `color` props, StatusBar, RefreshControl
// tint, ActivityIndicator, navigator style props. Keep in sync with
// tailwind.config.js / vendor/design-tokens.

export interface ThemeColors {
  bg: string;
  bgElevated: string;
  border: string;
  borderStrong: string;
  text: string;
  textBody: string;
  textMuted: string;
  accent: string;
  accentPressed: string;
  accentText: string;
  onAccentMuted: string;
  success: string;
  warning: string;
  error: string;
  overlay: string;
}

// Warm Confidence — the exact values from apps/web/tailwind.config.ts. Web is
// the reference; the mobile app must render the same brand, not a near-miss.
const light: ThemeColors = {
  bg: "#FAF5EE", // cream
  bgElevated: "#FFFFFF", // card
  border: "#E9E0D4",
  borderStrong: "#9C8D7B", // border-input
  text: "#211A15", // espresso
  textBody: "#6B5F54", // text-body
  textMuted: "#756A5E", // text-muted
  accent: "#DA4A1C", // ember
  accentPressed: "#C13E14", // ember-hover
  accentText: "#FAF5EE", // cream
  onAccentMuted: "#FBE9E1", // ember-tint
  success: "#12766A",
  warning: "#96630F", // gold-text
  error: "#C13E14",
  overlay: "rgba(33, 26, 21, 0.45)",
};

const dark: ThemeColors = {
  bg: "#171009",
  bgElevated: "#211A15", // espresso
  border: "#3A2E25", // espresso-line
  borderStrong: "#52413a",
  text: "#FAF5EE", // cream
  textBody: "#D8C9BD",
  textMuted: "#9C8A80",
  accent: "#E5734A", // brand-400 — ember lifted for contrast on espresso
  accentPressed: "#DA4A1C",
  accentText: "#FAF5EE",
  onAccentMuted: "#3A241D",
  success: "#4ade80",
  warning: "#F2A93B", // gold
  error: "#f87171",
  overlay: "rgba(0, 0, 0, 0.6)",
};

export function useThemeColors(): ThemeColors {
  const { colorScheme } = useColorScheme();
  return colorScheme === "dark" ? dark : light;
}

export function useIsDark(): boolean {
  const { colorScheme } = useColorScheme();
  return colorScheme === "dark";
}
