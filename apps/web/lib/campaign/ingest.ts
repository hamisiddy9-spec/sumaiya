/**
 * Campaign-event ingest — the door bouncer for POST /api/campaign/event.
 *
 * A client-reported event is untrusted input by definition, and this table is
 * what the admin campaign view reads. So the rules are strict and they live
 * here, pure and testable, rather than inline in a route that only a browser
 * can exercise:
 *
 *   - `src`      sanitized to the same slug shape attribution.ts produces
 *                (`[a-z0-9._-]`, ≤64). Junk that survives as nothing is
 *                REJECTED rather than stored as an unattributable row: a row
 *                with no campaign is not campaign data.
 *   - `name`     must be one of the declared funnel steps (events.ts). Free
 *                text here would let anything write any row name it liked and
 *                silently poison the rollup.
 *   - `visitorId` an opaque random id, 6–64 chars of `[a-z0-9-]` after
 *                normalization. It is the unit "unique visitors" is counted in,
 *                so it must be a bounded, comparable token.
 *   - `props`    the event's own declared props, run through the SAME PII
 *                stripper the outcome/app-telemetry writes use. The client's
 *                shape is not the guarantee; the stripper is.
 *   - `at`       the client clock is advisory: never in the future, never older
 *                than 30 days (same clamp as the native ingest).
 */
import { sanitizeCampaignSource } from "@/lib/analytics/attribution";
import { isCampaignFunnelStep, type CampaignFunnelStep } from "@/lib/analytics/events";
import { sanitizePayload } from "@/lib/outcomes/events";

/** Client timestamps are advisory — the same window the native ingest uses. */
export const MAX_EVENT_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export const MIN_VISITOR_ID_LENGTH = 6;
export const MAX_VISITOR_ID_LENGTH = 64;

export interface CampaignEventInput {
  src: string;
  name: CampaignFunnelStep;
  visitorId: string;
  occurredAt: Date;
  props: Record<string, unknown>;
}

export type CampaignEventParse =
  | { ok: true; value: CampaignEventInput }
  | { ok: false; reason: string };

/** Normalize a visitor id to a bounded, comparable token (or ""). */
export function normalizeVisitorId(raw: unknown): string {
  if (typeof raw !== "string") return "";
  const clean = raw.toLowerCase().replace(/[^a-z0-9-]+/g, "").slice(0, MAX_VISITOR_ID_LENGTH);
  return clean.length >= MIN_VISITOR_ID_LENGTH ? clean : "";
}

/**
 * Client clock, clamped: a phone with a wrong date must not scatter rows across
 * years, and a replayed request must not fake a future one.
 */
export function clampOccurredAt(at: unknown, now = Date.now()): Date {
  if (typeof at !== "number" || !Number.isFinite(at)) return new Date(now);
  if (at > now) return new Date(now);
  if (at < now - MAX_EVENT_AGE_MS) return new Date(now - MAX_EVENT_AGE_MS);
  return new Date(at);
}

export function parseCampaignEvent(raw: unknown, now = Date.now()): CampaignEventParse {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, reason: "body" };
  }
  const body = raw as Record<string, unknown>;

  const src = sanitizeCampaignSource(
    typeof body.src === "string" ? body.src : null,
  );
  if (!src) return { ok: false, reason: "src" };

  const name = typeof body.name === "string" ? body.name : "";
  if (!isCampaignFunnelStep(name)) return { ok: false, reason: "name" };

  const visitorId = normalizeVisitorId(body.visitorId);
  if (!visitorId) return { ok: false, reason: "visitorId" };

  return {
    ok: true,
    value: {
      src,
      name,
      visitorId,
      occurredAt: clampOccurredAt(body.at, now),
      props: sanitizePayload(body.props ?? {}),
    },
  };
}
