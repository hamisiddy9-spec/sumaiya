/**
 * Simple in-memory rate limiter.
 * For production, use Redis or similar. Good enough for VEdge serverless.
 */

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const store = new Map<string, RateLimitEntry>();

// Periodic cleanup to prevent memory leaks
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 60_000; // 1 minute

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) store.delete(key);
  }
}

export interface RateLimitOptions {
  max: number;       // max requests allowed
  windowMs: number;  // time window in milliseconds
}

/**
 * Returns { allowed: true } or { allowed: false, retryAfter: seconds }
 * Key should be derived from IP or a unique per-user identifier.
 */
export function rateLimit(key: string, options: RateLimitOptions): { allowed: boolean; retryAfter?: number } {
  cleanup();
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + options.windowMs });
    return { allowed: true };
  }

  entry.count++;
  if (entry.count > options.max) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  return { allowed: true };
}

// ── Durable (cross-instance) limiter ─────────────────────────────────────────
// The in-memory limiter above lives inside a single serverless instance, so on
// Vercel it only throttles bursts that happen to hit the same warm lambda. For
// real per-IP protection we back it with Upstash Redis over its REST API (plain
// fetch — no SDK, edge-safe). When Upstash isn't configured, or the call errors
// or times out, we fall back to the in-memory limiter so nothing ever hard-fails
// on the rate-limit path.
const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const durableEnabled = Boolean(UPSTASH_URL && UPSTASH_TOKEN);

/** One fixed-window check against Upstash: INCR, set TTL on first hit, read TTL. */
async function upstashCheck(
  key: string,
  options: RateLimitOptions,
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 1000);
  try {
    const res = await fetch(`${UPSTASH_URL!.replace(/\/$/, "")}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        "Content-Type": "application/json",
      },
      // PEXPIRE ... NX sets the window only on the first hit, so the window
      // doesn't slide forward on every request.
      body: JSON.stringify([
        ["INCR", key],
        ["PEXPIRE", key, String(options.windowMs), "NX"],
        ["PTTL", key],
      ]),
      signal: ctrl.signal,
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`upstash ${res.status}`);
    const data = (await res.json()) as Array<{ result?: number; error?: string }>;
    const count = data[0]?.result;
    if (typeof count !== "number") throw new Error("upstash bad response");
    if (count <= options.max) return { allowed: true };
    const ttlMs = data[2]?.result;
    const retryAfter =
      typeof ttlMs === "number" && ttlMs > 0
        ? Math.ceil(ttlMs / 1000)
        : Math.ceil(options.windowMs / 1000);
    return { allowed: false, retryAfter };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Cross-instance rate limit. Uses Upstash Redis when configured; otherwise (or
 * on any Upstash error/timeout) falls back to the in-memory limiter. Same
 * return shape as {@link rateLimit}, but async. Prefer this on HTTP-facing
 * paths; the sync {@link rateLimit} is fine for per-instance burst guards.
 */
export async function rateLimitDurable(
  key: string,
  options: RateLimitOptions,
): Promise<{ allowed: boolean; retryAfter?: number }> {
  if (!durableEnabled) return rateLimit(key, options);
  try {
    return await upstashCheck(key, options);
  } catch {
    // Upstash unreachable/slow — degrade to the in-memory limiter rather than
    // letting the request fail on the throttle check.
    return rateLimit(key, options);
  }
}

/**
 * Get client IP from request headers (works on Vercel, most edge platforms)
 */
export function clientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const xrip = request.headers.get("x-real-ip");
  if (xrip) return xrip.trim();
  return "127.0.0.1";
}
