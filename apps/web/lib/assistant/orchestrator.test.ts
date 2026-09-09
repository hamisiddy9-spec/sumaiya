/**
 * Unit tests for the goal-chaining orchestrator (lib/assistant/orchestrator.ts).
 */
import { describe, it, expect } from "vitest";
import { computeNextAction, type ExecutedAction } from "./orchestrator";
import type { UnifiedContext } from "./context";

function ctx(cv = true): UnifiedContext {
  return {
    profile: null,
    profileSummary: "",
    activeCv: cv ? { id: "cv1", title: "My CV", data: { personal: { fullName: "", jobTitle: "", email: "", phone: "", location: "" }, summary: "", experience: [], education: [], skills: [], certifications: [], languages: [], projects: [], referees: [] } as never } : null,
    applications: [],
    matchedJobs: [],
    unconfirmed: [],
    signals: [],
    recentActivity: [],
  };
}

const JD = "Senior backend engineer. Requirements: Node.js, PostgreSQL, AWS, Docker, TypeScript, REST APIs.";

describe("computeNextAction", () => {
  it("returns null when nothing executed yet", () => {
    expect(computeNextAction(ctx(), null)).toBeNull();
  });

  it("jobs.match below 70 → cv.tailor with the same JD (empty fixture CV scores low)", () => {
    const last: ExecutedAction = { tool: "jobs.match", args: { jobDescription: JD } };
    const next = computeNextAction(ctx(), last);
    expect(next?.tool).toBe("cv.tailor");
    expect(next?.args.jobDescription).toBe(JD);
  });

  it("jobs.match IGNORES a client-supplied score — the real engine decides (security fix)", () => {
    // A lying client must not force the next step: score 0 and score 99 on the
    // SAME cv+jd must produce the SAME decision, computed from the real engine.
    const low: ExecutedAction = { tool: "jobs.match", args: { jobDescription: JD }, score: 0 };
    const high: ExecutedAction = { tool: "jobs.match", args: { jobDescription: JD }, score: 99 };
    const a = computeNextAction(ctx(), low);
    const b = computeNextAction(ctx(), high);
    expect(a?.tool).toBe(b?.tool);
    expect(a?.reason.en).toBe(b?.reason.en);
    // The reason shows the REAL engine's score, not the spoofed one.
    expect(a!.reason.en).toMatch(/\d+%/);
    expect(a!.reason.en).not.toContain("99%");
  });

  it("jobs.match without a CV → null (nothing grounded to suggest)", () => {
    const last: ExecutedAction = { tool: "jobs.match", args: { jobDescription: JD }, score: 55 };
    expect(computeNextAction(ctx(false), last)).toBeNull();
  });

  it("ats.check below 70 → cv.improveSummary", () => {
    const last: ExecutedAction = { tool: "ats.check", args: {} };
    const next = computeNextAction(ctx(), last);
    expect(next?.tool).toBe("cv.improveSummary");
  });

  it("ats.check IGNORES a client-supplied score — the real engine decides (security fix)", () => {
    const low: ExecutedAction = { tool: "ats.check", args: {}, score: 0 };
    const high: ExecutedAction = { tool: "ats.check", args: {}, score: 99 };
    const a = computeNextAction(ctx(), low);
    const b = computeNextAction(ctx(), high);
    expect(a?.tool).toBe(b?.tool);
    expect(a?.reason.en).toBe(b?.reason.en);
  });

  it("cv.tailor → coverLetter.generate, carrying the JD", () => {
    const last: ExecutedAction = { tool: "cv.tailor", args: { jobDescription: JD } };
    const next = computeNextAction(ctx(), last);
    expect(next?.tool).toBe("coverLetter.generate");
    expect(next?.args.jobDescription).toBe(JD);
  });

  it("coverLetter.generate → jobs.track carrying the job details", () => {
    const last: ExecutedAction = { tool: "coverLetter.generate", args: { jobTitle: "Senior Backend Engineer", company: "NMB Bank", jobDescription: JD } };
    const next = computeNextAction(ctx(), last);
    expect(next?.tool).toBe("jobs.track");
    expect(next?.args.jobTitle).toBe("Senior Backend Engineer");
    expect(next?.args.companyName).toBe("NMB Bank");
  });

  it("jobs.track → interview.prep with the application link", () => {
    const last: ExecutedAction = { tool: "jobs.track", args: {}, applicationId: "a1" };
    const next = computeNextAction(ctx(), last);
    expect(next?.tool).toBe("interview.prep");
    expect(next?.href).toBe("/interview?app=a1");
  });

  it("unknown / read-only tools produce no invented next step", () => {
    expect(computeNextAction(ctx(), { tool: "jobs.search", args: {} })).toBeNull();
    expect(computeNextAction(ctx(), { tool: "doc.summarize", args: {} })).toBeNull();
    expect(computeNextAction(ctx(), { tool: "pdf.merge", args: {} })).toBeNull();
  });
});
