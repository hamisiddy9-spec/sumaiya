// /api/payments — PayMe Africa mobile-money checkout.
//
//   GET  /api/payments            — provider status (enabled / configured / sandbox)
//   POST /api/payments/initiate   — { plan, phone } — start a mobile-money collection
//   POST /api/payments/callback   — PayMe webhook: verify signature → provision Premium
//   GET  /api/payments/status/:ref — the caller's own payment status (poll)
//
// Gating: the server switch is PAYMENTS_ENABLED (env). While it is off, every
// state-changing route 403s, so the integration can ship dark and be flipped on
// by an env change + redeploy once the sandbox flow is confirmed. Provisioning
// rides the existing Premium window (profile.premiumUntil via grantPremiumDays),
// so a paid user needs no new entitlement wiring.

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db, payment } from "@/lib/db";
import { getUserId } from "@/lib/api/auth";
import { captureServer, flushAnalytics } from "@/lib/analytics/server";
import { grantPremiumDays } from "@/lib/referral";
import { PLANS, planAmount, normalizeTzMsisdn, type PlanId } from "@/lib/payments/plans";
import {
  readPaymeConfig,
  paymentsEnabled,
  collection,
  verifyWebhook,
  parseCollectionResponse,
  parseWebhook,
} from "@/lib/api/payme";

const initiateSchema = z.object({
  plan: z.enum(["monthly", "annual", "test"]),
  phone: z.string().min(9).max(20),
});

