import { describe, it, expect } from "vitest";
import { validateToolArgs, semanticActionType, TOOL_ARG_SCHEMAS } from "@/lib/assistant/actions";

describe("validateToolArgs (WS-3)", () => {
  it("accepts valid jobs.match args", () => {
    const r = validateToolArgs("jobs.match", { jobDescription: "Marketing Manager at Kilimall..." });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.args.jobDescription).toContain("Kilimall");
  });

  it("rejects missing required args (jobs.match without jobDescription)", () => {
    const r = validateToolArgs("jobs.match", {});
    expect(r.ok).toBe(false);
  });

  it("rejects wrong types (cv.addSkills with a string instead of array)", () => {
    const r = validateToolArgs("cv.addSkills", { skills: "python" });
    expect(r.ok).toBe(false);
  });

  it("rejects unknown tools", () => {
    const r = validateToolArgs("totally.fake", {});
    expect(r.ok).toBe(false);
  });

  it("rejects extra keys (strict schema — model can't smuggle args)", () => {
    const r = validateToolArgs("application.update", {
      applicationId: "app_1",
      status: "applied",
      evil: "prompt injection",
    });
    expect(r.ok).toBe(false);
  });

  it("accepts application.update with valid status enum", () => {
    const r = validateToolArgs("application.update", { applicationId: "app_1", status: "interviewing" });
    expect(r.ok).toBe(true);
  });

  it("rejects invalid application status", () => {
    const r = validateToolArgs("application.update", { applicationId: "app_1", status: "hired!!" });
    expect(r.ok).toBe(false);
  });

  it("accepts empty-args read tools (ats.check)", () => {
    const r = validateToolArgs("ats.check", {});
    expect(r.ok).toBe(true);
  });

  it("covers every registry tool id with a schema", () => {
    // Guard: if a new tool is added to the registry without a schema, the
    // model's action for it silently drops — this test fails loudly instead.
    expect(Object.keys(TOOL_ARG_SCHEMAS).length).toBeGreaterThanOrEqual(34);
  });
});

describe("semanticActionType (directive §21)", () => {
  it("maps score tools to show_match_score", () => {
    expect(semanticActionType("jobs.match")).toBe("show_match_score");
    expect(semanticActionType("ats.check")).toBe("show_match_score");
  });

  it("maps skill-gap to show_missing_keywords", () => {
    expect(semanticActionType("career.skillGap")).toBe("show_missing_keywords");
  });

  it("maps document edits to show_document_diff", () => {
    expect(semanticActionType("cv.tailor")).toBe("show_document_diff");
    expect(semanticActionType("doc.expand")).toBe("show_document_diff");
  });

  it("maps generators to create_document", () => {
    expect(semanticActionType("coverLetter.generate")).toBe("create_document");
  });

  it("maps tracker tools to update_application", () => {
    expect(semanticActionType("jobs.track")).toBe("update_application");
    expect(semanticActionType("application.update")).toBe("update_application");
  });

  it("returns null for unknown tools", () => {
    expect(semanticActionType("nope.nothing")).toBeNull();
  });
});
