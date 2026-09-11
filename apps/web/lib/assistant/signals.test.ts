/**
 * Unit tests for the proactive signal engine (lib/assistant/signals.ts).
 */
import { describe, it, expect } from "vitest";
import { computeSignals, signalKey, filterSeenSignals, SIGNAL_THRESHOLDS, type Signal } from "./signals";
import type { UnifiedContext } from "./context";

const NOW = new Date("2026-08-19T00:00:00Z");

function baseCtx(): UnifiedContext {
  return {
    profile: null,
    profileSummary: "",
    activeCv: null,
    applications: [],
    matchedJobs: [],
    unconfirmed: [],
    signals: [],
    recentActivity: [],
  };
}

function job(overrides: Partial<UnifiedContext["matchedJobs"][number]> = {}) {
  return {
    id: "j1", title: "Backend Engineer", company: "NMB Bank", location: "Dar",
    employmentType: "full-time", category: "tech", applicationDeadline: null,
    score: 80, reason: "matched React", postedAt: "2026-01-01T00:00:00Z", description: "", ...overrides,
  };
}

function app(overrides: Partial<UnifiedContext["applications"][number]> = {}) {
  return {
    id: "a1", title: "App", companyName: "NMB Bank", jobTitle: "Backend Engineer",
    status: "applied", appliedAt: null, createdAt: null, updatedAt: "2026-08-01", ...overrides,
  };
}

const t = (s: Signal) => s.type;

