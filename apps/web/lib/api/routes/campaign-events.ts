// Campaign funnel ingest — POST /api/campaign/event.
//
// The one thing the web funnel was missing: a server-side record that a printed
// poster was ever scanned. lib/analytics/campaign.ts posts the funnel steps a
// tagged visit can reach; this route stores them in `campaign_event` so the
// admin campaign view can answer "did the poster produce anyone?" from OUR
// database instead of a third-party dashboard this repo cannot query.
//
// Rules (the anti-pattern is `app_event`, whose ingest this deliberately copies):
//   • No sign-in required. The whole point is the steps BEFORE anyone has an
//     account — requiring auth would lose exactly the scans we are trying to
//     measure. The grouping key is an anonymous per-browser visitor id.
//   • Never reject the client. A failed ping must never affect the ATS check or
//     the sign-in that triggered it, so every path returns 200 and every failure
//     is swallowed after being logged.
//   • Sanitized on the way in, never on the way out: src is slug-validated, the
//     name must be a declared funnel step, and props go through the same
//     PII-stripping sanitizer outcome events use. See lib/campaign/ingest.ts.
//   • Opt-out is enforced here for signed-in senders, same as the native ingest
//     — the client is not trusted to remember the setting. (Anonymous scans
//     carry no user identity at all, only an opaque random visitor id.)
//
// Mounted at /campaign/event (Hono) — outside /ai/*, so pings never touch the AI
// burst limiter; the general 60/min API limiter still applies.

import { Hono } from "hono";
import { eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { campaignEvent, userProfile } from "@/lib/db/schema";
import { getUserId } from "@/lib/api/auth";
import { parseCampaignEvent } from "@/lib/campaign/ingest";

export const campaignEventRoutes = new Hono().post("/event", async (c) => {
  try {
    const body = await c.req.json().catch(() => null);
    const parsed = parseCampaignEvent(body);
    if (!parsed.ok) {
      // Not a client error worth surfacing: the tracker is fire-and-forget and
      // a rejected ping must look exactly like an accepted one to the browser.
      return c.json({ ok: true, skipped: parsed.reason });
    }

    const userId = await getUserId(c).catch(() => null);
    if (userId) {
      const [row] = await db
        .select({ optOut: userProfile.analyticsOptOut })
        .from(userProfile)
        .where(eq(userProfile.id, userId))
        .limit(1);
      if (row?.optOut) return c.json({ ok: true, skipped: "opted_out" });
    }

    const { src, name, visitorId, occurredAt, props } = parsed.value;
    await db.insert(campaignEvent).values({
      id: nanoid(),
      src,
      name,
      visitorId,
      // `sql`…`::jsonb` — NOT the bare object. A plain object handed to drizzle
      // arrives double-encoded (the column holds a JSON *string*), which is the
      // bug that silently blanked the admin Insights page: see
      // lib/api/routes/app-telemetry.ts for the same cast and the evidence.
      props: sql`${props}::jsonb` as unknown as Record<string, unknown>,
      occurredAt,
    });
  } catch (err) {
    // Instrumentation must never break the feature it observes.
    console.error("[campaign-events] ingest failed (swallowed):", err);
  }
  return c.json({ ok: true });
});
