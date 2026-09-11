import { describe, it, expect } from "vitest";
import { isPremiumTemplate, PREMIUM_TEMPLATE_IDS, CURATED_CV_TEMPLATE_IDS, TEMPLATES } from "./index";

describe("isPremiumTemplate", () => {
  it("flags exactly the 7 hand-curated 'Premium flagships'", () => {
    expect([...PREMIUM_TEMPLATE_IDS].sort()).toEqual(
      ["coral", "kioo", "malachite", "nuru", "pemba", "rift", "zahabu"].sort(),
    );
  });

  it("every premium id is a real, existing template", () => {
    const ids = new Set(TEMPLATES.map((t) => t.id));
    for (const id of PREMIUM_TEMPLATE_IDS) expect(ids.has(id)).toBe(true);
  });

  it("every premium id is in the curated set (never gates a template nobody is offered)", () => {
    for (const id of PREMIUM_TEMPLATE_IDS) expect(CURATED_CV_TEMPLATE_IDS).toContain(id);
  });

  it("a non-premium template is not flagged", () => {
    expect(isPremiumTemplate("nakuru")).toBe(false);
  });

  it("an unknown id is never premium", () => {
    expect(isPremiumTemplate("not-a-real-template")).toBe(false);
  });
});
