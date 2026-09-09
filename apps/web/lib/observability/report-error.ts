/**
 * Server-side error reporting.
 *
 * Best-effort and never throws (a reporter that can crash the request it's
 * reporting on is worse than no reporter): a structured JSON line to the
 * console. On Vercel this lands in the function logs, so a 500 is greppable by
 * message/scope instead of vanishing into a bare `catch {}`. Runtime errors are
 * also surfaced in Vercel's dashboard.
 */

type ErrorContext = Record<string, unknown> & {
  userId?: string;
  distinctId?: string;
  /** Where the error came from, e.g. "api", "contact". */
  scope?: string;
};

function toError(e: unknown): Error {
  return e instanceof Error ? e : new Error(typeof e === "string" ? e : JSON.stringify(e));
}

/**
 * Report a caught server-side error. Awaitable so callers on an error path keep
 * the same call shape, but resolves immediately.
 */
export async function reportError(error: unknown, context: ErrorContext = {}): Promise<void> {
  const err = toError(error);
  try {
    console.error(
      JSON.stringify({
        level: "error",
        name: err.name,
        message: err.message,
        stack: err.stack,
        ...context,
      }),
    );
  } catch {
    console.error("[reportError]", err, context);
  }
}
