/**
 * Pins `TEMPLATES_WITHOUT_PHOTO` to reality — the whole registry, not a sample.
 *
 * `photo-rendering.test.ts` proves the 44 photo-capable CURATED templates really
 * draw the photo. This file answers the complementary question the QA sweep left
 * open (docs/QA-IO-MATRIX-2026-09-20.md, D7): which templates silently DROP a
 * photo the candidate uploaded, so the editor can say so before the user finds
 * out in the exported PDF.
 *
 * It is a re-derivation, not a restatement. Every template in the registry is
 * rendered with a photo set and the markup inspected, then the result is
 * compared to the declared list in `@/lib/templates/photo-support`. If either
 * side drifts — a template gains a portrait slot, or a new template ships
 * without one — this fails, so the list can never quietly go stale and the
 * notice can never lie in either direction.
 *
 * Measured when it was written (2026-09-20): 266 registered templates, 70 drop
 * the photo, 196 draw it.
 */
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TEMPLATE_COMPONENTS } from "./registry";
import type { TemplateProps } from "./registry";
import { CURATED_CV_TEMPLATE_IDS } from "@/lib/templates/curation";
import { TEMPLATES } from "@/types";
import {
  TEMPLATES_WITHOUT_PHOTO,
  photoNotPrintedNotice,
  templateShowsPhoto,
} from "@/lib/templates/photo-support";
import type { CVData } from "@/types";

// Structurally valid JPEG; nothing decodes it, only `data:image/` is inspected.
const PHOTO =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==";

function buildCv(photo?: string): CVData {
  return {
    personal: {
      fullName: "Asha Mwinyi",
      jobTitle: "Operations Manager",
      email: "asha@example.com",
      phone: "+255700000000",
      location: "Dar es Salaam, Tanzania",
      linkedin: "linkedin.com/in/asha",
      website: "asha.example.com",
      photo,
    },
    summary:
      "Operations manager with nine years across logistics and retail distribution in East Africa, focused on cost control and reliable delivery.",
    experience: [
      {
        id: "e1",
        company: "Coastal Logistics",
        position: "Operations Manager",
        location: "Dar es Salaam",
        startDate: "2020-03",
        endDate: "",
        current: true,
        description: "Ran a 40-vehicle fleet and cut delivery delays by 22%.",
      },
    ],
    education: [
      {
        id: "ed1",
        institution: "University of Dar es Salaam",
        degree: "BCom",
        field: "Business Administration",
        startDate: "2011-09",
        endDate: "2014-06",
      },
    ],
    skills: [{ id: "s1", name: "Supply chain", level: 5 }],
    projects: [],
    languages: [{ id: "l1", name: "Swahili", proficiency: "Native" }],
    certifications: [{ id: "c1", name: "CIPS Level 4", issuer: "CIPS", date: "2021-05" }],
    referees: [],
    hobbies: "Running",
  };
}

function render(id: string, photo?: string): string {
  const Component = TEMPLATE_COMPONENTS[id as keyof typeof TEMPLATE_COMPONENTS];
  if (!Component) throw new Error(`no component registered for template id: ${id}`);
  const props: TemplateProps = {
    data: buildCv(photo),
    primaryColor: "#B45309",
    fontFamily: "Inter",
    lang: "sw",
  };
  return renderToStaticMarkup(createElement(Component, props));
}

/** The templates that really drop the photo, computed from the markup. */
function measure(): { drawing: string[]; dropping: string[] } {
  const drawing: string[] = [];
  const dropping: string[] = [];
  for (const id of Object.keys(TEMPLATE_COMPONENTS)) {
    (render(id, PHOTO).includes("data:image/") ? drawing : dropping).push(id);
  }
  return { drawing, dropping };
}

describe("photo support — the declared list is what the templates actually do", () => {
  it("matches the registry exactly: nothing missing, nothing extra", () => {
    const { dropping } = measure();
    expect([...dropping].sort()).toEqual([...TEMPLATES_WITHOUT_PHOTO].sort());
  });

  it("covers the whole registry, so no template is silently unclassified", () => {
    const { drawing, dropping } = measure();
    expect(drawing.length + dropping.length).toBe(Object.keys(TEMPLATE_COMPONENTS).length);
    // 196 draw it, 70 drop it, out of 266 registered.
    expect(drawing.length).toBe(196);
    expect(dropping.length).toBe(70);
  });

  it("can only contain registered ids — a stale name would be a lie about a template that no longer exists", () => {
    const registered = new Set(Object.keys(TEMPLATE_COMPONENTS));
    const unknown = [...TEMPLATES_WITHOUT_PHOTO].filter((id) => !registered.has(id));
    expect(unknown).toEqual([]);
  });

  it("classifies every OFFERED (curated) template, and only three of them drop the photo", () => {
    const curatedDropping = CURATED_CV_TEMPLATE_IDS.filter(
      (id) => !templateShowsPhoto(id)
    );
    // grid / stripe / mono-cv: the Minimal-ATS group, where stripping the photo
    // is the design, not a defect. If a fourth curated template joins them, the
    // notice will start firing for it — which is correct — but it should be a
    // deliberate decision, so this pin makes it visible.
    expect([...curatedDropping].sort()).toEqual(["grid", "mono-cv", "stripe"]);
  });
});

describe("photo support — the notice tells the truth", () => {
  it("fires only for templates that really drop the photo", () => {
    expect(templateShowsPhoto("nakuru")).toBe(true);
    expect(templateShowsPhoto("kioo")).toBe(true);
    expect(templateShowsPhoto("grid")).toBe(false);
    expect(templateShowsPhoto("baroque-cv")).toBe(false);
  });

  it("treats an unknown or absent template as photo-capable, never as a false alarm", () => {
    // The notice must never appear because the template id was momentarily
    // undefined (first render, a legacy document) — silence is the safe default.
    expect(templateShowsPhoto(undefined)).toBe(true);
    expect(templateShowsPhoto(null)).toBe(true);
    expect(templateShowsPhoto("")).toBe(true);
    expect(templateShowsPhoto("some-template-that-never-existed")).toBe(true);
  });

  it("gives every photo-less template a display NAME, so the notice never reads as a raw id", () => {
    // The notice interpolates the template's name ("Muundo wa Grid …"). If a
    // legacy layout had no entry in the catalog the user would be told
    // "Muundo wa baroque-cv hauonyeshi picha" — technically true and useless.
    // Measured when this was written: all 70 have a name, none falls back to id.
    const byId = new Map(TEMPLATES.map((t) => [t.id as string, t.name]));
    const unnamed = [...TEMPLATES_WITHOUT_PHOTO].filter((id) => {
      const name = byId.get(id);
      return !name || name === id;
    });
    expect(unnamed).toEqual([]);
  });

  it("names the template and says the photo will not be in the file, in Swahili and English", () => {
    const sw = photoNotPrintedNotice("Grid", "sw");
    expect(sw).toContain("Grid");
    expect(sw).toMatch(/haitakuwa kwenye PDF/);

    const en = photoNotPrintedNotice("Grid", "en");
    expect(en).toContain("Grid");
    expect(en).toMatch(/will not be in the PDF/);
  });

  it("does not call the template broken — a designed photo-less layout is not a defect", () => {
    for (const lang of ["sw", "en"] as const) {
      const msg = photoNotPrintedNotice("Grid", lang);
      expect(msg).not.toMatch(/broken|imeharibika|kosa|error|hitilafu/i);
    }
  });
});
