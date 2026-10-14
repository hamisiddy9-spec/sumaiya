/**
 * The export / share path's user-visible strings.
 *
 * `services/share.ts` was the audit's P0 #3: five English-only strings on the
 * failure branches ("Not Available", "Error", "Sharing is not available on your
 * device", …) on an app whose guide says, verbatim, "Ship an English-only
 * surface. Both languages, every screen." (§10), each also opening with a bare
 * status word instead of naming the situation (§6: state the situation AND the
 * next action, never scold).
 *
 * These tests drive the real branches with a mocked share/print layer and
 * assert the exact dialog a Swahili user reads — not a re-description of it.
 */
import { readFileSync } from "fs";
import { join } from "path";

const mockIsAvailable = jest.fn();
const mockShareAsync = jest.fn();
const mockPrintAsync = jest.fn();
const mockAlert = jest.fn();

jest.mock("expo-sharing", () => ({
  isAvailableAsync: (...a: unknown[]) => mockIsAvailable(...a),
  shareAsync: (...a: unknown[]) => mockShareAsync(...a),
}));
jest.mock("expo-print", () => ({
  printAsync: (...a: unknown[]) => mockPrintAsync(...a),
}));
jest.mock("../components/ui", () => ({
  dialog: { alert: (...a: unknown[]) => mockAlert(...a) },
}));
jest.mock("./export-ledger", () => ({ reportExport: jest.fn(async () => {}) }));

let mockLang: "en" | "sw" = "en";
jest.mock("../lib/i18n", () => ({
  getLastKnownLang: () => mockLang,
}));

import type { CV } from "@sumaiya/types";
import { SHARE_COPY, openPDFPreview, printPDF, shareCV } from "./share";

const cv = {
  id: "cv-1",
  userId: "u1",
  templateId: "classic",
  title: "Storekeeper CV",
  data: { personalInfo: { fullName: "Amina Hassan", email: "a@b.com" } },
  createdAt: new Date(),
  updatedAt: new Date(),
} as unknown as CV;

const PDF = "file:///cache/Amina Hassan - Storekeeper CV.pdf";

beforeEach(() => {
  jest.clearAllMocks();
  mockLang = "en";
  mockIsAvailable.mockResolvedValue(true);
  mockShareAsync.mockResolvedValue(undefined);
  mockPrintAsync.mockResolvedValue(undefined);
});

describe("SHARE_COPY — both languages, situation + next action, never 'Error'", () => {
  const entries = Object.entries(SHARE_COPY);

  it("covers every failure branch on the export path", () => {
    // share unavailable / share failed / preview unavailable / preview failed /
    // print failed — one pair per branch, none dropped.
    expect(entries.length).toBeGreaterThanOrEqual(5);
  });

  it.each(entries)("%s is written in full in both languages", (_key, v) => {
    for (const lang of ["en", "sw"] as const) {
      expect(v.title[lang].trim().length).toBeGreaterThan(3);
      expect(v.body[lang].trim().length).toBeGreaterThan(20);
    }
    // Swahili leads the authoring; the two must genuinely differ, never the
    // English string pasted into the Swahili slot.
    expect(v.title.sw).not.toBe(v.title.en);
    expect(v.body.sw).not.toBe(v.body.en);
  });

  it.each(entries)("%s names the situation instead of scolding", (_key, v) => {
    for (const lang of ["en", "sw"] as const) {
      expect(v.title[lang]).not.toBe("Error");
      expect(v.title[lang]).not.toBe("Not Available");
      expect(v.title[lang].toLowerCase()).not.toMatch(/^error\b|^failed\b/);
    }
  });

  it.each(entries)("%s gives the next action, in both languages", (_key, v) => {
    expect(v.body.en.toLowerCase()).toMatch(/try again|save|attach|open/);
    expect(v.body.sw.toLowerCase()).toMatch(/jaribu|hifadhi|pachika|fungua/);
  });

  it("closes the whole English-only class in the file itself", () => {
    const src = readFileSync(join(__dirname, "share.ts"), "utf8");
    for (const banned of [
      '"Not Available"',
      '"Error"',
      "Failed to share CV",
      "Failed to open PDF preview",
      "Sharing is not available on your device",
      "PDF preview not available on your device",
    ]) {
      expect(src).not.toContain(banned);
    }
    // And every user-visible branch reads its copy from the bilingual table.
    expect(src).toContain("getLastKnownLang");
  });
});

