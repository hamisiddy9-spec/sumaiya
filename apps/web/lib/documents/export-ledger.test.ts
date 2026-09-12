import { describe, it, expect } from "vitest";
import {
  EXPORT_KINDS,
  EXPORT_DEFAULT_TITLES,
  normalizeExportKind,
  buildLedgerRow,
} from "./export-ledger";

/**
 * The bug these cover: `download_log` only ever received CV rows, because each
 * endpoint rolled its own bookkeeping and three of the four document types
 * wrote nothing. Everything here is the part that must behave identically no
 * matter which surface (Hono route, Next route handler, mobile) called it.
 */

describe("normalizeExportKind", () => {
  it("accepts the four canonical kinds", () => {
    expect(normalizeExportKind("cv")).toBe("cv");
    expect(normalizeExportKind("cover-letter")).toBe("cover-letter");
    expect(normalizeExportKind("letter")).toBe("letter");
    expect(normalizeExportKind("business-card")).toBe("business-card");
  });

  it("accepts the spellings the two API surfaces actually disagree on", () => {
    // The web editor posts camelCase-ish paths; the Hono routes use kebab-case.
    expect(normalizeExportKind("cover_letter")).toBe("cover-letter");
    expect(normalizeExportKind("coverLetter")).toBe("cover-letter");
    expect(normalizeExportKind("business_card")).toBe("business-card");
    expect(normalizeExportKind("businessCard")).toBe("business-card");
    expect(normalizeExportKind("card")).toBe("business-card");
  });

  it("is case- and whitespace-insensitive", () => {
    expect(normalizeExportKind("  CV ")).toBe("cv");
    expect(normalizeExportKind("Cover-Letter")).toBe("cover-letter");
  });

  it("rejects anything that is not a document kind", () => {
    expect(normalizeExportKind("resume")).toBeNull();
    expect(normalizeExportKind("")).toBeNull();
    expect(normalizeExportKind("   ")).toBeNull();
    expect(normalizeExportKind(null)).toBeNull();
    expect(normalizeExportKind(undefined)).toBeNull();
    expect(normalizeExportKind(42)).toBeNull();
    expect(normalizeExportKind({ documentType: "cv" })).toBeNull();
    expect(normalizeExportKind(["cv"])).toBeNull();
  });
});

describe("EXPORT_DEFAULT_TITLES", () => {
  it("names every kind — a ledger row must never be blank to the user", () => {
    for (const kind of EXPORT_KINDS) {
      expect(EXPORT_DEFAULT_TITLES[kind]?.trim()).toBeTruthy();
    }
  });
});

describe("buildLedgerRow", () => {
  const base = { userId: "u1", documentId: "d1", documentType: "letter" as const };

  it("keeps the title the export actually had", () => {
    const row = buildLedgerRow({ ...base, title: "Kurudi kazini — HR" });
    expect(row.title).toBe("Kurudi kazini — HR");
    expect(row.documentType).toBe("letter");
    expect(row.documentId).toBe("d1");
    expect(row.userId).toBe("u1");
  });

  it("falls back to the kind's default instead of storing an empty title", () => {
    // A blank row would render as a nameless document in the library block.
    expect(buildLedgerRow(base).title).toBe("My Letter");
    expect(buildLedgerRow({ ...base, title: null }).title).toBe("My Letter");
    expect(buildLedgerRow({ ...base, title: "   " }).title).toBe("My Letter");
    expect(buildLedgerRow({ ...base, title: "" }).title).toBe("My Letter");
  });

  it("trims a title that arrived with padding", () => {
    // Exactly the shape POST /mobile/apply returns for the cover letter.
    expect(buildLedgerRow({ ...base, title: "  Platform Engineer (m/f/d)  " }).title).toBe(
      "Platform Engineer (m/f/d)",
    );
  });

  it("defaults the format to pdf and honours an explicit one", () => {
    expect(buildLedgerRow(base).format).toBe("pdf");
    expect(buildLedgerRow({ ...base, format: "docx" }).format).toBe("docx");
    // "" / null / whitespace are not a format.
    expect(buildLedgerRow({ ...base, format: "" }).format).toBe("pdf");
    expect(buildLedgerRow({ ...base, format: "   " }).format).toBe("pdf");
    expect(buildLedgerRow({ ...base, format: null }).format).toBe("pdf");
  });

  it("mints an id when the caller has none, and keeps the caller's when it does", () => {
    const minted = buildLedgerRow(base);
    expect(minted.id).toBeTruthy();
    expect(buildLedgerRow(base).id).not.toBe(minted.id); // not a fixed string
    expect(buildLedgerRow({ ...base, id: "fixed" }).id).toBe("fixed");
  });
});
