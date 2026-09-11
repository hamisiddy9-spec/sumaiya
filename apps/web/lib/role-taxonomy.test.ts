import { describe, it, expect } from "vitest";
import { detectRoleBucket, roleTaxonomyPromptBlock } from "./role-taxonomy";

describe("detectRoleBucket", () => {
  it("detects sales from a title", () => {
    expect(detectRoleBucket("Sales Associate at NMB Bank")?.id).toBe("sales");
  });

  it("detects clinical from a Swahili title", () => {
    expect(detectRoleBucket("Daktari wa Mifugo - Arusha")?.id).toBe("clinical");
  });

  it("uses word boundaries — 'tax' (finance) does not false-positive inside 'taxi'", () => {
    expect(detectRoleBucket("The taxi arrived on time every day")).toBeNull();
  });

  it("returns null for an empty or unmatched string", () => {
    expect(detectRoleBucket("")).toBeNull();
    expect(detectRoleBucket("Some role with no lexicon hits xyzabc")).toBeNull();
  });
});

describe("roleTaxonomyPromptBlock", () => {
  it("returns a non-empty, truthfulness-guarded block for a detected bucket", () => {
    const block = roleTaxonomyPromptBlock("Sales Representative — FMCG distributor");
    expect(block).toContain("sales role");
    expect(block).toContain("never invent");
  });

  it("returns empty string when nothing matches — never forces a framing", () => {
    expect(roleTaxonomyPromptBlock("")).toBe("");
    expect(roleTaxonomyPromptBlock("xyzabc no signal here")).toBe("");
  });

  it("never imposes sales framing on a clinical role (the veterinarian guard, generalized)", () => {
    const block = roleTaxonomyPromptBlock("Veterinarian - animal health clinic");
    expect(block).toContain("clinical/care role");
    expect(block).not.toContain("sales role");
  });
});
