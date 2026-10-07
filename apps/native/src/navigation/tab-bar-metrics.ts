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
let live = false;
const subscribers = new Set<() => void>();

function notify(): void {
  subscribers.forEach((fn) => fn());
}

/** Called by AnimatedTabBar on layout — the bar is the only writer. */
export function publishTabBarHeight(height: number): void {
  if (!(height > 0) || Math.abs(height - measured) < 0.5) return;
  measured = height;
  notify();
}

/**
 * Called by AnimatedTabBar on mount/unmount — is a bar on screen under the overlay?
 *
 * Separate from the height on purpose. A carousel/onboarding screen sits OUTSIDE the
 * tab navigator, so no bar has ever published there; the height-only fallback below
 * still reserved the bar's height, and the update pill floated ~60dp up — directly
 * over the onboarding language choices, which it then swallowed taps for (it is
 * pressable, zIndex 999). A bar that is not mounted must reserve NO height.
 */
export function publishTabBarLive(next: boolean): void {
  if (live === next) return;
  live = next;
  notify();
}

function subscribe(fn: () => void): () => void {
  subscribers.add(fn);
  return () => {
    subscribers.delete(fn);
  };
}

const getSnapshot = (): number => measured;
const getServerSnapshot = (): number => 0;
const getLive = (): boolean => live;
const getLiveServer = (): boolean => false;

/**
 * How much room floating UI must leave at the bottom. Pure, so the onboarding
 * regression is testable without a renderer:
 *
 * - no bar mounted → the safe inset only (0 on a device without one). Reserving the
 *   bar's height here is the bug: nothing is under the overlay to clear.
 * - bar mounted, height measured → that height.
 * - bar mounted, first frame before its layout lands → the derived height, so the
 *   pill never flashes over the tabs on the opening frame.
 */
export function clearanceFor(state: { live: boolean; measured: number; insetBottom: number }): number {
  if (!state.live) return state.insetBottom;
  if (state.measured > 0) return state.measured;
  return (
    TAB_BAR_CONTENT_HEIGHT +
    (state.insetBottom > 0 ? state.insetBottom : TAB_BAR_DEFAULT_BOTTOM_PAD)
  );
}

export function useTabBarClearance(): number {
  const insets = useSafeAreaInsets();
  const height = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const mounted = useSyncExternalStore(subscribe, getLive, getLiveServer);
  return clearanceFor({ live: mounted, measured: height, insetBottom: insets.bottom });
}

/** Test-only read of the store's state — the publish guards are otherwise unobservable. */
export function tabBarMetricsSnapshot(): { live: boolean; measured: number; subscribers: number } {
  return { live, measured, subscribers: subscribers.size };
}

/** Test-only: reset the module-level store between cases. */
export function resetTabBarMetrics(): void {
  live = false;
  measured = 0;
}
