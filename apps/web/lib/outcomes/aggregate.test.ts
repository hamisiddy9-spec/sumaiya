// Aggregation tests — synthetic PII-free event rows, pure math, no DB.

import { describe, it, expect } from "vitest";
import {
  aggregateTailorLift,
  aggregateMatchOutcome,
  aggregateNudgeEfficacy,
  aggregateConfirmationRate,
  insightsOverview,
  type OutcomeEventRow,
} from "./aggregate";

function row(partial: Partial<OutcomeEventRow> & { type: string; payload: Record<string, unknown> }): OutcomeEventRow {
  return { userHash: "h1", createdAt: new Date("2026-08-18T10:00:00Z"), ...partial };
}

const base = (type: string, payload: Record<string, unknown>, userHash = "h1", createdAt = "2026-08-18T10:00:00Z") =>
  row({ userHash, type, payload, createdAt: new Date(createdAt) });

describe("aggregateTailorLift", () => {
  it("returns absent (null) metrics when there are no events", () => {
    const a = aggregateTailorLift([]);
    expect(a.n).toBe(0);
    expect(a.avgDeltaAts).toBeNull();
    expect(a.liftRate).toBeNull();
    expect(a.smallSample).toBe(false); // 0 is not a "small sample" — it's absent
  });

  it("computes the real ATS lift statistics", () => {
    const rows = [
      base("tailor.lift", { beforeAts: 40, afterAts: 60, deltaAts: 20, beforeMatch: 30, afterMatch: 31 }),
      base("tailor.lift", { beforeAts: 50, afterAts: 50, deltaAts: 0, beforeMatch: 30, afterMatch: 30 }),
      base("tailor.lift", { beforeAts: 30, afterAts: 40, deltaAts: 10, beforeMatch: 30, afterMatch: 35 }),
      base("tailor.lift", { beforeAts: 20, afterAts: 25, deltaAts: 5, beforeMatch: 30, afterMatch: 30 }),
      base("tailor.lift", { beforeAts: 20, afterAts: 30, deltaAts: 10, beforeMatch: 30, afterMatch: 32 }),
      base("tailor.lift", { beforeAts: 20, afterAts: 28, deltaAts: 8, beforeMatch: 30, afterMatch: 33 }),
      base("tailor.lift", { beforeAts: 20, afterAts: 24, deltaAts: 4, beforeMatch: 30, afterMatch: 30 }),
      base("tailor.lift", { beforeAts: 20, afterAts: 22, deltaAts: 2, beforeMatch: 30, afterMatch: 30 }),
      base("tailor.lift", { beforeAts: 20, afterAts: 20, deltaAts: 0, beforeMatch: 30, afterMatch: 30 }),
      base("tailor.lift", { beforeAts: 20, afterAts: 30, deltaAts: 10, beforeMatch: 30, afterMatch: 34 }),
      base("tailor.lift", { beforeAts: 20, afterAts: 24, deltaAts: 4, beforeMatch: 30, afterMatch: 30 }),
    ];
    const a = aggregateTailorLift(rows);
    expect(a.n).toBe(11);
    // sum of deltas = 20+0+10+5+10+8+4+2+0+10+4 = 73 → mean 6.636…
    expect(a.avgDeltaAts).toBeCloseTo(73 / 11, 5);
    // lift rate: deltas > 0 → 8 of 11
    expect(a.liftRate).toBeCloseTo(81.8, 1); // 9 of 11 deltas > 0
    expect(a.smallSample).toBe(false); // n >= 10
  });

  it("labels small samples", () => {
    const a = aggregateTailorLift([base("tailor.lift", { beforeAts: 40, afterAts: 60, deltaAts: 20 })]);
    expect(a.smallSample).toBe(true);
  });
});

describe("aggregateMatchOutcome", () => {
  const created = (appId: string, score: number) =>
    base("application.created", { applicationId: appId, matchScore: score, status: "draft" });
  const status = (appId: string, to: string) =>
    base("application.status", { applicationId: appId, from: "applied", to, matchScore: null });

  it("funnels applications by match-score bucket with real transition counts", () => {
    const rows = [
      created("appA", 80), status("appA", "applied"), status("appA", "interviewing"), status("appA", "offer"),
      created("appB", 75), status("appB", "interviewing"),
      created("appC", 50),
      created("appD", 30),
      created("appE", 85), status("appE", "offer"),
      created("appF", 65), status("appF", "applied"), status("appF", "interviewing"),
      created("appG", 45),
      created("appH", 90), status("appH", "interviewing"),
      created("appI", 55), status("appI", "offer"),
      created("appJ", 35),
      created("appK", 72),
      created("appL", 42), status("appL", "interviewing"),
    ];
    const a = aggregateMatchOutcome(rows);
    const high = a.buckets.find((b) => b.bucket === "≥70")!;
    const mid = a.buckets.find((b) => b.bucket === "40–69")!;
    const low = a.buckets.find((b) => b.bucket === "<40")!;

    expect(high.n).toBe(5); // A, B, E, H, K
    expect(high.interviewing).toBe(3); // A, B, H (E went straight to offer — offer-only does not count as interviewing)
    expect(high.offer).toBe(2); // A, E
    expect(mid.n).toBe(5); // C(50), F(65), G(45), I(55), L(42)
    expect(low.n).toBe(2); // D30, J35
  });

  it("returns empty buckets (n=0, rates null) when nothing is created", () => {
    const a = aggregateMatchOutcome([status("appX", "interviewing")]);
    expect(a.buckets).toHaveLength(3);
    for (const b of a.buckets) {
      expect(b.n).toBe(0);
      expect(b.interviewRate).toBeNull();
    }
  });
});

