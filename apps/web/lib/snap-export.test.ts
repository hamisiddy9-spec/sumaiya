// Unit tests for the D3 PDF-export filename helpers — deterministic, node-only.

import { describe, it, expect } from "vitest";
import { sanitizeFilenamePart, snapExportFilename } from "@/lib/snap-export";

describe("sanitizeFilenamePart", () => {
  it("trims and collapses whitespace", () => {
    expect(sanitizeFilenamePart("  Sales   Manager  ")).toBe("Sales Manager");
  });

  it("removes path/OS-unsafe characters", () => {
    expect(sanitizeFilenamePart('Sales/Manager: "Sr" <Lead> | (x)')).toBe('Sales Manager  Sr  Lead   (x)'.replace(/\s+/g, " "));
  });

  it("strips control characters", () => {
    expect(sanitizeFilenamePart("Sales\u0000Manager\u0007Lead")).toBe("Sales Manager Lead");
  });

  it("returns empty for empty/whitespace input", () => {
    expect(sanitizeFilenamePart("")).toBe("");
    expect(sanitizeFilenamePart("   ")).toBe("");
    expect(sanitizeFilenamePart(undefined)).toBe("");
    expect(sanitizeFilenamePart(null)).toBe("");
  });

  it("caps the length at 60 chars", () => {
    const long = "x".repeat(200);
    expect(sanitizeFilenamePart(long).length).toBe(60);
  });
});

describe("snapExportFilename", () => {
  it("builds an English CV name with the real job title", () => {
    expect(snapExportFilename("cv", "Sales Manager", false)).toBe("Tailored_CV_Sales_Manager.pdf");
  });

  it("builds a Swahili letter name with the real job title", () => {
    expect(snapExportFilename("letter", "Sales Manager", true)).toBe("Barua_ya_Maombi_Sales_Manager.pdf");
  });

  it("drops the job part when there is no title (never invents one)", () => {
    expect(snapExportFilename("cv", "", false)).toBe("Tailored_CV.pdf");
    expect(snapExportFilename("cv", undefined, false)).toBe("Tailored_CV.pdf");
    expect(snapExportFilename("letter", "   ", true)).toBe("Barua_ya_Maombi.pdf");
  });

  it("sanitizes unsafe characters in the title", () => {
    expect(snapExportFilename("cv", 'Sales/Manager: "Lead"', false)).toBe("Tailored_CV_Sales_Manager_Lead.pdf");
  });
});
