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

/**
 * The activation funnel — the ordered stages a user passes through on the way
 * to their first completed application. Keep in sync with the web catalog
 * (apps/web/lib/analytics/events.ts) so the two apps measure the same journey.
 */
export const FUNNEL_EVENTS = {
  signedUp: "signed_up",
  onboarded: "onboarded",
  profileCompleted: "profile_completed",
  cvCreated: "cv_created",
  cvExported: "cv_exported",
  applicationCreated: "application_created",
  templateSelected: "template_selected",
} as const;

type Sink = (name: string, props?: TrackProps) => void;

let sink: Sink | null = null;

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
