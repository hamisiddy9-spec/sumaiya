/**
 * Where the tab bar ends — measured, not assumed.
 *
 * Floating UI (the update download pill) is absolutely positioned and has to
 * sit ABOVE the tab bar. Anchored at `bottom: 0` it covered the tabs, and since
 * the pill is pressable it swallowed the taps meant for them — the app looked
 * like it couldn't change screens.
 *
 * A hard-coded tab-bar height is a lie the moment the label font scales: with
 * large accessibility text the bar grows taller and the pill creeps back over
 * the navigation. So the bar publishes its real height here and overlays read
 * it.
 *
 * A module-level store rather than React context on purpose: the pill is
 * mounted at the app root, OUTSIDE the tab navigator, so a provider nested
 * inside the navigator would never reach it.
 */
import { useSyncExternalStore } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Fallback metrics, matching AnimatedTabBar: paddingTop 6 + icon 30 + label 16. */
const TAB_BAR_CONTENT_HEIGHT = 52;

/** The CSS-box bottom padding the bar uses when there is no safe-area inset. */
const TAB_BAR_DEFAULT_BOTTOM_PAD = 10;

let measured = 0;
const subscribers = new Set<() => void>();

/** Called by AnimatedTabBar on layout — the bar is the only writer. */
export function publishTabBarHeight(height: number): void {
  if (!(height > 0) || Math.abs(height - measured) < 0.5) return;
  measured = height;
  subscribers.forEach((fn) => fn());
}

function subscribe(fn: () => void): () => void {
  subscribers.add(fn);
  return () => {
    subscribers.delete(fn);
  };
}

const getSnapshot = (): number => measured;
const getServerSnapshot = (): number => 0;

/**
 * How much room floating UI must leave at the bottom to clear the tab bar.
 * Falls back to the derived height until the bar's first layout pass, so the
 * pill never flashes over the tabs on the opening frame.
 */
export function useTabBarClearance(): number {
  const insets = useSafeAreaInsets();
  const height = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  if (height > 0) return height;
  return (
    TAB_BAR_CONTENT_HEIGHT +
    (insets.bottom > 0 ? insets.bottom : TAB_BAR_DEFAULT_BOTTOM_PAD)
  );
}
