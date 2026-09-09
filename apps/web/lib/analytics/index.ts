/**
 * Analytics — the client-safe entry point.
 *
 * Two sinks, one API:
 *   - PostHog          — the product funnel: per-user events, cohorts, session
 *                        replay, feature flags, surveys. Initialised lazily in
 *                        the browser, gated on an env key + Do-Not-Track.
 *   - Vercel Analytics — kept for cookieless, aggregate traffic numbers
 *                        (<Analytics/> in the root layouts does the pageviews).
 *
 * Existing call sites keep working: `track("event", props)` and the default
 * `posthog` stub export are unchanged. New code should prefer `capture(name,
 * props)` with a name from `EVENTS` for compile-time safety.
 *
 * Nothing here throws — analytics must never break a user action — and with no
 * PostHog key set every call degrades to the Vercel-only behaviour we had
 * before.
 */
import { track as vercelTrack } from "@vercel/analytics";
import {
  type AnalyticsEventMap,
  type AnalyticsEventName,
  isKnownEvent,
} from "./events";

export {
  EVENTS,
  ACTIVATION_EVENTS,
  type AnalyticsEventName,
  type AnalyticsEventMap,
  type DocumentType,
  type ExportSource,
} from "./events";

// Re-export for the handful of legacy imports that referenced these types.
export type { ExportSource as LegacyExportSource } from "./events";

type Props = Record<string, unknown> | undefined;

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com";

function primitivesOnly(
  props?: Props,
): Record<string, string | number | boolean | null> | undefined {
  if (!props) return undefined;
  const out: Record<string, string | number | boolean | null> = {};
  for (const [k, v] of Object.entries(props)) {
    if (v === null || ["string", "number", "boolean"].includes(typeof v)) {
      out[k] = v as string | number | boolean | null;
    }
  }
  return Object.keys(out).length ? out : undefined;
}

function doNotTrack(): boolean {
  if (typeof navigator === "undefined") return false;
  const n = navigator as Navigator & { msDoNotTrack?: string };
  const w = window as Window & { doNotTrack?: string };
  const v = n.doNotTrack ?? w.doNotTrack ?? n.msDoNotTrack;
  return v === "1" || v === "yes";
}

// ─── PostHog (browser) — lazy singleton ──────────────────────────────────────

let phLoad: Promise<typeof import("posthog-js").default | null> | null = null;

function loadPostHog() {
  if (phLoad) return phLoad;
  phLoad = (async () => {
    if (typeof window === "undefined" || !POSTHOG_KEY || doNotTrack()) {
      return null;
    }
    try {
      const { default: posthogJs } = await import("posthog-js");
      posthogJs.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        // Session replay on the editor + snap flows is the highest-value
        // signal for a 3G Android audience — but mask everything a CV can
        // contain by default.
        session_recording: {
          maskAllInputs: true,
          maskTextSelector: "[data-ph-mask], input, textarea, [contenteditable]",
        },
        autocapture: true,
        capture_pageview: true,
        capture_pageleave: true,
        persistence: "localStorage+cookie",
        // We call identify() ourselves on auth state change.
        person_profiles: "identified_only",
      });
      return posthogJs;
    } catch {
      return null;
    }
  })();
  return phLoad;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Loose event tracker — kept for existing call sites. Fires PostHog (when
 * available) and Vercel. In dev, warns on an event name that isn't in the
 * catalog so orphan events are caught early.
 */
export function track(event: string, props?: Props): void {
  if (typeof window === "undefined") return;
  if (process.env.NODE_ENV !== "production" && !isKnownEvent(event)) {
    // eslint-disable-next-line no-console
    console.warn(
      `[analytics] "${event}" is not in lib/analytics/events.ts — add it to the catalog.`,
    );
  }
  const clean = primitivesOnly(props);
  try {
    vercelTrack(event, clean);
  } catch {
    /* never let analytics break a user action */
  }
  loadPostHog()
    .then((ph) => ph?.capture(event, clean))
    .catch(() => {});
}

/** Typed tracker — preferred for new code. `props` is inferred from the name. */
export function capture<K extends AnalyticsEventName>(
  event: K,
  ...args: AnalyticsEventMap[K] extends void ? [] : [props: AnalyticsEventMap[K]]
): void {
  track(event, args[0] as Props);
}

/** @deprecated use `track` / `capture`. Kept for existing imports. */
export function trackFunnelEvent(event: string, props?: Props): void {
  track(event, props);
}

/**
 * Tie subsequent events to a real user. Call on sign-in / session restore.
 * `reset()` (via signOut) unlinks so a shared phone doesn't merge two people.
 */
export function identify(
  userId: string,
  traits?: Record<string, string | number | boolean>,
): void {
  loadPostHog()
    .then((ph) => ph?.identify(userId, traits))
    .catch(() => {});
}

export function resetIdentity(): void {
  loadPostHog()
    .then((ph) => ph?.reset())
    .catch(() => {});
}

/** Read a PostHog feature flag in the browser (undefined until flags load). */
export async function getFeatureFlag(
  key: string,
): Promise<boolean | string | undefined> {
  const ph = await loadPostHog();
  return ph?.getFeatureFlag(key);
}

/**
 * Drop-in stand-in for the `posthog-js` default export, so the few files that
 * did `import posthog from "@/lib/analytics"` and call `posthog.capture(...)`
 * keep working and now actually reach PostHog.
 */
const posthog = {
  capture: (event?: unknown, props?: unknown) => {
    if (typeof event === "string") track(event, props as Props);
  },
  identify: (id?: unknown, traits?: unknown) => {
    if (typeof id === "string")
      identify(id, traits as Record<string, string | number | boolean>);
  },
  reset: () => resetIdentity(),
  captureException: (_e?: unknown, _props?: unknown) => {
    /* Vercel/PostHog analytics is not the error tracker — see lib/observability */
  },
};
export default posthog;
