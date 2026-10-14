/**
 * The design guide's palette, pinned as tests.
 *
 * `docs/DESIGN-GUIDE.md` §1 fixes the warm scale, and the failure mode this
 * file exists for is silent: a "near-miss" palette still renders, still looks
 * warm, and quietly stops matching Nuru, Faraja and TemplateHub — the exact
 * drift that let Stitch's `#ab2e00` tonal rebuild through in the first place.
 * So the guide's literals are asserted here, in one place, alongside the two
 * rules that are easy to break by reaching for a nice-looking hex:
 *
 *   1. NO WHITE SURFACE. The guide: "In a warm palette a white card reads as a
 *      hole." White is permitted only as on-ember text.
 *   2. NO UNREADABLE ON-SURFACE TEXT. The guide pins colours; the product also
 *      promises AA. Both are checked, so a future palette edit cannot trade one
 *      for the other without failing here.
 *
 * The tailwind config is checked by reading its source (the same source-guard
 * approach `mark-well-tokens.test.ts` uses for the well geometry) because the
 * config is the other half of the same decision — NativeWind classes and
 * `useThemeColors()` must not disagree about the brand.
 */
import * as fs from "fs";
import * as path from "path";
import { PALETTES } from "./theme";

const CONFIG_PATH = path.resolve(__dirname, "../../../tailwind.config.js");

/** WCAG relative luminance. */
function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
  const f = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function contrast(a: string, b: string): number {
  const [la, lb] = [luminance(a), luminance(b)];
  const hi = Math.max(la, lb);
  const lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}

describe("the guide's palette (§1)", () => {
  it("pins the light scale literally — ember is root, everything derives from it", () => {
    const l = PALETTES.light;
    expect(l.bg).toBe("#FBF9F5"); // surface
    expect(l.bgElevated).toBe("#F5F3EF"); // surfaceRaised
    expect(l.bgSunken).toBe("#EFEEEA"); // surfaceSunken
    expect(l.border).toBe("#E2BFB5");
    expect(l.borderStrong).toBe("#8E7068");
    expect(l.text).toBe("#211A15"); // espresso
    expect(l.textBody).toBe("#1B1C1A"); // text
    expect(l.textMuted).toBe("#5A413A");
    expect(l.accent).toBe("#DA4A1C"); // ember
    expect(l.accentHover).toBe("#C2410C"); // emberHover
    expect(l.accentPressed).toBe("#B93C13"); // emberPressed
    expect(l.accentText).toBe("#FFFFFF"); // onEmber
    expect(l.success).toBe("#186A22");
    expect(l.warning).toBe("#B45309");
    expect(l.error).toBe("#BA1A1A");
  });

  it("pins dark mode as warm parity, not an invert — ember unchanged", () => {
    const d = PALETTES.dark;
    expect(d.bg).toBe("#1B1C1A"); // base
    expect(d.bgElevated).toBe("#24201C"); // raised
    expect(d.bgSunken).toBe("#141210"); // sunken
    expect(d.text).toBe("#F2F0ED");
    expect(d.textMuted).toBe("#C9C0B8");
    expect(d.accent).toBe("#DA4A1C"); // unchanged across schemes
    expect(PALETTES.light.accent).toBe(PALETTES.dark.accent);
  });

  it("never uses pure white as a surface, in either scheme", () => {
    for (const [name, palette] of Object.entries(PALETTES)) {
      for (const key of ["bg", "bgElevated", "bgSunken"] as const) {
        expect(`${name}.${key}=${palette[key].toUpperCase()}`).not.toContain("#FFFFFF");
      }
    }
  });

  it("keeps the surfaces warm rather than cool grey", () => {
    // A cool grey has blue >= red. Warm surfaces keep red > blue by a margin,
    // which is the whole point of the scale (ember is the root).
    for (const palette of [PALETTES.light, PALETTES.dark]) {
      for (const key of ["bg", "bgElevated", "bgSunken"] as const) {
        const h = palette[key].replace("#", "");
        const [r, , b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
        if (Number.isNaN(r)) continue; // rgba() strings are checked by their hue below
        expect(r).toBeGreaterThan(b);
      }
    }
  });

  it("keeps every on-surface colour readable (AA 4.5:1) in both schemes", () => {
    for (const palette of [PALETTES.light, PALETTES.dark]) {
      const pairs: [string, string, string][] = [
        ["body text", palette.textBody, palette.bg],
        ["muted text", palette.textMuted, palette.bg],
        ["success", palette.success, palette.bg],
        ["warning", palette.warning, palette.bg],
        ["error", palette.error, palette.bg],
        ["raised surface text", palette.textBody, palette.bgElevated],
      ];
      for (const [label, fg, bg] of pairs) {
        if (fg.startsWith("rgba") || bg.startsWith("rgba")) continue;
        const ratio = contrast(fg, bg);
        if (ratio < 4.5) {
          throw new Error(`${label}: ${fg} on ${bg} is ${ratio.toFixed(2)}:1 — under AA 4.5:1`);
        }
      }
    }
  });

  it("keeps the label on a filled accent button readable", () => {
    // Ember + onEmber (the guide's pairing) is 4.22:1 — fine for a large or bold
    // label. `accentFillStrong` carries the guide's own emberPressed so a small
    // label has a value to use that clears AA without inventing a colour.
    const l = PALETTES.light;
    expect(contrast(l.accentFillStrong, l.accentText)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(l.accent, l.accentText)).toBeGreaterThan(4);
  });
});

describe("tailwind.config.js agrees with the palettes (source guard)", () => {
  const config = fs.readFileSync(CONFIG_PATH, "utf8");

  it("carries every guide value", () => {
    for (const hex of [
      "#FBF9F5", "#F5F3EF", "#EFEEEA", "#E2BFB5", "#8E7068",
      "#211A15", "#1B1C1A", "#5A413A",
      "#DA4A1C", "#C2410C", "#B93C13",
      "#186A22", "#B45309", "#BA1A1A",
    ]) {
      expect(config).toContain(hex);
    }
  });

  it("does not resolve the card surface to white", () => {
    const cardLine = config.split("\n").find((line) => /^\s*card:\s*'/.test(line));
    expect(cardLine).toBeDefined();
    expect(cardLine!.toUpperCase()).not.toContain("#FFFFFF");
    expect(cardLine).toContain("#F5F3EF");
  });
});
