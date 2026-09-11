import { cvToHtml, CV_TEMPLATES, type CvTemplateId } from "./cv-html";
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
