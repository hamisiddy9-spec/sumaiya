/**
 * The cv.data SHAPE BOUNDARY — the one place a stored CV becomes a live one and
 * back again.
 *
 * Why this file exists: production held 19 CVs whose `data` column is a JSON
 * *string* inside jsonb (`jsonb_typeof = 'string'`) rather than a jsonb object.
 * `parseCVData` was fixed to unwrap that on READ, but the shared `obj()` helper
 * behind the WRITE direction still returned `{}` for a string — so
 * `toStoredCvData` stored an EMPTY CV, silently, with the user's real content
 * sitting in the value it was handed. These tests pin the unwrap on both
 * directions so the write path cannot regress into silent data loss again.
 *
 * Lives under apps/web because that is where the vitest project runs; it
 * exercises the real `@sumaiya/utils` package through the workspace link.
 */
import { describe, expect, it } from "vitest";
// Deep import on purpose: the `@sumaiya/utils` barrel drags in expo-sqlite
// (offline-storage), which the web test environment cannot resolve.
import { toNativeCvData, toStoredCvData } from "@sumaiya/utils/cv-shape";

/** A stored-shape CV (what the web app reads and writes). */
const STORED = {
  personal: { fullName: "Neema Joseph", jobTitle: "Operations Manager", email: "n@example.co.tz" },
  summary: "Operations manager with 8 years in distribution.",
  experience: [{ title: "Operations Manager", company: "Zuri Logistics" }],
  education: [{ institution: "UDSM", degree: "BCom" }],
  skills: [{ name: "Excel" }, { name: "SAP" }],
};

/** The native-shape CV (what the app stores on device). */
const NATIVE = {
  personalInfo: { fullName: "Neema Joseph", jobTitle: "Operations Manager", email: "n@example.co.tz" },
  summary: "Operations manager with 8 years in distribution.",
  experience: [{ title: "Operations Manager", company: "Zuri Logistics" }],
  education: [{ institution: "UDSM", degree: "BCom" }],
  skills: [{ name: "Excel" }, { name: "SAP" }],
};

describe("toStoredCvData — the write path", () => {
  it("keeps the content of a plain object", () => {
    const out = toStoredCvData<typeof STORED>(NATIVE);
    expect(out.personal.fullName).toBe("Neema Joseph");
    expect(out.summary).toContain("8 years");
    expect(out.skills).toHaveLength(2);
  });

  it("keeps the content when handed a JSON STRING (the production shape)", () => {
    // Before the fix this returned an object whose every section was empty.
    const out = toStoredCvData<typeof STORED>(JSON.stringify(NATIVE));
    expect(out.personal.fullName).toBe("Neema Joseph");
    expect(out.summary).toContain("8 years");
    expect(out.experience).toHaveLength(1);
    expect(out.skills).toHaveLength(2);
  });

  it("keeps the content when handed a DOUBLY-encoded string", () => {
    const out = toStoredCvData<typeof STORED>(JSON.stringify(JSON.stringify(NATIVE)));
    expect(out.personal.fullName).toBe("Neema Joseph");
    expect(out.skills).toHaveLength(2);
  });

  it("still returns an empty object for a value that is not an object at all", () => {
    // Documented behaviour, not a silent success: junk in, empty out.
    type Empty = { personal: { fullName: string } };
    expect(toStoredCvData<Empty>("not json at all").personal.fullName).toBe("");
    expect(toStoredCvData<Empty>(null).personal.fullName).toBe("");
    expect(toStoredCvData<Empty>([1, 2, 3]).personal.fullName).toBe("");
  });
});

describe("toNativeCvData — the read path", () => {
  it("keeps the content when handed a JSON string", () => {
    const out = toNativeCvData<typeof NATIVE>(JSON.stringify(STORED));
    expect(out.personalInfo.fullName).toBe("Neema Joseph");
    expect(out.experience).toHaveLength(1);
    expect(out.skills).toHaveLength(2);
  });

  it("writes `personalInfo` for the native shape and stays lossless", () => {
    const out = toNativeCvData<typeof NATIVE & { personal?: unknown }>(STORED);
    expect(out.personalInfo.fullName).toBe("Neema Joseph");
    // convert() spreads the source, so the original key survives. That is
    // deliberate (the boundary is lossless both ways) — asserted so a future
    // "tidy-up" that starts dropping keys has to argue with a test.
    expect(out).toHaveProperty("personal");
  });
});

describe("round trip", () => {
  it("object → native → stored keeps every section", () => {
    const there = toNativeCvData<typeof NATIVE>(STORED);
    const back = toStoredCvData<typeof STORED>(there);
    expect(back.personal.fullName).toBe(STORED.personal.fullName);
    expect(back.summary).toBe(STORED.summary);
    expect(back.experience).toHaveLength(1);
    expect(back.education).toHaveLength(1);
    expect(back.skills).toHaveLength(2);
  });

  it("string → native → stored keeps every section", () => {
    const there = toNativeCvData<typeof NATIVE>(JSON.stringify(STORED));
    const back = toStoredCvData<typeof STORED>(JSON.stringify(there));
    expect(back.personal.fullName).toBe(STORED.personal.fullName);
    expect(back.skills).toHaveLength(2);
  });
});
