import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TRUTH_CONSTRAINT } from "@/lib/api/ai-guardrails";

const here = path.dirname(fileURLToPath(import.meta.url));

describe("TRUTH_CONSTRAINT", () => {
  it("is a substantial, single source of truth", () => {
    expect(typeof TRUTH_CONSTRAINT).toBe("string");
    expect(TRUTH_CONSTRAINT.length).toBeGreaterThan(80);
  });

  it("states the core rule: never invent user facts, naming the sensitive fields", () => {
    const lower = TRUTH_CONSTRAINT.toLowerCase();
    expect(lower).toContain("never invent");
    for (const word of ["employers", "numbers", "skills"]) {
      expect(lower).toContain(word);
    }
  });
});

describe("AI route wiring", () => {
  const aiRoute = readFileSync(path.join(here, "routes", "ai.ts"), "utf8");

  it("imports the shared truth constant rather than re-stating it ad hoc", () => {
    expect(aiRoute).toContain('import { TRUTH_CONSTRAINT }');
  });

  it("embeds the truth constant across multiple generation prompts", () => {
    const uses = aiRoute.split("${TRUTH_CONSTRAINT}").length - 1;
    expect(uses).toBeGreaterThanOrEqual(5);
  });
});
