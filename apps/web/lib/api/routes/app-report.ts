// User-initiated problem reports — POST /app/report.
//
// The native app's "Report a problem" (the error boundary, and Profile ->
// Report a problem) shows the user a consent sheet listing exactly what will
// be sent, and only posts here once they confirm. This is the other half of
// mobile visibility alongside app-telemetry.ts: that route answers "what are
// phones doing"; this one answers "what did a specific person hit, with
// evidence" — but the person stays anonymous the same way telemetry does.
//
// Rules (same spirit as app-telemetry.ts, different key, extra caution
// because this one accepts an image from anyone):
//   • Auth optional. A guest can hit a problem before they ever sign in, and a
//     guest who never signs in is still someone worth hearing from.
//   • Rate-limited HARD, on top of the general per-IP limiter already applied
//     to every route in route.ts — a screenshot is expensive to store, and an
//     unauthenticated endpoint that accepts base64 images is a target.
//   • Size-capped (>2MB decoded rejected outright) and the base64 is verified
//     to actually decode to a JPEG before it's stored — never store whatever
//     arrives.
//   • `logs` goes through the same PII sanitizer as outcome events and
//     app_event telemetry (it's the same shape: named entries with a small
//     props/detail bag). `note` is the user's OWN free-typed text — capped in
//     length by the schema below, but not run through the key-based
//     sanitizer, which is built for structured props and would silently
//     truncate honest prose to 120 characters.
//   • Never 500 the client: every failure path returns a plain JSON message
//     the app can show, never an opaque crash.

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { db, appReport } from "@/lib/db";
import { nanoid } from "nanoid";
import { getUserId } from "@/lib/api/auth";
import { sanitizePayload } from "@/lib/outcomes/events";
import { rateLimitDurable, clientIp } from "@/lib/api/rate-limit";
import { createHash } from "node:crypto";

/** Decoded-screenshot cap. A report is evidence, not a wallpaper. */
const MAX_SCREENSHOT_BYTES = 2 * 1024 * 1024;
// Base64 inflates by ~4/3 — cap the wire size generously above that so a
// legitimate 2MB image never gets rejected by the STRING length check before
// the real byte-length check even runs.
const MAX_SCREENSHOT_B64_CHARS = 3_000_000;

const logEntrySchema = z.object({
  at: z.number().optional(),
  kind: z.string().max(32),
  name: z.string().max(120),
  detail: z.string().max(500).optional().nullable(),
});

const bodySchema = z.object({
  installId: z.string().min(6).max(64),
  kind: z.enum(["crash", "problem", "idea"]),
  note: z.string().max(1000).optional(),
  screenshot: z.string().max(MAX_SCREENSHOT_B64_CHARS).optional().nullable(),
  logs: z.array(logEntrySchema).max(40).default([]),
  appVersion: z.string().max(32).optional(),
  platform: z.string().max(32).optional(),
  device: z.string().max(120).optional().nullable(),
});

/** Same construction as app-telemetry.ts's userHashFor — kept local rather
 *  than shared so the two ingest paths can't accidentally diverge by editing
 *  one and not the other. Null when OUTCOME_SALT isn't configured: we still
 *  store the report, we just don't claim a real anonymization key for it. */
function userHashFor(userId: string): string | null {
  const salt = process.env.OUTCOME_SALT;
  if (!salt) return null;
  return createHash("sha256").update(`${salt}:${userId}`).digest("hex");
}

/** True only if `b64` decodes to a buffer starting with the JPEG magic bytes
 *  (FF D8 FF) and is within the size cap. Anything else — not base64, a PNG,
 *  an SVG, an oversized blob — is treated as absent rather than stored. */
export function decodeJpegOrNull(b64: string | null | undefined): string | null {
  if (!b64) return null;
  try {
    const buf = Buffer.from(b64, "base64");
    if (buf.length === 0 || buf.length > MAX_SCREENSHOT_BYTES) return null;
    if (buf[0] !== 0xff || buf[1] !== 0xd8 || buf[2] !== 0xff) return null;
    return b64;
  } catch {
    return null;
  }
}

export const appReportRoutes = new Hono().post(
  "/report",
  zValidator("json", bodySchema),
  async (c) => {
    // A screenshot-carrying endpoint open to anonymous callers is exactly the
    // kind of thing that gets hammered — cap it far below the general 60/min
    // API limiter that already applies to every route.
    const ip = clientIp(c.req.raw);
    const limited = await rateLimitDurable(`app-report:${ip}`, { max: 5, windowMs: 60 * 60 * 1000 });
    if (!limited.allowed) {
      return c.json({ error: "Too many reports from this connection. Try again later." }, 429);
    }

    const body = c.req.valid("json");
    try {
      const userId = await getUserId(c).catch(() => null);
      const userHash = userId ? userHashFor(userId) : null;
      const screenshot = decodeJpegOrNull(body.screenshot);

      await db.insert(appReport).values({
        id: nanoid(),
        installId: body.installId,
        userHash,
        kind: body.kind,
        note: body.note?.trim() || null,
        screenshot,
        // `sql`…`::jsonb`, not the bare array — see app-telemetry.ts's identical
        // comment: handing drizzle a plain value for a jsonb column double-
        // encodes it into a JSON *string*, which reads back as present but
        // empty everywhere a caller does `logs[0].name`.
        logs: sql`${sanitizePayload(body.logs)}::jsonb` as unknown as unknown[],
        appVersion: body.appVersion ?? null,
        platform: body.platform ?? "android",
        device: body.device ?? null,
      });

      return c.json({ ok: true });
    } catch (err) {
      console.error("[app-report] ingest failed:", err);
      return c.json({ error: "Couldn't save that report. Please try again." }, 500);
    }
  },
);
