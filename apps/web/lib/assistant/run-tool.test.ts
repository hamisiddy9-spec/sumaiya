import { describe, expect, it } from "vitest";
import { runTool, executableTools } from "./run-tool";
import { getSampleCV } from "@/lib/sample-cv";

// These run with no DATABASE_URL / OUTCOME_SALT / PostHog key — the audit-row,
// eval-sample and analytics writes are all best-effort and swallow, so the
// pipeline's decisions and results are what we assert.

const cv = getSampleCV("en");
const user = { userId: "u_test", sw: false };
const guest = { userId: null, sw: false };

const REAL_JD =
  "We are hiring a Senior Software Engineer. Requirements: 5+ years experience with React, " +
  "TypeScript, Node.js and PostgreSQL. You will design and ship scalable web applications, " +
  "mentor junior engineers, and collaborate with product. Nairobi, hybrid. Apply now.";

describe("runTool — pipeline", () => {
  it("rejects an unknown tool", async () => {
    const r = await runTool({ toolId: "does.notExist", subject: user, caller: "ui" });
    expect(r.status).toBe("blocked");
    if (r.status === "blocked") expect(r.reason).toBe("unknown_tool");
  });

  it("blocks a needsCv tool when no CV is in context", async () => {
    const r = await runTool({ toolId: "ats.check", subject: user, caller: "ui" });
    expect(r.status).toBe("blocked");
    if (r.status === "blocked") expect(r.reason).toBe("needs_cv");
  });

  it("runs ats.check (auto policy, deterministic) and returns a score", async () => {
    const r = await runTool({
      toolId: "ats.check",
      subject: user,
      caller: "ui",
      context: { cv },
    });
    expect(r.status).toBe("ok");
    if (r.status === "ok") {
      const data = r.data as { score: number; checks: unknown[]; breakdown: unknown[] };
      expect(typeof data.score).toBe("number");
      expect(data.score).toBeGreaterThanOrEqual(0);
      expect(data.score).toBeLessThanOrEqual(100);
      expect(Array.isArray(data.checks)).toBe(true);
    }
  });

  it("guests can run ats.check (guest-first funnel)", async () => {
    const r = await runTool({
      toolId: "ats.check",
      subject: guest,
      caller: "ui",
      context: { cv },
    });
    expect(r.status).toBe("ok");
  });

  it("jobs.match runs on a real advert", async () => {
    const r = await runTool({
      toolId: "jobs.match",
      subject: user,
      caller: "assistant",
      args: { jobDescription: REAL_JD },
      context: { cv },
    });
    expect(r.status).toBe("ok");
    if (r.status === "ok") {
      const data = r.data as { score: number; matched: string[]; missing: string[] };
      expect(typeof data.score).toBe("number");
    }
  });

  it("jobs.match blocks conversational text that isn't an advert", async () => {
    const r = await runTool({
      toolId: "jobs.match",
      subject: user,
      caller: "assistant",
      args: { jobDescription: "i want a job as a developer somewhere in nairobi" },
      context: { cv },
    });
    expect(r.status).toBe("blocked");
    if (r.status === "blocked") expect(r.reason).toBe("bad_advert");
  });

  it("jobs.match rejects invalid args", async () => {
    const r = await runTool({
      toolId: "jobs.match",
      subject: user,
      caller: "assistant",
      args: {},
      context: { cv },
    });
    expect(r.status).toBe("blocked");
    if (r.status === "blocked") expect(r.reason).toBe("invalid_args");
  });

  it("a confirm-policy tool returns confirm_required, not a result", async () => {
    const r = await runTool({
      toolId: "cv.tailor",
      subject: user,
      caller: "assistant",
      args: { jobDescription: REAL_JD },
      context: { cv },
    });
    expect(r.status).toBe("confirm_required");
  });

  it("cv.tailor with confirmed:true gets past the gate (then no_executor here)", async () => {
    const r = await runTool({
      toolId: "cv.tailor",
      subject: user,
      caller: "assistant",
      args: { jobDescription: REAL_JD },
      context: { cv },
      confirmed: true,
    });
    // No generative executor wired yet — proves the gate opened.
    expect(r.status).toBe("error");
    if (r.status === "error") expect(r.code).toBe("no_executor");
  });

  it("outcome.record (hidden system tool) runs and is account-gated", async () => {
    const ok = await runTool({
      toolId: "outcome.record",
      subject: user,
      caller: "ui",
      args: { applicationId: "app_1", stage: "interview" },
    });
    expect(ok.status).toBe("ok");

    const asGuest = await runTool({
      toolId: "outcome.record",
      subject: guest,
      caller: "ui",
      args: { applicationId: "app_1", stage: "interview" },
    });
    expect(asGuest.status).toBe("blocked");
    if (asGuest.status === "blocked") expect(asGuest.reason).toBe("guest_only");
  });

  it("executableTools() lists the wired deterministic set", () => {
    const t = executableTools();
    expect(t).toContain("ats.check");
    expect(t).toContain("jobs.match");
    expect(t).toContain("outcome.record");
  });
});
