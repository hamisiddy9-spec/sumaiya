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
    expect(cv.skills).toEqual(["React", "TS"]); // non-strings dropped
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
