// /api/referral — the word-of-mouth loop (blueprint Stage 5).
//
//   GET  /api/referral        — the caller's code + invite URL + joined/activated counts
//   POST /api/referral/claim   — { code } — link the caller as referred (once, ever)
//   POST /api/referral/shared  — { channel } — analytics only (a share happened)

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { getUserId } from "@/lib/api/auth";
import { referralStats, claimReferral } from "@/lib/referral";
import { captureServer } from "@/lib/analytics/server";

export const referralRoutes = new Hono()

  .get("/", async (c) => {
    const userId = await getUserId(c);
    if (!userId) return c.json({ error: "Unauthorized" }, 401);
    try {
      return c.json({ success: true, data: await referralStats(userId) });
    } catch (err) {
      console.error("[referral] stats failed:", err);
      return c.json({ error: "Couldn't load your invite link." }, 500);
    }
  })

  .post("/claim", zValidator("json", z.object({ code: z.string().min(1).max(16) })), async (c) => {
    const userId = await getUserId(c);
    if (!userId) return c.json({ error: "Unauthorized" }, 401);
    const { code } = c.req.valid("json");
    const result = await claimReferral(code, userId);
    // A failed claim (unknown / self / already) is not an error the client
    // shows — it's a silent no-op. Only the transport can 4xx/5xx.
    return c.json({ success: true, data: result });
  })

  .post("/shared", zValidator("json", z.object({ channel: z.enum(["whatsapp", "link", "copy"]) })), async (c) => {
    const userId = await getUserId(c);
    if (!userId) return c.json({ error: "Unauthorized" }, 401);
    captureServer(userId, "referral_sent", { channel: c.req.valid("json").channel });
    return c.json({ success: true });
  });
