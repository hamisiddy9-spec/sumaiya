/**
 * Campaign funnel → server. The link that was missing.
 *
 * THE PROBLEM THIS SOLVES
 * Attribution (`?src=poster`) is captured in the browser and attached to every
 * event — but those events go to PostHog and Vercel, third-party dashboards this
 * repo cannot query. So before this file, the server had NO record that a single
 * poster scan had ever happened: "did the poster produce one user?" was
 * unanswerable from our own data, and any admin view built on it would have been
 * a pretty page over nothing. (Verified, not assumed: no table in the schema
 * carried a campaign source — see drizzle/migrations/0019_campaign_events.sql.)
 *
 * WHAT THIS ADDS, AND HOW SMALL IT IS
 * Four steps, declared in the catalog (CAMPAIGN_FUNNEL_STEPS in events.ts), are
 * posted to POST /api/campaign/event when — and only when — the visitor arrived
 * with a `?src=`. One row per step per visitor in `campaign_event`. That makes
 * scan → ats_checked → sign_in → document_created measurable from our own
 * database, with no third party in the loop.
 *
 * WHAT IT IS NOT
 * These rows are CLIENT-REPORTED. They are a durable, queryable record of what
 * the browser said happened, exactly like the PostHog events they mirror — not
 * server-verified truth (a user could be signed in on a different device, or
 * clear storage). The admin view labels them as such rather than implying a
 * level of proof the data does not have.
 *
 * SAFETY CONTRACT (identical in spirit to the rest of lib/analytics)
 *   - never throws; every path is wrapped
 *   - no `src` in effect → no request at all (an untagged visitor is not a
 *     campaign, and the ingest route would reject it anyway)
 *   - a name that is not a declared funnel step → no request
 *   - falls back from sendBeacon to fetch(keepalive), and if both are missing
 *     (SSR, old browser, test) it silently does nothing
 */
import { getCampaignSource, getVisitorId } from "./attribution";
import {
  isCampaignFunnelStep,
  type CampaignFunnelStep,
} from "./events";

/** Where the client reports funnel steps. Mounted in app/api/[[...route]]. */
export const CAMPAIGN_EVENT_ENDPOINT = "/api/campaign/event";

/** Same bound the app-telemetry ingest uses on prop strings. */
export const MAX_CAMPAIGN_PROP_LENGTH = 120;

type PropValue = string | number | boolean | null;
type Props = Record<string, unknown> | undefined;

export interface CampaignEventPayload {
  src: string;
  name: CampaignFunnelStep;
  visitorId: string;
  /** Client clock, ms. The server clamps it — see the ingest route. */
  at: number;
  /** The event's own declared props, primitives only. */
  props: Record<string, PropValue>;
}

function primitiveProps(props: Props): Record<string, PropValue> {
  const out: Record<string, PropValue> = {};
  if (!props) return out;
  for (const [k, v] of Object.entries(props)) {
    // `src` is dropped here: `track()` merges attribution into every props bag
    // before calling this, and the payload already carries src as its own
    // top-level field with its own column. Storing it twice is how the two
    // copies eventually disagree.
    if (k === "src") continue;
    if (v === null || ["string", "number", "boolean"].includes(typeof v)) {
      out[k] = typeof v === "string" ? v.slice(0, MAX_CAMPAIGN_PROP_LENGTH) : (v as PropValue);
    }
  }
  return out;
}

/**
 * The exact body the route will receive, or null when this event must not be
 * reported. Pure — the decision logic is testable without a browser, which is
 * the only reason the door-bouncer lives in its own function.
 */
export function buildCampaignPayload(input: {
  src: string | null | undefined;
  name: string;
  visitorId: string | null | undefined;
  props?: Props;
  at?: number;
}): CampaignEventPayload | null {
  const src = typeof input.src === "string" ? input.src.trim() : "";
  if (!src) return null;
  if (!isCampaignFunnelStep(input.name)) return null;
  const visitorId = typeof input.visitorId === "string" ? input.visitorId.trim() : "";
  if (!visitorId) return null;
  return {
    src,
    name: input.name,
    visitorId,
    at: Number.isFinite(input.at) ? (input.at as number) : Date.now(),
    props: primitiveProps(input.props),
  };
}

/**
 * Report one funnel step to the server, if this visitor is campaign-attributed.
 *
 * Fire-and-forget by design: it runs on the same thread as a user action (an
 * ATS check, a sign-in) and must add no perceptible latency. sendBeacon is
 * preferred so the request survives the navigation that follows a sign-in — the
 * exact moment the old client-only setup lost the thread.
 */
export function reportCampaignStep(name: string, props?: Props): void {
  try {
    if (typeof window === "undefined") return;
    const payload = buildCampaignPayload({
      src: getCampaignSource(),
      name,
      visitorId: getVisitorId(),
      props,
    });
    if (!payload) return;
    send(payload);
  } catch {
    /* analytics must never break the action it observes */
  }
}

function send(payload: CampaignEventPayload): void {
  const body = JSON.stringify(payload);
  try {
    const nav = navigator as Navigator & {
      sendBeacon?: (url: string, data?: BodyInit | null) => boolean;
    };
    if (typeof nav.sendBeacon === "function") {
      const queued = nav.sendBeacon(
        CAMPAIGN_EVENT_ENDPOINT,
        new Blob([body], { type: "application/json" }),
      );
      if (queued) return;
    }
  } catch {
    /* fall through to fetch */
  }
  try {
    void fetch(CAMPAIGN_EVENT_ENDPOINT, {
      method: "POST",
      body,
      headers: { "content-type": "application/json" },
      keepalive: true,
      // Never let a funnel ping ride on a stale cached response.
      cache: "no-store",
    }).catch(() => {});
  } catch {
    /* nothing else to try — drop it */
  }
}
