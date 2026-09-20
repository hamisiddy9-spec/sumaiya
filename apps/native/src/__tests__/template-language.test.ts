/**
 * Guards that the template gallery's design thumbnails render a sample CV in
 * the reader's own language. The defect: RealTemplateThumb hardcoded
 * `lang: "en"`, so all 224 design thumbnails and the full-screen preview
 * showed an English sample CV to a Swahili user — on the exact surface where
 * the user chooses what their own CV will look like.
 *
 * The language must be passed in, never defaulted: a default is how 224
 * designs showed the wrong language in the first place.
 */
import fs from "fs";
import path from "path";

const THUMB = fs.readFileSync(
  path.join(__dirname, "..", "components", "cv", "real-template-thumb.tsx"),
  "utf8",
);
const GALLERY = fs.readFileSync(
  path.join(__dirname, "..", "components", "cv", "template-gallery.tsx"),
  "utf8",
);

describe("real-template-thumb.tsx — no hardcoded language", () => {
  it("contains no lang: \"en\" default (the `lang: \"en\" | \"sw\"` prop TYPE is not this)", () => {
    expect(THUMB).not.toMatch(/lang:\s*"en"(?!\s*\|)/);
  });

  it("calls sampleCv(lang) and requires a lang prop", () => {
    expect(THUMB).toContain("sampleCv(lang)");
    expect(THUMB).toMatch(/lang:\s*"en"\s*\|\s*"sw"/);
  });
});

describe("template-gallery.tsx — every RealTemplateThumb passes lang", () => {
  it("every call site passes lang={lang}", () => {
    const calls = [...GALLERY.matchAll(/<RealTemplateThumb\b/g)];
    expect(calls.length).toBe(2);

    for (const call of calls) {
      const tagStart = call.index!;
      const tagEnd = GALLERY.indexOf("/>", tagStart);
      const tag = GALLERY.slice(tagStart, tagEnd);
      expect(tag).toContain("lang={lang}");
    }
  });
});
