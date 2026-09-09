// Unit tests for the Snap-to-Apply (E2) OCR gating helpers — deterministic,
// no AI, no browser. The E2 anti-fabrication eval lives in evals/snap-ocr.test.ts.

import { describe, it, expect } from "vitest";
import {
  MIN_OCR_TEXT_CHARS,
  isOcrTextUsable,
  snapOcrNoTextMessage,
  snapOcrRetryMessage,
} from "@/lib/snap-ocr";

const JD = `Frontend Engineer — Dar es Salaam (Full-time)

About the role: We are looking for a Frontend Engineer to build customer-facing dashboards.

Responsibilities:
- Build responsive interfaces with React and TypeScript
- Integrate REST APIs and write unit tests
- Ship accessible, performant web applications with Next.js

Requirements:
- 3+ years of experience with React and JavaScript
- Experience with Git and deploying to Vercel`;

describe("isOcrTextUsable", () => {
  it("rejects empty and whitespace-only OCR output", () => {
    expect(isOcrTextUsable("")).toBe(false);
    expect(isOcrTextUsable("   \n  \t ")).toBe(false);
  });

  it("rejects symbol-only garbage (blank/blurry photo)", () => {
    expect(isOcrTextUsable("### /// ~~~ +++ +++")).toBe(false);
    expect(isOcrTextUsable("---- ____ .... ----")).toBe(false);
  });

  it("rejects output below the minimum length", () => {
    expect(isOcrTextUsable("Hiring now")).toBe(false);
    expect(isOcrTextUsable("a".repeat(MIN_OCR_TEXT_CHARS - 1))).toBe(false);
  });

  it("accepts a realistic OCR-extracted job posting", () => {
    expect(isOcrTextUsable(JD)).toBe(true);
  });

  it("accepts output at/above the minimum length with real letters", () => {
    expect(isOcrTextUsable("x".repeat(MIN_OCR_TEXT_CHARS))).toBe(true);
  });

  it("is null-safe", () => {
    expect(isOcrTextUsable(null as unknown as string)).toBe(false);
  });
});

describe("warm retry copy", () => {
  it("provides a no-text message in both languages", () => {
    expect(snapOcrNoTextMessage(false)).toMatch(/couldn't read/i);
    expect(snapOcrNoTextMessage(true)).toMatch(/hatukuweza|kusoma/i);
  });

  it("provides actionable retry guidance in both languages", () => {
    expect(snapOcrRetryMessage(false)).toMatch(/light|focus|frame/i);
    expect(snapOcrRetryMessage(true)).toMatch(/mwanga|wazi|skrini/i);
  });
});
