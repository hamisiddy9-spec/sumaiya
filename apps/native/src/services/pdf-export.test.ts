jest.mock("expo-print", () => ({ printToFileAsync: jest.fn(async () => ({ uri: "file:///cache/printed-uuid.pdf" })) }));
jest.mock("expo-file-system/legacy", () => ({
  cacheDirectory: "file:///cache/",
  deleteAsync: jest.fn(async () => {}),
  copyAsync: jest.fn(async () => {}),
}));

import { readFileSync } from "fs";
import { join } from "path";
import { letterFileName } from "./pdf-export";

describe("every printToFileAsync call passes A4, not the expo-print US Letter default", () => {
  // A one-page CV is authored at 794x1123 — 67 CSS px taller than a Letter
  // content box — so a call that omits width/height silently exports a
  // two-page PDF with a sliver on page 2. This is a static guard: it scans
  // the real call sites rather than trusting a runtime mock.
  const SRC = join(__dirname, "..");
  const read = (rel: string) => readFileSync(join(SRC, rel), "utf8");

  const CALL_SITES = ["services/pdf-export.ts", "screens/job-apply-screen.tsx", "screens/pdf-tools-screen.tsx"];

  /** Extracts one `printToFileAsync(...)` call by counting parens, so a
   *  nested call inside the args (e.g. `letterToHtml({ ... })`) can't fool a
   *  non-greedy regex into stopping at its inner `})`. */
  function extractCall(source: string, nameIndex: number): string {
    const start = source.indexOf("(", nameIndex);
    let depth = 0;
    for (let i = start; i < source.length; i++) {
      if (source[i] === "(") depth++;
      if (source[i] === ")") {
        depth--;
        if (depth === 0) return source.slice(nameIndex, i + 1);
      }
    }
    throw new Error(`unbalanced printToFileAsync( in ${source.slice(nameIndex, nameIndex + 60)}`);
  }

  it.each(CALL_SITES)("%s's printToFileAsync call(s) pass A4_W_PT/A4_H_PT", (file) => {
    const source = read(file);
    const starts = [...source.matchAll(/printToFileAsync(?=\()/g)].map((m) => m.index);
    expect(starts.length).toBeGreaterThan(0);
    for (const at of starts) {
      const call = extractCall(source, at);
      expect(call).toMatch(/width:\s*A4_W_PT/);
      expect(call).toMatch(/height:\s*A4_H_PT/);
    }
  });
});

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
