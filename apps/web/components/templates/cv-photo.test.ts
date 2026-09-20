/**
 * Pins the geometry of the CV photo frame.
 *
 * The rendering test proves the photo reaches each template. This file proves
 * the two properties that make it CORRECT rather than merely present:
 *
 *   1. The frame is SQUARE (width === height). A non-square frame is what
 *      stretches a portrait headshot, and a stretched face is the kind of
 *      error a candidate never notices but an employer does.
 *   2. The photo is drawn with `background-size: cover`, so the square crops
 *      the photo instead of distorting it — AND with `role="img"` +
 *      `aria-label`, so a screen reader still announces whose photo it is.
 *
 * Why not `<img style="object-fit: cover">`: `object-fit` is not a contract the
 * PDF can honour. The export rasterizes the sheet with html2canvas 1.4.1, whose
 * dist contains no object-fit handling at all, so an `<img>` is drawn into its
 * element box and a non-square photo exports stretched. `background-size:
 * cover` is implemented by the same library, so the preview and the download
 * agree. The accessible NAME, though, is a property and not a mechanism: it
 * must hold for whatever element ends up drawing the photo.
 *
 * It also pins the opt-in behaviour: with no photo, CvPhoto renders NOTHING
 * (not an empty frame, not an initials disc), which is what lets a template
 * offer a photo without reserving a hole when the candidate declines.
 */
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CvPhoto, PhotoCircle, PhotoSquare } from "./template-utils";

const PHOTO = "data:image/jpeg;base64,AAAA";

function html(photo?: string, radius = 50, size = 84): string {
  return renderToStaticMarkup(
    createElement(CvPhoto, { url: photo, name: "Asha Mwinyi", size, radius })
  );
}

describe("CvPhoto", () => {
  it("renders nothing at all when there is no photo (no hole, no placeholder)", () => {
    expect(html(undefined)).toBe("");
    expect(html("")).toBe("");
  });

  it("is a fixed SQUARE frame when there is a photo", () => {
    const out = html(PHOTO, 50, 84);
    expect(out).toContain("width:84px");
    expect(out).toContain("height:84px");
    // Same number on both axes — this is the no-distortion guarantee.
    expect(/width:(\d+)px[^"]*height:\1px/.test(out)).toBe(true);
  });

  it("draws the photo with background-size:cover so the square crops, never stretches", () => {
    const out = html(PHOTO);
    expect(out).toContain("background-size:cover");
    // The photo really is what the frame draws (not a colour standing in for it).
    expect(out).toContain("data:image/jpeg;base64,AAAA");
    // …and NOT with the mechanism the PDF rasterizer ignores. html2canvas 1.4.1
    // has no object-fit support, so an <img> carrying the photo would export a
    // stretched face even though the screen looked right.
    expect(out).not.toContain("object-fit");
    expect(out).not.toMatch(/<img\b[^>]*data:image/);
  });

  it("fills the frame so no letterbox gaps appear inside it", () => {
    const out = html(PHOTO);
    expect(out).toContain("width:100%");
    expect(out).toContain("height:100%");
  });

  it("honours the per-template radius: 50 is a circle, 0 is a square, n is px", () => {
    expect(html(PHOTO, 50)).toContain("border-radius:50%");
    expect(html(PHOTO, 0)).toContain("border-radius:0");
    expect(html(PHOTO, 8)).toContain("border-radius:8px");
  });

  it("names the photo for screen readers rather than leaving it unlabelled", () => {
    // The accessible name is the candidate's own name, and it must survive the
    // move from `<img alt>` to a background image: an element with no text
    // content is announced by nothing except an explicit role + label, so
    // `role="img"` + `aria-label="Asha Mwinyi"` is what keeps "Asha Mwinyi"
    // reaching a screen reader. This assertion is about the PROPERTY, not the
    // tag — it stays live whatever element draws the photo.
    const out = html(PHOTO);
    expect(out).toContain('role="img"');
    expect(out).toContain('aria-label="Asha Mwinyi"');
  });

  it("puts the crop mechanism AND the accessible name on the SAME element", () => {
    // A name on the frame with the photo drawn by an unlabelled child would
    // still leave the image itself silent, so the two properties are pinned
    // together, on one tag.
    const out = html(PHOTO);
    const photoTag = (out.match(/<[a-z]+[^>]*background-image[^>]*>/g) ?? [])[0] ?? "";
    expect(photoTag).toContain("background-size:cover");
    expect(photoTag).toContain('role="img"');
    expect(photoTag).toContain('aria-label="Asha Mwinyi"');
  });
});

describe("PhotoCircle / PhotoSquare (the engine's always-on variants)", () => {
  it("PhotoCircle keeps a square frame and cover when a photo is present", () => {
    const out = renderToStaticMarkup(
      createElement(PhotoCircle, { url: PHOTO, name: "Asha Mwinyi", size: 80 })
    );
    expect(out).toContain("background-size:cover");
    expect(out).toContain("border-radius:50%");
    expect(/width:\s*80px[^"]*height:\s*80px/.test(out)).toBe(true);
    // Named, like CvPhoto: the initials fallback is text, the photo is not.
    expect(out).toContain('aria-label="Asha Mwinyi"');
  });

  it("PhotoCircle falls back to initials when there is no photo (its own design)", () => {
    const out = renderToStaticMarkup(createElement(PhotoCircle, { name: "Asha Mwinyi" }));
    expect(out).toContain("AM");
    expect(out).not.toContain("data:image/");
  });

  it("PhotoSquare keeps a square frame and cover when a photo is present", () => {
    const out = renderToStaticMarkup(
      createElement(PhotoSquare, { url: PHOTO, name: "Asha Mwinyi", size: 90, radius: 8 })
    );
    expect(out).toContain("background-size:cover");
    expect(out).toContain("border-radius:8px");
    expect(/width:\s*90px[^"]*height:\s*90px/.test(out)).toBe(true);
    expect(out).toContain('aria-label="Asha Mwinyi"');
  });
});
