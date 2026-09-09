// EVAL: Orchestrator correctness — given real state, the right next action is
// proposed. The chain chip is the user's one-tap continuation; a regression
// here (wrong tool, invented reason, client-score trust) misleads users.
//
// Deterministic, no AI, no DB. Part of `npm run evals` (merge gate).

import { describe, it, expect } from "vitest";
import { computeNextAction, type ExecutedAction } from "@/lib/assistant/orchestrator";
import type { UnifiedContext } from "@/lib/assistant/context";
import type { CVData } from "@/types";
import { cvFrontend, cvWeak, jdFrontend, jdPlumber } from "./fixtures/golden-pairs";
import { matchCvToJd } from "@/lib/job-match";

function makeCtx(cv: CVData | null): UnifiedContext {
  return {
    profile: null,
    profileSummary: "",
    activeCv: cv ? { id: "cv1", title: "My CV", data: cv } : null,
    applications: [],
    matchedJobs: [],
    unconfirmed: [],
    signals: [],
    recentActivity: [],
  };
}

function last(tool: string, args: Record<string, unknown> = {}, extra: Partial<ExecutedAction> = {}): ExecutedAction {
  return { tool, args, ...extra };
}

describe("eval: orchestrator correctness", () => {
  it("no last action → no invented next step", () => {
    expect(computeNextAction(makeCtx(cvFrontend), null)).toBeNull();
  });

  it("jobs.match score < 70 → cv.tailor with the SAME job", () => {
    const ctx = makeCtx(cvFrontend);
    // Frontend CV vs plumbing JD scores low (probe: 12).
    const ex = last("jobs.match", { jobDescription: jdPlumber });
    const next = computeNextAction(ctx, ex);
    expect(next?.tool).toBe("cv.tailor");
    expect(next?.args.jobDescription).toBe(jdPlumber);
    // Reason must carry the REAL engine score, not a client-supplied one.
    const real = matchCvToJd(cvFrontend, jdPlumber).score;
    expect(next?.reason.en).toContain(`${real}%`);
  });

  it("jobs.match score >= 70 → coverLetter.generate", () => {
    // Frontend pair scores 39 — too low for the strong-match branch. Use a JD
    // the CV covers almost fully by reusing the CV's own skill language.
    const strongJd = `Frontend Engineer — Full-time
We are looking for a Frontend Engineer with experience in React, TypeScript and Next.js.
Responsibilities: build web applications with React, TypeScript and JavaScript, write Jest unit tests, integrate REST APIs.
Requirements: experience with CSS, HTML and Git. Apply now.`;
    const ctx = makeCtx(cvFrontend);
    expect(matchCvToJd(cvFrontend, strongJd).score).toBeGreaterThanOrEqual(70);
    const next = computeNextAction(ctx, last("jobs.match", { jobDescription: strongJd }));
    expect(next?.tool).toBe("coverLetter.generate");
    expect(next?.args.jobDescription).toBe(strongJd);
  });

  it("ats.check with a low real ATS score → cv.improveSummary", () => {
    const ctx = makeCtx(cvWeak); // deliberately weak CV
    const next = computeNextAction(ctx, last("ats.check"));
    expect(next?.tool).toBe("cv.improveSummary");
  });

  it("cv.tailor applied → coverLetter.generate (carries the JD when known)", () => {
    const next = computeNextAction(makeCtx(cvFrontend), last("cv.tailor", { jobDescription: jdFrontend }));
    expect(next?.tool).toBe("coverLetter.generate");
    expect(next?.args.jobDescription).toBe(jdFrontend);
  });

  it("coverLetter.generate → jobs.track (carries job identity)", () => {
    const next = computeNextAction(
      makeCtx(cvFrontend),
      last("coverLetter.generate", { jobDescription: jdFrontend, jobTitle: "Frontend Engineer", company: "Nala Finance" }),
    );
    expect(next?.tool).toBe("jobs.track");
    expect(next?.args.jobTitle).toBe("Frontend Engineer");
    expect(next?.args.companyName).toBe("Nala Finance");
  });

  it("jobs.track → interview.prep with the application href", () => {
    const noApp = computeNextAction(makeCtx(cvFrontend), last("jobs.track", {}));
    expect(noApp?.tool).toBe("interview.prep");
    expect(noApp?.href).toBe("/interview");

    const withApp = computeNextAction(
      makeCtx(cvFrontend),
      last("jobs.track", {}, { applicationId: "app_123" }),
    );
    expect(withApp?.tool).toBe("interview.prep");
    expect(withApp?.href).toBe("/interview?app=app_123");
  });

  it("unknown tool → no invented next step", () => {
    expect(computeNextAction(makeCtx(cvFrontend), last("some.unknownTool"))).toBeNull();
  });

  it("jobs.match without a JD → no next step (nothing grounded)", () => {
    expect(computeNextAction(makeCtx(cvFrontend), last("jobs.match", {}))).toBeNull();
  });

  it("no active CV → jobs.match cannot chain (nothing to tailor)", () => {
    expect(computeNextAction(makeCtx(null), last("jobs.match", { jobDescription: jdFrontend }))).toBeNull();
  });

  it("client-supplied scores are IGNORED — the real engine decides (score-trust)", () => {
    const ctx = makeCtx(cvFrontend);
    const jd = jdPlumber; // real score 12 → cv.tailor
    const a = computeNextAction(ctx, last("jobs.match", { jobDescription: jd }, { score: 0 }));
    const b = computeNextAction(ctx, last("jobs.match", { jobDescription: jd }, { score: 99 }));
    expect(a?.tool).toBe("cv.tailor");
    expect(b?.tool).toBe("cv.tailor");
    // Both reasons carry the REAL score (12), not the spoofed 0/99.
    const real = matchCvToJd(cvFrontend, jd).score;
    expect(a?.reason.en).toContain(`${real}%`);
    expect(b?.reason.en).toContain(`${real}%`);
    expect(b?.reason.en).not.toContain("99%");
  });

  it("reason text is bilingual (en + sw)", () => {
    const next = computeNextAction(makeCtx(cvFrontend), last("cv.tailor", { jobDescription: jdFrontend }));
    expect(next?.reason.en.length).toBeGreaterThan(10);
    expect(next?.reason.sw.length).toBeGreaterThan(10);
  });
});
