// Per-user monthly AI budget ceiling (system blueprint — model router:
// "hard per-user budget caps").
//
// checkAiQuota (lib/api/ai-limit) is the per-DAY call limiter. This is the
// per-MONTH spend ceiling: a rough USD estimate from the tool_invocation audit
// trail, checked in the run-tool pipeline before a cost-bearing tool runs.
//
// Off by default. Set AI_USER_MONTHLY_USD to a number to enable. A LiteLLM
// proxy can enforce its own central caps too; this is the app-level backstop
// that degrades gracefully (a blocked tool, not a 500).

import "server-only";
import { and, eq, gte, sql } from "drizzle-orm";
import { db, toolInvocation } from "@/lib/db";

// Rough blended cost per successful generative call, USD. Deliberately
// conservative (over-estimates) so the ceiling bites a little early rather
// than late. Tune with real provider invoices.
const COST_USD: Record<string, number> = {
  "full-ai": 0.004,
  "cheap-ai": 0.001,
  none: 0,
};

function ceilingUsd(): number {
  const v = Number(process.env.AI_USER_MONTHLY_USD ?? 0);
  return Number.isFinite(v) && v > 0 ? v : 0;
}

export function budgetEnabled(): boolean {
  return ceilingUsd() > 0;
}

export interface BudgetState {
  ok: boolean;
  spentUsd: number;
  ceilingUsd: number;
}

/** Estimate this calendar month's spend for a user from the audit trail. */
export async function monthlySpendUsd(userId: string): Promise<number> {
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  try {
    const rows = await db
      .select({ costClass: toolInvocation.costClass, n: sql<number>`count(*)::int` })
      .from(toolInvocation)
      .where(
        and(
          eq(toolInvocation.userId, userId),
          gte(toolInvocation.createdAt, monthStart),
          eq(toolInvocation.outcome, "executed"),
        ),
      )
      .groupBy(toolInvocation.costClass);
    return rows.reduce((sum, r) => sum + (COST_USD[r.costClass] ?? 0) * r.n, 0);
  } catch {
    // Can't read the ledger — don't block on an infra hiccup.
    return 0;
  }
}

export async function checkMonthlyBudget(userId: string | null): Promise<BudgetState> {
  const ceiling = ceilingUsd();
  if (ceiling === 0 || !userId) {
    return { ok: true, spentUsd: 0, ceilingUsd: ceiling };
  }
  const spent = await monthlySpendUsd(userId);
  return { ok: spent < ceiling, spentUsd: spent, ceilingUsd: ceiling };
}
