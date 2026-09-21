/**
 * Drift guards for the mirrored web registry.
 *
 * The 218 engine templates are generated from apps/web/components/templates.
 * Generated data rots silently: a template can land with a layout the engine
 * does not implement, a config key nobody reads, or an `@accent` sentinel that
 * never got resolved — and the only symptom is a blank or broken page in a
 * exported PDF, which no type-check can see.
 *
 * These tests render every single template and assert the properties that make
 * the output usable at all. They are the reason a new web template cannot ship
 * an empty page.
 */

import { cvToHtml, ALL_TEMPLATES, CV_TEMPLATES, ENGINE_TEMPLATES, isKnownTemplate, templateLayout, templateMeta } from "../cv-html";
import { TEMPLATE_REGISTRY, BESPOKE_IDS } from "../templates/registry";
import { hasRenderer, systemFontStack, templateAccent } from "./render";
import { skillLevel, toEngineView } from "./view";
import type { CV } from "@sumaiya/types";

// A deliberately messy CV: every optional field present, both skill encodings,
// a location, a current role, and hobbies as a comma string — the shape real
// rows actually arrive in.
function cv(): CV {
  return {
    id: "cv-1",
    userId: "u-1",
    templateId: "meridian",
    title: "My CV",
    createdAt: new Date(),
    updatedAt: new Date(),
    data: {
      personalInfo: {
        fullName: "Asha Mwinyi",
        email: "asha@example.com",
        phone: "+255712345678",
        location: "Dar es Salaam, Tanzania",
        headline: "Operations Manager",
      },
      summary: "Operations manager with 9 years in logistics across East Africa.",
      experience: [
        {
          id: "e1",
          company: "Sokoni Logistics",
          title: "Operations Manager",
          startDate: "2019-03",
          endDate: "Present",
          description: "Ran a 40-person warehouse team.\nCut dispatch time 31%.",
          keyAchievements: [],
        },
        {
          id: "e2",
          company: "Pwani Freight",
          title: "Supervisor",
          startDate: "2014-01",
          endDate: "2019-02",
          description: "Covered three depots.",
          keyAchievements: [],
        },
      ],
      education: [
        {
          id: "d1",
          institution: "University of Dar es Salaam",
          degree: "BCom",
          field: "Logistics",
          graduationDate: "2013-11",
          gpa: 3.8,
        },
      ],
      skills: [
        // word form (native/shared) and numeric form (web) must both work
        { id: "s1", name: "Fleet planning", level: "expert" as unknown as never },
        { id: "s2", name: "Excel", level: 3 as unknown as never },
      ],
      certifications: [
        { id: "c1", name: "CIPS Level 4", issuer: "CIPS", issueDate: "2021-06" },
      ],
      languages: [
        { id: "l1", language: "Swahili", proficiency: "native" as unknown as never },
        { id: "l2", language: "English", proficiency: "fluent" as unknown as never },
      ],
      // fields the shared type does not model yet but the boundary preserves
      ...({
        projects: [{ id: "p1", name: "Depot merger", role: "Lead", description: "Merged two depots." }],
        referees: [{ id: "r1", name: "J. Mkapa", title: "Director", company: "Pwani", email: "j@x.co" }],
        hobbies: "Running, chess, photography",
      } as unknown as Record<string, never>),
    },
  } as CV;
}

describe("template registry sync", () => {
  it("registers 218 engine templates from the web registry", () => {
    expect(Object.keys(TEMPLATE_REGISTRY)).toHaveLength(218);
    expect(ENGINE_TEMPLATES).toHaveLength(218);
  });

  it("gives every registry entry either a renderer or an explicit bespoke marker", () => {
    const unhandled = Object.values(TEMPLATE_REGISTRY)
      .filter((tpl) => !hasRenderer(tpl))
      .map((tpl) => tpl.id);
    // Anything without a renderer must be a known, listed bespoke port.
    expect(unhandled.every((id) => BESPOKE_IDS.includes(id))).toBe(true);
  });

  it("keeps ids unique across the legacy six and the mirrored registry", () => {
    const ids = ALL_TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    // and the legacy six are still first, so existing pickers don't reorder
    expect(ALL_TEMPLATES.slice(0, CV_TEMPLATES.length).map((t) => t.id)).toEqual(
      CV_TEMPLATES.map((t) => t.id),
    );
  });

  it("never registers a template whose layout the engine cannot draw", () => {
    const layouts = new Set(["SidebarLayout", "HeaderLayout", "MinimalLayout", "TwoColumnLayout", "AccentBandLayout"]);
    const bad = Object.values(TEMPLATE_REGISTRY)
      .filter((tpl) => hasRenderer(tpl) && !layouts.has(tpl.layout))
      .map((tpl) => `${tpl.id}:${tpl.layout}`);
    expect(bad).toEqual([]);
  });
});

