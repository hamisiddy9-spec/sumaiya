import { describe, expect, it } from "vitest";
import { ASSISTANT_TOOLS, toolMeta } from "./tools";

describe("toolMeta", () => {
  it("returns resolved metadata for every tool in the catalog", () => {
    for (const t of ASSISTANT_TOOLS) {
      const m = toolMeta(t.id);
      expect(["auto", "preview", "confirm", "blocked"]).toContain(m.policy);
      expect(["none", "cheap-ai", "full-ai"]).toContain(m.cost);
      expect(["local", "queue", "online-only"]).toContain(m.offline);
      expect(m.capability).toBeTruthy();
    }
  });

  it("defaults read tools to auto and write tools to at least preview", () => {
    for (const t of ASSISTANT_TOOLS) {
      const m = toolMeta(t.id);
      if (t.sideEffect === "read") {
        // read tools are auto unless explicitly escalated (none currently are)
        expect(m.policy).toBe("auto");
      } else {
        expect(m.policy === "preview" || m.policy === "confirm").toBe(true);
      }
    }
  });

  it("puts artifact-creating / external / fact-committing tools behind confirm (D3)", () => {
    const mustConfirm = [
      "cv.tailor",
      "coverLetter.generate",
      "jobs.track",
      "application.update",
      "letter.invoice",
      "doc.convert",
    ];
    for (const id of mustConfirm) {
      expect(toolMeta(id).policy).toBe("confirm");
    }
  });

  it("marks the deterministic engines as free + offline-capable", () => {
    expect(toolMeta("ats.check")).toMatchObject({
      cost: "none",
      offline: "local",
    });
    expect(toolMeta("jobs.match")).toMatchObject({
      cost: "none",
      offline: "local",
    });
  });

  it("handles an unknown tool id without throwing", () => {
    const m = toolMeta("nope.notreal");
    expect(m.policy).toBe("auto");
  });
});