export const paymentRoutes = new Hono()

  .get("/", (c) => {
    const cfg = readPaymeConfig();
    return c.json({
      provider: "payme",
      enabled: paymentsEnabled(),
      configured: Boolean(cfg),
      sandbox: cfg?.sandbox ?? false,
    });
  })

  .post("/initiate", zValidator("json", initiateSchema), async (c) => {
    if (!paymentsEnabled()) {
      return c.json({ error: "Payments are currently disabled." }, 403);
    }
    const cfg = readPaymeConfig();
    if (!cfg) {
      return c.json({ error: "Payment provider is not configured." }, 503);
    }
    const userId = await getUserId(c);
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const { plan, phone } = c.req.valid("json");
    const amount = planAmount(plan, "TZS");
    if (amount === null) return c.json({ error: "Unknown plan." }, 400);

    const msisdn = normalizeTzMsisdn(phone);
    if (!msisdn) {
      return c.json({ error: "Enter a valid Tanzanian mobile number (e.g. 0712 345 678)." }, 400);
    }

    const reference = `SUM-${nanoid()}`;

    // Record the attempt BEFORE calling the provider, so a webhook that races
    // the HTTP response still finds a row to settle against.
    await db.insert(payment).values({
      id: nanoid(),
      userId,
      amount,
      currency: "TZS",
      status: "pending",
      provider: "payme",
      providerRef: reference,
      paymentMethod: "mobile_money",
      metadata: { plan },
    });
    captureServer(userId, "checkout_started", { plan, amount, currency: "TZS" });

    const callbackUrl = process.env.PAYME_CALLBACK_URL || undefined;
    let result;
    try {
      result = await collection(cfg, { amount, msisdn, reference, currency: "TZS", callbackUrl });
    } catch (err) {
      console.error("[payme] collection request failed:", err);
      await db.update(payment).set({ status: "failed", updatedAt: new Date() }).where(eq(payment.providerRef, reference));
      captureServer(userId, "payment_failed", { plan, stage: "initiate", status: "network_error" });
      await flushAnalytics();
      return c.json({ error: "Couldn't reach the payment service. Please try again." }, 502);
    }

    if (!result.ok) {
      // PayMe's reply carries the reason (bad signature, unknown app, wallet
      // balance…). It holds no secrets; cap it so a huge body can't flood logs.
      const detail = typeof result.raw === "string" ? result.raw : JSON.stringify(result.raw);
      console.error(`[payme] collection rejected: HTTP ${result.status} sigMode=${cfg.sigMode} body=${(detail ?? "").slice(0, 500)}`);
      await db.update(payment).set({ status: "failed", updatedAt: new Date() }).where(eq(payment.providerRef, reference));
      captureServer(userId, "payment_failed", { plan, stage: "initiate", status: String(result.status) });
      await flushAnalytics();
      return c.json({ error: "Payment couldn't be started. Please try again." }, 502);
    }

    // Record PayMe's own transaction id against the pending row, so it is
    // traceable even before the settlement webhook arrives.
    const parsed = parseCollectionResponse(result.raw);
    if (parsed.providerTxnId) {
      await db.update(payment).set({ providerTxnId: parsed.providerTxnId, updatedAt: new Date() }).where(eq(payment.providerRef, reference));
    }

    captureServer(userId, "payment_initiated", { plan, amount, currency: "TZS" });
    await flushAnalytics();
    // The push is on its way to the user's phone; the webhook settles it.
    return c.json({ success: true, data: { reference, status: "pending" } });
  })

  // Webhook — unauthenticated by session (PayMe calls it), authenticated by the
  // HMAC signature. Reads the RAW body: the signature is over the exact bytes.
  .post("/callback", async (c) => {
    const cfg = readPaymeConfig();
    if (!cfg) return c.json({ error: "not configured" }, 503);

    const rawBody = await c.req.raw.text();
    const sig =
      c.req.raw.headers.get("X-Middleware-Signature") ||
      c.req.raw.headers.get("X-Signature");
    if (!verifyWebhook(cfg, rawBody, sig, c.req.raw.headers.get("X-Timestamp"))) {
      console.warn("[payme] callback rejected: bad signature");
      return c.json({ error: "invalid signature" }, 401);
    }

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      return c.json({ error: "bad json" }, 400);
    }

    const evt = parseWebhook(payload);
    if (!evt.reference) return c.json({ ok: true }); // nothing to settle

    const [row] = await db
      .select({ id: payment.id, userId: payment.userId, status: payment.status, amount: payment.amount, currency: payment.currency, metadata: payment.metadata })
      .from(payment)
      .where(eq(payment.providerRef, evt.reference))
      .limit(1);
    if (!row) return c.json({ ok: true });
    if (row.status === "completed") return c.json({ ok: true }); // idempotent replay

    const plan = (row.metadata as { plan?: PlanId } | null)?.plan;

    if (evt.paid) {
      const days = plan ? PLANS[plan].days : 30;
      await db.update(payment).set({ status: "completed", providerTxnId: evt.providerTxnId, updatedAt: new Date() }).where(eq(payment.id, row.id));
      await grantPremiumDays(row.userId, days);
      captureServer(row.userId, "payment_completed", { plan: plan ?? null, amount: row.amount, currency: row.currency, days });
      await flushAnalytics();
      return c.json({ ok: true });
    }

    if (evt.failed) {
      await db.update(payment).set({ status: "failed", providerTxnId: evt.providerTxnId, updatedAt: new Date() }).where(eq(payment.id, row.id));
      captureServer(row.userId, "payment_failed", { plan: plan ?? null, stage: "callback", status: "failed" });
      await flushAnalytics();
      return c.json({ ok: true });
    }

    // PENDING / unknown — acknowledge without changing state; a later webhook settles it.
    return c.json({ ok: true });
  })

  .get("/status/:reference", async (c) => {
    const userId = await getUserId(c);
    if (!userId) return c.json({ error: "Unauthorized" }, 401);
    const reference = c.req.param("reference");
    const [row] = await db
      .select({ status: payment.status })
      .from(payment)
      .where(and(eq(payment.providerRef, reference), eq(payment.userId, userId)))
      .limit(1);
    if (!row) return c.json({ error: "Not found" }, 404);
    return c.json({ success: true, data: { status: row.status } });
  });
