/**
 * Server-side analytics — for events that must not be trusted from the client:
 * AI cost/latency, tool invocations, exports, self-reported outcomes.
 *
 * Uses posthog-node. `flush`/`shutdown` matter on serverless — call
 * `flushAnalytics()` before a function returns if you just captured something
 * important, or rely on the periodic flush for high-volume events.
 *
 * No key set → every call is a no-op (same graceful degradation as the client).
 */
import "server-only";
import { PostHog } from "posthog-node";
import type { AnalyticsEventMap, AnalyticsEventName } from "./events";

const KEY = process.env.POSTHOG_API_KEY || process.env.NEXT_PUBLIC_POSTHOG_KEY;
const HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com";

let client: PostHog | null = null;

function get(): PostHog | null {
  if (!KEY) return null;
  if (!client) {
    client = new PostHog(KEY, {
      host: HOST,
      // Small batches + short interval: serverless instances are short-lived.
      flushAt: 10,
      flushInterval: 3000,
    });
  }
  return client;
}

/**
 * Capture a server-side event against a user (or a stable anonymous id).
 * Typed against the same catalog as the client.
 */
export function captureServer<K extends AnalyticsEventName>(
  distinctId: string,
  event: K,
  properties?: AnalyticsEventMap[K] extends void
    ? undefined
    : AnalyticsEventMap[K],
): void {
  const ph = get();
  if (!ph) return;
  try {
    ph.capture({
      distinctId: distinctId || "anonymous",
      event,
      properties: (properties ?? undefined) as Record<string, unknown> | undefined,
    });
  } catch {
    /* analytics must never break a request */
  }
}

/** Evaluate a PostHog feature flag server-side for a given user. */
export async function serverFeatureFlag(
  key: string,
  distinctId: string,
): Promise<boolean | string | undefined> {
  const ph = get();
  if (!ph) return undefined;
  try {
    return await ph.getFeatureFlag(key, distinctId || "anonymous");
  } catch {
    return undefined;
  }
}

/** Best-effort flush — await before returning from a route that captured. */
export async function flushAnalytics(): Promise<void> {
  try {
    await get()?.flush();
  } catch {
    /* ignore */
  }
}

/** For graceful shutdown paths (instrumentation, tests). */
export async function shutdownAnalytics(): Promise<void> {
  try {
    await get()?.shutdown();
  } catch {
    /* ignore */
  }
  client = null;
}
