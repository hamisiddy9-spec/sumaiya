import { rateLimit, rateLimitDurable } from "@/lib/api/rate-limit";
import { db, aiUsage } from "@/lib/db";
import { and, eq, sql } from "drizzle-orm";

// Per-user AI usage caps. Two layers:
//  - burst window (in-memory, per instance) — cheap protection against rapid fire
//  - daily cap (durable, DB-backed) — the real cost ceiling, shared across
//    serverless instances and surviving deploys.
// Both are configurable via env.
const PER_MINUTE = Number(process.env.AI_PER_MINUTE ?? 10);
const PER_DAY = Number(process.env.AI_PER_DAY ?? 60);

const DAY_MS = 24 * 60 * 60 * 1000;

export interface AiQuotaResult {
  allowed: boolean;
  message?: string;
  retryAfter?: number;
}

const overDailyLimit: AiQuotaResult = {
  allowed: false,
  message: "You've reached today's AI limit. It resets within 24 hours.",
};

/** Atomically increments and reads the user's counter for today (UTC). */
async function bumpDailyUsage(userId: string): Promise<number> {
  const day = new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
  const [row] = await db
    .insert(aiUsage)
    .values({ userId, day, count: 1 })
    .onConflictDoUpdate({
      target: [aiUsage.userId, aiUsage.day],
      set: { count: sql`${aiUsage.count} + 1`, updatedAt: new Date() },
    })
    .returning({ count: aiUsage.count });
  return row?.count ?? 1;
}

/**
 * Rolls back one unit of today's usage. Call this when a request that already
 * passed checkAiQuota ultimately produced no result (e.g. the provider errored),
 * so a user is never billed for an AI response they didn't receive. Best-effort:
 * failures here are swallowed so they can't turn a provider hiccup into a 500.
 */
export async function refundAiUsage(userId: string): Promise<void> {
  const day = new Date().toISOString().slice(0, 10);
  try {
    await db
      .update(aiUsage)
      .set({ count: sql`GREATEST(${aiUsage.count} - 1, 0)`, updatedAt: new Date() })
      .where(and(eq(aiUsage.userId, userId), eq(aiUsage.day, day)));
  } catch (err) {
    console.error("[AI] usage refund failed:", err);
  }
}

/**
 * Enforces per-user AI usage caps. Call once per AI request, after resolving
 * the user id. The burst window is checked first so a rate-limited burst does
 * not consume the user's daily allowance. The daily cap is DB-backed; if the
 * DB is unavailable (or the ai_usage table hasn't been created yet) it falls
 * back to a soft in-memory daily counter so the feature still degrades safely.
 */
export async function checkAiQuota(userId: string): Promise<AiQuotaResult> {
  const burst = await rateLimitDurable(`ai-min:${userId}`, { max: PER_MINUTE, windowMs: 60_000 });
  if (!burst.allowed) {
    return {
      allowed: false,
      retryAfter: burst.retryAfter,
      message: "You're using AI a little fast — please wait a moment and try again.",
    };
  }

  try {
    const count = await bumpDailyUsage(userId);
    return count > PER_DAY ? overDailyLimit : { allowed: true };
  } catch (err) {
    // DB error or table not migrated yet — fall back to a soft in-memory cap.
    console.error("[AI] durable quota unavailable, using in-memory fallback:", err);
    const daily = rateLimit(`ai-day:${userId}`, { max: PER_DAY, windowMs: DAY_MS });
    return daily.allowed ? { allowed: true } : { ...overDailyLimit, retryAfter: daily.retryAfter };
  }
}
