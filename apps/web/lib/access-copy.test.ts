/**
 * The dashboard's access banner may not claim what the account does not have.
 *
 * The shipped defect: a brand-new free account read "Umefunguliwa Kila Kitu /
 * Kila kitu kipo tayari kutumika" ("everything is unlocked") while
 * GET /api/entitlements answered `premium: false` with
 * `capabilities["template.premium"] === false` — the Premium designs were
 * locked (docs/QA-WEB-JOURNEYS-2026-09-20.md D2). Live response captured beside
 * the rendered copy on 2026-09-21: only `template.premium` is false for a
 * signed-in free account; every other capability is true.
 *
 * These assertions are about the SENTENCE the user reads, because that is what
 * was false — the numbers underneath were always right.
 */
import { describe, it, expect } from "vitest";
import { accessCopy } from "./access-copy";

const UNLOCKED_SW = "Umefunguliwa Kila Kitu";
const UNLOCKED_SW_BODY = "Kila kitu kipo tayari kutumika.";
const UNLOCKED_EN = "Full access";
const UNLOCKED_EN_BODY = "All features unlocked.";

describe("accessCopy — a non-Premium account is never told everything is unlocked", () => {
  it("Swahili: no 'everything is unlocked', names the one locked thing, keeps the upsell", () => {
    const c = accessCopy(false, true);
    const all = `${c.title} ${c.body}`;
    expect(all).not.toContain(UNLOCKED_SW);
    expect(all).not.toContain(UNLOCKED_SW_BODY);
    // Says what IS free, so the banner is still useful.
    expect(all).toMatch(/CV/);
    expect(all).toMatch(/bure/i);
    // Names the actual limit (the only tier:"plan" capability)…
    expect(all).toContain("Premium");
    // …and keeps an honest way to get it (referrals grant a real window today).
    expect(all).toMatch(/rafiki/);
    expect(c.cta).toBeDefined();
    // Never names the ATS mechanism in Swahili (lib/swahili-lint.test.ts guard).
    expect(all).not.toMatch(/\bATS\b/);
  });

  it("English: same rule", () => {
    const c = accessCopy(false, false);
    const all = `${c.title} ${c.body}`;
    expect(all).not.toContain(UNLOCKED_EN);
    expect(all).not.toContain(UNLOCKED_EN_BODY);
    expect(all).toContain("Premium");
    expect(all).toMatch(/inviting a friend/i);
    expect(c.cta).toBeDefined();
  });

  it("a Premium account (an active earned window) may say everything is unlocked", () => {
    const sw = accessCopy(true, true);
    expect(sw.title).toBe(UNLOCKED_SW);
    expect(sw.body).toBe(UNLOCKED_SW_BODY);
    const en = accessCopy(true, false);
    expect(en.title).toBe(UNLOCKED_EN);
    expect(en.body).toBe(UNLOCKED_EN_BODY);
    // Nothing left to sell — no CTA.
    expect(sw.cta).toBeUndefined();
    expect(en.cta).toBeUndefined();
  });

  it("the two surfaces that render it use one function, so they can never disagree", () => {
    // Both the sidebar card and the dashboard banner call accessCopy with the
    // same premium flag; this pins the two languages to the same claim set.
    for (const premium of [true, false]) {
      const sw = accessCopy(premium, true);
      const en = accessCopy(premium, false);
      expect(Boolean(sw.cta)).toBe(Boolean(en.cta));
      expect(sw.title.length).toBeGreaterThan(0);
      expect(en.title.length).toBeGreaterThan(0);
    }
  });
});
