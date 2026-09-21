import { cvToHtml, isRenderable, CV_TEMPLATES, type CvTemplateId } from "./cv-html";
import { BESPOKE_IDS } from "./templates/registry";
import type { CV, CVData } from "@sumaiya/types";

const BASE_DATA: CVData = {
  personalInfo: { fullName: "Jane Doe", email: "jane@x.com" },
  experience: [],
  education: [],
  skills: [],
  languages: [],
};

const PHOTO = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAA==";

function cv(data: Partial<CVData> = {}): CV {
  return {
    id: "c1", userId: "u1", templateId: "classic", title: "CV",
    data: { ...BASE_DATA, ...data }, createdAt: new Date(), updatedAt: new Date(),
  };
}

describe("cvToHtml — photo rendering", () => {
  it("renders no <img> when no photo is set", () => {
    expect(cvToHtml(cv())).not.toContain("<img");
  });

  it.each(CV_TEMPLATES.map((t) => t.id))("renders the photo for the %s template when set", (id: CvTemplateId) => {
    const html = cvToHtml(cv({ personalInfo: { ...BASE_DATA.personalInfo, profilePhoto: PHOTO } }), { template: id });
    expect(html).toContain(`src="${PHOTO}"`);
    expect(html).toContain('class="photo"');
  });

  it("rejects a value that doesn't look like a real image src (defense against a crafted CV)", () => {
    const html = cvToHtml(cv({ personalInfo: { ...BASE_DATA.personalInfo, profilePhoto: 'x" onerror="alert(1)' } }));
    expect(html).not.toContain("<img");
    expect(html).not.toContain("onerror");
  });

  it("accepts an https URL as well as a base64 data URI", () => {
    const html = cvToHtml(cv({ personalInfo: { ...BASE_DATA.personalInfo, profilePhoto: "https://example.com/p.jpg" } }));
    expect(html).toContain('src="https://example.com/p.jpg"');
  });
});

describe("isRenderable", () => {
  it("is true for the legacy hand-written templates", () => {
    expect(isRenderable("classic")).toBe(true);
    expect(isRenderable("modern")).toBe(true);
  });

  it("is true for an engine-backed template with a renderer", () => {
    expect(isRenderable("aberdare")).toBe(true);
  });

  it("is false for a bespoke id that has no renderer yet (cvToHtml falls back to classic for these)", () => {
    expect(BESPOKE_IDS.length).toBeGreaterThan(0);
    for (const id of BESPOKE_IDS) {
      expect(isRenderable(id)).toBe(false);
    }
  });

  it("is false for an unknown id", () => {
    expect(isRenderable("not-a-real-template")).toBe(false);
    expect(isRenderable(undefined)).toBe(false);
    expect(isRenderable(null)).toBe(false);
  });
});

describe("cvToHtml — falls back to classic for a non-renderable template id", () => {
  it("renders successfully (the classic layout) instead of throwing, matching isRenderable's false", () => {
    expect(isRenderable(BESPOKE_IDS[0])).toBe(false);
    expect(() => cvToHtml(cv(), { template: BESPOKE_IDS[0] })).not.toThrow();
    expect(cvToHtml(cv(), { template: BESPOKE_IDS[0] })).toContain("@page");
  });
});

describe("cvToHtml — print pagination", () => {
  it.each(CV_TEMPLATES.map((t) => t.id))("declares an A4 page and protects entries from splitting for the %s template", (id: CvTemplateId) => {
    const html = cvToHtml(cv(), { template: id });
    expect(html).toContain("@page");
    expect(html).toMatch(/size:\s*A4/);
    expect(html).toMatch(/\.entry\s*\{[^}]*break-inside:\s*avoid/);
  });
});
