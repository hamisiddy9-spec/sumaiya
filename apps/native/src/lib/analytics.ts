/**
 * Client-side analytics seam for the native app.
 *
 * The web app has a full typed event catalog and `capture()` sink
 * (apps/web/lib/analytics/events.ts). Native has neither yet, so this exposes
 * the same `track(name, props)` call shape and logs to the console for now. A
 * real sink (PostHog, Amplitude, the /api/analytics endpoint) can be dropped
 * in later via `setAnalyticsSink()` without touching any call site.
 *
 * Event NAMES follow the web catalog's snake_case convention — add new ones to
 * apps/web/lib/analytics/events.ts as they land.
 *
 * Deliberately no-crash: analytics must never take down a screen, even in a
 * bad release build.
 */

export type TrackProps = Record<string, string | number | boolean | null | undefined>;

type Sink = (name: string, props?: TrackProps) => void;

let sink: Sink | null = null;

// Re-export the shared activation-funnel definition so native call sites import
// one entry point (`../lib/analytics`) for both `track` and the stage names.
export { ACTIVATION_FUNNEL, FUNNEL_EVENTS, type FunnelEventName } from "@sumaiya/types";

/** Register the real sink once at startup. Pass null to disable it. */
export function setAnalyticsSink(fn: Sink | null): void {
  sink = fn;
}

/** Emit one event. Logs to console for now; never throws. */
export function track(name: string, props?: TrackProps): void {
  try {
    console.info(`[analytics] ${name}`, props ?? {});
  } catch {
    /* swallow — logging must not throw */
  }
  if (sink) {
    try {
      sink(name, props);
    } catch {
      /* a broken sink is not the app's problem */
    }
  }
}
