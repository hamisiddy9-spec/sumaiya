import { describe, it, expect } from "vitest";
import {
  nativeProfileToCareer,
  careerToNativeProfile,
  EMPTY_NATIVE_PROFILE,
  type NativeProfile,
} from "./mobile-bridge";

const native = (over: Partial<NativeProfile> = {}): NativeProfile => ({
  ...EMPTY_NATIVE_PROFILE,
  ...over,
});

describe("mobile-bridge", () => {
  it("maps the flat native profile into a valid structured CareerProfile", () => {
    const cp = nativeProfileToCareer(
      native({
        fullName: "Amina Yusuf",
        email: "amina@example.com",
        phone: "0712345678",
        location: "Nairobi",
        headline: "Finance & Accounting · Sales & Retail",
        summary: "Five years in retail finance.",
        skills: "Excel, bookkeeping\nCustomer service",
        experience: "Accounts clerk at Nakumatt, 2019-2023. Ran daily reconciliations.",
        languages: "English, Swahili",
      }),
    );

    expect(cp.personal.fullName).toBe("Amina Yusuf");
    expect(cp.personal.jobTitle).toBe(""); // headline is NOT a job title
    expect(cp.skills.map((s) => s.name)).toEqual(["Excel", "bookkeeping", "Customer service"]);
    expect(cp.skills.every((s) => s.level >= 1 && s.level <= 5)).toBe(true);
    expect(cp.languages.map((l) => l.name)).toEqual(["English", "Swahili"]);
    expect(cp.languages[0].proficiency).toBe("Intermediate");
    expect(cp.experience).toHaveLength(1);
    expect(cp.experience[0].description).toContain("Nakumatt");
    expect(cp.experience[0].current).toBe(false);
    expect(cp.preferences.targetRoles).toEqual([
      "Finance & Accounting",
      "Sales & Retail",
    ]);
    expect(cp.preferences.preferredLocations).toEqual(["Nairobi"]);
  });

  it("leaves empty sections empty (no phantom entries)", () => {
    const cp = nativeProfileToCareer(native({ fullName: "Bob" }));
    expect(cp.experience).toEqual([]);
    expect(cp.education).toEqual([]);
    expect(cp.skills).toEqual([]);
  });

  it("round-trips the essentials back to the native shape", () => {
    const original = native({
      fullName: "Amina Yusuf",
      location: "Nairobi",
      summary: "Retail finance.",
      skills: "Excel, bookkeeping",
      languages: "English, Swahili",
      headline: "Finance & Accounting",
    });
    const back = careerToNativeProfile(nativeProfileToCareer(original), 123);
    expect(back.fullName).toBe("Amina Yusuf");
    expect(back.location).toBe("Nairobi");
    expect(back.summary).toBe("Retail finance.");
    expect(back.skills).toBe("Excel, bookkeeping");
    expect(back.languages).toBe("English, Swahili");
    expect(back.headline).toBe("Finance & Accounting");
    expect(back.updatedAt).toBe(123);
  });
});
