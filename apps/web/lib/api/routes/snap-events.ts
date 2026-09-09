// Snap-to-Apply funnel (D8) — client-reported outcome events.
//
// The snap UI knows steps the /api/ai/snap route can't see: the page mount
// (snap.started), the photo/OCR path (snap.ocr_used) and the save click
// (snap.saved). The client reports them here; this route funnels them into
// the SAME outcome-event infra as everything else — salted user hash,
// PII-stripped payloads, per-user analytics_opt_out check, best-effort writes.
//
// Rules (mirrors the assistant flows):
//   • Signed-in users only — guests have no user row to key, so they generate
//     nothing (same rule as lib/api/routes/ai.ts).
//   • Never throws, never rejects the client — a failed analytics ping must
//     never affect the snap flow.
//   • With OUTCOME_SALT unset, the emitter no-ops entirely (privacy gate).
//
// Mounted at POST /api/snap/event — deliberately OUTSIDE /ai/* so these tiny
// fire-and-forget pings never consume the AI burst-limiter budget (10/min per
// IP); the general 60/min API limiter still applies.

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { getUserId } from "@/lib/api/auth";
import { db } from "@/lib/db";

const snapEventSchema = z.object({
  event: z.enum(["started", "ocr_used", "saved"]),
  lang: z.enum(["en", "sw"]).optional(),
  source: z.enum(["profile", "guest"]).optional(),
});

export const snapEventRoutes = new Hono().post("/event", zValidator("json", snapEventSchema), async (c) => {
  const { event, lang, source } = c.req.valid("json");
  try {
    const userId = await getUserId(c);
    if (!userId) return c.json({ ok: true }); // guests: no user row → nothing recorded
    const { recordSnapStarted, recordSnapOcrUsed, recordSnapSaved } = await import("@/lib/outcomes/events");
    if (event === "started") {
      await recordSnapStarted(db, userId, { lang: lang ?? null });
    } else if (event === "ocr_used") {
      await recordSnapOcrUsed(db, userId, { lang: lang ?? null });
    } else {
      await recordSnapSaved(db, userId, { source: source ?? "guest", lang: lang ?? null });
    }
  } catch (err) {
    // Instrumentation must never break the feature it observes.
    console.error("[snap-events] record failed (swallowed):", err);
  }
  return c.json({ ok: true });
});
