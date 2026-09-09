import { describe, it, expect } from "vitest";
import { createEmptyCVData, type CVData } from "@/types";
import { checkAuthenticWriting } from "@/lib/authentic-writing";

function cv(partial: Partial<CVData>): CVData {
  return { ...createEmptyCVData(), ...partial };
}

describe("authentic-writing checks", () => {
  it("flags clichés with concrete suggestions", () => {
    const data = cv({
      summary: "Results-driven team player with a proven track record of hard work.",
      experience: [{ id: "e1", company: "X", position: "Dev", startDate: "", endDate: "", current: true, description: "" }],
    });
    const r = checkAuthenticWriting(data);
    const cliches = r.findings.filter((f) => f.type === "cliche");
    expect(cliches.length).toBeGreaterThanOrEqual(3);
    for (const c of cliches) {
      expect(c.suggestion.length).toBeGreaterThan(10);
      expect(c.term.length).toBeGreaterThan(2);
    }
    expect(r.hasIssues).toBe(true);
    expect(r.score).toBeLessThan(100);
  });

  it("flags buzzwords", () => {
    const data = cv({
      summary: "I leveraged synergy to utilize robust scalable tools for a strategic initiative.",
      experience: [{ id: "e1", company: "X", position: "Dev", startDate: "", endDate: "", current: true, description: "" }],
    });
    const r = checkAuthenticWriting(data);
    expect(r.findings.some((f) => f.type === "buzzword")).toBe(true);
  });

  it("flags keyword stuffing when a term repeats heavily", () => {
    const data = cv({
      summary: "React expert. I use React daily. React is my main stack. React React React.",
      experience: [{ id: "e1", company: "X", position: "Dev", startDate: "", endDate: "", current: true, description: "Built React apps. More React work. React everywhere. React in production. React is great." }],
    });
    const r = checkAuthenticWriting(data);
    const stuffing = r.findings.filter((f) => f.type === "stuffing");
    expect(stuffing.some((f) => f.term === "react" && f.count >= 5)).toBe(true);
  });

  it("does not flag the user's own name as stuffing", () => {
    const data = cv({
      personal: { ...createEmptyCVData().personal, fullName: "Jane Mwangi" },
      summary: "Jane Mwangi works at Mwangi Corp. Jane leads the Mwangi team. Jane Mwangi Mwangi Jane.",
      experience: [{ id: "e1", company: "X", position: "Dev", startDate: "", endDate: "", current: true, description: "" }],
    });
    const r = checkAuthenticWriting(data);
    expect(r.findings.filter((f) => f.type === "stuffing" && (f.term === "jane" || f.term === "mwangi"))).toEqual([]);
  });

  it("returns a clean report for concise, concrete writing", () => {
    const data = cv({
      summary: "Software engineer. Cut checkout load time 40% for 2,000 daily users.",
      experience: [{ id: "e1", company: "TechCo", position: "Engineer", startDate: "", endDate: "", current: true, description: "Shipped the payments rewrite; reduced error rate from 2% to 0.3%." }],
      skills: [{ id: "s1", name: "React", level: 4 }],
    });
    const r = checkAuthenticWriting(data);
    expect(r.hasIssues).toBe(false);
    expect(r.score).toBe(100);
  });

  it("attributes findings to sections and keeps score in range", () => {
    const data = cv({
      summary: "Dynamic results-driven professional.",
      experience: [{ id: "e1", company: "X", position: "Dev", startDate: "", endDate: "", current: true, description: "Team player." }],
    });
    const r = checkAuthenticWriting(data);
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(100);
    for (const f of r.findings) {
      expect(["summary", "experience", "education", "skills", "all"]).toContain(f.section);
    }
  });
});
