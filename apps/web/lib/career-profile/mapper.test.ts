import { describe, it, expect } from "vitest";
import {
  cvDataToProfile,
  profileToCvData,
  mergeProfileFromCv,
  pickMostCompleteCv,
  cvCompleteness,
  parseCvLoose,
  profileSectionCounts,
  stampProfileAllFacts,
} from "@/lib/career-profile/mapper";
import {
  createEmptyCareerProfile,
  createEmptyCVData,
  type CareerProfile,
  type CVData,
} from "@/types";

function cv(partial: Partial<CVData>): CVData {
  return { ...createEmptyCVData(), ...partial };
}

function profile(partial: Partial<CareerProfile>): CareerProfile {
  return { ...createEmptyCareerProfile(), ...partial };
}

// ─── cvCompleteness / pickMostCompleteCv ────────────────────────────────────

describe("cvCompleteness", () => {
  it("scores empty CV as 0", () => {
    expect(cvCompleteness(createEmptyCVData())).toBe(0);
  });

  it("counts facts across sections", () => {
    const data = cv({
      personal: { fullName: "A", jobTitle: "Eng", email: "a@b.c", phone: "1", location: "X" },
      summary: "sum",
      experience: [{ id: "1", company: "Co", position: "Role", startDate: "", endDate: "", current: false, description: "" }],
      skills: [{ id: "1", name: "TS", level: 4 }, { id: "2", name: "SQL", level: 3 }],
    });
    // 2+1+1+1 (personal) + 2 (summary) + 1 (exp) + 2 (skills)
    expect(cvCompleteness(data)).toBe(10);
  });
});

describe("pickMostCompleteCv", () => {
  it("returns null when there are no CVs", () => {
    expect(pickMostCompleteCv([])).toBeNull();
  });

  it("picks the most complete CV", () => {
    const thin = { id: "thin", data: cv({ summary: "" }), updatedAt: new Date("2026-01-01") };
    const rich = {
      id: "rich",
      data: cv({
        personal: { fullName: "A", jobTitle: "B", email: "c@d.e", phone: "1", location: "X" },
        summary: "s",
        experience: [{ id: "1", company: "Co", position: "Role", startDate: "", endDate: "", current: false, description: "" }],
        skills: [{ id: "1", name: "TS", level: 4 }],
      }),
      updatedAt: new Date("2026-02-01"),
    };
    expect(pickMostCompleteCv([thin, rich])?.id).toBe("rich");
  });

  it("ties break toward the newest", () => {
    const a = { id: "a", data: cv({ personal: { fullName: "A", jobTitle: "", email: "", phone: "", location: "" } }), updatedAt: new Date("2026-01-01") };
    const b = { id: "b", data: cv({ personal: { fullName: "B", jobTitle: "", email: "", phone: "", location: "" } }), updatedAt: new Date("2026-03-01") };
    expect(pickMostCompleteCv([a, b])?.id).toBe("b");
  });

  it("tolerates a completely empty/malformed data blob", () => {
    const junk = { id: "j", data: { nope: true }, updatedAt: null };
    expect(pickMostCompleteCv([junk])?.id).toBe("j");
  });
});

// ─── cvDataToProfile ────────────────────────────────────────────────────────

