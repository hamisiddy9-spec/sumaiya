import * as Sentry from "@sentry/nextjs";

/**
 * Server (Node.js runtime) Sentry init. Loaded from instrumentation.ts inside
 * `register()` so it runs before any request is handled.
 *
 * DSN via NEXT_PUBLIC_SENTRY_DSN (see .env.example); the fallback is a
 * clearly-marked placeholder that keeps the SDK wired but sends nothing until a
 * real DSN is set.
 */
const SENTRY_DSN =
  process.env.NEXT_PUBLIC_SENTRY_DSN ?? "https://examplePublicKey@o0.ingest.sentry.io/0";

Sentry.init({
  dsn: SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
});
