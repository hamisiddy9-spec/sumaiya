import { describe, it, expect } from "vitest";
import {
  isSafeApplyUrl,
  findScamSignals,
  isPlaceholder,
  verifyListing,
} from "./authenticity";

describe("isSafeApplyUrl", () => {
  it("accepts plain https links", () => {
    expect(isSafeApplyUrl("https://company.com/careers/engineer")).toBe(true);
    expect(isSafeApplyUrl("https://jobs.example.com/apply/123")).toBe(true);
  });

  it("rejects non-http schemes and empty", () => {
    expect(isSafeApplyUrl("")).toBe(false);
    expect(isSafeApplyUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeApplyUrl("mailto:hr@company.com")).toBe(false);
    expect(isSafeApplyUrl("/relative/path")).toBe(false);
    expect(isSafeApplyUrl("data:text/html;base64,AAAA")).toBe(false);
  });

  it("rejects URL shorteners (phishing redirects)", () => {
    expect(isSafeApplyUrl("https://bit.ly/3xYz")).toBe(false);
    expect(isSafeApplyUrl("https://tinyurl.com/abc")).toBe(false);
    expect(isSafeApplyUrl("https://t.co/xyz")).toBe(false);
    expect(isSafeApplyUrl("https://cutt.ly/xyz")).toBe(false);
  });
});

describe("findScamSignals", () => {
  it("flags fee-to-apply scams", () => {
    const reasons = findScamSignals(
      "Mystery Shopper — earn $500/day!",
      "QuickCash Ltd",
      "Pay a registration fee of $50 to apply. Guaranteed income, no interview required.",
    );
    expect(reasons.length).toBeGreaterThan(0);
    expect(reasons.join(" ")).toMatch(/fee|guaranteed|mystery|interview/i);
  });

  it("flags wire transfer requests", () => {
    expect(findScamSignals("Job", "Co", "Send money via Western Union to start")).toContain("wire transfer request");
  });

  it("passes a normal job posting", () => {
    const reasons = findScamSignals(
      "Senior React Engineer",
      "Acme Corp",
      "We are hiring a Senior React Engineer to build our design system. 5+ years experience required. Apply at https://acme.com/careers.",
    );
    expect(reasons).toEqual([]);
  });

  it("does NOT flag anti-scam boilerplate inside a real employer's JD", () => {
    // Real Greenhouse JD (Duolingo, live 2026-08): the employer WARNS
    // candidates about scammers — mentioning the phrase, not demanding it.
    const reasons = findScamSignals(
      "Ad Sales Lead, Central",
      "Duolingo",
      "We'll never ask you to deposit a check, purchase equipment, or exchange money during the interview process. Real Duolingo employees always use an email that ends in @duolingo.com. We offer a comprehensive benefits package including paid time off and stock options.",
    );
    expect(reasons).toEqual([]);
  });

  it("still flags a REAL 'purchase equipment' demand in an un-negated sentence", () => {
    const reasons = findScamSignals(
      "Data Entry Clerk",
      "QuickCash Ltd",
      "Start today! Purchase equipment from our approved vendor ($350) to begin work. No experience required.",
    );
    expect(reasons).toContain("training/equipment fee");
  });

  it("flags a training-fee demand even when another sentence has a negation", () => {
    // Negation scoping is per-sentence: a warning elsewhere doesn't mask a
    // genuine demand in a different sentence.
    const reasons = findScamSignals(
      "Data Entry Clerk",
      "QuickCash Ltd",
      "We will not ask for your bank details. You must pay a training fee of $200 to start.",
    );
    expect(reasons).toContain("training/equipment fee");
  });
});

describe("isPlaceholder", () => {
  it("flags test/sample listings", () => {
    expect(isPlaceholder("Test job — do not apply", "lorem ipsum dolor sit amet")).toBe(true);
    expect(isPlaceholder("Sample Job", "placeholder description")).toBe(true);
  });

  it("passes real titles", () => {
    expect(isPlaceholder("Backend Engineer", "Build REST APIs with Node and Postgres.")).toBe(false);
  });
});

describe("verifyListing", () => {
  it("rejects a listing with an unsafe apply link", () => {
    const v = verifyListing({
      title: "Data Entry Clerk",
      company: "Unknown Ltd",
      description: "Work from home, flexible hours.",
      applyUrl: "https://bit.ly/apply-now",
    });
    expect(v.ok).toBe(false);
    expect(v.reasons.join(" ")).toMatch(/shortener|not a safe/i);
  });

  it("accepts a clean listing", () => {
    const v = verifyListing({
      title: "Product Designer",
      company: "Designful Inc",
      description: "Design delightful experiences for our mobile app. Portfolio required.",
      applyUrl: "https://designful.com/careers/product-designer",
    });
    expect(v.ok).toBe(true);
    expect(v.reasons).toEqual([]);
  });
});
