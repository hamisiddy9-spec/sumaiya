/**
 * The provider's HTML path must carry the photo — and must refuse anything that
 * is not an image data URL.
 *
 * Two real failure modes are pinned here:
 *
 *   1a. SILENT DROP. `buildTemplateHtml` emitted name/email/phone/location and
 *       never read `personalInfo.photo`, so a document rendered through the
 *       provider came out photoless while the editor preview showed the photo.
 *   1b. INJECTION. The value lands inside an attribute in a string-templated
 *       document, so a non-image value (or one carrying a quote) must never be
 *       emitted at all. Only `data:image/...;base64,` is accepted.
 *
 * The absence case carries equal weight: a CV with no photo must render exactly
 * the header it rendered before — no empty frame, no reserved gap.
 */
import { describe, expect, it } from "vitest";
import { nativeTemplateProvider } from "./native-provider";
import type { DocumentContent } from "./schema";

const PHOTO = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAA==";

function doc(photo?: string): DocumentContent {
  return {
    personalInfo: {
      fullName: "Asha Mwinyi",
      email: "asha@example.com",
      phone: "+255700000000",
      location: "Dar es Salaam",
      headline: "Operations Manager",
      ...(photo === undefined ? {} : { photo }),
    },
    summary: "Operations manager.",
    experience: [],
    education: [],
    skills: [],
  } as unknown as DocumentContent;
}

async function html(photo?: string): Promise<string> {
  const rendered = await nativeTemplateProvider.renderDocument("nuru", doc(photo));
  return rendered.content;
}

describe("native provider HTML: the CV photo", () => {
  it("includes the photo when the document has one", async () => {
    const out = await html(PHOTO);
    expect(out).toContain(PHOTO);
    expect(out).toMatch(/<img[^>]+class="photo"/);
  });

  it("draws it in a fixed square with object-fit:cover, so it cannot distort", async () => {
    const out = await html(PHOTO);
    expect(out).toContain("object-fit: cover");
    // .photo is defined once, width == height.
    expect(/\.photo\s*\{[^}]*width:\s*(\d+)px[^}]*height:\s*\1px/.test(out)).toBe(true);
  });

  it("keeps the name and contact details alongside the photo", async () => {
    const out = await html(PHOTO);
    expect(out).toContain("Asha Mwinyi");
    expect(out).toContain("asha@example.com");
    expect(out).toContain("Dar es Salaam");
  });

  it("omits the photo entirely when there is none — no empty frame, no reserved gap", async () => {
    const out = await html(undefined);
    expect(out).not.toContain("data:image/");
    expect(out).not.toContain('class="photo"');
    // The header is still there and still named.
    expect(out).toContain("Asha Mwinyi");
    expect(out).toContain('class="header"');
  });

  it("renders an empty photo string as no photo", async () => {
    const out = await html("");
    expect(out).not.toContain('class="photo"');
  });

  it("refuses a non-image value instead of putting it in an attribute", async () => {
    for (const bad of [
      "javascript:alert(1)",
      "https://evil.example.com/x.jpg",
      "data:text/html;base64,PHNjcmlwdD4=",
      'data:image/jpeg;base64,x" onerror="alert(1)',
    ]) {
      const out = await html(bad);
      expect(out, `must not emit: ${bad}`).not.toContain("alert(1)");
      expect(out).not.toContain('class="photo"');
      expect(out).not.toContain("evil.example.com");
    }
  });

  it("escapes the name it uses in the photo's alt text", async () => {
    const d = doc(PHOTO) as unknown as { personalInfo: Record<string, unknown> };
    d.personalInfo.fullName = 'Bob "><script>alert(1)</script>';
    const rendered = await nativeTemplateProvider.renderDocument("nuru", d as unknown as DocumentContent);
    expect(rendered.content).not.toContain("<script>");
  });
});
