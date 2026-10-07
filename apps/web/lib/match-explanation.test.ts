/**
 * "KWA NINI ILIBADILIKA" must speak the conversation's language.
 *
 * The shipped defect: /snap rendered raw English bullets inside the Swahili UI —
 * "Still missing from your profile: sales, officer, ccbrt, requirements, least,
 * customer." and "Your profile already covers this job well — the reorder keeps
 * the same match..." (docs/QA-WEB-JOURNEYS-2026-09-20.md D3). The strings were
 * built server-side, so the client could only print what it was handed.
 *
 * This also pins the ATS rule: Swahili copy describes the OUTCOME
 * ("mifumo ya kuajiri", "vigezo vya waajiri", "waajiri") and never names the
 * mechanism — lib/swahili-lint.test.ts fails the build on "…ya ATS"/"…kwa ATS".
 */
import { describe, it, expect } from "vitest";
import { matchExplanation, type MatchExplanationInput } from "./match-explanation";
import { snapMatch } from "@/lib/api/snap-apply";
import { createEmptyCVData, type CVData } from "@/types";

const EN_MISSING = "Still missing from your profile:";
const SW_MISSING = "Bado hayapo kwenye wasifu wako:";

describe("matchExplanation — one builder, both languages", () => {
  const base: Omit<MatchExplanationInput, "lang"> = {
    newlyMatched: ["sales", "budgeting"],
    stillMissing: ["excel.", "reporting"],
    beforeScore: 40,
    afterScore: 55,
  };

  it("Swahili: no English bullet survives, and the missing terms are still named", () => {
    const sw = matchExplanation({ ...base, lang: "sw" });
    const all = sw.join(" ");
    expect(all).not.toContain(EN_MISSING);
    expect(all).not.toContain("Your profile already covers this job well");
    expect(all).toContain(SW_MISSING);
    expect(all).toContain("reporting");
    expect(all).toContain("sales");
    // The mechanism is never named in Swahili.
    expect(all).not.toMatch(/\bATS\b/);
  });

  it("English keeps its wording (the equal-score sentence is the one QA saw)", () => {
    const en = matchExplanation({ ...base, lang: "en", beforeScore: 55, afterScore: 55 });
    const all = en.join(" ");
    expect(all).toContain("Your profile already covers this job well");
    expect(all).toContain(EN_MISSING);
  });

  it("both languages agree on the FACTS (same keywords, same order)", () => {
    const sw = matchExplanation({ ...base, lang: "sw" });
    const en = matchExplanation({ ...base, lang: "en" });
    expect(sw.length).toBe(en.length);
    expect(sw[1]).toContain("reporting");
    expect(en[1]).toContain("reporting");
  });

  it("says the gap honestly when the job wants skills the profile lacks", () => {
    const sw = matchExplanation({ ...base, lang: "sw", beforeScore: 55, afterScore: 40 });
    const en = matchExplanation({ ...base, lang: "en", beforeScore: 55, afterScore: 40 });
    expect(sw.join(" ")).toMatch(/pengo/);
    expect(en.join(" ")).toMatch(/real gap/);
  });
});

describe("snapMatch — the producer the /snap screen reads", () => {
  const cv: CVData = {
    ...createEmptyCVData(),
    summary: "Nina uzoefu wa mauzo na uhasibu.",
    personal: { ...createEmptyCVData().personal, jobTitle: "Mauzo" },
    skills: [
      { id: "s1", name: "Mauzo", level: 4 },
      { id: "s2", name: "Uhasibu", level: 3 },
    ],
  };
  const JD =
    "Salaam. We are looking for a Sales Officer for CCBRT. Requirements: sales reports, customer care, Excel. " +
    "You will work independently and grow the territory. At least 3 years of experience in sales.";

  it("writes the why-bullets in the conversation's language", () => {
    const en = snapMatch(cv, JD, "en");
    const sw = snapMatch(cv, JD, "sw");
    expect(en.explanation.join(" ")).toContain(EN_MISSING);
    const swText = sw.explanation.join(" ");
    expect(swText).toContain(SW_MISSING);
    expect(swText).not.toContain(EN_MISSING);
    expect(swText).not.toMatch(/\bATS\b/);
    // The numbers are language-independent (same engine, same input).
    expect(sw.before.score).toBe(en.before.score);
    expect(sw.after.score).toBe(en.after.score);
    expect(sw.before.missing).toEqual(en.before.missing);
  });

  it("defaults to English for callers that pass no language (old clients)", () => {
    expect(snapMatch(cv, JD).explanation.join(" ")).toContain(EN_MISSING);
  });
});
