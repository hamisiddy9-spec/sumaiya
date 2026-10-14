import { readFileSync } from "fs";
import { join } from "path";
import { FONT } from "./tokens";

/**
 * §2 TYPOGRAPHY, guarded at the one place Home can get it wrong silently.
 *
 * React Native takes ONE family name and has no font stack, so a `fontFamily`
 * that is not the exact key registered in `src/app/_layout.tsx` does not raise —
 * it paints the system font and the heading is merely "a bit off". That is
 * precisely the state §2 flags in Stitch's own render (every run serif while the
 * CSS declares two sans families), and it is invisible in review.
 *
 * The file is read as SOURCE (the approach `components/ui/typography.test.ts`
 * takes for the same reason): importing `_layout.tsx` would start
 * expo-splash-screen and Reanimated at module load, and the thing to check is
 * the registration as written.
 */
const layout = readFileSync(join(__dirname, "..", "..", "app", "_layout.tsx"), "utf8");

describe("Home's type ramp is registered, not assumed", () => {
  it("names only families `_layout.tsx` actually loads", () => {
    for (const [role, family] of Object.entries(FONT)) {
      expect(`${role}:${family}`).toBe(
        layout.includes(family) ? `${role}:${family}` : `${role}:NOT REGISTERED in app/_layout.tsx`,
      );
    }
  });

  it("leads with the registered name, not the web family name", () => {
    // The web names ("Hanken Grotesk", "JetBrains Mono") never reach React
    // Native — a space in the value means the fallback got used by mistake.
    for (const family of Object.values(FONT)) {
      expect(family).not.toContain(" ");
    }
  });

  it("carries the weight in the file, so no style pairs a family with a foreign weight", () => {
    // Pairing `fontFamily: <400 cut>` with a `fontWeight` is how Android drops
    // silently back to the system font, so each ramp entry names its own cut.
    expect(FONT.display).toContain("800");
    expect(FONT.bold).toContain("700");
    expect(FONT.semibold).toContain("600");
    expect(FONT.regular).toContain("400");
  });
});
