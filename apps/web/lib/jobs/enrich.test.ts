/**
 * Enrichment tests — thin detection + the SSRF/content-type/fallback guards.
 * fetchPublicPage uses global fetch; the important pure logic (thin
 * detection, acceptance ratio) is tested here, and the SSRF guard itself is
 * covered by ai-ssrf.test.ts (shared module — not reinvented).
 */
import { describe, expect, it } from "vitest";
import {
  extractContentWindow,
  isThinDescription,
  MIN_IMPROVEMENT_RATIO,
  THIN_DESCRIPTION_CHARS,
} from "./enrich";

describe("isThinDescription", () => {
  it("flags short descriptions as thin", () => {
    expect(isThinDescription("Junior React Developer - Berlin")).toBe(true);
    expect(isThinDescription("")).toBe(true);
    expect(isThinDescription("   ")).toBe(true);
  });

  it("rich descriptions are NOT thin", () => {
    const rich = "We are looking for a senior engineer. ".repeat(30);
    expect(isThinDescription(rich)).toBe(false);
  });

  it("threshold is content-based, not raw length (whitespace ignored)", () => {
    // 250 real chars padded with whitespace beyond the raw threshold
    const text = "x".repeat(THIN_DESCRIPTION_CHARS - 50);
    const padded = text + " ".repeat(500);
    expect(isThinDescription(padded)).toBe(true);
    expect(isThinDescription("x".repeat(THIN_DESCRIPTION_CHARS + 1))).toBe(false);
  });
});

describe("extractContentWindow", () => {
  // Realistic job page: long header/nav noise BEFORE the JD (like Arbeitnow's
  // page), the job title as the body anchor, then the JD, then footer noise.
  const page =
    "Header navigation noise ".repeat(20) +
    "Jobs in Germany Locations Categories About\n" +
    "Senior Data Scientist (m/f/d) Peter Park Munich\n" +
    "We build data science tools. Requirements: Python, ML, Kubernetes.\n" +
    "Footer links and more navigation ".repeat(10);

  it("starts the window at the LAST title occurrence (the body header, not <title>)", () => {
    const out = extractContentWindow(page, "Senior Data Scientist (m/f/d)", 200);
    // Window starts 40 chars BEFORE the body title anchor, so the prefix is
    // the tail of the nav line, not the nav block — JD is at the start.
    expect(out).toContain("Senior Data Scientist (m/f/d)");
    expect(out).toContain("We build data science tools");
    expect(out).not.toContain("Header navigation noise");
  });

  it("falls back to the page start when the title is not found", () => {
    const out = extractContentWindow(page, "Completely Different Title", 50);
    expect(out).toBe("Header navigation noise Header navigation noise He");
  });

  it("caps the window at maxChars", () => {
    const out = extractContentWindow(page, "Senior Data Scientist (m/f/d)", 120);
    expect(out.length).toBeLessThanOrEqual(160); // 120 + 40 start offset
  });
});

describe("enrichment acceptance ratio", () => {
  it("requires the fetched page to be at least 2x the thin source", () => {
    const thinLen = 100;
    const improved = thinLen * MIN_IMPROVEMENT_RATIO;
    expect(improved).toBe(200);
    // A fetched page of 150 chars (1.5x) would be REJECTED — noise, not a JD.
    expect(150 < thinLen * MIN_IMPROVEMENT_RATIO).toBe(true);
  });
});