describe("every engine template renders a usable document", () => {
  const ids = ENGINE_TEMPLATES.map((t) => t.id);

  it.each(ids)("%s produces a non-empty, self-contained document", (id) => {
    const html = cvToHtml(cv(), { template: id, accent: "#DA4A1C" });

    // It is a document
    expect(html.startsWith("<!DOCTYPE html>")).toBe(true);
    expect(html).toContain("</html>");

    // It has content beyond the boilerplate
    expect(html.length).toBeGreaterThan(1200);

    // Printable: an A4 page with no margin surprise, and a job entry never
    // splits across a page boundary (see the pdf-export print-pagination audit).
    expect(html).toContain("@page");
    expect(html).toMatch(/size:\s*A4/);
    expect(html).toContain("break-inside:avoid");

    // No unresolved generator sentinel leaked into the output
    expect(html).not.toContain("@accent");

    // Self-contained: no external stylesheet, font or image fetch. This is the
    // invariant that lets the same string feed expo-print and the WebView.
    expect(html).not.toContain("@import");
    expect(html).not.toContain("<link");
    expect(html).not.toMatch(/url\((['"]?)https?:/);
    expect(html).not.toMatch(/<script/i);
    expect(html).not.toContain("onerror");
  });

  it.each(ids)("%s renders the CV's real content", (id) => {
    const html = cvToHtml(cv(), { template: id, accent: "#DA4A1C" });
    // The name is in every layout's header, so it must survive any template.
    expect(html).toContain("Asha Mwinyi");
  });
});

describe("skill levels normalise to the same 1-5 scale", () => {
  it("accepts the word form and the numeric form", () => {
    expect(skillLevel("expert")).toBe(5);
    expect(skillLevel("advanced")).toBe(4);
    expect(skillLevel("intermediate")).toBe(3);
    expect(skillLevel("beginner")).toBe(2);
    expect(skillLevel(5)).toBe(5);
    expect(skillLevel("4")).toBe(4);
  });

  it("never flatters an unreadable level into a full bar", () => {
    expect(skillLevel(undefined)).toBe(3);
    expect(skillLevel("")).toBe(3);
    expect(skillLevel("wizard")).toBe(3);
    expect(skillLevel(99)).toBe(5);
    expect(skillLevel(-3)).toBe(1);
  });

  it("keeps both encodings in the view", () => {
    const view = toEngineView(cv().data);
    expect(view.skills.map((s) => [s.name, s.level])).toEqual([
      ["Fleet planning", 5],
      ["Excel", 3],
    ]);
  });
});

describe("data the native type does not model still reaches the page", () => {
  it("renders projects, referees and hobbies when the row carries them", () => {
    const view = toEngineView(cv().data);
    expect(view.projects).toHaveLength(1);
    expect(view.referees).toHaveLength(1);
    expect(view.hobbies).toBe("Running, chess, photography");

    // and they survive into an actual render
    const html = cvToHtml(cv(), { template: "meridian", accent: "#DA4A1C" });
    expect(html).toContain("Depot merger");
    expect(html).toContain("J. Mkapa");
    expect(html).toContain("Running");
  });

  it("reads the web aliases too (position/employer/personal/jobTitle)", () => {
    const webShaped = {
      personal: { fullName: "Web User", jobTitle: "Designer", email: "w@x.co" },
      experience: [{ id: "1", position: "Designer", employer: "Acme", startDate: "2020-01" }],
      education: [],
      skills: [],
      languages: [],
      certifications: [],
    };
    const view = toEngineView(webShaped as unknown as CV["data"]);
    expect(view.personal.fullName).toBe("Web User");
    expect(view.personal.jobTitle).toBe("Designer");
    expect(view.experience[0].position).toBe("Designer");
    expect(view.experience[0].company).toBe("Acme");
  });
});

describe("render helpers", () => {
  it("maps web fonts onto stacks a phone actually has", () => {
    expect(systemFontStack("'Inter', sans-serif")).toContain("-apple-system");
    expect(systemFontStack("'Playfair Display', serif")).toContain("Georgia");
    expect(systemFontStack("'JetBrains Mono', monospace")).toContain("monospace");
    // never emits a font name the device would have to download
    expect(systemFontStack(undefined)).not.toMatch(/Inter|Playfair/);
  });

  it("falls back to the template's own preview colour for the accent", () => {
    const tpl = TEMPLATE_REGISTRY["meridian"];
    expect(templateAccent(tpl)).toBe(tpl.previewColor);
    expect(templateAccent(tpl, "#123456")).toBe("#123456");
    // a malformed accent does not become CSS
    expect(templateAccent(tpl, "red;evil")).toBe(tpl.previewColor);
  });

  it("knows which ids can be persisted", () => {
    expect(isKnownTemplate("classic")).toBe(true);
    expect(isKnownTemplate("meridian")).toBe(true);
    // Bespoke templates (rift, zahabu, nuru, …) have no renderer yet, so they
    // are deliberately not offered: picking one would silently export the
    // fallback template instead of the design the user chose.
    expect(isKnownTemplate("rift")).toBe(false);
    expect(isKnownTemplate("not-a-template")).toBe(false);
    expect(isKnownTemplate(null)).toBe(false);
  });

  it("keeps the bespoke list and the renderable list disjoint", () => {
    const renderable = new Set(ENGINE_TEMPLATES.map((t) => t.id));
    expect(BESPOKE_IDS.filter((id) => renderable.has(id))).toEqual([]);
  });
});

describe("TemplateHub can navigate every design", () => {
  const LAYOUTS = ["SidebarLayout", "HeaderLayout", "MinimalLayout", "TwoColumnLayout", "AccentBandLayout"];

  it("draws a truthful thumbnail shape for every mirrored template", () => {
    // A picker that fell back to the "classic" sketch for an engine template
    // would show the wrong design. Every engine id must resolve to a real one.
    const wrong = ENGINE_TEMPLATES.filter((t) => !LAYOUTS.includes(templateLayout(t.id))).map((t) => t.id);
    expect(wrong).toEqual([]);
  });

  it("still draws the bespoke sketches for the original six", () => {
    for (const id of CV_TEMPLATES.map((t) => t.id)) {
      expect(templateLayout(id)).not.toBe("");
    }
    // and the six are NOT engine templates, so they keep their own sketches
    expect(CV_TEMPLATES.some((t) => LAYOUTS.includes(templateLayout(t.id)))).toBe(false);
  });

  it("exposes a style family so the hub's filters can work", () => {
    const missing = ENGINE_TEMPLATES.filter((t) => !t.style).map((t) => t.id);
    expect(missing).toEqual([]);
    const families = Array.from(new Set(ENGINE_TEMPLATES.map((t) => String(t.style))));
    expect(families.length).toBeGreaterThan(1);
    for (const f of families) expect(typeof f).toBe("string");
  });

  it("carries both free and premium designs", () => {
    const free = ALL_TEMPLATES.filter((t) => t.tier === "free").length;
    const premium = ALL_TEMPLATES.filter((t) => t.tier === "premium").length;
    expect(free).toBeGreaterThan(0);
    // The hub is only interesting if premium is a minority but real.
    expect(premium).toBeGreaterThan(0);
    expect(free + premium).toBe(ALL_TEMPLATES.length);
  });

  it("can build the dashboard teaser: one design per layout family", () => {
    const seen = new Set<string>();
    const teaser: string[] = [];
    for (const tpl of ENGINE_TEMPLATES) {
      const family = templateLayout(tpl.id);
      if (seen.has(family)) continue;
      seen.add(family);
      teaser.push(tpl.id);
      if (teaser.length === 5) break;
    }
    expect(teaser).toHaveLength(5);
    expect(new Set(teaser.map(templateLayout)).size).toBe(5);
    // each teaser id is one the app will actually render
    for (const id of teaser) expect(isKnownTemplate(id)).toBe(true);
  });

  it("finds designs by name and by id", () => {
    const search = (q: string) =>
      ALL_TEMPLATES.filter(
        (t) =>
          t.id.includes(q) ||
          t.name.en.toLowerCase().includes(q) ||
          t.name.sw.toLowerCase().includes(q),
      );
    expect(search("meridian").map((t) => t.id)).toContain("meridian");
    expect(search("mer").length).toBeGreaterThan(0);
    expect(search("")).toHaveLength(ALL_TEMPLATES.length);
    expect(search("zzzzz")).toHaveLength(0);
  });

  it("resolves metadata for a selection", () => {
    expect(templateMeta("meridian")?.tier).toBeTruthy();
    expect(templateMeta("classic")?.name.en).toBe("Classic");
    expect(templateMeta("nope")).toBeUndefined();
  });
});
