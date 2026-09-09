// E3 — unit tests for the Daily Brief core. These guard the anti-fabrication
// contract: the brief NEVER invents jobs/matches/scores, ranking is
// deterministic, and empty states are honest (never padded).

import { describe, it, expect } from "vitest";
import {
  briefHeadline,
  rankMatches,
  shapeFollowUps,
  type BriefMatch,
  type BriefFollowUp,
} from "@/lib/daily-brief";

const rec = (over: Partial<Parameters<typeof rankMatches>[0][number]> = {}): any => ({
  jobId: "j1",
  score: 80,
  reason: "matched: sales, negotiation",
  matchedTerms: ["sales", "negotiation"],
  job: {
    id: "j1",
    title: "Sales Manager",
    company: "Acme Ltd",
    location: "Dar es Salaam",
    category: "sales",
    employmentType: "full-time",
    description: "Drive regional sales and lead the team.",
    applyUrl: "https://x.test/j1",
    sourceName: "ajira",
    applicationDeadline: null,
    createdAt: new Date().toISOString(),
  },
  ...over,
});

describe("rankMatches", () => {
  it("sorts by score desc and keeps the top N", () => {
    const recs = [rec({ score: 40 }), rec({ score: 95, jobId: "j2", job: { id: "j2", title: "Top", company: "B", location: "", category: "", employmentType: "", description: "x", applyUrl: "", sourceName: "", applicationDeadline: null, createdAt: "" } }), rec({ score: 60, jobId: "j3", job: { id: "j3", title: "Mid", company: "C", location: "", category: "", employmentType: "", description: "y", applyUrl: "", sourceName: "", applicationDeadline: null, createdAt: "" } })];
    const out = rankMatches(recs, 2);
    expect(out.map((m) => m.score)).toEqual([95, 60]);
    expect(out).toHaveLength(2);
  });

  it("never fabricates fields — copies exactly what the engine produced", () => {
    const out = rankMatches([rec()], 1)[0];
    expect(out.title).toBe("Sales Manager");
    expect(out.company).toBe("Acme Ltd");
    expect(out.score).toBe(80);
    expect(out.reason).toBe("matched: sales, negotiation");
    expect(out.matchedTerms).toEqual(["sales", "negotiation"]);
  });

  it("marks actionable only when the job has a real description", () => {
    expect(rankMatches([rec()], 1)[0].actionable).toBe(true);
    const noDesc = rec();
    noDesc.job.description = "   ";
    expect(rankMatches([noDesc], 1)[0].actionable).toBe(false);
  });

  it("returns [] for empty input — never pads with fake matches", () => {
    expect(rankMatches([], 3)).toEqual([]);
  });
});

describe("briefHeadline", () => {
  it("no profile → honest warm ask (no fake matches)", () => {
    const en = briefHeadline(false, false, [], []);
    const sw = briefHeadline(true, false, [], []);
    expect(en.toLowerCase()).toContain("career profile");
    expect(sw).toContain("Wasifu");
  });

  it("nothing at all → honest 'check back tomorrow', no padding", () => {
    const en = briefHeadline(false, true, [], []);
    expect(en.toLowerCase()).toContain("no new roles");
    const sw = briefHeadline(true, true, [], []);
    expect(sw).toContain("kesho");
  });

  it("matches only → leads with the strongest real match + real score", () => {
    const matches: BriefMatch[] = [
      { jobId: "a", title: "Sales Manager", company: "Acme", location: "", score: 82, reason: "x", matchedTerms: [], actionable: true },
      { jobId: "b", title: "Accountant", company: "Beta", location: "", score: 74, reason: "y", matchedTerms: [], actionable: true },
    ];
    expect(briefHeadline(false, true, matches, [])).toBe(
      "2 new roles fit you; strongest match is Sales Manager — 82%.",
    );
    // Swahili mirrors the same facts.
    expect(briefHeadline(true, true, matches, [])).toContain("Sales Manager");
    expect(briefHeadline(true, true, matches, [])).toContain("82%");
  });

  it("no matches but follow-ups → says exactly that", () => {
    const f: BriefFollowUp[] = [
      { applicationId: "a1", title: "My Application", company: "Acme", status: "applied", daysWaiting: 9 },
    ];
    expect(briefHeadline(false, true, [], f)).toContain("1 application");
    expect(briefHeadline(true, true, [], f)).toContain("1");
  });
});

describe("shapeFollowUps", () => {
  it("carries real fields + computes days waiting", () => {
    const app = {
      id: "a1",
      title: "My Application",
      companyName: "Acme",
      status: "applied",
      appliedAt: new Date(Date.now() - 10 * 86_400_000),
      createdAt: new Date(Date.now() - 20 * 86_400_000),
    };
    const out = shapeFollowUps([app]);
    expect(out[0].applicationId).toBe("a1");
    expect(out[0].company).toBe("Acme");
    expect(out[0].daysWaiting).toBe(10);
  });

  it("falls back to createdAt when appliedAt is null (real schema shape)", () => {
    const app = {
      id: "a2",
      title: "X",
      companyName: null,
      status: "applied",
      appliedAt: null,
      createdAt: new Date(Date.now() - 3 * 86_400_000),
    };
    expect(shapeFollowUps([app])[0].daysWaiting).toBe(3);
  });
});
