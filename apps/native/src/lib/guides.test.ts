import { GUIDES, getGuide } from "./guides";

/**
 * The guides' own contract.
 *
 * `category` is the eyebrow the design prints above a guide's title. It is a
 * required field rather than an optional one on purpose: an eyebrow that renders
 * empty is worse than no eyebrow, and eight guides with eight subjects are the
 * reason it is not a constant string in the screen.
 */
describe("every guide is complete enough to render", () => {
  it("has a category in both languages, with no blanks", () => {
    for (const g of GUIDES) {
      expect(g.category.en.trim().length).toBeGreaterThan(0);
      expect(g.category.sw.trim().length).toBeGreaterThan(0);
    }
  });

  it("has a title, a summary, a read time and at least one section", () => {
    for (const g of GUIDES) {
      expect(g.title.en.trim()).not.toBe("");
      expect(g.title.sw.trim()).not.toBe("");
      expect(g.summary.en.trim()).not.toBe("");
      expect(g.summary.sw.trim()).not.toBe("");
      expect(g.minutes).toBeGreaterThan(0);
      expect(g.sections.length).toBeGreaterThan(0);
    }
  });

  it("keeps ids unique, so a link can never open the wrong guide", () => {
    const ids = GUIDES.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("uses categories that actually distinguish the guides", () => {
    // If every guide shared one shelf label, the eyebrow would be decoration
    // and a constant string in the screen would be the honest implementation.
    // This is the assertion that stops the field decaying into that.
    const shelves = new Set(GUIDES.map((g) => g.category.en));
    expect(shelves.size).toBeGreaterThan(3);
  });

  it("resolves a guide by id, and nothing for an unknown one", () => {
    expect(getGuide(GUIDES[0].id)?.title.en).toBe(GUIDES[0].title.en);
    expect(getGuide("no-such-guide")).toBeUndefined();
  });
});