describe("cvDataToProfile", () => {
  it("maps every CV section into the profile", () => {
    const data = cv({
      personal: { fullName: "Jane", jobTitle: "Dev", email: "j@x.com", phone: "123", location: "Dar" },
      summary: "Full-stack dev",
      experience: [{ id: "e1", company: "Acme", position: "Eng", startDate: "2020-01", endDate: "", current: true, description: "Built things" }],
      education: [{ id: "d1", institution: "UDSM", degree: "BSc", field: "CS", startDate: "2016", endDate: "2020" }],
      skills: [{ id: "s1", name: "TypeScript", level: 4 }],
      certifications: [{ id: "c1", name: "AWS", issuer: "Amazon", date: "2024" }],
      languages: [{ id: "l1", name: "Swahili", proficiency: "Native" }],
      projects: [{ id: "p1", name: "App", description: "Cool app" }],
      referees: [{ id: "r1", name: "Bob", title: "Mgr", company: "Acme", email: "", phone: "" }],
    });
    const p = cvDataToProfile(data);
    expect(p.personal.fullName).toBe("Jane");
    expect(p.experience).toHaveLength(1);
    expect(p.experience[0].company).toBe("Acme");
    expect(p.education[0].institution).toBe("UDSM");
    expect(p.skills[0].name).toBe("TypeScript");
    expect(p.certifications[0].name).toBe("AWS");
    expect(p.languages[0].name).toBe("Swahili");
    expect(p.projects[0].name).toBe("App");
    expect(p.references[0].name).toBe("Bob");
  });

  it("leaves profile-only sections empty", () => {
    const p = cvDataToProfile(cv({}));
    expect(p.achievements).toEqual([]);
    expect(p.volunteer).toEqual([]);
    expect(p.preferences.targetRoles).toEqual([]);
  });

  it("stamps backfilled entries with provenance seam (Task 2)", () => {
    const data = cv({
      skills: [{ id: "s1", name: "React", level: 4 }],
    });
    const p = cvDataToProfile(data);
    expect(p.factMeta?.["s1"]?.source).toBe("backfill");
    expect(p.factMeta?.["s1"]?.status).toBe("confirmed");
  });
});

// ─── profileToCvData ────────────────────────────────────────────────────────

describe("profileToCvData", () => {
  it("returns empty CV when profile is null", () => {
    const out = profileToCvData(null);
    expect(out.personal.fullName).toBe("");
    expect(out.skills).toEqual([]);
  });

  it("derives a full CV from the profile", () => {
    const p = profile({
      personal: { fullName: "Jane", jobTitle: "Dev", email: "j@x.com", phone: "1", location: "Dar" },
      summary: "s",
      experience: [{ id: "e1", company: "Acme", position: "Eng", startDate: "2020-01", endDate: "", current: true, description: "x" }],
      skills: [{ id: "s1", name: "Go", level: 3 }],
      references: [{ id: "r1", name: "Bob", title: "Mgr", company: "Acme", email: "", phone: "" }],
    });
    const out = profileToCvData(p);
    expect(out.personal.fullName).toBe("Jane");
    expect(out.experience[0].company).toBe("Acme");
    expect(out.skills[0].name).toBe("Go");
    // references → referees
    expect(out.referees[0].name).toBe("Bob");
  });

  it("never blanks a section the profile doesn't cover (base CV wins)", () => {
    const p = profile({ personal: { fullName: "", jobTitle: "", email: "", phone: "", location: "" } });
    const base = cv({ hobbies: "reading", skills: [{ id: "s9", name: "Keep", level: 4 }] });
    const out = profileToCvData(p, base);
    expect(out.hobbies).toBe("reading");
    expect(out.skills[0].name).toBe("Keep");
  });

  it("does not copy empty profile sections into a fresh CV", () => {
    const p = profile({ skills: [] });
    const out = profileToCvData(p);
    expect(out.skills).toEqual([]);
  });
});

// ─── mergeProfileFromCv (non-destructive backfill) ──────────────────────────

