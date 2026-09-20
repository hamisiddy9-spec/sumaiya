import { fitScaleFor, fitSheet, PAGE_W, PAGE_H, MIN_FIT_SCALE } from "./fit";
import { cvToHtml } from "../cv-html";
import type { CV } from "@sumaiya/types";

/**
 * The native preview's fit-to-frame rule, pinned.
 *
 * Every value here is a measurement from the device or from the live app,
 * because that is what the rule has to satisfy: the gallery renders a real
 * template into a WebView cell that is 137.9dp wide on a Pixel 8 Pro
 * (measured: cell 393 device px = 149dp, RealTemplateThumb width = cell - 12),
 * and the full-screen preview is 396-412dp.
 */

const cv = (): CV =>
  ({
    id: "t",
    name: "t",
    templateId: "classic",
    accent: "#DA4A1C",
    data: {
      personalInfo: { fullName: "Amina Hassan", email: "amina@example.com", phone: "+255 712 345 678", location: "Dar es Salaam, Tanzania", headline: "Storekeeper" },
      summary: "Detail-oriented storekeeper with 6+ years managing inventory.",
      experience: [{ id: "e1", title: "Senior Storekeeper", company: "Kilimanjaro Retail Ltd", startDate: "Mar 2021", endDate: "", current: true, description: "Managed a 2,000-SKU warehouse." }],
      education: [{ id: "d1", degree: "Diploma", field: "Procurement & Logistics", institution: "DIT", graduationDate: "2018" }],
      skills: [{ id: "s1", name: "Inventory control", level: 4 }],
      languages: [{ id: "l1", language: "Swahili", proficiency: "Native" }],
    },
  } as unknown as CV);

describe("fitScaleFor", () => {
  it("is frameWidth / 794 — the sheet fills the frame exactly", () => {
    expect(fitScaleFor(794)).toBe(1);
    expect(fitScaleFor(138)).toBeCloseTo(138 / 794, 10);
    expect(fitScaleFor(396)).toBeCloseTo(396 / 794, 10);
    expect(fitScaleFor(137.9)).toBeCloseTo(137.9 / 794, 10);
  });

  it("never magnifies past 1 and has no legibility floor", () => {
    expect(MIN_FIT_SCALE).toBe(0);
    expect(fitScaleFor(4000)).toBe(1);
    // A 0.28 floor would draw a 222px sheet inside a 137dp gallery cell.
    expect(fitScaleFor(137.9)).toBeLessThan(0.28);
  });

  it("degrades safely with no measurement", () => {
    expect(fitScaleFor(0)).toBe(1);
    expect(fitScaleFor(Number.NaN)).toBe(1);
    expect(fitScaleFor(-10)).toBe(1);
  });
});

describe("fitSheet", () => {
  it("names the same width in the viewport meta so both WebView modes agree", () => {
    const f = fitSheet("<p>x</p>", 138);
    // The old meta was `width=794`: a hard 794px layout in a 138px WebView.
    expect(f.viewport).toBe('<meta name="viewport" content="width=138, initial-scale=1">');
    expect(f.viewport).not.toContain("width=794");
  });

  it("scales the 794px page by exactly frame/794 and boxes it at that size", () => {
    const f = fitSheet("<p>x</p>", 138);
    expect(f.css).toContain("#cv-fit { width: 138px;");
    expect(f.css).toContain("#cv-page { width: 794px;");
    expect(f.css).toContain(`transform: scale(${138 / 794});`);
    expect(f.css).toContain("transform-origin: top left;");
    expect(f.css).toContain(`min-height: ${Math.round(PAGE_H * (138 / 794))}px;`);
  });

  it("wraps the page so nothing is left outside the frame", () => {
    const f = fitSheet("<p>PAGE</p>", 300);
    expect(f.body).toBe('<div id="cv-fit"><div id="cv-page"><p>PAGE</p></div></div>');
  });

  it("keeps A4's ratio: the box is 794:1123 at any frame width", () => {
    for (const w of [138, 300, 396, 794]) {
      const s = fitScaleFor(w);
      expect(Math.round(PAGE_H * s) / Math.round(PAGE_W * s)).toBeCloseTo(PAGE_H / PAGE_W, 2);
    }
  });
});

describe("cvToHtml fitWidth", () => {
  it("wraps a preview render so the sheet is scaled to the frame", () => {
    const html = cvToHtml(cv(), { template: "apex", fitWidth: 138 });
    expect(html).toContain('id="cv-fit"');
    expect(html).toContain('id="cv-page"');
    expect(html).toContain(`transform: scale(${138 / 794});`);
    expect(html).toContain('<meta name="viewport" content="width=138, initial-scale=1">');
  });

  it("wraps the legacy six too (classic), not just the engine templates", () => {
    const html = cvToHtml(cv(), { template: "classic", fitWidth: 396 });
    expect(html).toContain('id="cv-fit"');
    expect(html).toContain(`transform: scale(${396 / 794});`);
  });

  it("leaves the print/PDF path byte-identical — no wrapper without fitWidth", () => {
    const printHtml = cvToHtml(cv(), { template: "apex" });
    expect(printHtml).toContain('<meta name="viewport" content="width=794">');
    expect(printHtml).not.toContain("cv-fit");
    expect(printHtml).not.toContain("transform: scale(");
    // Same page, same data, just no fit → the export cannot change shape.
    expect(cvToHtml(cv(), { template: "classic" })).not.toContain("cv-fit");
  });

  it("keeps the legacy page margin INSIDE the frame (padding must not shift it)", () => {
    // classic/minimal/… carry their page margin as `body { padding: 40px 44px }`.
    // The frame is a child of that body: before this, the padding pushed the
    // frame to left 44 on a 138px frame (box right 182) and clipped the sheet.
    const html = cvToHtml(cv(), { template: "classic", fitWidth: 138 });
    expect(html).toContain("body { padding: 0 !important; }");
    expect(html).toContain("#cv-page { padding: 40px 44px; }");
    // the page keeps its own margin, so the printed sheet's geometry is unchanged
    const print = cvToHtml(cv(), { template: "classic" });
    expect(print).toContain("padding: 40px 44px;");
    expect(print).not.toContain("body { padding: 0 !important; }");
  });

  it("treats a zero/absent width as 'not a preview'", () => {
    expect(cvToHtml(cv(), { template: "apex", fitWidth: 0 })).not.toContain("cv-fit");
    expect(cvToHtml(cv(), { template: "classic", fitWidth: 0 })).not.toContain("cv-fit");
  });
});
