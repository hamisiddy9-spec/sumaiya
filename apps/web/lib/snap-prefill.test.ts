// Unit tests for the D2 "Tailor my CV for this job" prefill hand-off.
// Deterministic, node-only (storage injected): pins the invariant that /snap
// only ever prefills REAL, fresh, non-empty JD text — a missing, stale,
// corrupted or oversized hand-off degrades to an empty page, never a
// fabricated job.

import { describe, it, expect } from "vitest";
import {
  SNAP_PREFILL_KEY,
  SNAP_PREFILL_MAX_AGE_MS,
  SNAP_PREFILL_MAX_JD_CHARS,
  saveJdPrefill,
  readJdPrefill,
  clearJdPrefill,
  type StorageLike,
} from "@/lib/snap-prefill";

/** Map-backed fake sessionStorage for deterministic tests. */
function fakeStorage(): StorageLike & { map: Map<string, string> } {
  const map = new Map<string, string>();
  return {
    map,
    getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
  };
}

const NOW = 1_700_000_000_000;

describe("saveJdPrefill", () => {
  it("stores trimmed real JD text with a timestamp", () => {
    const s = fakeStorage();
    expect(saveJdPrefill({ jd: "  Sales Manager at Acme — responsibilities…  " }, s, NOW)).toBe(true);
    const parsed = JSON.parse(s.map.get(SNAP_PREFILL_KEY)!);
    expect(parsed.jd).toBe("Sales Manager at Acme — responsibilities…");
    expect(parsed.at).toBe(NOW);
  });

  it("refuses to save empty/whitespace JD text (no fabricated prefill)", () => {
    const s = fakeStorage();
    expect(saveJdPrefill({ jd: "" }, s, NOW)).toBe(false);
    expect(saveJdPrefill({ jd: "   \n  " }, s, NOW)).toBe(false);
    expect(s.map.has(SNAP_PREFILL_KEY)).toBe(false);
  });

  it("returns false when storage is unavailable, without throwing", () => {
    expect(saveJdPrefill({ jd: "A real JD" }, null, NOW)).toBe(false);
    expect(saveJdPrefill({ jd: "A real JD" }, undefined, NOW)).toBe(false);
  });

  it("caps oversized JD text and trims long title/company", () => {
    const s = fakeStorage();
    const huge = "x".repeat(SNAP_PREFILL_MAX_JD_CHARS + 500);
    expect(saveJdPrefill({ jd: huge, title: "t".repeat(500), company: "c".repeat(500) }, s, NOW)).toBe(true);
    const parsed = JSON.parse(s.map.get(SNAP_PREFILL_KEY)!);
    expect(parsed.jd.length).toBe(SNAP_PREFILL_MAX_JD_CHARS);
    expect(parsed.title.length).toBe(200);
    expect(parsed.company.length).toBe(200);
  });

  it("keeps optional title/company only when non-empty", () => {
    const s = fakeStorage();
    saveJdPrefill({ jd: "JD", title: "  ", company: "Acme" }, s, NOW);
    const parsed = JSON.parse(s.map.get(SNAP_PREFILL_KEY)!);
    expect(parsed.title).toBeUndefined();
    expect(parsed.company).toBe("Acme");
  });
});

describe("readJdPrefill", () => {
  it("round-trips a saved hand-off", () => {
    const s = fakeStorage();
    saveJdPrefill({ jd: "JD text", title: "Sales Manager", company: "Acme" }, s, NOW);
    expect(readJdPrefill(s, NOW + 1000)).toEqual({
      jd: "JD text",
      title: "Sales Manager",
      company: "Acme",
      at: NOW,
    });
  });

  it("returns null when nothing was saved", () => {
    expect(readJdPrefill(fakeStorage(), NOW)).toBeNull();
  });

  it("returns null for corrupted JSON", () => {
    const s = fakeStorage();
    s.setItem(SNAP_PREFILL_KEY, "{not json!!");
    expect(readJdPrefill(s, NOW)).toBeNull();
  });

  it("returns null for empty / whitespace-only JD (never a fabricated prefill)", () => {
    const s = fakeStorage();
    s.setItem(SNAP_PREFILL_KEY, JSON.stringify({ jd: "   ", at: NOW }));
    expect(readJdPrefill(s, NOW)).toBeNull();
  });

  it("returns null for a non-string or missing jd field", () => {
    const s = fakeStorage();
    s.setItem(SNAP_PREFILL_KEY, JSON.stringify({ at: NOW }));
    expect(readJdPrefill(s, NOW)).toBeNull();
    s.setItem(SNAP_PREFILL_KEY, JSON.stringify({ jd: 42, at: NOW }));
    expect(readJdPrefill(s, NOW)).toBeNull();
  });

  it("returns null for an oversized JD", () => {
    const s = fakeStorage();
    s.setItem(SNAP_PREFILL_KEY, JSON.stringify({ jd: "x".repeat(SNAP_PREFILL_MAX_JD_CHARS + 1), at: NOW }));
    expect(readJdPrefill(s, NOW)).toBeNull();
  });

  it("refuses stale hand-offs older than the recency window", () => {
    const s = fakeStorage();
    saveJdPrefill({ jd: "JD" }, s, NOW);
    expect(readJdPrefill(s, NOW + SNAP_PREFILL_MAX_AGE_MS)).not.toBeNull();
    expect(readJdPrefill(s, NOW + SNAP_PREFILL_MAX_AGE_MS + 1)).toBeNull();
  });

  it("refuses a future timestamp (clock skew / tampering)", () => {
    const s = fakeStorage();
    s.setItem(SNAP_PREFILL_KEY, JSON.stringify({ jd: "JD", at: NOW + 60_000 }));
    expect(readJdPrefill(s, NOW)).toBeNull();
  });

  it("refuses a missing / non-numeric timestamp", () => {
    const s = fakeStorage();
    s.setItem(SNAP_PREFILL_KEY, JSON.stringify({ jd: "JD" }));
    expect(readJdPrefill(s, NOW)).toBeNull();
    s.setItem(SNAP_PREFILL_KEY, JSON.stringify({ jd: "JD", at: "yesterday" }));
    expect(readJdPrefill(s, NOW)).toBeNull();
  });

  it("returns null when storage is unavailable", () => {
    expect(readJdPrefill(null, NOW)).toBeNull();
  });
});

describe("clearJdPrefill", () => {
  it("removes a pending hand-off (consumed once /snap reads it)", () => {
    const s = fakeStorage();
    saveJdPrefill({ jd: "JD" }, s, NOW);
    clearJdPrefill(s);
    expect(s.map.has(SNAP_PREFILL_KEY)).toBe(false);
    expect(readJdPrefill(s, NOW)).toBeNull();
  });

  it("is a safe no-op when storage is unavailable", () => {
    expect(() => clearJdPrefill(null)).not.toThrow();
  });
});
