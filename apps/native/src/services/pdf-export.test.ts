jest.mock("expo-print", () => ({ printToFileAsync: jest.fn(async () => ({ uri: "file:///cache/printed-uuid.pdf" })) }));
jest.mock("expo-file-system/legacy", () => ({
  cacheDirectory: "file:///cache/",
  deleteAsync: jest.fn(async () => {}),
  copyAsync: jest.fn(async () => {}),
}));

import { letterFileName } from "./pdf-export";

describe("letterFileName", () => {
  it("names a letter the way a person would, not with a UUID", () => {
    // The file the owner received was `54abcd12-d5ef-47ae-8fb4-cae2774c3185.pdf`:
    // expo-print's name, never renamed. This is the fix.
    const name = letterFileName("Platform Engineer (m/f/d)", "Ecoplanet Green Operations Gmbh");
    expect(name).toBe("Cover letter - Platform Engineer (m-f-d) - Ecoplanet Green Operations Gmbh.pdf");
    expect(name).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}/);
  });

  it("strips characters no filesystem wants", () => {
    const name = letterFileName('Senior "Ops" Lead', "A/B:C?D");
    expect(name).not.toMatch(/[/\\?%*:|"<>]/);
    expect(name.endsWith(".pdf")).toBe(true);
  });

  it("degrades gracefully when the job details are missing", () => {
    expect(letterFileName(null, null)).toBe("Cover letter.pdf");
    expect(letterFileName("", "")).toBe("Cover letter.pdf");
    expect(letterFileName("Storekeeper")).toBe("Cover letter - Storekeeper.pdf");
  });

  it("keeps the name short enough to stay readable", () => {
    const name = letterFileName("x".repeat(200), "y".repeat(200));
    expect(name.length).toBeLessThanOrEqual(85);
  });
});
