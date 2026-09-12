/**
 * Unit tests for the unified context assembler (lib/assistant/context.ts).
 * assembleUserContext is DB-backed — exercised against the real DB via the
 * opt-in RUN_DB_VERIFY gate; the pure prompt-block renderer is fully tested.
 */
import { describe, it, expect } from "vitest";
import { contextToPromptBlock, type UnifiedContext } from "./context";
import type { Signal } from "./signals";

function ctx(overrides: Partial<UnifiedContext> = {}): UnifiedContext {
  return {
    profile: null,
    profileSummary: "",
    activeCv: null,
    applications: [],
    matchedJobs: [],
    unconfirmed: [],
    signals: [] as Signal[],
    recentActivity: [],
    ...overrides,
  };
}

describe("contextToPromptBlock", () => {
  it("renders personal + CV + applications + jobs + unconfirmed + activity", () => {
    const block = contextToPromptBlock(ctx({
      profile: {
        personal: { fullName: "Jane", jobTitle: "Engineer", email: "j@x.com", phone: "123", location: "Dar" },
        summary: "Fintech engineer", experience: [], education: [], skills: [], certifications: [],
        languages: [], projects: [], achievements: [], volunteer: [], references: [], preferences: {
          targetRoles: [], preferredLocations: [], remotePreference: "",
        },
      } as UnifiedContext["profile"],
      profileSummary: "Fintech engineer",
      activeCv: { id: "cv1", title: "My CV", data: { experience: [{}], skills: [{}] } as never },
      applications: [
        { id: "a1", title: "App1", companyName: "Zuri", jobTitle: "Engineer", status: "applied", appliedAt: "2026-08-01", createdAt: "2026-08-01", updatedAt: "2026-08-02" },
      ],
      matchedJobs: [
        { id: "j1", title: "Backend Dev", company: "NMB", location: "Dar", employmentType: "full-time", category: "tech", applicationDeadline: "2026-09-01", score: 82, reason: "matched React", postedAt: "2026-08-01T00:00:00Z", description: "" },
      ],
      unconfirmed: [
        { key: "summary", section: "summary", field: "summary", label: { en: "Professional summary", sw: "Muhtasari" }, value: "AI text", source: "conversation" },
      ],
      recentActivity: [{ type: "cv", label: "My CV", at: "2026-08-02T00:00:00Z" }],
    }));
    expect(block).toContain("Name: Jane");
    expect(block).toContain("Active CV: \"My CV\"");
    expect(block).toContain("Tracked applications (1)");
    expect(block).toContain("Top matched jobs (1)");
    expect(block).toContain("Backend Dev");
    expect(block).toContain("TENTATIVE");
    expect(block).toContain("Recent activity");
  });

  it("returns empty string for an empty context", () => {
    expect(contextToPromptBlock(ctx())).toBe("");
  });

  it("counts applications by status", () => {
    const block = contextToPromptBlock(ctx({
      applications: [
        { id: "a1", title: "A", companyName: "", jobTitle: "", status: "applied", appliedAt: null, createdAt: null, updatedAt: "2026-08-01" },
        { id: "a2", title: "B", companyName: "", jobTitle: "", status: "interviewing", appliedAt: null, createdAt: null, updatedAt: "2026-08-01" },
        { id: "a3", title: "C", companyName: "", jobTitle: "", status: "applied", appliedAt: null, createdAt: null, updatedAt: "2026-08-01" },
      ],
    }));
    expect(block).toContain("applied 2");
    expect(block).toContain("interviewing 1");
  });

  it("never dumps full job descriptions into the prompt", () => {
    const block = contextToPromptBlock(ctx({
      matchedJobs: [
        { id: "j1", title: "Backend Dev", company: "NMB", location: "Dar", employmentType: "full-time", category: "tech", applicationDeadline: null, score: 80, reason: "matched React", postedAt: "2026-08-01T00:00:00Z", description: "Requires 5 years of SECRET_JD_TEXT experience with Kubernetes and Postgres." },
      ],
    }));
    expect(block).not.toContain("SECRET_JD_TEXT");
    expect(block).not.toContain("description");
  });
});

/** One library entry, with the fields the renderer actually reads. */
function doc(over: Partial<NonNullable<UnifiedContext["documents"]>[number]> = {}) {
  return {
    id: "d1", type: "letter" as const, title: "Kurudi kazini", jobTitle: "", companyName: "",
    status: "complete", updatedAt: "2026-09-10T00:00:00Z", downloads: 0, lastDownloadedAt: null,
    ...over,
  };
}

describe("library block (documents)", () => {
  /**
   * The reason this block exists: the context used to stop at CVs and
   * applications, so Sumaiya could not see a cover letter, a letter or a card —
   * and could not ask the one question that matters after an export.
   */
  it("renders nothing when the user has no library", () => {
    expect(contextToPromptBlock(ctx())).not.toContain("library");
    expect(contextToPromptBlock(ctx({ documents: [] }))).not.toContain("library");
  });

  it("lists documents and marks the ones that have been exported", () => {
    const block = contextToPromptBlock(ctx({
      documents: [
        doc({ id: "l1", type: "letter", title: "Kurudi kazini" }),
        doc({ id: "c1", type: "cover-letter", title: "Platform Engineer", jobTitle: "Platform Engineer", lastDownloadedAt: "2026-09-11T00:00:00Z" }),
      ],
    }));
    expect(block).toContain("Their library (2)");
    expect(block).toContain('letter "Kurudi kazini"');
    expect(block).toContain('cover-letter "Platform Engineer" for Platform Engineer [exported]');
    // The un-exported letter must NOT carry the marker.
    expect(block).not.toContain('letter "Kurudi kazini" [exported]');
  });

  it("raises the follow-up with a day count, and tells her to ask only once", () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 86_400_000 - 60_000).toISOString();
    const block = contextToPromptBlock(ctx({
      documents: [
        doc({ id: "c1", type: "cover-letter", title: "Platform Engineer", jobTitle: "Ecoplanet", lastDownloadedAt: twoDaysAgo }),
        doc({ id: "l1", type: "letter", title: "Older letter", lastDownloadedAt: "2020-01-01T00:00:00Z" }),
      ],
    }));
    expect(block).toContain("LAST EXPORTED");
    // The MOST RECENT export leads — not the first document in the list.
    expect(block).toContain('LAST EXPORTED: "Platform Engineer" for Ecoplanet, 2 day(s) ago.');
    expect(block).toContain("ask ONCE");
    expect(block).toContain("Never nag");
  });

  it("says nothing about sending when there has been no export", () => {
    const block = contextToPromptBlock(ctx({ documents: [doc({ lastDownloadedAt: null })] }));
    expect(block).toContain("Their library (1)");
    expect(block).not.toContain("LAST EXPORTED");
  });

  it("caps the rendered library so a large one cannot flood the prompt", () => {
    const many = Array.from({ length: 12 }, (_, i) =>
      doc({ id: `d${i}`, title: `Doc ${i}`, updatedAt: `2026-09-${String(i + 1).padStart(2, "0")}T00:00:00Z` }),
    );
    const block = contextToPromptBlock(ctx({ documents: many }));
    // The count is honest, the list is not.
    expect(block).toContain("Their library (12)");
    // Every line is bullet-prefixed, so match on membership rather than start.
    const line = block.split("\n").find((l) => l.includes("Their library")) ?? "";
    expect(line.split("|")).toHaveLength(6);
  });
});

