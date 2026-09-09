// Next.js runs register() once when the server starts. We use it to log any
// missing/misconfigured environment variables loudly at boot (see lib/env.ts),
// so operators catch a bad prod config immediately instead of via mysterious
// 401s or 503s later.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { assertServerEnv } = await import("./lib/env");
    assertServerEnv();
  }
}
