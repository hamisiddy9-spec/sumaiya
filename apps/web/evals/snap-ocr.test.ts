// EVAL: E2 Snap-to-Apply — OCR slice anti-fabrication regression pack.
// Deterministic, no AI, no DB, no browser. Part of `npm run evals` (merge gate).
//
// E2 adds the photo path: camera/gallery capture → client-side OCR → the SAME
// /api/ai/snap pipeline as E1. The moment it could lie: (a) OCR garbage being
// treated as a job, (b) empty/symbol-only OCR output being sent (or fabricated
// into a JD), (c) a second server route that bypasses looksLikeJobDescription.
// Each is pinned here so a PR that weakens any gate fails.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { looksLikeJobDescription } from "@/lib/job-match";
import { isOcrTextUsable, snapOcrNoTextMessage, snapOcrRetryMessage } from "@/lib/snap-ocr";

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(resolve(ROOT, rel), "utf8");
const route = () => read("lib/api/routes/snap.ts");
const client = () => read("app/(app)/snap/snap-client.tsx");

// A realistic frontend JD (passes the guard) — what a good OCR read looks like.
const JD = `Frontend Engineer — Dar es Salaam (Full-time)

About the role: We are looking for a Frontend Engineer to build customer-facing dashboards.

Responsibilities:
- Build responsive interfaces with React and TypeScript
- Integrate REST APIs and write unit tests
- Ship accessible, performant web applications with Next.js

Requirements:
- 3+ years of experience with React and JavaScript
- Experience with Git and deploying to Vercel`;

describe("eval: E2 — OCR output can never become a fabricated job", () => {
  it("empty / whitespace OCR output is refused client-side (never sent)", () => {
    expect(isOcrTextUsable("")).toBe(false);
    expect(isOcrTextUsable("   \n  ")).toBe(false);
  });

  it("symbol-only OCR garbage (blank/blurry photo) is refused, not sent", () => {
    expect(isOcrTextUsable("### /// ~~~ +++ +++ ~~~")).toBe(false);
  });

  it("a good OCR read passes the usability gate AND the server JD guard", () => {
    expect(isOcrTextUsable(JD)).toBe(true);
    expect(looksLikeJobDescription(JD)).toBe(true);
  });

  it("the route STILL gates every payload with looksLikeJobDescription (no bypass)", () => {
    const src = route();
    expect(src).toMatch(/looksLikeJobDescription/);
    // The photo path must not add a second route that skips the guard.
    const guardIdx = src.indexOf("looksLikeJobDescription");
    const aiIdx = src.indexOf("callAi(");
    expect(guardIdx).toBeGreaterThan(-1);
    expect(aiIdx).toBeGreaterThan(guardIdx);
  });
});

describe("eval: E2 — the photo path reuses the SAME pipeline (one truth)", () => {
  it("the client extracts text on-device (client-side WASM OCR, free — no paid API key)", () => {
    const src = client();
    expect(src).toMatch(/extractTextFromImage/);
    expect(src).toMatch(/client-cv-extract/);
    // No server-side OCR route was introduced — the client calls the same
    // /api/ai/snap endpoint the paste slice uses.
    expect(src).toMatch(/\/api\/ai\/snap/);
  });

  it("no new OCR-specific server route was added", () => {
    // The only snap route is the E1 one; a second route would need to appear
    // in the routes file and would risk a guard bypass.
    const src = route();
    expect(src).toMatch(/post\("\/snap"/);
    expect(src).not.toMatch(/post\("\/snap-ocr"/);
    expect(src).not.toMatch(/ocr/i);
  });

  it("unusable OCR output triggers warm retry guidance, never a fabricated JD", () => {
    expect(snapOcrNoTextMessage(false)).toMatch(/couldn't read/i);
    expect(snapOcrRetryMessage(false)).toMatch(/light|focus|frame/i);
    expect(snapOcrNoTextMessage(true)).toMatch(/hatukuweza|kusoma/i);
    expect(snapOcrRetryMessage(true)).toMatch(/mwanga|wazi|skrini/i);
  });

  it("the client offers live camera capture AND gallery upload (mobile-first)", () => {
    const src = client();
    expect(src).toMatch(/capture="environment"/);
    expect(src).toMatch(/accept="image\/\*"/);
  });
});
