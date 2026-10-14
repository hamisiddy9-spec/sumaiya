/**
 * §2 TYPOGRAPHY, pinned as tests.
 *
 * `docs/DESIGN-GUIDE.md` §2 names three families with three jobs and four
 * literal text styles. Both halves fail *silently* when they drift:
 *
 *   1. A family that is not registered does not raise — React Native paints the
 *      system font instead, so a heading is merely "a bit off". That is exactly
 *      the state §2 flags in Stitch's own render (every run serif while the CSS
 *      declares two sans families), and it is why `app/_layout.tsx` now reads
 *      the loader back and reports a miss rather than assuming success.
 *   2. The literal spec is deliberately un-tidy — 29 is not 30, 15.5 is not 16,
 *      −0.6 is not −0.5. Rounding it is invisible in review and reads as
 *      vibe-coded on screen, so the numbers are asserted at the exact literals.
 *
 * The files are read as SOURCE (the approach `theme-tokens.test.ts` and
 * `mark-well-tokens.test.ts` already take for the same reason): importing
 * `app/_layout.tsx` would start expo-splash-screen and Reanimated at module load,
 * and the point is to check the registration as written, not a mock of it.
 */
import * as fs from "fs";
import * as path from "path";

const LAYOUT_PATH = path.resolve(__dirname, "../../app/_layout.tsx");
const CONFIG_PATH = path.resolve(__dirname, "../../../tailwind.config.js");
const ONBOARDING_PATH = path.resolve(__dirname, "../../screens/onboarding-screen.tsx");
const PACKAGE_PATH = path.resolve(__dirname, "../../../package.json");
const FONT_ROOT = path.resolve(__dirname, "../../../node_modules/@expo-google-fonts");

const layout = fs.readFileSync(LAYOUT_PATH, "utf8");
const config = fs.readFileSync(CONFIG_PATH, "utf8");
const onboarding = fs.readFileSync(ONBOARDING_PATH, "utf8");
const pkg = JSON.parse(fs.readFileSync(PACKAGE_PATH, "utf8")) as {
  dependencies: Record<string, string>;
};

/** The three families of §2, and the package each one must come from. */
const FAMILIES = {
  display: { family: "BricolageGrotesque_800ExtraBold", pkg: "bricolage-grotesque" },
  sans: { family: "HankenGrotesk_400Regular", pkg: "hanken-grotesk" },
  mono: { family: "JetBrainsMono_400Regular", pkg: "jetbrains-mono" },
} as const;

/**
 * The .ttf Metro will bundle, as it sits on disk. A family name with no file is
 * a name that can only ever fall back, so this — not the string in the source —
 * is the thing that proves a family is real.
 */
function findTtf(family: string): string | null {
  if (!fs.existsSync(FONT_ROOT)) return null;
  for (const pkgDir of fs.readdirSync(FONT_ROOT)) {
    const pkgPath = path.join(FONT_ROOT, pkgDir);
    if (!fs.statSync(pkgPath).isDirectory()) continue;
    for (const weightDir of fs.readdirSync(pkgPath)) {
      const weightPath = path.join(pkgPath, weightDir);
      if (!fs.statSync(weightPath).isDirectory()) continue;
      const file = path.join(weightPath, `${family}.ttf`);
      if (fs.existsSync(file)) return file;
    }
  }
  return null;
}