describe("aggregateNudgeEfficacy", () => {
  it("counts acted-on nudges per signal type (same user, resolving tool, within 24h)", () => {
    const t0 = "2026-08-18T10:00:00Z";
    const rows = [
      base("signal.shown", { signalType: "cv.tailor", trigger: "job-1", tool: "cv.tailor", priority: 80 }, "u1", t0),
      base("signal.shown", { signalType: "cv.tailor", trigger: "job-2", tool: "cv.tailor", priority: 80 }, "u1", t0),
      base("signal.shown", { signalType: "cv.tailor", trigger: "job-3", tool: "cv.tailor", priority: 80 }, "u2", t0),
      base("signal.shown", { signalType: "confirmations", trigger: "3 facts", tool: "confirmations", priority: 90 }, "u1", t0),
      // u1 runs cv.tailor 2h later → 1 acted-on for u1's job-1 signal (the
      // match is per user+tool within the window, not per exact trigger)
      base("tool.executed", { tool: "cv.tailor" }, "u1", "2026-08-18T12:00:00Z"),
      // u3 shows but never acts
      base("signal.shown", { signalType: "ats.check", trigger: "score-42", tool: "ats.check", priority: 70 }, "u3", t0),
    ];
    const a = aggregateNudgeEfficacy(rows);
    const tailor = a.find((x) => x.signalType === "cv.tailor")!;
    const confirm = a.find((x) => x.signalType === "confirmations")!;
    const ats = a.find((x) => x.signalType === "ats.check")!;

    expect(tailor.shown).toBe(3);
    // Per-signal semantics: BOTH of u1's cv.tailor signals preceded the
    // 12:00 run (same user, resolving tool, within 24h) → both acted. u2
    // never ran the tool → actedOn = 2.
    expect(tailor.actedOn).toBe(2);
    expect(confirm.actedOn).toBe(0);
    expect(ats.actedOn).toBe(0);
    expect(a[0].signalType).toBe("cv.tailor"); // sorted by shown desc
  });

  it("ignores tool executions outside the 24h window", () => {
    const rows = [
      base("signal.shown", { signalType: "cv.tailor", trigger: "job-1", tool: "cv.tailor", priority: 80 }, "u1", "2026-08-18T10:00:00Z"),
      base("tool.executed", { tool: "cv.tailor" }, "u1", "2026-08-20T10:00:00Z"), // 48h later
    ];
    const a = aggregateNudgeEfficacy(rows);
    expect(a[0].actedOn).toBe(0);
  });

  it("returns [] when no signals were shown", () => {
    expect(aggregateNudgeEfficacy([base("tool.executed", { tool: "cv.tailor" })])).toEqual([]);
  });
});

describe("aggregateConfirmationRate", () => {
  it("computes accept vs reject from real resolutions", () => {
    const rows = [
      base("confirmation.resolved", { decision: "accept", count: 3, kinds: ["summary"] }),
      base("confirmation.resolved", { decision: "reject", count: 1, kinds: ["experience"] }),
      base("confirmation.resolved", { decision: "accept", count: 2, kinds: ["experience"] }),
      base("confirmation.resolved", { decision: "accept", count: 1, kinds: ["other"] }),
    ];
    const a = aggregateConfirmationRate(rows);
    expect(a.n).toBe(4);
    expect(a.accept).toBe(3);
    expect(a.reject).toBe(1);
    expect(a.acceptRate).toBe(75);
  });

  it("absent when nothing resolved", () => {
    const a = aggregateConfirmationRate([]);
    expect(a.n).toBe(0);
    expect(a.acceptRate).toBeNull();
  });
});

describe("insightsOverview", () => {
  it("assembles every section from the same row set", () => {
    const rows = [
      base("tailor.lift", { beforeAts: 40, afterAts: 60, deltaAts: 20 }),
      base("signal.shown", { signalType: "cv.tailor", trigger: "j1", tool: "cv.tailor", priority: 80 }),
    ];
    const o = insightsOverview(rows);
    expect(o.totalEvents).toBe(2);
    expect(o.tailorLift.n).toBe(1);
    expect(o.matchOutcome.buckets).toHaveLength(3);
    expect(o.nudgeEfficacy).toHaveLength(1);
    expect(o.confirmations.n).toBe(0);
    expect(o.generatedAt).toBeTruthy();
  });
});
