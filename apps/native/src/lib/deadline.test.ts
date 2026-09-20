import { closingLabel } from "./deadline";

/**
 * Dates are pinned to a fixed "now" so these assertions do not decay: a test
 * written against the real clock passes today and fails next month.
 */
const NOW = new Date("2026-09-21T09:00:00");

function at(iso: string): string {
  return new Date(iso).toISOString();
}

describe("closingLabel", () => {
  it("says nothing when there is no deadline (unknown is not closed)", () => {
    expect(closingLabel(null, "sw", NOW)).toBeNull();
    expect(closingLabel(undefined, "en", NOW)).toBeNull();
    expect(closingLabel("", "sw", NOW)).toBeNull();
  });

  it("refuses to print a non-date on a job card", () => {
    expect(closingLabel("soon", "en", NOW)).toBeNull();
    expect(closingLabel("not-a-date", "sw", NOW)).toBeNull();
  });

  it("names tomorrow and today, which is what decides whether to act now", () => {
    expect(closingLabel(at("2026-09-21T23:30:00"), "sw", NOW)).toBe("Leo");
    expect(closingLabel(at("2026-09-22T08:00:00"), "sw", NOW)).toBe("Kesho");
    expect(closingLabel(at("2026-09-22T08:00:00"), "en", NOW)).toBe("Tomorrow");
  });

  it("counts the coming days in the forward direction", () => {
    // "Siku 3 zijazo" (the coming three days), never the backwards
    // "zilizopita" — a deadline is in front of you.
    expect(closingLabel(at("2026-09-24T12:00:00"), "sw", NOW)).toBe("Siku 3 zijazo");
    expect(closingLabel(at("2026-09-24T12:00:00"), "en", NOW)).toBe("In 3 days");
    expect(closingLabel(at("2026-09-24T12:00:00"), "sw", NOW)).not.toMatch(/zilizopita/);
  });

  it("gives a real date once the week is out", () => {
    const far = closingLabel(at("2026-10-12T12:00:00"), "sw", NOW);
    expect(far).toMatch(/12/);
    expect(far).toMatch(/2026/);
    expect(far).not.toMatch(/Siku/);
  });

  it("describes a date already gone as past, not as a deadline to make", () => {
    expect(closingLabel(at("2026-09-20T12:00:00"), "sw", NOW)).toBe("Jana");
    expect(closingLabel(at("2026-09-18T12:00:00"), "en", NOW)).toBe("3 days ago");
  });
});
