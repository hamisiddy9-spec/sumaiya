/**
 * Guards for job-aware suggestions.
 *
 * A recommendation is a promise: "this design suits your job". Two ways that
 * promise breaks silently — a keyword table that never matches, and a style
 * family name that does not exist in the registry (so a field quietly
 * recommends nothing). Both are asserted here rather than discovered by a user
 * staring at an empty row.
 */

import { ALL_TEMPLATES, isKnownTemplate, templateMeta } from "./cv-html";
import { FIELD_STYLES, KEYWORDS, fieldLabel, inferField, suggestTemplates } from "./template-suggestions";

describe("inferField", () => {
  it("reads English job words", () => {
    expect(inferField("Warehouse supervisor")).toBe("logistics-transport");
    expect(inferField("Registered nurse")).toBe("healthcare");
    expect(inferField("Secondary school teacher")).toBe("education");
    expect(inferField("Truck driver")).toBe("driving");
    expect(inferField("Security guard")).toBe("security");
    expect(inferField("Cashier at a shop")).toBe("sales-retail");
  });

  it("reads Swahili job words", () => {
    expect(inferField("Dereva wa lori")).toBe("driving");
    expect(inferField("Mwalimu wa shule ya msingi")).toBe("education");
    expect(inferField("Muuguzi hospitalini")).toBe("healthcare");
    expect(inferField("Mpishi wa hoteli")).toBe("hospitality-food");
    expect(inferField("Mkulima wa mahindi")).toBe("agriculture");
    expect(inferField("Fundi wa umeme")).toBe("construction-trades");
  });

  it("prefers the more specific match", () => {
    // "engineer" is a keyword in two fields; the fuller phrase must win.
    expect(inferField("Software engineer")).toBe("it-software");
    expect(inferField("Civil engineer")).toBe("engineering");
  });

  it("says nothing rather than guessing", () => {
    expect(inferField("")).toBeNull();
    expect(inferField("   ")).toBeNull();
    expect(inferField(null)).toBeNull();
    expect(inferField(undefined)).toBeNull();
    expect(inferField("zzzz qqqq")).toBeNull();
  });

  it("handles mixed-language text", () => {
    expect(inferField("Nurse / Muuguzi, Muhimbili")).toBe("healthcare");
  });
});

describe("suggestTemplates", () => {
  it("recommends designs the app can actually render", () => {
    const s = suggestTemplates("Registered nurse");
    expect(s).not.toBeNull();
    for (const t of s!.templates) {
      expect(isKnownTemplate(t.id)).toBe(true);
      expect(templateMeta(t.id)).toBeTruthy();
    }
  });

  it("stays inside the field's design families", () => {
    const s = suggestTemplates("Marketing manager")!;
    const allowed = FIELD_STYLES[s.field].styles;
    for (const t of s!.templates) expect(allowed).toContain(t.style);
  });

  it("never opens with a paywall", () => {
    for (const text of ["Nurse", "Driver", "Teacher", "Accountant"]) {
      const s = suggestTemplates(text)!;
      expect(s.templates.length).toBeGreaterThan(0);
      // the first suggestion must be free — a recommendation should not be an upsell
      expect(s.templates[0].tier).toBe("free");
    }
  });

  it("is deterministic and respects the limit", () => {
    const a = suggestTemplates("Accountant", 4)!;
    const b = suggestTemplates("Accountant", 4)!;
    expect(a.templates.map((t) => t.id)).toEqual(b.templates.map((t) => t.id));
    expect(a.templates.length).toBeLessThanOrEqual(4);
  });

  it("returns null instead of a wrong recommendation", () => {
    expect(suggestTemplates("zzzz qqqq")).toBeNull();
  });

  it("gives a reason in both languages", () => {
    const s = suggestTemplates("Warehouse supervisor")!;
    expect(s.why.en.length).toBeGreaterThan(20);
    expect(s.why.sw.length).toBeGreaterThan(20);
    expect(s.why.sw).not.toBe(s.why.en);
  });
});

describe("suggestion tables cannot drift", () => {
  it("only styles that exist in the registry", () => {
    const known = new Set(ALL_TEMPLATES.map((t) => String(t.style)));
    const bad: string[] = [];
    for (const [field, rule] of Object.entries(FIELD_STYLES)) {
      for (const s of rule.styles) if (!known.has(s)) bad.push(`${field}:${s}`);
    }
    expect(bad).toEqual([]);
  });

  it("only fields that have keywords", () => {
    const missing = Object.keys(FIELD_STYLES).filter((f) => !KEYWORDS[f]);
    expect(missing).toEqual([]);
  });

  it("every field with keywords can actually produce suggestions", () => {
    // If a field's styles matched no renderable template, the user would see
    // "recommended for you" and then nothing.
    const empty: string[] = [];
    for (const field of Object.keys(KEYWORDS)) {
      const rule = FIELD_STYLES[field];
      if (!rule) continue;
      const hits = ALL_TEMPLATES.filter((t) => t.style && rule.styles.includes(t.style));
      if (!hits.length) empty.push(field);
    }
    expect(empty).toEqual([]);
  });

  it("labels every field bilingual", () => {
    for (const field of Object.keys(KEYWORDS)) {
      const en = fieldLabel(field, "en");
      const sw = fieldLabel(field, "sw");
      expect(en.length).toBeGreaterThan(0);
      expect(sw.length).toBeGreaterThan(0);
      expect(en).not.toBe(sw);
    }
  });
});
