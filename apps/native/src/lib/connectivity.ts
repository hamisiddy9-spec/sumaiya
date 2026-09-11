import { useEffect, useState } from "react";
import { useNetworkState } from "expo-network";

/** How long a "not reachable" reading must persist before we believe it.
 *  expo-network's isInternetReachable does a real reachability probe, which is
 *  known to flash a false negative for a tick or two right after app launch
 *  (network stack still settling) or during a Wi-Fi/cellular handoff — without
 *  this debounce the offline banner flickers on for a moment on a perfectly
 *  healthy connection. */
const OFFLINE_DEBOUNCE_MS = 2500;

function rawIsOnline(state: { isInternetReachable?: boolean; isConnected?: boolean }): boolean {
  if (state.isInternetReachable === undefined && state.isConnected === undefined) return true;
  // isInternetReachable is the stronger signal on Android; fall back to isConnected.
  return (state.isInternetReachable ?? state.isConnected ?? true) !== false;
}

/**
 * Is the device online right now? Conservative in both directions: an
 * undefined first tick (before the native module has answered) counts as
 * online so the banner never flashes on a cold start, and a "false" reading
 * must hold for OFFLINE_DEBOUNCE_MS before it's believed, so a momentary
 * reachability-probe blip doesn't flash the banner either.
 */
export function useIsOnline(): boolean {
  const state = useNetworkState();
  const raw = rawIsOnline(state);
  const [debounced, setDebounced] = useState(true);

  useEffect(() => {
    if (raw) {
      setDebounced(true);
      return;
    }
    const id = setTimeout(() => setDebounced(false), OFFLINE_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [raw]);

  return debounced;
}
