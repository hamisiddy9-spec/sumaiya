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
        { id: "j1", title: "Backend Dev", company: "NMB", location: "Dar", employmentType: "full-time", category: "tech", applicationDeadline: "2026-09-01", score: 82, reason: "matched React", postedAt: "2026-08-01T00:00:00Z" },
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
        { id: "j1", title: "Backend Dev", company: "NMB", location: "Dar", employmentType: "full-time", category: "tech", applicationDeadline: null, score: 80, reason: "matched React", postedAt: "2026-08-01T00:00:00Z" },
      ],
    }));
    expect(block).not.toContain("description");
  });
});
