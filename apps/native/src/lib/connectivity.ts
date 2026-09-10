import { useNetworkState } from "expo-network";

/**
 * Is the device online right now? Conservative: only reports offline when
 * expo-network is sure there's no connection — an undefined first tick (before
 * the native module has answered) counts as online so the banner never flashes
 * on a cold start.
 */
export function useIsOnline(): boolean {
  const state = useNetworkState();
  if (state.isInternetReachable === undefined && state.isConnected === undefined) return true;
  // isInternetReachable is the stronger signal on Android; fall back to isConnected.
  return (state.isInternetReachable ?? state.isConnected ?? true) !== false;
}
