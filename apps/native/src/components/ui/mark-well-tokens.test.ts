import * as fs from "fs";
import * as path from "path";
import {
  MARK_WELL,
  WELL_RATIO_MAX,
  WELL_RATIO_MIN,
  wellBackground,
  wellMarkRatio,
  wellRadiusRatio,
} from "./mark-well-tokens";

/**
 * The container invariant for the welcoming path.
 *
 * The defect this pins: the launch → language → slides flow rendered the mark
 * at four different sizes inside three different containers, so a viewer read
 * three separate effects instead of one. The numbers now live in
 * `mark-well-tokens.ts`, and these cases assert both halves — that the geometry
 * is well-formed, and that no screen has gone back to writing its own.
 */

describe("the well's geometry", () => {
  it("is one size, one radius, one mark scale", () => {
    expect(Object.keys(MARK_WELL).sort()).toEqual(["mark", "radius", "size", "tint"]);
    expect(MARK_WELL.size).toBe(128);
    expect(MARK_WELL.radius).toBe(40);
    expect(MARK_WELL.mark).toBe(72);
    for (const v of [MARK_WELL.size, MARK_WELL.radius, MARK_WELL.mark]) {
      expect(Number.isFinite(v)).toBe(true);
      expect(v).toBeGreaterThan(0);
      expect(Number.isInteger(v)).toBe(true);
    }
  });

  it("keeps the design system's well ratio (r/size ≈ 0.30)", () => {
    // _mockup.css: .well--72 r22, .well--44 r12, .well--38 r11, .well--30 r9
    expect(wellRadiusRatio(72, 22)).toBeCloseTo(0.3056, 3);
    expect(wellRadiusRatio(44, 12)).toBeCloseTo(0.2727, 3);
    expect(wellRadiusRatio()).toBeGreaterThanOrEqual(WELL_RATIO_MIN);
    expect(wellRadiusRatio()).toBeLessThanOrEqual(WELL_RATIO_MAX);
  });

  it("is a well, not a full-bleed mark", () => {
    expect(wellMarkRatio()).toBeGreaterThan(0.5);
    expect(wellMarkRatio()).toBeLessThan(0.6);
  });

  it("tints the container with the accent, never a hard-coded colour", () => {
    expect(MARK_WELL.tint).toMatch(/^[0-9a-f]{2}$/);
    expect(wellBackground("#DA4A1C")).toBe("#DA4A1C14");
    // the house --ember-tint (#FBE9E1) is this same tint over the cream page
    expect(wellBackground("#DA4A1C")).not.toBe("#FBE9E1");
  });
});

describe("the source guard — no screen writes its own well", () => {
  const root = path.join(__dirname, "..", "..");
  // Read the CODE, not the prose: the screens' comments cite the retired sizes
  // ("the mark at 52 in a solid 96 square") to explain what changed.
  const read = (rel: string) =>
    fs
      .readFileSync(path.join(root, rel), "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/(^|[^:])\/\/[^\n]*/g, "$1");

  // The four sizes and three containers the flow used to carry, as they were
  // written in the source. Any of these reappearing in a welcoming-path screen
  // means a second container treatment is back.
  const RETIRED = [
    { name: "splash container 96/r26", re: /borderRadius:\s*26\b/ },
    { name: "splash mark 52", re: /SumaiyaMark\s+size=\{52\}/ },
    { name: "welcome/slide mark 78", re: /SumaiyaMark\s+size=\{78\}/ },
    { name: "slide container 148/r44", re: /borderRadius:\s*44\b/ },
    { name: "portal mark 64", re: /SumaiyaMark\s+size=\{64\}/ },
    { name: "portal box 80", re: /width:\s*80,\s*\n\s*height:\s*80/ },
  ];

  const SCREENS = [
    "screens/splash-screen.tsx",
    "screens/onboarding-screen.tsx",
    "components/portal-transition.tsx",
  ];

  it.each(SCREENS)("%s carries none of the retired well geometry", (rel) => {
    const src = read(rel);
    for (const r of RETIRED) {
      expect({ file: rel, pattern: r.name, present: r.re.test(src) }).toEqual({
        file: rel,
        pattern: r.name,
        present: false,
      });
    }
  });

  it.each(SCREENS)("%s takes its mark scale from the shared well", (rel) => {
    const src = read(rel);
    expect(src).toMatch(/MARK_WELL|MarkWell/);
    // the shared tint helper is the only way a well gets its background
    expect(src.includes('accent + "14"')).toBe(false);
  });

  it("uses the well on the launch, the language stage and every slide", () => {
    expect(read("screens/splash-screen.tsx")).toContain("<MarkWell");
    expect(read("screens/onboarding-screen.tsx")).toContain("<MarkWell");
  });

  it("keeps the mark out of the slides' scroll-linked transform", () => {
    // The slides used to scale/translate their visual from the scroll offset
    // (0.6 → 1.0), so the mark's on-screen size changed as you swiped. The
    // standard bans scroll-driven reveals on a phone.
    const src = read("screens/onboarding-screen.tsx");
    expect(src).not.toMatch(/interpolate\(scrollX\.value,\s*input,\s*\[0\.6/);
  });
});
