/**
 * Crash / error reporting seam.
 *
 * The app has no crash reporter wired yet (no Sentry DSN, no provisioning).
 * Rather than scatter `console.error` everywhere and lose field crashes, every
 * caught-but-notable error goes through `reportError`. Today it just logs; the
 * day a reporter is provisioned, call `setReporter(...)` once at startup and
 * every existing call site starts shipping breadcrumbs — no further edits.
 *
 *   // e.g. in _layout.tsx, after Sentry.init(...)
 *   setReporter((err, ctx) => Sentry.captureException(err, { extra: ctx }));
 */

type Reporter = (error: unknown, context?: Record<string, unknown>) => void;

let reporter: Reporter | null = null;

/** Register the real reporter once at startup. Passing null disables it. */
export function setReporter(fn: Reporter | null): void {
  reporter = fn;
}

/**
 * Report a caught error that the user was shielded from but that we'd want to
 * see in aggregate (sync failures, chat errors, boundary catches…). Never
 * throws — a broken reporter must not break the app.
 */
export function reportError(error: unknown, context?: Record<string, unknown>): void {
  if (__DEV__) {
    // In development, the console is the reporter.
    console.error("[reportError]", context?.scope ?? "", error, context ?? "");
  }
  if (reporter) {
    try {
      reporter(error, context);
    } catch {
      /* a broken reporter is not the app's problem */
    }
  }
}
