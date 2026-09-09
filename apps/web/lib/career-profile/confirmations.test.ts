/**
 * Unit tests for the confirmation trust loop (lib/career-profile/confirmations.ts).
 */
import { describe, it, expect } from "vitest";
import { createEmptyCareerProfile, type CareerProfile } from "@/types";
import { listPendingConfirmations, resolveConfirmations, hasPendingConfirmations } from "./confirmations";

function seededProfile(): CareerProfile {
  const p = createEmptyCareerProfile();
  p.personal = { fullName: "Jane", jobTitle: "Engineer", email: "j@x.com", phone: "123", location: "Dar" };
  p.summary = "Results-driven engineer with 5 years of fintech experience";
  p.experience = [{
    id: "e1", company: "Zuri Fintech", position: "Engineer", startDate: "2022-01",
    endDate: "", current: true, description: "- Built mobile-money dashboards\n- Cut latency 55%",
  }];
  p.skills = [{ id: "s1", name: "React", level: 4 }];
  p.factMeta = {
    "summary": { source: "conversation", confidence: 0.7, status: "needs-confirmation", updatedAt: "2026-08-19T00:00:00Z" },
    "e1.description": { source: "conversation", confidence: 0.7, status: "needs-confirmation", updatedAt: "2026-08-19T00:00:00Z" },
    "e1": { source: "conversation", confidence: 0.7, status: "confirmed", updatedAt: "2026-08-19T00:00:00Z" },
    "s1": { source: "conversation", confidence: 0.7, status: "confirmed", updatedAt: "2026-08-19T00:00:00Z" },
    "personal.fullName": { source: "conversation", confidence: 0.7, status: "confirmed", updatedAt: "2026-08-19T00:00:00Z" },
  };
  return p;
}

describe("listPendingConfirmations", () => {
  it("returns summary + per-field description, never confirmed facts", () => {
    const items = listPendingConfirmations(seededProfile());
    expect(items.map((i) => i.key).sort()).toEqual(["e1.description", "summary"]);
  });

  it("labels and values are human-readable and bilingual", () => {
    const items = listPendingConfirmations(seededProfile());
    const summary = items.find((i) => i.key === "summary")!;
    expect(summary.label.en).toContain("summary");
    expect(summary.label.sw).toContain("Muhtasari");
    expect(summary.value).toBe("Results-driven engineer with 5 years of fintech experience");
    expect(summary.source).toBe("conversation");
    const desc = items.find((i) => i.key === "e1.description")!;
    expect(desc.label.en).toContain("Zuri Fintech");
    expect(desc.value).toContain("Built mobile-money dashboards");
    expect(desc.entryId).toBe("e1");
  });

  it("returns [] for null/empty profile", () => {
    expect(listPendingConfirmations(null)).toEqual([]);
    expect(listPendingConfirmations(createEmptyCareerProfile())).toEqual([]);
  });

  it("ignores keys that don't resolve to a real value", () => {
    const p = createEmptyCareerProfile();
    p.factMeta = { "ghost.description": { status: "needs-confirmation" }, "summary": { status: "needs-confirmation" } };
    const items = listPendingConfirmations(p);
    expect(items.map((i) => i.key)).toEqual(["summary"]);
  });

  it("summary sorts first, then descriptions, then entries", () => {
    const p = seededProfile();
    p.factMeta!["personal.phone"] = { source: "conversation", status: "needs-confirmation" };
    const keys = listPendingConfirmations(p).map((i) => i.key);
    expect(keys[0]).toBe("summary");
    expect(keys).toContain("personal.phone");
    expect(keys.indexOf("e1.description")).toBeLessThan(keys.indexOf("personal.phone"));
  });
});

describe("hasPendingConfirmations", () => {
  it("true when any fact awaits confirmation", () => {
    expect(hasPendingConfirmations(seededProfile())).toBe(true);
  });
  it("false when everything is confirmed", () => {
    const p = seededProfile();
    const resolved = resolveConfirmations(p, ["summary", "e1.description"], "accept");
    expect(hasPendingConfirmations(resolved)).toBe(false);
  });
});