describe("shareCV — the user reads their own language", () => {
  it("carries a bilingual share-sheet title and says nothing on success", async () => {
    mockLang = "sw";
    await shareCV(cv, PDF);
    expect(mockShareAsync).toHaveBeenCalledTimes(1);
    expect(mockShareAsync.mock.calls[0][1]).toMatchObject({
      mimeType: "application/pdf",
      dialogTitle: "Shiriki CV ya Amina Hassan",
    });
    expect(mockAlert).not.toHaveBeenCalled();
  });

  it("names the situation and the next step when this phone cannot share", async () => {
    mockLang = "sw";
    mockIsAvailable.mockResolvedValue(false);
    await shareCV(cv, PDF);
    expect(mockAlert).toHaveBeenCalledWith(
      SHARE_COPY.shareUnavailable.title.sw,
      SHARE_COPY.shareUnavailable.body.sw,
    );
    expect(mockShareAsync).not.toHaveBeenCalled();
  });

  it("does the same in English", async () => {
    mockLang = "en";
    mockIsAvailable.mockResolvedValue(false);
    await shareCV(cv, PDF);
    expect(mockAlert).toHaveBeenCalledWith(
      SHARE_COPY.shareUnavailable.title.en,
      SHARE_COPY.shareUnavailable.body.en,
    );
  });

  it("reports a failed hand-off as a situation a Swahili user can act on", async () => {
    mockLang = "sw";
    mockShareAsync.mockRejectedValue(new Error("boom"));
    await shareCV(cv, PDF);
    expect(mockAlert).toHaveBeenCalledWith(
      SHARE_COPY.shareFailed.title.sw,
      SHARE_COPY.shareFailed.body.sw,
    );
  });
});

describe("openPDFPreview", () => {
  it("uses a bilingual title and reports a dead preview honestly", async () => {
    mockLang = "sw";
    await openPDFPreview(PDF);
    expect(mockShareAsync.mock.calls[0][1]).toMatchObject({ dialogTitle: "Ona CV" });

    mockIsAvailable.mockResolvedValue(false);
    await openPDFPreview(PDF);
    expect(mockAlert).toHaveBeenCalledWith(
      SHARE_COPY.previewUnavailable.title.sw,
      SHARE_COPY.previewUnavailable.body.sw,
    );

    mockIsAvailable.mockResolvedValue(true);
    mockShareAsync.mockRejectedValue(new Error("boom"));
    await openPDFPreview(PDF);
    expect(mockAlert).toHaveBeenCalledWith(
      SHARE_COPY.previewFailed.title.sw,
      SHARE_COPY.previewFailed.body.sw,
    );
  });
});

describe("printPDF — the sheet's print tile's real capability", () => {
  it("opens the phone's print window with the already-printed PDF", async () => {
    await printPDF(PDF);
    expect(mockPrintAsync).toHaveBeenCalledWith({ uri: PDF });
    expect(mockAlert).not.toHaveBeenCalled();
  });

  it("tells a Swahili user plainly when no print window opens", async () => {
    mockLang = "sw";
    mockPrintAsync.mockRejectedValue(new Error("no print service"));
    await printPDF(PDF);
    expect(mockAlert).toHaveBeenCalledWith(
      SHARE_COPY.printFailed.title.sw,
      SHARE_COPY.printFailed.body.sw,
    );
  });
});
