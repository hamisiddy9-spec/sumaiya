import { useEffect, useState } from "react";
import { AppState } from "react-native";
import { useNetworkState, getNetworkStateAsync } from "expo-network";
import { API_BASE_URL } from "./api-client";

/** How long a "not reachable" reading must persist before we even investigate.
 *  expo-network's isInternetReachable does a real reachability probe, which is
 *  known to flash a false negative for a tick or two right after app launch
 *  (network stack still settling) or during a Wi-Fi/cellular handoff — without
 *  this debounce the offline banner flickers on for a moment on a perfectly
 *  healthy connection. */
const OFFLINE_DEBOUNCE_MS = 2500;

/** How long to wait between backend checks while the platform still claims we
 *  are offline, so a stale reading self-corrects instead of sticking. */
const RECHECK_MS = 10_000;

/** A reachability probe must never hang the banner decision. */
const PROBE_TIMEOUT_MS = 5000;

type NetworkStateLike = { isInternetReachable?: boolean; isConnected?: boolean };

/**
 * What the platform reports, on its own terms.
 *
 * expo-network's Android implementation returns false unless the *active*
 * network carries NET_CAPABILITY_INTERNET, NET_CAPABILITY_VALIDATED and
 * NET_CAPABILITY_NOT_SUSPENDED (see NetworkUtils.kt). VALIDATED is only set
 * after Android's own captive-portal probe to Google has completed, and
 * NOT_SUSPENDED is dropped whenever the system suspends the radio — screen off,
 * Doze, or right after a handoff. In all of those states our own backend is
 * perfectly reachable while this flag says otherwise.
 */
export function rawIsOnline(state: NetworkStateLike): boolean {
  if (state.isInternetReachable === undefined && state.isConnected === undefined) return true;
  // isInternetReachable is the stronger signal on Android; fall back to isConnected.
  return (state.isInternetReachable ?? state.isConnected ?? true) !== false;
}

/**
 * The actual decision: is the user online?
 *
 * The platform reading is trusted when it says yes. When it says no we do NOT
 * take its word for it — the only thing that matters to the person holding the
 * phone is whether Sumaiya's backend answers, so we ask it. A single false
 * reading from a suspended or not-yet-validated network must not tell someone
 * they are offline while their edits would sync fine.
 */
export function resolveOnline(state: NetworkStateLike, backendReachable: boolean | null): boolean {
  if (rawIsOnline(state)) return true;
  return backendReachable === true;
}

/** Ask our own backend, cheaply and with a hard timeout. */
export async function probeBackend(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
    try {
      const res = await fetch(`${API_BASE_URL}/api/health`, {
        method: "GET",
        signal: controller.signal,
        cache: "no-store",
      });
      return res.ok;
    } finally {
      clearTimeout(timer);
    }
  } catch {
    // Aborted, DNS failure, no route — all mean "cannot reach the backend".
    return false;
  }
}

/**
 * Is the device online right now?
 *
 * Conservative in both directions: an undefined first tick (before the native
 * module has answered) counts as online so the banner never flashes on a cold
 * start, and a "not reachable" reading is confirmed against our own API before
 * it is believed.
 */
export function useIsOnline(): boolean {
  const state = useNetworkState();
  const raw = rawIsOnline(state);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    if (raw) {
      setOnline(true);
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    // Keep re-checking for as long as the platform disagrees with reality, so a
    // stale reading clears on its own rather than waiting for the user to
    // background and reopen the app.
    const check = async () => {
      if (cancelled) return;
      const reachable = await probeBackend();
      if (cancelled) return;
      setOnline(resolveOnline(state, reachable));
      timer = setTimeout(check, RECHECK_MS);
    };

    timer = setTimeout(check, OFFLINE_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [raw, state]);

  // expo-network's own change events are push-based, and after the device
  // spends a long stretch asleep (Doze/deep sleep) that push can simply never
  // fire again on resume — a real user saw the "offline" banner stuck for the
  // rest of the session even though connectivity had genuinely come back,
  // clearing only when the app process was killed and restarted. Force a
  // fresh read whenever the app returns to the foreground.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      if (next !== "active") return;
      getNetworkStateAsync()
        .then(async (fresh) => {
          if (rawIsOnline(fresh)) {
            setOnline(true);
            return;
          }
          setOnline(resolveOnline(fresh, await probeBackend()));
        })
        .catch(() => {});
    });
    return () => sub.remove();
  }, []);

  return online;
}
