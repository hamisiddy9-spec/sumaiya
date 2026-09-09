import { describe, it, expect } from "vitest";
import { createEmptyCareerProfile } from "@/types";
import {
  INTERVIEW_QUESTIONS,
  applyAnswer,
  interviewProgress,
  isQuestionAnswered,
  parseEducation,
  parseList,
} from "@/lib/career-interview/questions";

describe("career interview question bank", () => {
  it("has a stable, ordered set of questions", () => {
    expect(INTERVIEW_QUESTIONS.length).toBeGreaterThanOrEqual(10);
    const ids = INTERVIEW_QUESTIONS.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length); // unique
    for (const q of INTERVIEW_QUESTIONS) {
      expect(q.prompt.en.length).toBeGreaterThan(5);
      expect(q.prompt.sw.length).toBeGreaterThan(5);
    }
  });

  it("applies scalar answers to the profile", () => {
    const p = createEmptyCareerProfile();
    const a = applyAnswer(applyAnswer(p, "fullName", "  Jane  Mwangi "), "jobTitle", "Software Engineer");
    expect(a.personal.fullName).toBe("Jane  Mwangi");
    expect(a.personal.jobTitle).toBe("Software Engineer");
    expect(p.personal.fullName).toBe(""); // input not mutated
  });

  it("parses comma lists and merges by name without duplicates", () => {
    const p = createEmptyCareerProfile();
    const a = applyAnswer(p, "skills", "React, Node.js, react, PostgreSQL, Excel");
    expect(a.skills.map((s) => s.name)).toEqual(["React", "Node.js", "PostgreSQL", "Excel"]);
    // Re-answering adds nothing new
    const b = applyAnswer(a, "skills", "React, Django");
    expect(b.skills.map((s) => s.name)).toEqual(["React", "Node.js", "PostgreSQL", "Excel", "Django"]);
    expect(a.skills.length).toBe(4); // original untouched
  });

  it("builds experience entry-by-entry", () => {
    const p = createEmptyCareerProfile();
    const a = applyAnswer(applyAnswer(applyAnswer(p, "expRole", "Frontend Developer"), "expCompany", "TechCo"), "expDescription", "Built dashboards.");
    expect(a.experience).toHaveLength(1);
    expect(a.experience[0].position).toBe("Frontend Developer");
    expect(a.experience[0].company).toBe("TechCo");
    expect(a.experience[0].description).toBe("Built dashboards.");
    expect(a.experience[0].current).toBe(true);
  });

  it("parses education into degree/field/institution", () => {
    expect(parseEducation("BSc, Computer Science, UDSM")).toEqual({
      degree: "BSc",
      field: "Computer Science",
      institution: "UDSM",
    });
    const p = createEmptyCareerProfile();
    const a = applyAnswer(p, "education", "BSc, Computer Science, UDSM");
    expect(a.education).toHaveLength(1);
    expect(a.education[0].degree).toBe("BSc");
    expect(a.education[0].institution).toBe("UDSM");
    // Same education not duplicated
    const b = applyAnswer(a, "education", "BSc, Computer Science, UDSM");
    expect(b.education).toHaveLength(1);
  });

  it("parses lists with trimming and dedupe", () => {
    expect(parseList("  Swahili ,English, english , ")).toEqual(["Swahili", "English"]);
    expect(parseList("")).toEqual([]);
  });

  it("stamps interview answers as confirmed facts", () => {
    const p = createEmptyCareerProfile();
    const a = applyAnswer(p, "skills", "React");
    expect(a.factMeta?.[a.skills[0].id]).toMatchObject({ source: "interview", status: "confirmed" });
  });

  it("tracks progress and answered state", () => {
    const p = createEmptyCareerProfile();
    expect(interviewProgress(p).answered).toBe(0);
    const a = applyAnswer(p, "fullName", "Jane");
    expect(isQuestionAnswered(a, INTERVIEW_QUESTIONS[0])).toBe(true);
    expect(interviewProgress(a).answered).toBe(1);
    expect(interviewProgress(a).total).toBe(INTERVIEW_QUESTIONS.length);
  });
});
