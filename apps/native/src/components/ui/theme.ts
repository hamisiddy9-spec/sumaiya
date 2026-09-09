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

const light: ThemeColors = {
  bg: "#f5ede6", // sand
  bgElevated: "#faf8f6", // card
  border: "#e8ddd4",
  borderStrong: "#d8c9bd",
  text: "#1a1410", // espresso
  textBody: "#4a4540",
  textMuted: "#8b7d75",
  accent: "#d85c2c", // ember
  accentPressed: "#c24a1f",
  accentText: "#fef5f0", // cream
  onAccentMuted: "#f7e6dd",
  success: "#1f9d55",
  warning: "#c77a17",
  error: "#dc2626",
  overlay: "rgba(26, 20, 16, 0.45)",
};

const dark: ThemeColors = {
  bg: "#0f0a07", // espresso_dark
  bgElevated: "#1a1410", // espresso
  border: "#3d2f27", // espresso_line
  borderStrong: "#52413a",
  text: "#fef5f0", // cream
  textBody: "#d6c8bf",
  textMuted: "#9c8a80",
  accent: "#e2683a",
  accentPressed: "#d85c2c",
  accentText: "#fef5f0",
  onAccentMuted: "#3a241d",
  success: "#4ade80",
  warning: "#f5b455",
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
