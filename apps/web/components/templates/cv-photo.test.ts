/**
 * Pins the geometry of the CV photo frame.
 *
 * The rendering test proves the photo reaches each template. This file proves
 * the two properties that make it CORRECT rather than merely present:
 *
 *   1. The frame is SQUARE (width === height). A non-square frame is what
 *      stretches a portrait headshot, and a stretched face is the kind of
 *      error a candidate never notices but an employer does.
 *   2. The image is drawn with object-fit:cover, so the square crops the photo
 *      instead of distorting it.
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

  it("draws the image with object-fit:cover so the square crops, never stretches", () => {
    const out = html(PHOTO);
    expect(out).toContain("object-fit:cover");
    expect(out).toContain('src="data:image/jpeg;base64,AAAA"');
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

  it("names the image for screen readers rather than leaving it unlabelled", () => {
    expect(html(PHOTO)).toContain('alt="Asha Mwinyi"');
  });
});

describe("PhotoCircle / PhotoSquare (the engine's always-on variants)", () => {
  it("PhotoCircle keeps a square frame and cover when a photo is present", () => {
    const out = renderToStaticMarkup(
      createElement(PhotoCircle, { url: PHOTO, name: "Asha Mwinyi", size: 80 })
    );
    expect(out).toContain("object-fit:cover");
    expect(out).toContain("border-radius:50%");
    expect(/width:\s*80px[^"]*height:\s*80px/.test(out)).toBe(true);
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
    expect(out).toContain("object-fit:cover");
    expect(out).toContain("border-radius:8px");
    expect(/width:\s*90px[^"]*height:\s*90px/.test(out)).toBe(true);
  });
});
