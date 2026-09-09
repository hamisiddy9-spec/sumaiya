// Startup environment check. Missing values here cause silent, confusing
// failures in production — most notably, absent Supabase keys make every
// authenticated request 401 with no signal at all. Rather than fail-fast and
// risk crashing the whole app on an over-eager "required" list, we surface
// problems LOUDLY in the server logs at startup so an operator sees them
// immediately, while letting the app boot.

// Without these the app cannot function (auth breaks, or the DB won't connect).
const REQUIRED = [
  "DATABASE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

export function assertServerEnv(): void {
  const missing = REQUIRED.filter((k) => !process.env[k]);
  if (missing.length) {
    console.error(
      `[env] MISSING REQUIRED ENV VARS: ${missing.join(", ")} — ` +
        `authentication and/or the database will not work until these are set.`,
    );
  }

  // Needed for account update/delete and payment-confirmation email; core
  // document building still works without it.
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn("[env] SUPABASE_SERVICE_ROLE_KEY not set — account update/delete and some admin actions will fail.");
  }

  // Any one AI provider enables the assistant / import / tailor / translate.
  if (!process.env.DEEPSEEK_API_KEY && !process.env.ANTHROPIC_API_KEY && !process.env.OPENAI_API_KEY) {
    console.warn("[env] No AI provider key (DEEPSEEK/ANTHROPIC/OPENAI) — AI features will return 503.");
  }

  // Without Upstash, per-IP rate limiting falls back to an in-memory map that
  // only throttles within a single warm serverless instance.
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.warn("[env] UPSTASH_REDIS_REST_* not set — per-IP rate limiting is in-memory only (not cross-instance).");
  }
}
