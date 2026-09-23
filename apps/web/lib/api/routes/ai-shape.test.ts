import { describe, it, expect } from "vitest";
import { validateBuiltDocShape } from "@/lib/api/routes/ai";

describe("validateBuiltDocShape — build-doc output shape gate", () => {
  it("rejects non-objects and arrays", () => {
    expect(validateBuiltDocShape(123, "cv")).toBeNull();
    expect(validateBuiltDocShape("text", "cv")).toBeNull();
    expect(validateBuiltDocShape([], "cv")).toBeNull();
    expect(validateBuiltDocShape(null, "cv")).toBeNull();
    expect(validateBuiltDocShape(undefined, "cv")).toBeNull();
  });

  it("rejects a CV without a personal object", () => {
    expect(validateBuiltDocShape({ summary: "Hi" }, "cv")).toBeNull();
    expect(validateBuiltDocShape({ personal: "nope", summary: "Hi" }, "cv")).toBeNull();
    expect(validateBuiltDocShape({ personal: [], summary: "Hi" }, "cv")).toBeNull();
  });

  it("cleans and passes a valid CV, coercing non-string scalars", () => {
    const out = validateBuiltDocShape({
      personal: { fullName: "Juma", jobTitle: 42, email: "j@x.com" },
      summary: "Engineer",
      experience: [{ company: "A", position: "Dev", description: "Built things" }],
      education: [],
      skills: ["React", 7, "TS"],
      projects: [],
      languages: [],
      certifications: [],
      hobbies: 123,
    }, "cv");
    expect(out).not.toBeNull();
    const cv = out as Record<string, unknown>;
    const personal = cv.personal as Record<string, unknown>;
    expect(personal.fullName).toBe("Juma");
    expect(personal.jobTitle).toBe(""); // 42 coerced to ""
    expect(cv.hobbies).toBe(""); // 123 coerced to ""
    // Skills are OBJECTS. This assertion used to read ["React","TS"] with the comment
    // "non-strings dropped" — which froze in the very shape that lost every skill on the
    // web path, because the storage boundary requires a row with `name` (CV_ROW_IDENTITY
    // in types/index.ts) and discards bare strings. A string is now coerced to { name },
    // and a number (never a skill in any client) is still dropped.
    expect(cv.skills).toEqual([{ name: "React" }, { name: "TS" }]);
  });

  it("keeps skill OBJECTS intact — the shape the prompts ask for and the store keeps", () => {
    // The seam that failed: both CV prompts in ai.ts asked the model for `"skills":[""]`
    // while the normaliser kept only strings and the write boundary kept only objects, so
    // skills were discarded twice over. Measured on the live endpoint: 7 skills returned
    // by the model, 0 stored in cv.data. This asserts the requested shape survives.
    const out = validateBuiltDocShape({
      personal: { fullName: "Amina" },
      summary: "Sales assistant",
      experience: [],
      education: [],
      projects: [],
      languages: [],
      certifications: [],
      skills: [
        { name: "Customer service", level: "advanced" },
        { name: "Microsoft Excel", level: "intermediate" },
        "Point of Sale (POS)",
      ],
    }, "cv");
    expect(out).not.toBeNull();
    const skills = (out as Record<string, unknown>).skills as Array<Record<string, unknown>>;
    expect(skills).toHaveLength(3);
    expect(skills[0]).toEqual({ name: "Customer service", level: "advanced" });
    expect(skills[2]).toEqual({ name: "Point of Sale (POS)" });
    expect(skills.every((s) => typeof s.name === "string" && s.name.trim() !== "")).toBe(true);
  });

  it("drops a skills row with no readable name — the boundary's own rule", () => {
    const out = validateBuiltDocShape({
      personal: { fullName: "A" },
      summary: "x",
      experience: [],
      education: [],
      projects: [],
      languages: [],
      certifications: [],
      skills: [{ name: "   " }, { level: "advanced" }, 7, null],
    }, "cv");
    expect((out as Record<string, unknown>).skills).toEqual([]);
  });

  it("rejects a cover letter with non-string/empty content", () => {
    expect(validateBuiltDocShape({ fullName: "A", content: 123 }, "cover-letter")).toBeNull();
    expect(validateBuiltDocShape({ fullName: "A", content: "" }, "cover-letter")).toBeNull();
    expect(validateBuiltDocShape({ fullName: "A" }, "cover-letter")).toBeNull();
  });

  it("passes a valid cover letter and normalizes fields", () => {
    const out = validateBuiltDocShape({
      fullName: "A", jobTitle: "Dev", companyName: "X", content: "Dear hiring team…",
    }, "cover-letter");
    expect(out).not.toBeNull();
    expect((out as Record<string, unknown>).content).toBe("Dear hiring team…");
  });

  it("normalizes a business card (missing fields become empty strings)", () => {
    const out = validateBuiltDocShape({ name: "A", tagline: 5 }, "business-card");
    expect(out).not.toBeNull();
    const card = out as Record<string, unknown>;
    expect(card.name).toBe("A");
    expect(card.tagline).toBe("");
    expect(card.email).toBe("");
  });

  it("rejects a letter with unknown/missing letterType", () => {
    expect(validateBuiltDocShape({ letterType: "totally-made-up", body: "Hi" }, "letter")).toBeNull();
    expect(validateBuiltDocShape({ body: "Hi" }, "letter")).toBeNull();
    expect(validateBuiltDocShape({ letterType: "reference", body: "" }, "letter")).toBeNull();
    expect(validateBuiltDocShape({ letterType: "reference" }, "letter")).toBeNull();
  });

  it("passes a valid letter and fills empty from/to", () => {
    const out = validateBuiltDocShape({
      letterType: "resignation",
      subject: "Resignation",
      body: "I hereby resign…",
      closing: "Yours sincerely",
      from: { name: "A" },
      to: null,
    }, "letter");
    expect(out).not.toBeNull();
    const letter = out as Record<string, unknown>;
    expect(letter.letterType).toBe("resignation");
    expect((letter.from as Record<string, unknown>).name).toBe("A");
    expect(letter.to).toEqual({ name: "", title: "", company: "", address: "", email: "", phone: "" });
  });
});
