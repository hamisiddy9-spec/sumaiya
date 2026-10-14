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
 *
 * The guard used to scan only the three welcoming-path files, so two later
 * screens slipped invented wells past CI: `first-run-screen.tsx` (a 116 / r36 /
 * mark-62 box) and `error-boundary.tsx` (a 76 / r24 / mark-40 box). Both are
 * now registry entries, both carry none of the retired numbers, and the whole
 * tree is swept for a retired mark scale, so a third cannot appear unnoticed.
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

  /** Every .tsx under `screens/` or `components/`, tests excluded. */
  const tsxSources = (): string[] => {
    const walk = (dir: string): string[] => {
      const out: string[] = [];
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) out.push(...walk(full));
        else if (entry.name.endsWith(".tsx") && !entry.name.endsWith(".test.tsx")) out.push(full);
      }
      return out;
    };
    return [...walk(path.join(root, "screens")), ...walk(path.join(root, "components"))].map(
      (f) => path.relative(root, f).split(path.sep).join("/"),
    );
  };

  // Every source file that draws the house mark in a well: the three
  // welcoming-path surfaces, the shared component itself, and the two screens
  // that were inventing their own container. Each must take its geometry from
  // `MARK_WELL` / `MarkWell`, and none may carry a retired size.
  const WELL_FILES = [
    "screens/splash-screen.tsx",
    "screens/onboarding-screen.tsx",
    "components/portal-transition.tsx",
    "components/mark-well.tsx",
    "screens/first-run-screen.tsx",
    "components/error-boundary.tsx",
    // The sign-in brand block carried its own 92/r28/mark-48 well until 2026-10-14;
    // the tree-walk could not see it because it drew a plain View, not `MarkWell`.
    "screens/auth/sign-in-screen.tsx",
  ];

  // The sizes and containers the flow used to carry, AND the two invented wells
  // the old guard missed (first-run 116 / r36 / mark 62; error-boundary 76 /
  // r24 / mark 40). Any of these reappearing means a second container is back.
  const RETIRED = [
    { name: "splash container 96/r26", re: /borderRadius:\s*26\b/ },
    { name: "splash mark 52", re: /SumaiyaMark\s+size=\{52\}/ },
    { name: "welcome/slide mark 78", re: /SumaiyaMark\s+size=\{78\}/ },
    { name: "slide container 148/r44", re: /borderRadius:\s*44\b/ },
    { name: "portal mark 64", re: /SumaiyaMark\s+size=\{64\}/ },
    { name: "portal box 80", re: /width:\s*80,\s*\n\s*height:\s*80/ },
    // first-run-screen.tsx — a locally-invented 116 / r36 / mark-62 well.
    { name: "first-run well 116/r36", re: /width:\s*116,\s*height:\s*116,\s*borderRadius:\s*36/ },
    { name: "first-run well radius 36", re: /borderRadius:\s*36\b/ },
    { name: "first-run mark 62", re: /SumaiyaMark\s+size=\{62\}/ },
    // sign-in-screen.tsx — its own 92 / r28 / mark-48 well.
    { name: "sign-in well 92/r28", re: /width:\s*92,\s*height:\s*92,\s*borderRadius:\s*28/ },
    { name: "sign-in mark 48", re: /SumaiyaMark\s+size=\{48\}/ },
    // error-boundary.tsx — a locally-invented 76 / r24 / mark-40 well.
    { name: "error-boundary well 76/r24", re: /width:\s*76,\s*height:\s*76,\s*borderRadius:\s*24/ },
    { name: "error-boundary well radius 24", re: /borderRadius:\s*24\b/ },
    { name: "error-boundary mark 40", re: /SumaiyaMark\s+size=\{40\}/ },
  ];

  it.each(WELL_FILES)("%s carries none of the retired well geometry", (rel) => {
    const src = read(rel);
    for (const r of RETIRED) {
      expect({ file: rel, pattern: r.name, present: r.re.test(src) }).toEqual({
        file: rel,
        pattern: r.name,
        present: false,
      });
    }
  });

  it.each(WELL_FILES)("%s takes its mark scale from the shared well", (rel) => {
    const src = read(rel);
    expect(src).toMatch(/MARK_WELL|MarkWell/);
    // the shared tint helper is the only way a well gets its background
    expect(src.includes('accent + "14"')).toBe(false);
  });

  it("registers EVERY screen/component that draws the shared well", () => {
    // Close the hole for good: any file that draws the well is found by walking
    // the tree, not by a hand-maintained list — so a new surface that starts
    // using `MarkWell`/`MARK_WELL` without registering here fails immediately
    // (and so does a registered file that quietly stops being a well file).
    const draws = tsxSources().filter((rel) => /MarkWell|MARK_WELL/.test(read(rel)));
    expect(draws.length).toBeGreaterThan(0);
    for (const rel of draws) {
      expect(WELL_FILES).toContain(rel);
    }
  });

  it("sweeps the whole tree for a retired mark scale, not just the listed files", () => {
    // A file that draws the mark at one of the retired sizes is a second
    // container treatment wherever it lives. This catches the *next* invented
    // well even if nobody remembers to add the file to WELL_FILES.
    const RETIRED_MARK_SCALES = new Set([40, 48, 52, 62, 64, 78]);
    const offenders: string[] = [];
    for (const rel of tsxSources()) {
      const src = read(rel);
      for (const hit of src.match(/SumaiyaMark\s+size=\{(\d+)\}/g) ?? []) {
        const n = Number(hit.replace(/\D+/g, ""));
        if (RETIRED_MARK_SCALES.has(n)) offenders.push(`${rel} → ${hit}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("the retired patterns actually match the geometry they ban — the guard is not vacuous", () => {
    // The two invented wells, written exactly as they were before the fix. If a
    // pattern here stopped matching, CI would go quiet without the geometry
    // being any better — so the ban is proved against the real shape.
    const beforeFirstRun = `style={{ width: 116, height: 116, borderRadius: 36, backgroundColor: c.accent + "14" }}
<SumaiyaMark size={62} state="idle" color={c.accent} />`;
    const beforeBoundary = `width: 76,
height: 76,
borderRadius: 24,
<SumaiyaMark size={40} state="static" color="#FFFFFF" />`;
    const caught = (src: string) => RETIRED.filter((r) => r.re.test(src)).map((r) => r.name);
    expect(caught(beforeFirstRun)).toEqual(
      expect.arrayContaining(["first-run well 116/r36", "first-run well radius 36", "first-run mark 62"]),
    );
    expect(caught(beforeBoundary)).toEqual(
      expect.arrayContaining(["error-boundary well 76/r24", "error-boundary well radius 24", "error-boundary mark 40"]),
    );
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

/**
 * §3 (blades) and §4 (bounded loops), asserted against the source. These live
 * beside the well guard because they guard the same object — the house mark —
 * and, like it, are read from the code so the promise is evidence rather than a
 * reading of the diff.
 */
describe("the mark's motion — §3 blades, §4 bounded loops", () => {
  const root = path.join(__dirname, "..", "..");
  const read = (rel: string) =>
    fs
      .readFileSync(path.join(root, rel), "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/(^|[^:])\/\/[^\n]*/g, "$1");

  it("draws every blade at 1.0 / 0.9 / 0.8 — the mark and the art alike", () => {
    for (const rel of ["components/sumaiya-mark.tsx", "components/onboarding-art.tsx"]) {
      const src = read(rel);
      // the retired opacities; the three blades must not drift apart again
      expect(src).not.toMatch(/0\.94|0\.88/);
      expect(src).toMatch(/BLADE_OPACITY/);
    }
    // one source of the three numbers
    expect(read("components/sumaiya-mark.tsx")).toMatch(/BLADE_OPACITY\s*=\s*\[1,\s*0\.9,\s*0\.8\]/);
  });

  it("bounds every beat — no unbounded withRepeat in the motion layer", () => {
    // WCAG 2.2.2 (Level A): an auto-running loop that repeats forever is a
    // failure. `withRepeat(…, -1)` is the shape that fails, so it is banned by
    // name wherever the mark or a beat is animated. (This list is the files
    // that own the mark's and the surfaces' motion; the chat rail's own beat is
    // bounded by `CHAT_STEP_BEAT_CYCLES` and covered by `chat-motion.test.ts`.)
    const MOTION_FILES = [
      "components/sumaiya-mark.tsx",
      "components/ui/skeleton.tsx",
      "components/onboarding-art.tsx",
      "components/chat/chat-motion.ts",
      "screens/app/scan-processing-screen.tsx",
    ];
    for (const rel of MOTION_FILES) {
      const src = read(rel);
      expect({ file: rel, unbounded: /withRepeat\(\s*[^;]*?,\s*-1\b/.test(src) }).toEqual({
        file: rel,
        unbounded: false,
      });
    }
  });
});
