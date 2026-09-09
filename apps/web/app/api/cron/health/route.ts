import { NextRequest, NextResponse } from "next/server";
import { callAi, activeProvider } from "@/lib/api/ai-provider";
import { sendOpsAlert } from "@/lib/email";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Every 6h (see vercel.json). Pokes the things that fail silently:
//  - the AI provider (an out-of-credit key returns null with no other signal —
//    this is the outage that went unnoticed for weeks)
//  - the database connection
// Emails ALERT_EMAIL on any failure so the next outage is caught in hours,
// not by a user. Protected by CRON_SECRET.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const problems: string[] = [];
  const status: Record<string, string> = {};

  // ── AI provider ──────────────────────────────────────────────────────────
  const provider = activeProvider();
  if (!provider) {
    problems.push("AI: no provider key configured (DEEPSEEK / ANTHROPIC / OPENAI all unset).");
    status.ai = "no-key";
  } else {
    try {
      const reply = await callAi("Reply with exactly: ok", { maxTokens: 5, temperature: 0, timeoutMs: 15_000 });
      if (reply && reply.toLowerCase().includes("ok")) {
        status.ai = `ok (${provider})`;
      } else {
        problems.push(`AI: provider "${provider}" is configured but returned no usable response — likely out of credits or rate-limited.`);
        status.ai = `failing (${provider})`;
      }
    } catch (err) {
      problems.push(`AI: provider "${provider}" threw — ${err instanceof Error ? err.message : String(err)}`);
      status.ai = `error (${provider})`;
    }
  }

  // ── Database ─────────────────────────────────────────────────────────────
  try {
    await db.execute(sql`select 1`);
    status.db = "ok";
  } catch (err) {
    problems.push(`DB: connection check failed — ${err instanceof Error ? err.message : String(err)}`);
    status.db = "error";
  }

  if (problems.length) {
    await sendOpsAlert(`${problems.length} system check(s) failing`, problems);
  }

  return NextResponse.json(
    { healthy: problems.length === 0, status, problems },
    { status: problems.length ? 503 : 200 },
  );
}
