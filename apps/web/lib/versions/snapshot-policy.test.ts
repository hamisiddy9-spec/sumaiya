/**
 * Version history has to record something.
 *
 * The shipped defect: the editor shows a "Historia ya matoleo" panel with a
 * Restore button on every row, but a version was only written on an explicit
 * save, a download or a restore — so an hour of ordinary editing left exactly
 * ONE row, still carrying the pre-rename title
 * (docs/QA-WEB-JOURNEYS-2026-09-20.md D5).
 *
 * The policy is pure so this is decidable without a browser.
 */
import { describe, it, expect } from "vitest";
import { shouldRecordVersion, MIN_VERSION_INTERVAL_MS } from "./snapshot-policy";

const MIN = MIN_VERSION_INTERVAL_MS;
const NOW = 1_800_000_000_000;

describe("shouldRecordVersion", () => {
  it("records the first real change of a session", () => {
    expect(
      shouldRecordVersion({
        payloadSignature: "sig-after-rename",
        baselineSignature: "sig-as-loaded",
        lastRecordedAt: 0,
        now: NOW,
      }),
    ).toBe(true);
  });

  it("does not record when nothing meaningful changed", () => {
    // A save that carried no change (a focus/blur, a no-op autosave) must not
    // create a duplicate row: duplicates are what make a history list useless.
    expect(
      shouldRecordVersion({
        payloadSignature: "same",
        baselineSignature: "same",
        lastRecordedAt: 0,
        now: NOW,
      }),
    ).toBe(false);
  });

  it("throttles a burst of typing to one version per window", () => {
    const changed = {
      payloadSignature: "sig-2",
      baselineSignature: "sig-1",
      lastRecordedAt: NOW - 60_000, // a minute ago
      now: NOW,
    };
    expect(shouldRecordVersion(changed)).toBe(false);
    expect(shouldRecordVersion({ ...changed, lastRecordedAt: NOW - MIN, now: NOW })).toBe(true);
    expect(shouldRecordVersion({ ...changed, lastRecordedAt: NOW - MIN - 1, now: NOW })).toBe(true);
  });

  it("never records without a payload signature", () => {
    expect(
      shouldRecordVersion({ payloadSignature: "", baselineSignature: "", lastRecordedAt: 0, now: NOW }),
    ).toBe(false);
  });

  it("a session that keeps editing for an hour leaves a real history, not one row", () => {
    // Simulates the QA scenario: an hour of edits, each triggering an autosave.
    let baseline = "sig-0";
    let lastAt = 0;
    let recorded = 0;
    for (let minute = 1; minute <= 60; minute++) {
      const sig = `sig-${minute}`;
      const now = NOW + minute * 60_000;
      if (shouldRecordVersion({ payloadSignature: sig, baselineSignature: baseline, lastRecordedAt: lastAt, now })) {
        recorded += 1;
        lastAt = now;
        baseline = sig;
      }
    }
    // One per 10-minute window, and far more than the single creation row.
    expect(recorded).toBeGreaterThanOrEqual(5);
    expect(recorded).toBeLessThanOrEqual(7);
  });
});