describe("computeSignals", () => {
  it("returns [] on an empty context — never invents urgency", () => {
    expect(computeSignals(baseCtx(), NOW)).toEqual([]);
  });

  it("confirmations signal fires when facts await confirmation (priority 100)", () => {
    const ctx = baseCtx();
    ctx.unconfirmed = [{ key: "summary", section: "summary", field: "summary", label: { en: "S", sw: "S" }, value: "v", source: "conversation" }];
    const sigs = computeSignals(ctx, NOW);
    expect(t(sigs[0])).toBe("confirmations");
    expect(sigs[0].priority).toBe(100);
    expect(sigs[0].confirmations).toBe(1);
    expect(sigs[0].trigger).toContain("needs-confirmation");
  });

  it("cv.tailor fires for a matched job with an approaching deadline and no application", () => {
    const ctx = baseCtx();
    ctx.matchedJobs = [job({ applicationDeadline: "2026-08-25T00:00:00Z" })];
    const sigs = computeSignals(ctx, NOW);
    expect(t(sigs[0])).toBe("cv.tailor");
    expect(sigs[0].jobId).toBe("j1");
    expect(sigs[0].trigger).toContain("applicationDeadline");
  });

  it("no cv.tailor when an application already exists for that job", () => {
    const ctx = baseCtx();
    ctx.matchedJobs = [job({ applicationDeadline: "2026-08-25T00:00:00Z" })];
    ctx.applications = [app()];
    const sigs = computeSignals(ctx, NOW);
    expect(sigs.some((s) => s.type === "cv.tailor")).toBe(false);
  });

  it("no cv.tailor when the deadline is outside the window (far or past)", () => {
    const far = baseCtx(); far.matchedJobs = [job({ applicationDeadline: "2026-12-01T00:00:00Z" })];
    expect(computeSignals(far, NOW).some((s) => s.type === "cv.tailor")).toBe(false);
    const past = baseCtx(); past.matchedJobs = [job({ applicationDeadline: "2026-08-01T00:00:00Z" })];
    expect(computeSignals(past, NOW).some((s) => s.type === "cv.tailor")).toBe(false);
  });

  it("coverLetter.generate fires for a high-score matched job not applied to", () => {
    const ctx = baseCtx();
    ctx.matchedJobs = [job({ score: 84 })];
    const sigs = computeSignals(ctx, NOW);
    expect(sigs.some((s) => s.type === "coverLetter.generate")).toBe(true);
    expect(sigs.find((s) => s.type === "coverLetter.generate")!.trigger).toContain("84%");
  });

  it("job.newMatch fires for a fresh, well-scored listing not applied to", () => {
    const ctx = baseCtx();
    ctx.matchedJobs = [job({ postedAt: "2026-08-18T00:00:00Z", score: 55 })]; // 1 day old
    const sigs = computeSignals(ctx, NOW);
    const sig = sigs.find((s) => s.type === "job.newMatch");
    expect(sig).toBeDefined();
    expect(sig!.jobId).toBe("j1");
    expect(sig!.trigger).toContain("1d old");
  });

  it("no job.newMatch once the listing ages past the window, is low-score, or already applied to", () => {
    const stale = baseCtx(); stale.matchedJobs = [job({ postedAt: "2026-08-01T00:00:00Z" })];
    expect(computeSignals(stale, NOW).some((s) => s.type === "job.newMatch")).toBe(false);

    const weak = baseCtx(); weak.matchedJobs = [job({ postedAt: "2026-08-18T00:00:00Z", score: 30 })];
    expect(computeSignals(weak, NOW).some((s) => s.type === "job.newMatch")).toBe(false);

    const appliedCtx = baseCtx();
    appliedCtx.matchedJobs = [job({ postedAt: "2026-08-18T00:00:00Z" })];
    appliedCtx.applications = [app()];
    expect(computeSignals(appliedCtx, NOW).some((s) => s.type === "job.newMatch")).toBe(false);
  });

  it("ats.check fires when the active CV scores below threshold", () => {
    const ctx = baseCtx();
    ctx.activeCv = {
      id: "cv1", title: "My CV",
      data: { personal: { fullName: "", jobTitle: "", email: "", phone: "", location: "" }, summary: "", experience: [], education: [], skills: [], certifications: [], languages: [], projects: [], referees: [] } as never,
    };
    const sigs = computeSignals(ctx, NOW);
    const ats = sigs.find((s) => s.type === "ats.check");
    expect(ats).toBeDefined();
    expect(ats!.trigger).toContain("ATS score");
  });

  it("career.skillGap fires for a mid-score matched job", () => {
    const ctx = baseCtx();
    ctx.matchedJobs = [job({ score: 55 })];
    const sigs = computeSignals(ctx, NOW);
    expect(sigs.some((s) => s.type === "career.skillGap")).toBe(true);
  });

  it("career.skillGap names the actual missing skill when it can be determined — the Learning Hub join", () => {
    const ctx = baseCtx();
    ctx.activeCv = {
      id: "cv1", title: "My CV",
      data: { personal: { fullName: "", jobTitle: "", email: "", phone: "", location: "" }, summary: "Retail assistant with strong teamwork.", experience: [], education: [], skills: [], certifications: [], languages: [], projects: [], referees: [] } as never,
    };
    ctx.matchedJobs = [job({ score: 55, description: "Must know excel and inventory management for this storekeeper role." })];
    const sigs = computeSignals(ctx, NOW);
    const gap = sigs.find((s) => s.type === "career.skillGap")!;
    expect(gap.missingSkills).toContain("excel");
    expect(gap.detail.en).toContain("Excel");
    expect(gap.trigger).toContain("missing:");
  });

  it("career.skillGap stays generic (no missingSkills) when there's no CV or no JD text to diff against", () => {
    const ctx = baseCtx();
    ctx.matchedJobs = [job({ score: 55, description: "" })]; // no activeCv either
    const sigs = computeSignals(ctx, NOW);
    const gap = sigs.find((s) => s.type === "career.skillGap")!;
    expect(gap.missingSkills).toBeUndefined();
    expect(gap.detail.en).toContain("see exactly which skills");
  });

  it("application.followUp fires for an application stale > 7 days, citing the days", () => {
    const ctx = baseCtx();
    ctx.applications = [app({ appliedAt: "2026-08-01T00:00:00Z" })];
    const sigs = computeSignals(ctx, NOW);
    const fu = sigs.find((s) => s.type === "application.followUp");
    expect(fu).toBeDefined();
    expect(fu!.applicationId).toBe("a1");
    expect(fu!.trigger).toContain("18 days");
  });

  it("no follow-up for fresh applications or non-applied statuses", () => {
    const fresh = baseCtx(); fresh.applications = [app({ appliedAt: "2026-08-18T00:00:00Z" })];
    expect(computeSignals(fresh, NOW).some((s) => s.type === "application.followUp")).toBe(false);
    const interviewing = baseCtx(); interviewing.applications = [app({ status: "interviewing", appliedAt: "2026-08-01T00:00:00Z" })];
    expect(computeSignals(interviewing, NOW).some((s) => s.type === "application.followUp")).toBe(false);
  });

  it("sorts by priority desc and every signal carries a real trigger", () => {
    const ctx = baseCtx();
    ctx.unconfirmed = [{ key: "summary", section: "summary", field: "summary", label: { en: "S", sw: "S" }, value: "v", source: "conversation" }];
    ctx.matchedJobs = [job({ applicationDeadline: "2026-08-25T00:00:00Z" })];
    ctx.applications = [app({ appliedAt: "2026-08-01T00:00:00Z" })];
    const sigs = computeSignals(ctx, NOW);
    for (let i = 1; i < sigs.length; i++) expect(sigs[i - 1].priority).toBeGreaterThanOrEqual(sigs[i].priority);
    for (const s of sigs) expect(s.trigger.length).toBeGreaterThan(5);
  });

  it("thresholds are sane constants", () => {
    expect(SIGNAL_THRESHOLDS.deadlineDays).toBe(14);
    expect(SIGNAL_THRESHOLDS.coverLetterMinScore).toBe(70);
    expect(SIGNAL_THRESHOLDS.atsMinScore).toBe(70);
    expect(SIGNAL_THRESHOLDS.followUpDays).toBe(7);
  });
});