/** The first entry of a tailwind `fontFamily` array — the only one RN sees. */
function firstEntryOf(familyKey: string): string {
  const match = config.match(new RegExp(`\\b${familyKey}:\\s*\\[([^\\]]*)\\]`));
  if (!match) throw new Error(`tailwind.config.js declares no fontFamily.${familyKey}`);
  const first = match[1].split(",")[0].trim().replace(/^['"]|['"]$/g, "");
  if (!first) throw new Error(`fontFamily.${familyKey} is empty`);
  return first;
}

/** The one line carrying a style of the given `fontSize`, plus its neighbours. */
function styleAt(source: string, fontSize: string): { line: number; text: string; context: string } {
  const lines = source.split(/\r?\n/);
  const exact = `${fontSize.replace(".", "\\.")}(?![\\d.])`;
  const i = lines.findIndex((l) => new RegExp(`fontSize:\\s*${exact}`).test(l));
  if (i === -1) throw new Error(`no text style with fontSize ${fontSize}`);
  return { line: i + 1, text: lines[i], context: lines.slice(i, i + 3).join("\n") };
}

describe("§2 — the three families are registered, not assumed", () => {
  it("bundles a real .ttf for each of the guide's three families", () => {
    for (const [role, { family, pkg: expectedPkg }] of Object.entries(FAMILIES)) {
      const ttf = findTtf(family);
      expect(`${role}:${ttf ? path.basename(ttf) : "MISSING"}`).toBe(`${role}:${family}.ttf`);
      // …and from the RIGHT package: display is a grotesque, not a humanist.
      // Normalised, because this runs on Windows too.
      expect(ttf!.replace(/\\/g, "/")).toContain(`@expo-google-fonts/${expectedPkg}`);
    }
  });

  it("loads them from bundled assets, never over the network", () => {
    expect(layout).toContain("await Font.loadAsync(FONT_ASSETS)");
    // An empty map is the gap this file exists for — it "loads fonts" and
    // registers nothing.
    expect(layout).not.toMatch(/loadAsync\(\s*\{\s*\}\s*\)/);
    // Every family comes from a package, so Metro bundles the file. A URL here
    // would mean a cold start with no network paints the system font.
    expect(layout).not.toMatch(/loadAsync\([^)]*https?:\/\//);
    for (const { pkg: fontPkg } of Object.values(FAMILIES)) {
      expect(pkg.dependencies).toHaveProperty(`@expo-google-fonts/${fontPkg}`);
    }
  });

  it("makes a family that failed to register visible instead of falling back", () => {
    // Reading the loader back is the whole proof: `loadAsync` resolving is not
    // the same as the family being registered under the name styles ask for.
    expect(layout).toContain("Font.getLoadedFonts()");
    expect(layout).toMatch(/missing\.length\s*>\s*0/);
    expect(layout).toContain("reportError(");
    expect(layout).toContain('pushLogEntry("error", "fonts.load"');
  });

  it("keeps the font work from taking the rest of startup down with it", () => {
    // Isolated in its own catch: a missing font must not skip the SQLite open,
    // the saved theme or telemetry.
    expect(layout).toContain("catch (fontError)");
    expect(layout.indexOf("await Font.loadAsync")).toBeLessThan(layout.indexOf("offlineStorage.init"));
    // …and still before the splash comes down, so no screen paints first.
    expect(layout.indexOf("await Font.loadAsync")).toBeLessThan(layout.indexOf("SplashScreen.hideAsync()"));
  });

  it("agrees with tailwind: the family RN is told to use is the one registered", () => {
    for (const { family } of Object.values(FAMILIES)) {
      expect(layout).toContain(family); // registered in FONT_ASSETS
    }
    for (const [role, { family }] of Object.entries(FAMILIES)) {
      expect(firstEntryOf(role)).toBe(family);
    }
    // The heading family is weight 800 ("Bricolage Grotesque … weight 800"),
    // so the registered cut has to be the 800 one — a 400 file here is a
    // thinner heading, not a missing font, and would never raise.
    expect(FAMILIES.display.family).toContain("800");
    expect(firstEntryOf("display")).toContain("800");
  });

  it("keeps the web names as fallbacks behind the registered one", () => {
    // React Native takes one family and no stack, so the first entry is all it
    // sees; the rest document intent for anything rendering this config as CSS.
    expect(firstEntryOf("display")).not.toContain(" ");
    expect(config).toContain("Bricolage Grotesque");
    expect(config).toContain("Hanken Grotesk");
    expect(config).toContain("JetBrains Mono");
  });
});

describe("§2 — the literal spec, unrounded", () => {
  it("Welcome greeting: 29 / 800 / -0.6 on the one word \"Karibu\"", () => {
    const style = styleAt(onboarding, "29");
    expect(style.text).toContain("fontSize: 29");
    expect(style.text).toContain('fontWeight: "800"');
    expect(style.text).toContain("letterSpacing: -0.6");
    // Anchored to the greeting itself — not just "some style is 29".
    expect(style.context).toContain(">Karibu<");
  });

  it("Welcome body: 15 / 22 / maxW 290, Swahili first", () => {
    const style = styleAt(onboarding, "15");
    expect(style.text).toContain("lineHeight: 22");
    expect(style.text).toContain("maxWidth: 290");
    // Swahili leads, English follows (§6).
    const sw = style.context.indexOf("Mimi ni Sumaiya");
    const en = style.context.indexOf("I'm Sumaiya");
    expect(sw).toBeGreaterThan(-1);
    expect(en).toBeGreaterThan(sw);
  });

  it("Slide title: 26 / 800 / -0.5", () => {
    const style = styleAt(onboarding, "26");
    expect(style.text).toContain("fontSize: 26");
    expect(style.text).toContain('fontWeight: "800"');
    expect(style.text).toContain("letterSpacing: -0.5");
    expect(style.context).toContain("item.title[lang]");
  });

  it("Slide body: 15.5 / 23 / maxW 320", () => {
    const style = styleAt(onboarding, "15.5");
    expect(style.text).toContain("fontSize: 15.5");
    expect(style.text).toContain("lineHeight: 23");
    expect(style.text).toContain("maxWidth: 320");
    expect(style.context).toContain("item.body[lang]");
  });

  it("did not round the scale to a tidy one", () => {
    // The guide: "29 is not 30. 15.5 is not 16. −0.6 is not −0.5."
    expect(onboarding).toContain("fontSize: 29");
    expect(onboarding).not.toMatch(/fontSize:\s*30\b/);
    expect(onboarding).toContain("fontSize: 15.5");
    expect(onboarding).not.toMatch(/fontSize:\s*16\b/);
    expect(onboarding).toContain("letterSpacing: -0.6");
  });
});

describe("§3 — the font gate does not move the welcome entrance", () => {
  it("leaves the 1600 ms thinking → idle greeting alone", () => {
    // Registering fonts must not become a second entrance beat: the shared brand
    // greeting is pinned at 1600 ms across Nuru, Faraja and Sumaiya.
    expect(onboarding).toContain('setMarkState("idle"), 1600');
    expect(layout).not.toContain("1600");
  });
});