describe("resolveConfirmations — accept", () => {
  it("stamps user-edited confirmed and keeps the value", () => {
    const out = resolveConfirmations(seededProfile(), ["summary", "e1.description"], "accept");
    expect(out.summary).toBe("Results-driven engineer with 5 years of fintech experience");
    expect(out.experience[0].description).toContain("Built mobile-money");
    expect(out.factMeta!["summary"]).toMatchObject({ source: "user-edited", confidence: 1, status: "confirmed" });
    expect(out.factMeta!["e1.description"]).toMatchObject({ source: "user-edited", confidence: 1, status: "confirmed" });
    // Unrelated facts untouched.
    expect(out.factMeta!["e1"]?.source).toBe("conversation");
    expect(out.factMeta!["s1"]?.status).toBe("confirmed");
  });

  it("does not mutate the input profile", () => {
    const p = seededProfile();
    resolveConfirmations(p, ["summary"], "accept");
    expect(p.factMeta!["summary"]?.status).toBe("needs-confirmation");
  });

  it("accepting an unknown key is a no-op", () => {
    const out = resolveConfirmations(seededProfile(), ["nope"], "accept");
    expect(out.factMeta!["summary"]?.status).toBe("needs-confirmation");
  });

  it("accept does NOT stamp keys that were never pending (key-intersection security fix)", () => {
    // An attacker who never had these facts pending must not be able to invent
    // user-edited provenance for them — only needs-confirmation keys resolve.
    const p = seededProfile();
    const out = resolveConfirmations(p, ["personal.fullName", "e1", "s1", "summary"], "accept");
    // The pending key (summary) IS confirmed…
    expect(out.factMeta!["summary"]).toMatchObject({ source: "user-edited", status: "confirmed" });
    // …but the never-pending keys keep their ORIGINAL provenance — no invented
    // user-edited stamps, no confidence upgrade.
    expect(out.factMeta!["personal.fullName"]?.source).toBe("conversation");
    expect(out.factMeta!["personal.fullName"]?.status).toBe("confirmed");
    expect(out.factMeta!["e1"]?.source).toBe("conversation");
    expect(out.factMeta!["s1"]?.source).toBe("conversation");
  });
});

describe("resolveConfirmations — reject", () => {
  it("removes the meta AND blanks the prose value", () => {
    const out = resolveConfirmations(seededProfile(), ["summary", "e1.description"], "reject");
    expect(out.summary).toBe("");
    expect(out.experience[0].description).toBe("");
    expect(out.factMeta!["summary"]).toBeUndefined();
    expect(out.factMeta!["e1.description"]).toBeUndefined();
    // Structured facts survive.
    expect(out.experience[0].company).toBe("Zuri Fintech");
    expect(out.factMeta!["e1"]?.status).toBe("confirmed");
  });

  it("rejecting a whole entry removes it from its section", () => {
    const p = seededProfile();
    p.factMeta!["e1"] = { source: "conversation", status: "needs-confirmation" };
    const out = resolveConfirmations(p, ["e1"], "reject");
    expect(out.experience).toHaveLength(0);
    expect(out.factMeta!["e1"]).toBeUndefined();
  });

  it("rejecting a personal field blanks it", () => {
    const p = seededProfile();
    p.factMeta!["personal.phone"] = { source: "conversation", status: "needs-confirmation" };
    const out = resolveConfirmations(p, ["personal.phone"], "reject");
    expect(out.personal.phone).toBe("");
    expect(out.factMeta!["personal.phone"]).toBeUndefined();
  });

  it("reject does NOT delete values for keys that were never pending (key-intersection security fix)", () => {
    // Reject must only remove AI-drafted prose the user was actually asked
    // about — never silently delete user-authored data via an arbitrary key.
    const p = seededProfile();
    const out = resolveConfirmations(p, ["personal.fullName", "s1", "e1"], "reject");
    expect(out.personal.fullName).toBe("Jane"); // value survives
    expect(out.skills).toHaveLength(1);         // entry survives
    expect(out.experience).toHaveLength(1);     // entry survives
    expect(out.factMeta!["personal.fullName"]?.source).toBe("conversation");
    expect(out.factMeta!["s1"]?.source).toBe("conversation");
  });
});