describe("signalKey + filterSeenSignals — restraint (Wave 2 Group A)", () => {
  const sig = (type: string, trigger: string): Signal => ({
    type: type as Signal["type"], tool: type, priority: 50,
    title: { en: "t", sw: "t" }, detail: { en: "d", sw: "d" }, trigger,
  });

  it("keys are type+trigger so two jobs never collide", () => {
    expect(signalKey(sig("cv.tailor", "applicationDeadline 2026-08-25 (in 6d)")))
      .not.toBe(signalKey(sig("cv.tailor", "applicationDeadline 2026-09-01 (in 13d)")));
    expect(signalKey(sig("coverLetter.generate", "match score 80% ≥ 70%"))).toBe("coverLetter.generate|match score 80% ≥ 70%");
  });

  it("drops exactly the signals already seen — others survive", () => {
    const all = [
      sig("confirmations", "2 needs-confirmation facts"),
      sig("cv.tailor", "applicationDeadline 2026-08-25 (in 6d)"),
      sig("ats.check", "ATS score 55/100 < 70"),
    ];
    const kept = filterSeenSignals(all, ["confirmations|2 needs-confirmation facts"]);
    expect(kept.map((s) => s.type)).toEqual(["cv.tailor", "ats.check"]);
  });

  it("with no seen keys nothing is filtered; empty seen array is a no-op", () => {
    const all = [sig("cv.tailor", "applicationDeadline 2026-08-25 (in 6d)")];
    expect(filterSeenSignals(all, [])).toHaveLength(1);
    expect(filterSeenSignals(all, undefined as unknown as string[])).toHaveLength(1);
  });

  it("a repeated trigger of the SAME type is filtered too (never re-nudge)", () => {
    const t1 = sig("cv.tailor", "applicationDeadline 2026-08-25 (in 6d)");
    const t2 = sig("cv.tailor", "applicationDeadline 2026-08-25 (in 6d)");
    expect(filterSeenSignals([t1, t2], [signalKey(t1)])).toHaveLength(0);
  });
});
