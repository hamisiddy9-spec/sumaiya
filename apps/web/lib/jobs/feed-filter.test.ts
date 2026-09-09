import { describe, it, expect } from "vitest";
import {
  filterJobs, sortJobs, groupByRecency, topLocations, topCategories,
  isRemoteLocation, REMOTE_LOCATION, DEFAULT_FILTERS,
  type FeedJob,
} from "./feed-filter";

function job(partial: Partial<FeedJob>): FeedJob {
  return {
    id: "j1", title: "Software Engineer", company: "Acme", location: "Dar es Salaam",
    category: "Engineering", employmentType: "Full-time", description: "",
    applyUrl: "https://example.com/apply", status: "live", featured: false,
    applicationDeadline: null, sourceName: "Remotive", createdAt: new Date().toISOString(),
    matchScore: 80, missing: [],
    ...partial,
  };
}

describe("isRemoteLocation", () => {
  it("detects remote-ish location strings", () => {
    expect(isRemoteLocation("Remote")).toBe(true);
    expect(isRemoteLocation("Remote (Global)")).toBe(true);
    expect(isRemoteLocation("Worldwide")).toBe(true);
    expect(isRemoteLocation("Anywhere in the world")).toBe(true);
  });

  it("does not flag concrete cities", () => {
    expect(isRemoteLocation("Dar es Salaam")).toBe(false);
    expect(isRemoteLocation("Nairobi, Kenya")).toBe(false);
  });
});

describe("filterJobs", () => {
  const jobs = [
    job({ id: "a", category: "Engineering", location: "Dar es Salaam", matchScore: 90, createdAt: new Date(Date.now() - 2 * 86_400_000).toISOString() }),
    job({ id: "b", category: "Engineering", location: "Remote", matchScore: 60, createdAt: new Date(Date.now() - 10 * 86_400_000).toISOString() }),
    job({ id: "c", category: "Design", location: "Dar es Salaam", matchScore: 40, createdAt: new Date(Date.now() - 60 * 86_400_000).toISOString() }),
  ];

  it("returns everything with default filters", () => {
    expect(filterJobs(jobs, DEFAULT_FILTERS).map((j) => j.id)).toEqual(["a", "b", "c"]);
  });

  it("filters by category", () => {
    expect(filterJobs(jobs, { ...DEFAULT_FILTERS, category: "Engineering" }).map((j) => j.id)).toEqual(["a", "b"]);
  });

  it("filters by exact location", () => {
    expect(filterJobs(jobs, { ...DEFAULT_FILTERS, location: "Dar es Salaam" }).map((j) => j.id)).toEqual(["a", "c"]);
  });

  it("filters by remote-only", () => {
    expect(filterJobs(jobs, { ...DEFAULT_FILTERS, location: REMOTE_LOCATION }).map((j) => j.id)).toEqual(["b"]);
  });

  it("filters by min match score", () => {
    expect(filterJobs(jobs, { ...DEFAULT_FILTERS, minScore: "70" as const }).map((j) => j.id)).toEqual(["a"]);
  });

  it("filters by recency (7d)", () => {
    expect(filterJobs(jobs, { ...DEFAULT_FILTERS, recency: "7d" as const }).map((j) => j.id)).toEqual(["a"]);
  });

  it("combines filters (AND)", () => {
    const f = { ...DEFAULT_FILTERS, category: "Engineering", minScore: "50" as const, recency: "14d" as const };
    expect(filterJobs(jobs, f).map((j) => j.id)).toEqual(["a", "b"]);
  });

  it("searches title/company/location/category", () => {
    expect(filterJobs(jobs, { ...DEFAULT_FILTERS, query: "design" }).map((j) => j.id)).toEqual(["c"]);
    expect(filterJobs(jobs, { ...DEFAULT_FILTERS, query: "acme" }).map((j) => j.id)).toEqual(["a", "b", "c"]);
    expect(filterJobs(jobs, { ...DEFAULT_FILTERS, query: "dar es salaam" }).map((j) => j.id)).toEqual(["a", "c"]);
  });

  it("returns empty for impossible filters (no dead-end crash)", () => {
    expect(filterJobs(jobs, { ...DEFAULT_FILTERS, minScore: "90", category: "Design" })).toEqual([]);
  });
});

describe("sortJobs", () => {
  const jobs = [
    job({ id: "old", matchScore: 30, createdAt: "2026-01-01T00:00:00Z", applicationDeadline: "2026-12-01T00:00:00Z" }),
    job({ id: "new", matchScore: 95, createdAt: "2026-08-01T00:00:00Z", applicationDeadline: "2026-09-01T00:00:00Z" }),
    job({ id: "mid", matchScore: 60, createdAt: "2026-06-01T00:00:00Z", applicationDeadline: null }),
  ];

  it("sorts newest first by default", () => {
    expect(sortJobs(jobs, "newest").map((j) => j.id)).toEqual(["new", "mid", "old"]);
  });

  it("sorts by match score descending", () => {
    expect(sortJobs(jobs, "match").map((j) => j.id)).toEqual(["new", "mid", "old"]);
  });

  it("sorts by closing deadline ascending (no-deadline last)", () => {
    expect(sortJobs(jobs, "closing").map((j) => j.id)).toEqual(["new", "old", "mid"]);
  });
});

describe("groupByRecency", () => {
  const now = new Date("2026-08-10T12:00:00Z").getTime();
  const jobs = [
    job({ id: "today", createdAt: "2026-08-10T08:00:00Z" }),
    job({ id: "week", createdAt: "2026-08-06T08:00:00Z" }),
    job({ id: "older", createdAt: "2026-07-01T08:00:00Z" }),
  ];

  it("groups into today / thisWeek / earlier", () => {
    const groups = groupByRecency(jobs, now);
    expect(groups.map((g) => g.key)).toEqual(["today", "thisWeek", "earlier"]);
    expect(groups[0].jobs.map((j) => j.id)).toEqual(["today"]);
    expect(groups[1].jobs.map((j) => j.id)).toEqual(["week"]);
    expect(groups[2].jobs.map((j) => j.id)).toEqual(["older"]);
  });

  it("drops empty groups", () => {
    const groups = groupByRecency([jobs[0]], now);
    expect(groups).toHaveLength(1);
    expect(groups[0].key).toBe("today");
  });
});

describe("topLocations / topCategories", () => {
  const jobs = [
    job({ id: "a", location: "Remote", category: "Engineering" }),
    job({ id: "b", location: "Remote", category: "Engineering" }),
    job({ id: "c", location: "Dar es Salaam", category: "Design" }),
    job({ id: "d", location: "Nairobi", category: "Design" }),
    job({ id: "e", location: "Dar es Salaam", category: "Marketing" }),
  ];

  it("puts Remote first when present, then most common locations", () => {
    expect(topLocations(jobs)).toEqual([REMOTE_LOCATION, "Dar es Salaam", "Nairobi"]);
  });

  it("ranks categories by frequency", () => {
    expect(topCategories(jobs)).toEqual(["Design", "Engineering", "Marketing"]);
  });
});
