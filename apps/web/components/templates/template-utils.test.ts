import { describe, it, expect } from "vitest";
import { fmtDate, dateRange, visibleSkills } from "./format";

describe("fmtDate", () => {
  it("returns empty for empty input", () => {
    expect(fmtDate("")).toBe("");
  });

  it("formats year-month", () => {
    expect(fmtDate("2020-05")).toBe("May 2020");
  });

  it("handles year-only", () => {
    expect(fmtDate("2016")).toBe("2016");
  });
});

describe("dateRange (render-hardening)", () => {
  it("renders start – Present for a current job with a start date", () => {
    expect(dateRange("2020-05", "", true)).toBe("May 2020 – Present");
  });

  it("does NOT emit a leading dash when start is missing but current is set", () => {
    // Bug: dateRange("", "", true) used to return " – Present"
    expect(dateRange("", "", true)).toBe("Present");
    expect(dateRange("", "", true)).not.toMatch(/^[\s–-]+/);
  });

  it("returns start only when end is missing and not current", () => {
    expect(dateRange("2019-01", "", false)).toBe("Jan 2019");
  });

  it("returns end only when start is missing and not current", () => {
    expect(dateRange("", "2021-08", false)).toBe("Aug 2021");
  });

  it("returns empty when both dates are missing", () => {
    expect(dateRange("", "", false)).toBe("");
  });

  it("renders full range", () => {
    expect(dateRange("2017-08", "2020-04", false)).toBe("Aug 2017 – Apr 2020");
  });
});

describe("visibleSkills (render-hardening)", () => {
  it("drops blank and whitespace-only names", () => {
    const skills = [
      { id: "a", name: "React", level: 4 as const },
      { id: "b", name: "   ", level: 3 as const },
      { id: "c", name: "", level: 2 as const },
      { id: "d", name: "Node.js", level: 5 as const },
    ];
    const out = visibleSkills(skills);
    expect(out.map((s) => s.name)).toEqual(["React", "Node.js"]);
  });

  it("keeps all skills when every name is present", () => {
    const skills = [
      { id: "a", name: "React", level: 4 as const },
      { id: "b", name: "PostgreSQL", level: 3 as const },
    ];
    expect(visibleSkills(skills)).toHaveLength(2);
  });

  it("returns empty array for empty input", () => {
    expect(visibleSkills([])).toEqual([]);
  });

  it("guards against undefined name", () => {
    const skills = [{ id: "a", name: undefined, level: 3 as const }];
    expect(visibleSkills(skills)).toEqual([]);
  });
});
