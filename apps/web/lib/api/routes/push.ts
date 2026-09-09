// /api/push — web push subscription management (blueprint Stage 5).
//
//   GET  /api/push/vapid-key   — the public VAPID key (or null when unconfigured)
//   POST /api/push/subscribe   — store this browser's PushSubscription
//   POST /api/push/unsubscribe — drop it
//
// Sending happens server-side via lib/push/sendToUser().

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { getUserId } from "@/lib/api/auth";
import {
  vapidPublicKey,
  saveSubscription,
  removeSubscription,
  type PushSubscriptionJSON,
} from "@/lib/push";

const subSchema = z.object({
  endpoint: z.string().url().max(1024),
  keys: z.object({
    p256dh: z.string().min(1).max(256),
    auth: z.string().min(1).max(256),
  }),
});

export const pushRoutes = new Hono()

  .get("/vapid-key", (c) => {
    return c.json({ success: true, data: { key: vapidPublicKey() } });
  })

  .post("/subscribe", zValidator("json", subSchema), async (c) => {
    const userId = await getUserId(c);
    if (!userId) return c.json({ error: "Unauthorized" }, 401);
    const sub = c.req.valid("json") as PushSubscriptionJSON;
    const ok = await saveSubscription(userId, sub, c.req.raw.headers.get("user-agent") ?? "");
    return c.json({ success: ok, data: { subscribed: ok } });
  })

  .post(
    "/unsubscribe",
    zValidator("json", z.object({ endpoint: z.string().url().max(1024) })),
    async (c) => {
      const userId = await getUserId(c);
      if (!userId) return c.json({ error: "Unauthorized" }, 401);
      await removeSubscription(c.req.valid("json").endpoint);
      return c.json({ success: true, data: { unsubscribed: true } });
    },
  );
