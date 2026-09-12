import { describe, it, expect } from "vitest";
import { checkTailoring, usableText, MIN_LETTER_BODY, MIN_SUMMARY } from "./tailoring-guards";

/** What the model actually returned for the job whose PDF came out blank. */
const EMPTY_LETTER_RESPONSE = {
  jobTitle: "Platform Engineer (m/f/d)",
  company: "Ecoplanet Green Operations Gmbh",
  summary: "",
  experience: [],
  coverLetter: "",
};

const GOOD_LETTER =
  "I am applying for the Platform Engineer role at Ecoplanet. I have spent four years running Linux infrastructure for a payments platform, and I would bring the same care to your platform.";

describe("usableText", () => {
  it("rejects empty, whitespace and non-strings", () => {
    expect(usableText("", 10)).toBe(false);
    expect(usableText("   \n ", 10)).toBe(false);
    expect(usableText(null, 10)).toBe(false);
    expect(usableText(undefined, 10)).toBe(false);
    expect(usableText([], 10)).toBe(false);
    expect(usableText("short", 10)).toBe(false);
  });

  it("accepts real text and ignores surrounding whitespace", () => {
    expect(usableText("  a real sentence here  ", 10)).toBe(true);
  });
});

describe("checkTailoring", () => {
  it("fails a letter request when the body is empty — the reported bug", () => {
    // Before: typeof "" === "string" passed, so this was returned as success and
    // the app exported a PDF containing only the job title and company.
    const verdict = checkTailoring(EMPTY_LETTER_RESPONSE, { wantCv: false, wantLetter: true });
    expect(verdict.ok).toBe(false);
    if (!verdict.ok) {
      expect(verdict.missing).toBe("letter");
      expect(verdict.error.length).toBeGreaterThan(20);
    }
  });

  it("fails a combined request when the letter is empty, even if the CV is fine", () => {
    // A half-finished request is still a broken request: the person is about to
    // send that letter.
    const verdict = checkTailoring(
      { ...EMPTY_LETTER_RESPONSE, summary: "x".repeat(MIN_SUMMARY + 10), experience: [] },
      { wantCv: true, wantLetter: true },
    );
    expect(verdict.ok).toBe(false);
  });

  it("passes a real letter", () => {
    const verdict = checkTailoring({ ...EMPTY_LETTER_RESPONSE, coverLetter: GOOD_LETTER }, { wantCv: false, wantLetter: true });
    expect(verdict.ok).toBe(true);
  });

  it("passes a CV request with a real summary", () => {
    const verdict = checkTailoring(
      { summary: "y".repeat(MIN_SUMMARY + 1), experience: [] },
      { wantCv: true, wantLetter: false },
    );
    expect(verdict.ok).toBe(true);
  });

  it("passes a CV request whose only real content is the rewritten bullets", () => {
    const verdict = checkTailoring(
      { summary: "", experience: [{ id: "exp-1", description: "- Ran the Kubernetes platform for payments" }] },
      { wantCv: true, wantLetter: false },
    );
    expect(verdict.ok).toBe(true);
  });

  it("fails a CV request where nothing was actually rewritten", () => {
    const verdict = checkTailoring({ summary: "", experience: [{ id: "exp-1", description: "" }] }, { wantCv: true, wantLetter: false });
    expect(verdict.ok).toBe(false);
    if (!verdict.ok) expect(verdict.missing).toBe("cv");
  });

  it("does not demand a letter it was not asked for", () => {
    // wantLetter false → an absent coverLetter is not a failure.
    expect(checkTailoring({ summary: "z".repeat(MIN_SUMMARY + 1) }, { wantCv: true, wantLetter: false }).ok).toBe(true);
    expect(checkTailoring({}, { wantCv: false, wantLetter: false }).ok).toBe(true);
  });

  it("uses a minimum body length, not just non-empty", () => {
    expect(checkTailoring({ coverLetter: "Dear Sir" }, { wantCv: false, wantLetter: true }).ok).toBe(false);
    expect(
      checkTailoring({ coverLetter: "k".repeat(MIN_LETTER_BODY) }, { wantCv: false, wantLetter: true }).ok,
    ).toBe(true);
  });
});