describe("mergeProfileFromCv", () => {
  const richCv = cv({
    personal: { fullName: "Jane", jobTitle: "Dev", email: "j@x.com", phone: "123", location: "Dar" },
    summary: "Full-stack dev with 5 years",
    experience: [{ id: "e1", company: "Acme", position: "Eng", startDate: "2020-01", endDate: "", current: true, description: "Built things" }],
    education: [{ id: "d1", institution: "UDSM", degree: "BSc", field: "CS", startDate: "2016", endDate: "2020" }],
    skills: [{ id: "s1", name: "TypeScript", level: 4 }],
  });

  it("fills an empty profile entirely", () => {
    const { profile: out, filled } = mergeProfileFromCv(null, richCv);
    expect(out.personal.fullName).toBe("Jane");
    expect(out.summary).toContain("5 years");
    expect(out.experience).toHaveLength(1);
    expect(out.skills).toHaveLength(1);
    expect(filled).toEqual(expect.arrayContaining(["experience", "education", "skills"]));
  });

  it("never overwrites existing facts; appends new entries (provenance-aware)", () => {
    const existing = profile({
      personal: { fullName: "Jane", jobTitle: "Dev", email: "j@x.com", phone: "123", location: "Arusha" },
      summary: "My own summary",
      skills: [{ id: "k1", name: "Python", level: 5 }],
    });
    const { profile: out, filled } = mergeProfileFromCv(existing, richCv, { source: "cv:cv1", confidence: 1 });
    expect(out.summary).toBe("My own summary"); // kept — user-authored (no provenance)
    expect(out.skills[0].name).toBe("Python"); // kept — never clobbered
    expect(out.personal.location).toBe("Arusha"); // kept — no provenance = user-authored
    // New facts from the CV are APPENDED (that's the spine: CV enriches the
    // profile) — existing entries stay, the CV's unmatched entry joins.
    expect(out.skills.map((s) => s.name)).toEqual(["Python", "TypeScript"]);
    expect(out.experience).toHaveLength(1);
    expect(filled).toContain("experience");
    expect(filled).toContain("skills");
    // Provenance: everything the CV contributed is stamped cv:<id> — appended
    // entries and scalar fields that were actually filled.
    expect(out.factMeta!["s1"]?.source).toBe("cv:cv1");
    expect(out.factMeta!["personal.location"]?.source).toBeUndefined(); // not overwritten → not re-stamped
  });

  it("iron rule: user-edited facts are never overwritten by derived ones", () => {
    const existing = profile({
      personal: { fullName: "Jane", jobTitle: "Dev", email: "j@x.com", phone: "123", location: "Arusha" },
      summary: "My own summary",
      factMeta: {
        "personal.location": { source: "user-edited", status: "confirmed", confidence: 1, updatedAt: "2026-01-01T00:00:00Z" },
        "summary": { source: "user-edited", status: "confirmed", confidence: 1, updatedAt: "2026-01-01T00:00:00Z" },
      },
    });
    const { profile: out } = mergeProfileFromCv(existing, richCv, { source: "cv:cv1", confidence: 1 });
    expect(out.personal.location).toBe("Arusha");
    expect(out.summary).toBe("My own summary");
    expect(out.factMeta!["personal.location"]?.source).toBe("user-edited"); // stamp survives
  });

  it("cv: source supersedes legacy backfill facts, conversation supersedes cv:", () => {
    const legacy = profile({
      personal: { fullName: "Jane", jobTitle: "Dev", email: "j@x.com", phone: "123", location: "Arusha" },
      factMeta: { "personal.location": { source: "backfill", status: "confirmed", confidence: 0.8, updatedAt: "2026-01-01T00:00:00Z" } },
    });
    const afterCv = mergeProfileFromCv(legacy, richCv, { source: "cv:cv1", confidence: 1, now: "2026-02-01T00:00:00Z" }).profile;
    expect(afterCv.personal.location).toBe("Dar");
    expect(afterCv.factMeta!["personal.location"]?.source).toBe("cv:cv1");

    // A different location from a conversation (higher rank) supersedes the cv: fact.
    const convCv = cv({ personal: { ...richCv.personal, location: "Mwanza" } });
    const afterConv = mergeProfileFromCv(afterCv, convCv, { source: "conversation", confidence: 0.7, now: "2026-03-01T00:00:00Z" }).profile;
    expect(afterConv.personal.location).toBe("Mwanza");
    expect(afterConv.factMeta!["personal.location"]?.source).toBe("conversation");
  });

  it("is idempotent — merging twice changes nothing the second time", () => {
    const first = mergeProfileFromCv(null, richCv).profile;
    const second = mergeProfileFromCv(first, richCv);
    expect(second.filled).toEqual([]);
    expect(second.profile.experience).toHaveLength(1);
  });

  it("handles incomplete CV data without crashing", () => {
    const { profile: out } = mergeProfileFromCv(null, { data: "junk" } as unknown as CVData);
    expect(out.experience).toEqual([]);
    expect(out.personal.fullName).toBe("");
  });

  it("tolerates a long CV (many entries) without loss", () => {
    const longCv = cv({
      skills: Array.from({ length: 500 }, (_, i) => ({ id: `s${i}`, name: `Skill ${i}`, level: 3 as const })),
      experience: Array.from({ length: 100 }, (_, i) => ({
        id: `e${i}`, company: `Co ${i}`, position: "Eng", startDate: "2020-01", endDate: "", current: false, description: "x",
      })),
    });
    const { profile: out } = mergeProfileFromCv(null, longCv);
    expect(out.skills).toHaveLength(500);
    expect(out.experience).toHaveLength(100);
  });

  // ── content dedup (fast-follow: overlapping CVs, different ids) ────────────

  it("dedups skills by content: same 'React' from two CVs (different ids) → once", () => {
    const cvA = cv({ skills: [{ id: "a1", name: "React", level: 4 }] });
    const cvB = cv({ skills: [{ id: "b9", name: "React", level: 5 }] });
    const first = mergeProfileFromCv(null, cvA, { source: "cv:cvA", confidence: 1 }).profile;
    const { profile: out } = mergeProfileFromCv(first, cvB, { source: "cv:cvB", confidence: 1 });
    expect(out.skills).toHaveLength(1);
    expect(out.skills[0].name).toBe("React");
    // Field-by-field merge: same-rank cv: source, newer wins → level upgraded.
    expect(out.skills[0].level).toBe(5);
    expect(out.skills[0].id).toBe("a1"); // existing id kept, no duplicate copy
    expect(out.factMeta!["a1"]?.source).toBe("cv:cvB"); // re-stamped by the newer merge
    expect(out.factMeta!["b9"]).toBeUndefined(); // incoming id never stamped (not appended)
  });

  it("dedups languages by content name (case/whitespace-insensitive)", () => {
    const cvA = cv({ languages: [{ id: "l1", name: "Swahili", proficiency: "Native" }] });
    const cvB = cv({ languages: [{ id: "l2", name: "  swahili ", proficiency: "Fluent" }] });
    const first = mergeProfileFromCv(null, cvA, { source: "cv:cvA", confidence: 1 }).profile;
    const { profile: out } = mergeProfileFromCv(first, cvB, { source: "cv:cvB", confidence: 1 });
    expect(out.languages).toHaveLength(1);
    expect(out.languages[0].name).toBe("Swahili");
    expect(out.languages[0].proficiency).toBe("Fluent"); // same-rank newer wins
  });

  it("dedups certifications by name+issuer, not name alone", () => {
    const cvA = cv({ certifications: [{ id: "c1", name: "AWS", issuer: "Amazon", date: "2023" }] });
    const cvB = cv({ certifications: [{ id: "c2", name: "AWS", issuer: "Amazon", date: "2024" }] });
    const cvC = cv({ certifications: [{ id: "c3", name: "AWS", issuer: "Simplilearn", date: "2022" }] });
    const first = mergeProfileFromCv(null, cvA, { source: "cv:cvA", confidence: 1 }).profile;
    const second = mergeProfileFromCv(first, cvB, { source: "cv:cvB", confidence: 1 }).profile;
    expect(second.certifications).toHaveLength(1); // same name+issuer → merged
    const third = mergeProfileFromCv(second, cvC, { source: "cv:cvC", confidence: 1 }).profile;
    expect(third.certifications).toHaveLength(2); // different issuer → appended
    expect(third.certifications.map((c) => c.issuer).sort()).toEqual(["Amazon", "Simplilearn"]);
  });

  it("dedups experience by company+position+startDate", () => {
    const cvA = cv({
      experience: [{ id: "e1", company: "Acme", position: "Engineer", startDate: "2020-01", endDate: "", current: true, description: "v1" }],
    });
    const cvB = cv({
      experience: [{ id: "e2", company: "Acme", position: "Engineer", startDate: "2020-01", endDate: "", current: true, description: "v2" }],
    });
    const first = mergeProfileFromCv(null, cvA, { source: "cv:cvA", confidence: 1 }).profile;
    const { profile: out } = mergeProfileFromCv(first, cvB, { source: "cv:cvB", confidence: 1 });
    expect(out.experience).toHaveLength(1);
    expect(out.experience[0].description).toBe("v2"); // field merged (same-rank newer wins)
  });

  it("keeps canonical casing for experience identity fields ('Acme Corp' survives 'acme corp')", () => {
    const cvA = cv({
      experience: [{ id: "e1", company: "Acme Corp", position: "Senior Engineer", startDate: "2020-01", endDate: "", current: true, description: "v1" }],
    });
    const cvB = cv({
      experience: [{ id: "e2", company: "acme corp", position: "senior engineer", startDate: "2020-01", endDate: "", current: true, description: "v2" }],
    });
    const first = mergeProfileFromCv(null, cvA, { source: "cv:cvA", confidence: 1 }).profile;
    const { profile: out } = mergeProfileFromCv(first, cvB, { source: "cv:cvB", confidence: 1 });
    expect(out.experience).toHaveLength(1); // deduped
    expect(out.experience[0].company).toBe("Acme Corp"); // canonical casing kept
    expect(out.experience[0].position).toBe("Senior Engineer"); // canonical casing kept
    expect(out.experience[0].description).toBe("v2"); // non-identity field still merged
  });

  it("keeps canonical casing for certification identity fields (name+issuer survive case variants)", () => {
    const cvA = cv({
      certifications: [{ id: "c1", name: "AWS Certified Solutions Architect", issuer: "Amazon Web Services", date: "2023" }],
    });
    const cvB = cv({
      certifications: [{ id: "c2", name: "aws certified solutions architect", issuer: "amazon web services", date: "2024" }],
    });
    const first = mergeProfileFromCv(null, cvA, { source: "cv:cvA", confidence: 1 }).profile;
    const { profile: out } = mergeProfileFromCv(first, cvB, { source: "cv:cvB", confidence: 1 });
    expect(out.certifications).toHaveLength(1); // deduped
    expect(out.certifications[0].name).toBe("AWS Certified Solutions Architect"); // canonical kept
    expect(out.certifications[0].issuer).toBe("Amazon Web Services"); // canonical kept
    expect(out.certifications[0].date).toBe("2024"); // non-identity field merged (newer wins)
  });

  it("does NOT dedup experience when startDate differs (different fact)", () => {
    const cvA = cv({
      experience: [{ id: "e1", company: "Acme", position: "Engineer", startDate: "2020-01", endDate: "", current: true, description: "" }],
    });
    const cvB = cv({
      experience: [{ id: "e2", company: "Acme", position: "Engineer", startDate: "2021-06", endDate: "", current: true, description: "" }],
    });
    const first = mergeProfileFromCv(null, cvA, { source: "cv:cvA", confidence: 1 }).profile;
    const { profile: out } = mergeProfileFromCv(first, cvB, { source: "cv:cvB", confidence: 1 });
    expect(out.experience).toHaveLength(2); // genuinely different roles
  });

  it("content dedup respects the iron rule: user-edited skill is never re-stamped", () => {
    const existing = profile({
      skills: [{ id: "k1", name: "React", level: 4 }],
      factMeta: { k1: { source: "user-edited", status: "confirmed", confidence: 1, updatedAt: "2026-01-01T00:00:00Z" } },
    });
    const cvB = cv({ skills: [{ id: "b9", name: "React", level: 2 }] });
    const { profile: out } = mergeProfileFromCv(existing, cvB, { source: "cv:cvB", confidence: 1 });
    expect(out.skills).toHaveLength(1);
    expect(out.skills[0].level).toBe(4); // user-edited level survives
    expect(out.factMeta!["k1"]?.source).toBe("user-edited"); // stamp survives
    expect(out.factMeta!["b9"]).toBeUndefined();
  });

  it("dedups WITHIN one CV (two same-name skills, different ids → one)", () => {
    const dupCv = cv({
      skills: [
        { id: "s1", name: "React", level: 4 },
        { id: "s2", name: "react", level: 3 },
      ],
    });
    const { profile: out } = mergeProfileFromCv(null, dupCv, { source: "cv:cv1", confidence: 1 });
    expect(out.skills).toHaveLength(1);
    expect(out.skills[0].name).toBe("React");
  });

  it("content-match path stamps AI prose on the EXISTING entry key (exId, not the incoming id)", () => {
    // Reviewer bounce (#223 v2): on a content dedup the incoming entry may match
    // a DIFFERENT existing entry (different nanoid id) — the per-field prose
    // stamp must land on the existing entry's key, never the incoming id's.
    const cvA = cv({
      experience: [{ id: "e1", company: "Zuri Fintech", position: "Engineer", startDate: "2022-01", endDate: "", current: true, description: "Original bullets" }],
    });
    const cvB = cv({
      experience: [{ id: "e2", company: "Zuri Fintech", position: "Engineer", startDate: "2022-01", endDate: "", current: true, description: "AI rewritten bullets" }],
    });
    const first = mergeProfileFromCv(null, cvA, { source: "cv:cvA", confidence: 1 }).profile;
    const { profile: out } = mergeProfileFromCv(first, cvB, { source: "conversation", confidence: 0.7, aiDerived: true });
    expect(out.experience).toHaveLength(1); // content match → merged into e1
    expect(out.experience[0].id).toBe("e1");
    expect(out.experience[0].description).toBe("AI rewritten bullets"); // conversation (2) > cv (1)
    expect(out.factMeta!["e1.description"]?.status).toBe("needs-confirmation"); // stamped on EXISTING key
    expect(out.factMeta!["e1.description"]?.source).toBe("conversation");
    expect(out.factMeta!["e2.description"]).toBeUndefined(); // incoming id never stamped
    expect(out.factMeta!["e2"]).toBeUndefined();
    expect(out.factMeta!["e1"]?.status).toBe("confirmed"); // structured entry fact stays confirmed
  });

  // ── summary-provenance honesty (fast-follow: AI prose ≠ confirmed) ─────────

  it("stamps AI-derived summary needs-confirmation while structured facts stay confirmed", () => {
    const aiCv = cv({
      personal: { fullName: "Jane", jobTitle: "Dev", email: "j@x.com", phone: "123", location: "Dar" },
      summary: "Results-driven engineer with 5 years of fintech experience...",
      skills: [{ id: "s1", name: "React", level: 4 }],
    });
    const { profile: out } = mergeProfileFromCv(null, aiCv, { source: "conversation", confidence: 0.7, aiDerived: true });
    expect(out.factMeta!["summary"]?.status).toBe("needs-confirmation");
    expect(out.factMeta!["summary"]?.source).toBe("conversation");
    // Structured facts stay confirmed (the user stated them in the chat).
    expect(out.factMeta!["personal.fullName"]?.status).toBe("confirmed");
    expect(out.factMeta!["s1"]?.status).toBe("confirmed");
  });

  it("stamps AI-derived experience description needs-confirmation but keeps the entry confirmed", () => {
    const aiCv = cv({
      experience: [{
        id: "e1", company: "Zuri Fintech", position: "Engineer", startDate: "2022-01",
        endDate: "", current: true, description: "- Built mobile money dashboards\n- Cut latency 55%",
      }],
    });
    const { profile: out } = mergeProfileFromCv(null, aiCv, { source: "conversation", confidence: 0.7, aiDerived: true });
    // The entry itself (employer, dates) is a structured fact → confirmed.
    expect(out.factMeta!["e1"]?.status).toBe("confirmed");
    // But the AI-written bullets are prose → needs-confirmation, keyed per-field.
    expect(out.factMeta!["e1.description"]?.status).toBe("needs-confirmation");
    expect(out.factMeta!["e1.description"]?.source).toBe("conversation");
  });

  it("stamps CV-sourced prose needs-confirmation even without aiDerived (guest-migration/editor-save path)", () => {
    const userCv = cv({
      summary: "My own summary",
      experience: [{
        id: "e1", company: "Acme", position: "Eng", startDate: "2020-01",
        endDate: "", current: true, description: "My own description",
      }],
    });
    const { profile: out } = mergeProfileFromCv(null, userCv, { source: "cv:cv1", confidence: 1 });
    // Prose keyed on the SOURCE: any cv:-sourced summary/description enters the
    // trust loop — the caller can't accidentally bypass it by omitting aiDerived.
    expect(out.factMeta!["summary"]?.status).toBe("needs-confirmation");
    expect(out.factMeta!["e1.description"]?.status).toBe("needs-confirmation");
    expect(out.factMeta!["e1.description"]?.source).toBe("cv:cv1");
    // Structured facts stay confirmed.
    expect(out.factMeta!["e1"]?.status).toBe("confirmed");
  });

  it("user-authored provenance keeps prose confirmed", () => {
    const userCv = cv({
      summary: "My own summary",
      experience: [{
        id: "e1", company: "Acme", position: "Eng", startDate: "2020-01",
        endDate: "", current: true, description: "My own description",
      }],
    });
    const { profile: out } = mergeProfileFromCv(null, userCv, { source: "user-edited", confidence: 1 });
    expect(out.factMeta!["summary"]?.status).toBe("confirmed");
    expect(out.factMeta!["e1"]?.status).toBe("confirmed");
    expect(out.factMeta!["e1.description"]).toBeUndefined(); // user-authored → no per-field prose stamp
  });

  it("user saving the profile resolves needs-confirmation → confirmed (preview→confirm)", () => {
    const aiCv = cv({
      summary: "AI summary",
      experience: [{
        id: "e1", company: "Zuri", position: "Eng", startDate: "2022-01",
        endDate: "", current: true, description: "AI bullets",
      }],
    });
    const seeded = mergeProfileFromCv(null, aiCv, { source: "conversation", confidence: 0.7, aiDerived: true }).profile;
    expect(seeded.factMeta!["summary"]?.status).toBe("needs-confirmation");
    expect(seeded.factMeta!["e1.description"]?.status).toBe("needs-confirmation");

    const saved = stampProfileAllFacts(seeded, { source: "user-edited", confidence: 1 });
    expect(saved.factMeta!["summary"]?.status).toBe("confirmed");
    expect(saved.factMeta!["summary"]?.source).toBe("user-edited");
    expect(saved.factMeta!["e1.description"]?.status).toBe("confirmed");
    expect(saved.factMeta!["e1.description"]?.source).toBe("user-edited");
  });
});

// ─── parseCvLoose ───────────────────────────────────────────────────────────

describe("parseCvLoose", () => {
  it("handles null/undefined/junk", () => {
    expect(parseCvLoose(null).personal.fullName).toBe("");
    expect(parseCvLoose("text").skills).toEqual([]);
    expect(parseCvLoose({ personal: { fullName: 123 } }).personal.fullName).toBe("");
  });

  it("parses a valid CVData", () => {
    const data = cv({ summary: "hi", hobbies: "reading" });
    const out = parseCvLoose(data);
    expect(out.summary).toBe("hi");
    expect(out.hobbies).toBe("reading");
  });
});

// ─── profileSectionCounts ───────────────────────────────────────────────────

describe("profileSectionCounts", () => {
  it("returns only non-empty sections", () => {
    const p = profile({ skills: [{ id: "s1", name: "X", level: 3 }], experience: [] });
    const counts = profileSectionCounts(p);
    expect(counts).toEqual([{ key: "skills", count: 1 }]);
  });

  it("returns [] for null profile", () => {
    expect(profileSectionCounts(null)).toEqual([]);
  });
});
