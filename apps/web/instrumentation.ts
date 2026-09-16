// Next.js runs register() once when the server starts. Sentry's SDK must be
// initialized here — inside register(), for each runtime — so it is up before
// any request is handled, and so the existing env validation still runs first
// thing on the Node.js runtime. The `onRequestError` hook below takes effect on
// Next.js 15+ (this app is on 14.2, where it is ignored but harmless).
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
    // Log any missing/misconfigured environment variables loudly at boot (see
    // lib/env.ts), so operators catch a bad prod config immediately instead of
    // via mysterious 401s or 503s later.
    const { assertServerEnv } = await import("./lib/env");
    assertServerEnv();
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Captures errors from nested React Server Components, middleware, and proxies.
// No-op on Next.js 14.2; activates automatically once this app upgrades to
// Next.js 15+.
export const onRequestError = Sentry.captureRequestError;
