import * as Sentry from "@sentry/nextjs";

/**
 * Edge runtime Sentry init (middleware + edge routes). Loaded from
 * instrumentation.ts inside `register()`. DSN via NEXT_PUBLIC_SENTRY_DSN; the
 * fallback is a clearly-marked placeholder that sends nothing until set.
 */
const SENTRY_DSN =
  process.env.NEXT_PUBLIC_SENTRY_DSN ?? "https://examplePublicKey@o0.ingest.sentry.io/0";

Sentry.init({
  dsn: SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
});
