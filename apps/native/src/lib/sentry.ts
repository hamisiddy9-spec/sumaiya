import * as Sentry from "@sentry/react-native";

/**
 * Crash & error monitoring (Sentry).
 *
 * The DSN is read from EXPO_PUBLIC_SENTRY_DSN (see .env.example). The fallback
 * below is a clearly-marked placeholder — it is NOT a real key, so in any build
 * that forgot to set the env var the SDK stays wired but no events are ever
 * ingested. Set the real value in `.env` (local) and in the EAS secret
 * `EXPO_PUBLIC_SENTRY_DSN` (CI/release builds). Never hardcode it here.
 *
 * `Sentry.init` does the heavy lifting for crash reporting:
 *   - installs a global JS error handler (uncaught exceptions + unhandled
 *     promise rejections are captured before React can swallow them),
 *   - installs the native crash handlers (Android NDK/JNI + iOS signals) via
 *     the linked `@sentry/react-native` module (see the config plugin in
 *     app.json), so a hard crash that never reaches JS still gets reported.
 *
 * The native module is only present in a development/production build (the
 * `@sentry/react-native` config plugin in app.json links it at prebuild). On
 * Expo Go the SDK degrades gracefully — init is a no-op rather than a crash.
 */
const SENTRY_DSN =
  process.env.EXPO_PUBLIC_SENTRY_DSN ?? "https://examplePublicKey@o0.ingest.sentry.io/0";

Sentry.init({
  dsn: SENTRY_DSN,
  // Report the start/end of each app session alongside errors, so a crash's
  // impact is visible in Sentry's Health view rather than as a bare event.
  enableAutoSessionTracking: true,
  // Native crash handling is on by default; keep it explicit so a future
  // option shuffle can't silently drop JNI/signal crashes.
  enableNativeCrashHandling: true,
  enableNdk: true,
  // Keep transaction volume modest — most of the audience is on 3G.
  tracesSampleRate: 0.2,
});

/**
 * Capture a caught-but-notable error (the `reportError` seam in ../lib/reporting
 * hands every existing call site through here once wired up in _layout.tsx).
 * Safe to call before a real DSN is configured — the SDK no-ops on the
 * placeholder and never throws.
 */
export function captureException(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  try {
    Sentry.captureException(error, { extra: context });
  } catch {
    /* a broken reporter must not take down the app */
  }
}

export { Sentry };
