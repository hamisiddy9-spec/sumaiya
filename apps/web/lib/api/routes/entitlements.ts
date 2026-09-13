// /api/entitlements — what the signed-in caller is entitled to.
//
// One tiny endpoint so the CLIENT can run the same `can()` the server does,
// instead of re-inventing a tier check in a component. The template galleries
// are the first consumer: they live on the statically prerendered, CDN-cached
// marketing tree, so they cannot resolve Premium server-side without turning
// every template page dynamic (see the CDN CACHING note in middleware.ts).
// They hydrate this instead — the same shape the native app already fetches
// from /api/referral, and the same predicate (isPremiumActive) both sides use.
//
// Guests get 200 with the free answer rather than a 401: "you are not signed in,
// so you have no earned Premium" is a successful answer to this question, and
// the client hook then needs no error branch for the common anonymous case.

import { Hono } from "hono";
import { getUserId } from "@/lib/api/auth";
import { entitlementsFor } from "@/lib/entitlements";
import { premiumViewOf, subjectForUser } from "@/lib/entitlements-server";

export const entitlementRoutes = new Hono()

  .get("/", async (c) => {
    const userId = await getUserId(c);
    const subject = await subjectForUser(userId);
    return c.json({
      success: true,
      data: {
        ...premiumViewOf(subject),
        // The full capability map, answered by the same `can()` the server
        // enforces with — so a client gate can never disagree with the API.
        capabilities: entitlementsFor(subject),
      },
    });
  });
