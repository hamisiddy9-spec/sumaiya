import { describe, it, expect, afterEach } from "vitest";
import { budgetEnabled, checkMonthlyBudget } from "./budget";

const saved = { ...process.env };
afterEach(() => {
  process.env = { ...saved };
});

describe("AI monthly budget", () => {
  it("is off unless AI_USER_MONTHLY_USD is set", () => {
    delete process.env.AI_USER_MONTHLY_USD;
    expect(budgetEnabled()).toBe(false);
  });

  it("passes through for guests and when disabled", async () => {
    delete process.env.AI_USER_MONTHLY_USD;
    const r = await checkMonthlyBudget("u1");
    expect(r.ok).toBe(true);
    const g = await checkMonthlyBudget(null);
    expect(g.ok).toBe(true);
  });

  it("with no DB the spend reads as 0 → within any ceiling", async () => {
    process.env.AI_USER_MONTHLY_USD = "5";
    const r = await checkMonthlyBudget("u1");
    expect(r.ceilingUsd).toBe(5);
    expect(r.spentUsd).toBe(0);
    expect(r.ok).toBe(true);
  });
});
