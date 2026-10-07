import { describe, it, expect } from "vitest";
import {
  phonesByVersion,
  activeInstalls,
  topEvents,
  errorSummary,
  activationFunnel,
  appAdminOverview,
  type AppEventRow,
} from "./aggregate";

function row(overrides: Partial<AppEventRow> = {}): AppEventRow {
  return {
    installId: "install-1",
    name: "app.open",
    props: {},
    appVersion: "1.6.26",
    createdAt: new Date(),
    ...overrides,
  };
}

describe("phonesByVersion", () => {
  it("counts each install once, under its MOST RECENT version", () => {
    const rows: AppEventRow[] = [
      row({ installId: "a", appVersion: "1.6.24", createdAt: new Date("2026-09-01") }),
      row({ installId: "a", appVersion: "1.6.26", createdAt: new Date("2026-09-20") }),
      row({ installId: "b", appVersion: "1.6.25", createdAt: new Date("2026-09-10") }),
    ];
    const result = phonesByVersion(rows);
    expect(result).toEqual([
      { version: "1.6.26", count: 1 },
      { version: "1.6.25", count: 1 },
    ]);
  });

  it("returns nothing for an empty window", () => {
    expect(phonesByVersion([])).toEqual([]);
  });
});

describe("activeInstalls", () => {
  it("splits distinct installs by 7d vs 30d windows", () => {
    const now = Date.now();
    const rows: AppEventRow[] = [
      row({ installId: "recent", createdAt: new Date(now - 1 * 86400000) }),
      row({ installId: "mid", createdAt: new Date(now - 20 * 86400000) }),
      row({ installId: "old", createdAt: new Date(now - 90 * 86400000) }),
    ];
    const result = activeInstalls(rows);
    expect(result.d7).toBe(1);
    expect(result.d30).toBe(2);
  });
});

describe("topEvents", () => {
  it("counts events and distinct phones per name, sorted desc", () => {
    const rows: AppEventRow[] = [
      row({ installId: "a", name: "app.open" }),
      row({ installId: "b", name: "app.open" }),
      row({ installId: "a", name: "auth.signin" }),
    ];
    const result = topEvents(rows);
    expect(result[0]).toEqual({ name: "app.open", count: 2, phones: 2 });
    expect(result[1]).toEqual({ name: "auth.signin", count: 1, phones: 1 });
  });

  it("excludes events outside the window", () => {
    const rows: AppEventRow[] = [
      row({ name: "app.open", createdAt: new Date(Date.now() - 30 * 86400000) }),
    ];
    expect(topEvents(rows, 7)).toEqual([]);
  });
});

describe("errorSummary", () => {
  it("counts app.error rows and groups by message", () => {
    const rows: AppEventRow[] = [
      row({ installId: "a", name: "app.error", props: { message: "boom" } }),
      row({ installId: "b", name: "app.error", props: { message: "boom" } }),
      row({ installId: "b", name: "app.error", props: { message: "other" } }),
      row({ installId: "a", name: "app.open" }),
    ];
    const result = errorSummary(rows);
    expect(result.count).toBe(3);
    expect(result.phones).toBe(2);
    expect(result.topMessages[0]).toEqual({ message: "boom", count: 2 });
  });

  it("parses a double-encoded (stringified) props payload", () => {
    const rows: AppEventRow[] = [
      row({ name: "app.error", props: JSON.stringify({ message: "stringified boom" }) }),
    ];
    expect(errorSummary(rows).topMessages[0].message).toBe("stringified boom");
  });

  it("is honest about zero — no error rows means zero, not a fabricated top message", () => {
    const result = errorSummary([row({ name: "app.open" })]);
    expect(result.count).toBe(0);
    expect(result.topMessages).toEqual([]);
  });
});

describe("activationFunnel", () => {
  it("counts distinct installs per stage and the drop from the previous stage", () => {
    const rows: AppEventRow[] = [
      row({ installId: "a", name: "signed_up" }),
      row({ installId: "b", name: "signed_up" }),
      row({ installId: "a", name: "onboarded" }),
      row({ installId: "a", name: "cv_created" }),
    ];
    const result = activationFunnel(rows);
    expect(result[0]).toEqual({ stage: "signed_up", installs: 2, dropFromPrevious: null });
    expect(result[1]).toEqual({ stage: "onboarded", installs: 1, dropFromPrevious: 1 });
    expect(result[2]).toEqual({ stage: "profile_completed", installs: 0, dropFromPrevious: 1 });
    expect(result[3]).toEqual({ stage: "cv_created", installs: 1, dropFromPrevious: -1 });
  });

  it("is all zeros with no fabricated stages when nothing ever fired", () => {
    const result = activationFunnel([]);
    expect(result.every((p) => p.installs === 0)).toBe(true);
  });
});

describe("appAdminOverview", () => {
  it("is honest about an empty app_event table", () => {
    const o = appAdminOverview([]);
    expect(o.totalEvents).toBe(0);
    expect(o.phonesByVersion).toEqual([]);
    expect(o.active).toEqual({ d7: 0, d30: 0 });
    expect(o.errors.count).toBe(0);
  });
});
