import * as Sentry from "@sentry/nextjs";

/**
 * Client-side Sentry init. This file is auto-injected into the browser entry by
 * `withSentryConfig`'s webpack plugin (see next.config.mjs), so it runs before
 * any app code in the browser.
 *
 * The DSN is read from NEXT_PUBLIC_SENTRY_DSN (see .env.example). A Sentry DSN's
 * "public key" is not a secret — it only identifies the project — so it is safe
 * to expose via NEXT_PUBLIC_*. The fallback below is a clearly-marked
 * placeholder: the SDK stays wired but no events are ever ingested until a real
 * DSN is set.
 */
const SENTRY_DSN =
  process.env.NEXT_PUBLIC_SENTRY_DSN ?? "https://examplePublicKey@o0.ingest.sentry.io/0";

Sentry.init({
  dsn: SENTRY_DSN,
  // 100% in dev so every trace is visible while building; 10% in prod to keep
  // span volume modest for the mostly-3G audience.
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
});
