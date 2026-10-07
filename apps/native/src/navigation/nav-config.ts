import { DefaultTheme, DarkTheme, type Theme } from "@react-navigation/native";
import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { useIsDark, useThemeColors, type ThemeColors } from "../components/ui";
import { MOTION } from "../components/ui/motion";

/**
 * One navigation theme and one screen transition for the whole app.
 *
 * The white side-flash during a push was React Navigation's DEFAULT theme
 * painting `colors.background: rgb(242,242,242)` in the gap between the
 * outgoing and incoming screen. Give the container a theme whose background
 * and card match our surface, so there is nothing light to reveal.
 */
export function useNavTheme(): Theme {
  const c = useThemeColors();
  const dark = useIsDark();
  const base = dark ? DarkTheme : DefaultTheme;
  return {
    ...base,
    colors: {
      ...base.colors,
      background: c.bg,
      card: c.bg,
      text: c.text,
      border: c.border,
      primary: c.accent,
    },
  };
}

/** THE push transition — every stack uses this. slide-from-right, 260ms
 *  (MOTION.dur.screen), opaque surface behind it. */
export function stackScreenOptions(c: ThemeColors): NativeStackNavigationOptions {
  return {
    headerShown: false,
    animation: "slide_from_right",
    animationDuration: MOTION.dur.screen,
    contentStyle: { backgroundColor: c.bg },
  };
}

/** Root auth-state switches (onboarding ↔ auth ↔ app) — a mode change, not a
 *  push, so it cross-fades; 340ms rather than the push's 260ms. */
export function rootScreenOptions(c: ThemeColors): NativeStackNavigationOptions {
  return {
    headerShown: false,
    // MOTION.dur.field (340ms, not 260): the onboarding portal hands off while
    // the screen is a solid field of accent colour, so this cross-fade *is* the
    // reveal — the colour has to dissolve into the page, not blink away from it.
    animation: "fade",
    animationDuration: MOTION.dur.field,
    contentStyle: { backgroundColor: c.bg },
  };
}
