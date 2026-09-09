import { describe, expect, it } from "vitest";
import { snapApplicationPayload } from "./snap-application";

describe("snapApplicationPayload", () => {
  it("maps a full snap result into the from-cv payload", () => {
    const payload = snapApplicationPayload({
      cvId: "cv_123",
      jobTitle: "  Marketing Manager  ",
      jobDescription: "  Lead campaigns...  ",
      matchScore: 87.4,
    });

    expect(payload).toEqual({
      cvId: "cv_123",
      jobTitle: "Marketing Manager",
      jobDescription: "Lead campaigns...",
      matchScore: 87,
      status: "draft",
    });
  });

  it("returns null when there is no job context (bare CV save)", () => {
    expect(
      snapApplicationPayload({ cvId: "cv_1", jobTitle: "", jobDescription: "", matchScore: 91 })
    ).toBeNull();
    expect(
      snapApplicationPayload({ cvId: "cv_1", jobTitle: "   ", jobDescription: "   ", matchScore: null })
    ).toBeNull();
  });

  it("omits empty fields instead of sending empty strings", () => {
    const payload = snapApplicationPayload({
      cvId: "cv_1",
      jobTitle: "Accountant",
      jobDescription: "",
      matchScore: null,
    });

    expect(payload).toEqual({ cvId: "cv_1", jobTitle: "Accountant", status: "draft" });
  });

  it("keeps the JD alone as enough context for an application", () => {
    const payload = snapApplicationPayload({
      cvId: "cv_1",
      jobTitle: "",
      jobDescription: "We need a Senior Engineer with 5 years...",
      matchScore: 62,
    });

    expect(payload?.jobDescription).toBe("We need a Senior Engineer with 5 years...");
    expect(payload?.jobTitle).toBeUndefined();
    expect(payload?.status).toBe("draft");
  });

  it("clamps matchScore into the 0..100 range the route accepts", () => {
    expect(
      snapApplicationPayload({ cvId: "cv_1", jobTitle: "X", jobDescription: "Y", matchScore: 105 })?.matchScore
    ).toBe(100);
    expect(
      snapApplicationPayload({ cvId: "cv_1", jobTitle: "X", jobDescription: "Y", matchScore: -4 })?.matchScore
    ).toBe(0);
  });

  it("omits matchScore when it is null", () => {
    const payload = snapApplicationPayload({
      cvId: "cv_1",
      jobTitle: "X",
      jobDescription: "Y",
      matchScore: null,
    });

    expect("matchScore" in (payload as object)).toBe(false);
  });
});
