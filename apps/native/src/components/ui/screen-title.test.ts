/**
 * Regression guard for the Fabric `addViewAt` crash on the guest Home screen
 * (release 1.6.27, Pixel 8 Pro / Android 17): `ScreenTitle` used Reanimated's
 * `entering={FadeIn...}` on the first child of every screen's ScrollView
 * content. `./motion` already documents that an `entering`/`layout` wrapper
 * has crashed Fabric mounting here before (`addViewAt … index N, count
 * N-1`) and non-interactive-button'd it another time — which is why `Reveal`
 * and `Stagger` drive a shared value instead. `ScreenTitle` was the one
 * shared component that had not been migrated to that pattern, and it sits
 * at the very top of 20+ screens, exactly where later siblings (a hint card,
 * a loaded CV list) get inserted or removed.
 *
 * This parses the real source rather than re-describing it, so a future edit
 * that reintroduces `entering=`/`layout=` here fails loudly instead of
 * shipping quietly.
 */
import { readFileSync } from "fs";
import { join } from "path";

const stripComments = (source: string) =>
  source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const read = (rel: string) => stripComments(readFileSync(join(__dirname, rel), "utf8"));

describe("ScreenTitle does not reintroduce a Fabric layout-animation race", () => {
  const source = read("screen-title.tsx");

  it("never uses a Reanimated `entering` or `layout` prop", () => {
    expect(source).not.toMatch(/\bentering=/);
    expect(source).not.toMatch(/\blayout=/);
  });

  it("still fades in via the shared-value `Reveal`, not a layout animation", () => {
    expect(source).toMatch(/import\s*\{[^}]*\bReveal\b[^}]*\}\s*from\s*"\.\/motion"/);
    expect(source).toMatch(/<Reveal\b/);
  });
});
