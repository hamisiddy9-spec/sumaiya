import { relativeDate } from "./relative-date";

describe("relativeDate", () => {
  afterEach(() => jest.useRealTimers());

  it("reads 'Jana' for something from yesterday evening, viewed just after midnight — the calendar-day bug", () => {
    // Now: 01:00 today. Updated: 23:00 yesterday — only 2h ago, well under
    // a raw 24h diff, but it IS a different calendar day.
    jest.useFakeTimers().setSystemTime(new Date(2026, 8, 12, 1, 0, 0));
    const updated = new Date(2026, 8, 11, 23, 0, 0);
    expect(relativeDate(updated, "sw")).toBe("Jana");
    expect(relativeDate(updated, "en")).toBe("Yesterday");
  });

  it("reads 'Leo' for something ~20h old but from yesterday evening, viewed this afternoon — the reverse case", () => {
    // Now: 15:00 today. Updated: 19:00 yesterday — 20h ago (under 24h) but
    // calendar-yesterday, so it must read "Jana", never "Leo".
    jest.useFakeTimers().setSystemTime(new Date(2026, 8, 12, 15, 0, 0));
    const updated = new Date(2026, 8, 11, 19, 0, 0);
    expect(relativeDate(updated, "sw")).toBe("Jana");
  });

  it("reads 'Leo' for something updated earlier today, regardless of hours elapsed", () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 8, 12, 23, 0, 0));
    const updated = new Date(2026, 8, 12, 0, 5, 0); // just after midnight, same day
    expect(relativeDate(updated, "sw")).toBe("Leo");
    expect(relativeDate(updated, "en")).toBe("Today");
  });

  it("counts N days ago by calendar date, 2-6 days back", () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 8, 12, 10, 0, 0));
    const updated = new Date(2026, 8, 9, 22, 0, 0); // 3 calendar days back
    expect(relativeDate(updated, "sw")).toBe("Siku 3 zilizopita");
    expect(relativeDate(updated, "en")).toBe("3 days ago");
  });

  it("falls back to a formatted date at 7+ days", () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 8, 12, 10, 0, 0));
    const updated = new Date(2026, 7, 1, 10, 0, 0);
    expect(relativeDate(updated, "en")).toMatch(/Aug/);
  });
});
