import type { CVData } from "@sumaiya/types";
import { cvMetaLine, cvStatusLabel, cvStatusOf, editedAgo } from "./home-labels";

/**
 * Home's label rules, pinned.
 *
 * Two of these are §-level rules with a silent failure mode:
 *
 *   - the design's meta line is HOURS-relative (`saa 2 zilizopita`), not the
 *     `Leo`/`Jana` day bucket the rest of the app uses, and at a count of one
 *     the Swahili relative verb has to agree with it (`saa moja iliyopita`, never
 *     `saa 1 zilizopita` — `swahili-lint.test.ts` fails the build on the plural
 *     form).
 *   - the status chip is DERIVED from the CV, so `Rasimu` has to mean "this
 *     document is empty" and `Imekamilika` has to mean "this document passes
 *     every check" — not a stored flag nobody writes.
 */

const at = (minutesAgo: number, now = new Date("2026-10-14T12:00:00Z")) =>
  new Date(now.getTime() - minutesAgo * 60_000);
const NOW = new Date("2026-10-14T12:00:00Z");

describe("editedAgo", () => {
  it("stays singular for a count of one (Swahili agreement)", () => {
    expect(editedAgo(at(1), "sw", NOW)).toBe("dakika moja iliyopita");
    expect(editedAgo(at(60), "sw", NOW)).toBe("saa moja iliyopita");
    expect(editedAgo(at(60 * 24), "sw", NOW)).toBe("siku moja iliyopita");
    // The exact string the lint bans, asserted absent.
    expect(editedAgo(at(60), "sw", NOW)).not.toMatch(/\b1\s+zilizopita\b/);
  });

  it("reads the design's hours-relative form", () => {
    expect(editedAgo(at(0), "sw", NOW)).toBe("sasa hivi");
    expect(editedAgo(at(5), "sw", NOW)).toBe("dakika 5 zilizopita");
    expect(editedAgo(at(120), "sw", NOW)).toBe("saa 2 zilizopita");
    expect(editedAgo(at(60 * 24 * 3), "sw", NOW)).toBe("siku 3 zilizopita");
  });

  it("falls back to the date past a week", () => {
    const sw = editedAgo(at(60 * 24 * 20), "sw", NOW);
    expect(sw).not.toContain("zilizopita");
    expect(sw.length).toBeLessThan(12);
    expect(editedAgo(at(60 * 24 * 20), "en", NOW)).toMatch(/^\w{3}\s\d{1,2}$/);
  });

  it("never goes negative — a future timestamp reads as now", () => {
    expect(editedAgo(new Date(NOW.getTime() + 600_000), "sw", NOW)).toBe("sasa hivi");
    expect(editedAgo(new Date(NOW.getTime() + 600_000), "en", NOW)).toBe("just now");
  });
});

describe("cvMetaLine", () => {
  it("matches the design verbatim within the week", () => {
    expect(cvMetaLine(at(120), "sw", NOW)).toBe("CV · Imehaririwa saa 2 zilizopita");
    expect(cvMetaLine(at(120), "en", NOW)).toBe("CV · Edited 2 hours ago");
  });

  it("drops the verb and shows the date past a week", () => {
    expect(cvMetaLine(at(60 * 24 * 20), "en", NOW)).toMatch(/^CV · \w{3}\s\d{1,2}$/);
    expect(cvMetaLine(at(60 * 24 * 20), "sw", NOW)).not.toContain("Imehaririwa");
  });
});

// ── Status chip ───────────────────────────────────────────────────────────────
const FULL_DATA: CVData = {
  personalInfo: {
    fullName: "Amina Hassan Mwinyi",
    email: "amina@example.co.tz",
    phone: "+255700000000",
    location: "Dar es Salaam",
    headline: "Mkondoni",
  },
  summary:
    "Teller with four years behind a busy bank counter, strong on reconciliation, customer care and cash handling under pressure.",
  experience: [
    {
      id: "e1",
      company: "NMB Bank",
      title: "Teller",
      startDate: "2020-01",
      endDate: "2023-06",
      description: "Led a cash desk of 4 tellers and cut average queue time by 22% across the branch.",
      keyAchievements: ["Trained 6 new tellers during 2022"],
    },
  ],
  education: [{ id: "ed1", institution: "UDSM", degree: "BA", field: "Economics", graduationDate: "2019-06" }],
  skills: Array.from({ length: 8 }, (_, i) => ({
    id: `s${i}`,
    name: `Skill ${i}`,
    level: "advanced" as const,
  })),
  certifications: [],
  languages: [],
};

describe("cvStatusOf", () => {
  it("calls an empty document a draft", () => {
    expect(cvStatusOf({ data: {} as CVData })).toBe("draft");
    expect(cvStatusLabel("draft", "sw")).toBe("Rasimu");
    expect(cvStatusLabel("draft", "en")).toBe("Draft");
  });

  it("calls a CV that passes every check complete", () => {
    expect(cvStatusOf({ data: FULL_DATA })).toBe("complete");
    expect(cvStatusLabel("complete", "sw")).toBe("Imekamilika");
  });

  it("calls a CV with real content but unfinished checks ready", () => {
    const thin: CVData = { ...FULL_DATA, skills: FULL_DATA.skills.slice(0, 3) };
    expect(cvStatusOf({ data: thin })).toBe("ready");
    expect(cvStatusLabel("ready", "sw")).toBe("Tayari");
  });

  it("distinguishes all three, in both languages", () => {
    const labels = new Set([
      cvStatusLabel("draft", "sw"),
      cvStatusLabel("ready", "sw"),
      cvStatusLabel("complete", "sw"),
    ]);
    expect(labels.size).toBe(3);
    expect(cvStatusLabel("ready", "en")).toBe("Ready");
  });
});
