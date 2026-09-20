/**
 * Guards the two measured causes of "the primary button did not fire".
 *
 * On the Pixel 8 Pro against build 1.6.24 (2026-09-21), the Snap screen's
 * primary action "Lenga ajira hii" did not respond to a tap at its own reported
 * bounds. Neither the handler nor the button was wrong:
 *
 *   1. the footer was a SIBLING of the KeyboardAvoidingView, so the KAV shrank
 *      the scroll body while the footer stayed at the bottom of the full-height
 *      outer View — under the soft keyboard. The accessibility tree reported the
 *      button at y 2566-2682 while the IME occupied y 1959-2992, so three taps
 *      went to the keyboard and typed three characters into the focused job
 *      field instead (its counter went 2329 -> 2332).
 *   2. `keyboardDismissMode="interactive"` is iOS-only; on Android React Native
 *      ignores it, so scrolling the content never put the keyboard away either —
 *      the gesture a user makes to reach a covered control did nothing.
 *
 * Both faults are layout-level: invisible in a screenshot, invisible to tsc, and
 * invisible to any test that renders a component without a keyboard. So this
 * reads the source instead. It is deliberately structural — it fails if the
 * footer moves back outside the KeyboardAvoidingView, in either branch, and if
 * the dismiss mode goes back to one Android ignores.
 */
import { readFileSync } from "fs";
import { join } from "path";

const src = readFileSync(join(__dirname, "screen.tsx"), "utf8").replace(/\r\n/g, "\n");

describe("Screen: the footer cannot hide under the soft keyboard", () => {
  it("found the source (a moved file must not become a false pass)", () => {
    expect(src.length).toBeGreaterThan(1000);
    expect(src).toContain("KeyboardAvoidingView");
    expect(src).toContain("footerNode");
  });

  it("renders the footer INSIDE the KeyboardAvoidingView, in both branches", () => {
    const start = src.indexOf("const content = keyboardAvoiding ? (");
    expect(start).toBeGreaterThan(-1);
    const elseAt = src.indexOf("\n  ) : (\n", start);
    expect(elseAt).toBeGreaterThan(start);
    const returnAt = src.indexOf("\n  return <View", elseAt);
    expect(returnAt).toBeGreaterThan(elseAt);

    expect(src.slice(start, elseAt)).toContain("{footerNode}");
    expect(src.slice(elseAt, returnAt)).toContain("{footerNode}");
  });

  it("keeps the footer out of the outer View, where the keyboard covers it", () => {
    const returnAt = src.indexOf("\n  return <View");
    expect(src.slice(returnAt)).not.toContain("{footer}");
  });

  it("dismisses the keyboard on drag — the mode Android actually honours", () => {
    expect(src).toContain('keyboardDismissMode="on-drag"');
    // "interactive" is iOS-only; on Android RN ignores it silently.
    expect(src).not.toContain('keyboardDismissMode="interactive"');
  });
});
