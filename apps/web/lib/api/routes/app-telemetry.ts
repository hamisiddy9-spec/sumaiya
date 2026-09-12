// Native app telemetry — POST /app/telemetry.
//
// The native app batches anonymous events (lib/telemetry.ts on the device) and
// drops them here. This is the ONLY window we get into a tester's phone: their
// build, whether the updater finished, and what broke.
//
// Rules (same spirit as snap-events, different key):
//   • No sign-in required. The events that matter most — install, first launch,
//     the update funnel — happen BEFORE anyone has a user row, and a tester who
//     never signs in is still a tester. The grouping key is the anonymous
//     per-install id the app generates once.
//   • Never reject the client. A failed telemetry ping must never affect the
//     app, so every path returns 200 and every failure is swallowed.
//   • Sanitized on the way in, not on the way out: props go through the same
//     PII-stripping sanitizer as outcome events, so a future event with a
//     careless payload can't quietly store a phone number.
//   • Opt-out is enforced HERE, per batch, for signed-in users — the client is
//     not trusted to remember the setting.
//
// Mounted at /app/telemetry (Hono) — outside /ai/*, so pings never touch the AI
// burst limiter; the general API limiter still applies.

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { appEvent, userProfile } from "@/lib/db/schema";
import { getUserId } from "@/lib/api/auth";
import { sanitizePayload } from "@/lib/outcomes/events";
import { createHash } from "node:crypto";

/** Hard caps: a runaway client must not be able to write a million rows. */
const MAX_EVENTS = 50;
const MAX_NAME = 64;
const MAX_INSTALL_ID = 64;

const eventSchema = z.object({
  name: z.string().min(1).max(MAX_NAME),
  props: z.record(z.string(), z.unknown()).optional(),
  at: z.number().optional(),
});

const bodySchema = z.object({
  installId: z.string().min(6).max(MAX_INSTALL_ID),
  appVersion: z.string().max(32).optional(),
  platform: z.string().max(32).optional(),
  device: z.string().max(120).optional().nullable(),
  events: z.array(eventSchema).min(1).max(MAX_EVENTS),
});

/**
 * Salted, irreversible per-user key — the same construction outcome events use,
 * so app telemetry can be joined to outcome data without identifying anyone.
 * Returns null when the salt isn't configured (we still store the event; we just
 * don't claim to have a real anonymization key for it).
 */
function userHashFor(userId: string): string | null {
  const salt = process.env.OUTCOME_SALT;
  if (!salt) return null;
  return createHash("sha256").update(`${salt}:${userId}`).digest("hex");
}

export const appTelemetryRoutes = new Hono().post(
  "/telemetry",
  zValidator("json", bodySchema),
  async (c) => {
    const body = c.req.valid("json");
    try {
      const userId = await getUserId(c).catch(() => null);

      // Opt-out wins over everything, checked at ingest for signed-in users.
      if (userId) {
        const [row] = await db
          .select({ optOut: userProfile.analyticsOptOut })
          .from(userProfile)
          .where(eq(userProfile.id, userId))
          .limit(1);
        if (row?.optOut) return c.json({ ok: true, skipped: "opted_out" });
      }

      const userHash = userId ? userHashFor(userId) : null;
      const appVersion = body.appVersion ?? null;
      const platform = body.platform ?? "android";
      const device = body.device ?? null;

      await db.insert(appEvent).values(
        body.events.map((e) => ({
          id: nanoid(),
          installId: body.installId,
          userHash,
          name: e.name,
          // `sql`…`::jsonb` — NOT the bare object. Handing drizzle a plain
          // object for a jsonb column double-encodes it: the column ends up
          // holding a JSON *string*, so `props->>'key'` returns NULL forever
          // and the data looks present while reading as empty. Proven against
          // real rows: plain object → jsonb_typeof=string; with the cast →
          // object. The same bug was silently blanking the admin Insights page.
          props: sql`${sanitizePayload(e.props ?? {})}::jsonb` as unknown as Record<string, unknown>,
          appVersion,
          platform,
          device,
          // Client clock when the device sent one; the server clock is the
          // fallback so a phone with a wrong date can't scatter rows across
          // years. Clamped to "no future" for the same reason.
          occurredAt: clampOccurredAt(e.at),
        })),
      );
    } catch (err) {
      // Instrumentation must never break the feature it observes.
      console.error("[app-telemetry] ingest failed (swallowed):", err);
    }
    return c.json({ ok: true });
  },
);

/** Client timestamps are advisory: never in the future, never older than 30d. */
function clampOccurredAt(at?: number): Date {
  const now = Date.now();
  if (!at || !Number.isFinite(at)) return new Date(now);
  const floor = now - 30 * 24 * 60 * 60 * 1000;
  if (at > now) return new Date(now);
  if (at < floor) return new Date(floor);
  return new Date(at);
}
