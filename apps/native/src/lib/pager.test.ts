import * as fs from "fs";
import * as path from "path";
import { activeDotIndex, settlePage } from "./pager";

/**
 * The pager indicator's rest state.
 *
 * The failure this pins, in the form it was reported: "a dot between two
 * spinning rosettes" — the indicator lighting a dot where no slide is. The
 * screen used to interpolate every dot from the raw scroll offset; a device
 * capture of the last slide shows two dots fully lit at once. These cases pin
 * the two properties that make that impossible: the page is an integer, and
 * exactly one dot is derived from it.
 */
describe("settlePage", () => {
  it("rounds a fractional offset to the page it settled on", () => {
    expect(settlePage(1007.6, 1008)).toBe(1);
    expect(settlePage(1008, 1008)).toBe(1);
    expect(settlePage(1008.4, 1008)).toBe(1);
    expect(settlePage(2015.2, 1008)).toBe(2);
  });

  it("always returns an integer the dot row can compare against", () => {
    for (const raw of [0, 0.4, 503.9, 1007.6, 1008.4, 3021.9, 4032]) {
      const page = settlePage(raw, 1008);
      expect(Number.isInteger(page)).toBe(true);
    }
  });

  it("keeps the first slide at page 0 and never goes negative", () => {
    expect(settlePage(0, 1008)).toBe(0);
    expect(settlePage(0.4, 1008)).toBe(0);
    expect(settlePage(-12, 1008)).toBe(0);
  });

  it("clamps junk to page 0 instead of NaN", () => {
    for (const bad of [NaN, Infinity, -Infinity]) {
      expect(settlePage(bad, 1008)).toBe(0);
    }
    expect(settlePage(500, 0)).toBe(0);
    expect(settlePage(500, -1)).toBe(0);
  });
});

describe("activeDotIndex", () => {
  const COUNT = 4;

  it("lights exactly one dot for every page", () => {
    for (let page = 0; page < COUNT; page++) {
      const lit = Array.from({ length: COUNT }, (_, i) => i).filter((i) => i === activeDotIndex(page, COUNT));
      expect(lit).toEqual([page]);
    }
  });

  it("clamps a stale or out-of-range page instead of lighting nothing, or two", () => {
    expect(activeDotIndex(0, COUNT)).toBe(0);
    expect(activeDotIndex(9, COUNT)).toBe(3);
    expect(activeDotIndex(-3, COUNT)).toBe(0);
    expect(activeDotIndex(1.7, COUNT)).toBe(1);
  });

  it("survives junk input", () => {
    for (const bad of [NaN, Infinity, -Infinity]) {
      expect(activeDotIndex(bad, COUNT)).toBe(0);
    }
    expect(activeDotIndex(2, 0)).toBe(0);
  });
});

describe("the source guard — the dot row is not scroll-linked", () => {
  const raw = fs.readFileSync(path.join(__dirname, "..", "screens", "onboarding-screen.tsx"), "utf8");
  // Read the CODE, not the prose. The screen's own comments quote the retired
  // pattern (`interpolate(scrollX, …)`) to explain why it went, and a guard that
  // trips on its own documentation is a guard nobody keeps.
  const screen = raw.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");

  it("does not interpolate a dot from a raw scroll offset", () => {
    // The old defect: width/opacity ramped per scroll frame from a value four
    // animated nodes shared, which is how two dots could be painted active in
    // one frame. Any return of `interpolate(scrollX…` in the dot's style means
    // the class is back.
    expect(screen.includes("interpolate(")).toBe(false);
  });

  it("does not subscribe to the scroll position at all", () => {
    expect(screen.includes("useAnimatedScrollHandler")).toBe(false);
    expect(screen.includes("scrollX")).toBe(false);
    expect(screen.includes("onScroll=")).toBe(false);
  });

  it("derives the active dot from the settled page", () => {
    expect(screen).toContain("activeDotIndex(page, SLIDES.length)");
    expect(screen).toContain("settlePage(");
  });

  it("keeps the CTA and the language buttons as the labelled controls", () => {
    // Deliberately documented, not asserted: the dots are decorative and have
    // never carried an accessibility role; the Next/Start Button next to them
    // is the labelled control, and it keeps `accessibilityRole="button"` — as do
    // the two language choices on the welcome stage. Adding a role to the dots
    // now would be a new a11y surface, not a fix.
    expect(screen).toContain('accessibilityRole="button"');
  });
});
