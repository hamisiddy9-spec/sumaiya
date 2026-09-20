import { Hono } from "hono";
import { handle } from "hono/vercel";
import { cvRoutes } from "@/lib/api/routes/cv";
import { coverLetterRoutes } from "@/lib/api/routes/cover-letter";
import { businessCardRoutes } from "@/lib/api/routes/business-card";
import { letterRoutes } from "@/lib/api/routes/letter";
import { aiRoutes } from "@/lib/api/routes/ai";
import { snapRoutes } from "@/lib/api/routes/snap";
import { snapEventRoutes } from "@/lib/api/routes/snap-events";
import { userRoutes } from "@/lib/api/routes/user";
import { toolsRoutes } from "@/lib/api/routes/tools";
import { capabilityRoutes } from "@/lib/api/routes/capabilities";
import { entitlementRoutes } from "@/lib/api/routes/entitlements";
import { pushRoutes } from "@/lib/api/routes/push";
import { referralRoutes } from "@/lib/api/routes/referral";
import { whatsappRoutes } from "@/lib/api/routes/whatsapp";
import { profileRoutes } from "@/lib/api/routes/profile";
import { applicationRoutes } from "@/lib/api/routes/applications";
import { atsHistoryRoutes } from "@/lib/api/routes/ats-history";
import { marketplaceRoutes } from "@/lib/api/routes/marketplace";
import { versionRoutes } from "@/lib/api/routes/versions";
import { jobRoutes } from "@/lib/api/routes/jobs";
import { mobileOcrRoutes } from "@/lib/api/routes/mobile-ocr";
import { mobileRoutes } from "@/lib/api/routes/mobile";
import { appTelemetryRoutes } from "@/lib/api/routes/app-telemetry";
import { campaignEventRoutes } from "@/lib/api/routes/campaign-events";
import { rateLimitDurable, clientIp } from "@/lib/api/rate-limit";
import { reportError } from "@/lib/observability/report-error";

// pdf-lib / unpdf need the Node runtime (not edge). Give the function real
// headroom: PDF work on a cold lambda can exceed the 10s Hobby default and a
// timed-out function is exactly what made uploads "hang" with no response.
export const runtime = "nodejs";
export const maxDuration = 60;

const app = new Hono().basePath("/api");

// ── Rate limiters ────────────────────────────────────────────────────────────

// General API: 60 requests per minute per IP
app.use("*", async (c, next) => {
  const ip = clientIp(c.req.raw);
  const result = await rateLimitDurable(`api:${ip}`, { max: 60, windowMs: 60_000 });
  if (!result.allowed) {
    return c.json({ error: "Too many requests" }, 429);
  }
  await next();
});

// Stricter limit for AI: 10 per minute
app.use("/ai/*", async (c, next) => {
  const ip = clientIp(c.req.raw);
  const result = await rateLimitDurable(`ai:${ip}`, { max: 10, windowMs: 60_000 });
  if (!result.allowed) {
    return c.json({ error: "I can't take any more requests right now. Try again in a minute." }, 429);
  }
  await next();
});

// Surface any unhandled route error to the logs + PostHog instead of letting it
// disappear into a bare 500. Best-effort (fire-and-forget) so reporting never
// adds latency to the failing request.
app.onError((err, c) => {
  void reportError(err, { scope: "api", path: c.req.path, method: c.req.method });
  return c.json({ error: "Internal server error" }, 500);
});

// ── Routes ───────────────────────────────────────────────────────────────────

app.route("/cv", cvRoutes);
app.route("/cover-letter", coverLetterRoutes);
app.route("/business-card", businessCardRoutes);
app.route("/letter", letterRoutes);
app.route("/ai", aiRoutes);
app.route("/ai", snapRoutes);
// Client-reported snap funnel events — mounted OUTSIDE /ai/* so the pings
// never touch the AI burst limiter (see lib/api/routes/snap-events.ts).
app.route("/snap", snapEventRoutes);
app.route("/user", userRoutes);
app.route("/tools", toolsRoutes);
app.route("/capabilities", capabilityRoutes);
app.route("/entitlements", entitlementRoutes);
app.route("/push", pushRoutes);
app.route("/referral", referralRoutes);
app.route("/whatsapp", whatsappRoutes);
app.route("/profile", profileRoutes);
app.route("/applications", applicationRoutes);
app.route("/ats-history", atsHistoryRoutes);
app.route("/marketplace", marketplaceRoutes);
app.route("/versions", versionRoutes);
app.route("/jobs", jobRoutes);
app.route("/mobile", mobileOcrRoutes);
app.route("/mobile", mobileRoutes);
// Anonymous native telemetry — signed-out installs included, so it can't live
// behind the user-keyed outcome-event path. Never rejects the client.
app.route("/app", appTelemetryRoutes);
// Printed-poster campaign funnel — client-reported, anonymous, unsigned-in
// scans included (they are the scans that matter). See lib/campaign/ingest.ts.
app.route("/campaign", campaignEventRoutes);

app.get("/health", (c) => c.json({ ok: true, ts: Date.now() }));

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);
export const OPTIONS = handle(app);
